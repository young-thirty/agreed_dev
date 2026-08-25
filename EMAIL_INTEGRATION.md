# Gmail 이메일 연동 구현 방법

> 실제 코드는 `feat/#5` 브랜치에 커밋되어 있다. 이 문서만 보고도 그대로 재현할 수 있도록
> 전체 코드를 그대로 옮겨 적었다.

---

## 1. 사전 준비 — Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → 새 프로젝트 생성
2. **API 및 서비스 → 라이브러리 → Gmail API** 검색 → **사용 설정** (빼먹으면 403)
3. **API 및 서비스 → OAuth 동의 화면** → User Type: 외부(External) → 앱 이름/지원 이메일 입력 → 저장 → 게시 상태는 **테스트**로 유지 ("프로덕션으로 게시"는 누르지 않는다 — 심사가 걸린다)
4. **데이터 액세스 → 범위 추가 또는 삭제** → 검색창에 `gmail` → 아래 두 개 체크 → 업데이트 → 저장
   - `.../auth/gmail.readonly` (메일 읽기)
   - `.../auth/gmail.send` (메일 발송)
5. **테스트 사용자** 섹션 → 실제 로그인할 Gmail 계정 추가 (여기 등록 안 된 계정은 로그인 자체가 막힌다)
6. **사용자 인증 정보 → + 사용자 인증 정보 만들기 → OAuth 클라이언트 ID → 웹 애플리케이션**
   - 승인된 리디렉션 URI: `http://localhost:3000/api/email/callback`
7. 발급된 Client ID / Client Secret을 `.env.local`에 채운다

```bash
cp .env.example .env.local
```

```
GOOGLE_CLIENT_ID=발급받은 값
GOOGLE_CLIENT_SECRET=발급받은 값
GOOGLE_REDIRECT_URI=http://localhost:3000/api/email/callback
```

새 npm 의존성은 없다. `googleapis` SDK 대신 `fetch`로 REST를 직접 호출한다 (SDK가 수십 MB라서). Zod는 프로젝트에 이미 설치돼 있다.

---

## 2. 파일 구조

```
core/email/
├─ types.ts        RawEmail — 출처 무관 공통 이메일 형태
└─ grouping.ts      회사(도메인) → 발신인 2단계 그룹핑, 순수 함수

infra/email/
└─ gmail.ts         OAuth 토큰 교환/갱신, Gmail REST 조회·발송

app/api/email/
├─ token.ts          쿠키 토큰 읽기/만료 시 갱신 (route.ts 아님, 라우트 두 곳이 공유)
├─ connect/route.ts   GET, Google 인증 화면으로 리다이렉트
├─ callback/route.ts  GET, 코드를 토큰으로 교환해 쿠키 저장
├─ messages/route.ts  POST, 최근 메일을 그룹핑해서 반환
└─ send/route.ts      POST, 메일 발송

components/
├─ EmailPanel.tsx      연결 배너 + 회사/발신인/메일 트리 + 20초 폴링
└─ EmailComposer.tsx   테스트 발송 폼
```

---

## 3. 단계별 구현

### 3.1 `core/email/types.ts`

```ts
// 이메일의 출처와 무관한 공통 형태다. Gmail이든 파일이든 어댑터가 이 형태로 바꿔서 넘긴다.
// 그래야 도메인 로직이 출처를 모르고, 나중에 입력 경로가 늘어나도 이 아래는 바뀌지 않는다.

export type EmailAddress = { name: string; address: string };

export type RawEmail = {
  id: string;
  threadId: string;
  sentAt: string; // ISO
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  body: string;
};
```

### 3.2 `core/email/grouping.ts`

```ts
import type { EmailAddress, RawEmail } from './types';

export type SenderGroup = {
  address: string;
  name: string;
  count: number;
  latestAt: string;
  emails: RawEmail[];
};

export type CompanyGroup = {
  domain: string;
  count: number;
  latestAt: string;
  senders: SenderGroup[];
};

function domainOf(address: string): string {
  return address.slice(address.lastIndexOf('@') + 1).toLowerCase();
}

/**
 * 이 메일의 상대가 누구인지 정한다.
 * 받은 메일이면 보낸 사람이, 내가 보낸 메일이면 받는 사람이 상대다.
 * 나에게만 보낸 메일처럼 상대가 없으면 null을 돌려주고, 호출부가 건너뛴다.
 */
export function counterparty(email: RawEmail, myAddresses: string[]): EmailAddress | null {
  const mine = new Set(myAddresses.map((a) => a.toLowerCase()));
  if (!mine.has(email.from.address.toLowerCase())) return email.from;
  return email.to.find((t) => !mine.has(t.address.toLowerCase())) ?? null;
}

/**
 * 회사(도메인) → 발신인 주소 두 단계로 묶는다.
 * 두 단계 모두 최근 메일이 있는 쪽이 위로 온다.
 */
export function groupByCompany(emails: RawEmail[], myAddresses: string[]): CompanyGroup[] {
  const bySender = new Map<string, SenderGroup>();

  for (const email of emails) {
    const who = counterparty(email, myAddresses);
    if (who === null) continue;

    const key = who.address.toLowerCase();
    const found = bySender.get(key);
    if (found) {
      found.emails.push(email);
    } else {
      bySender.set(key, { address: key, name: who.name || key, count: 0, latestAt: '', emails: [email] });
    }
  }

  const byDomain = new Map<string, CompanyGroup>();
  for (const sender of bySender.values()) {
    sender.emails.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    sender.count = sender.emails.length;
    sender.latestAt = sender.emails[0].sentAt;

    const domain = domainOf(sender.address);
    const company = byDomain.get(domain) ?? { domain, count: 0, latestAt: '', senders: [] };
    company.senders.push(sender);
    byDomain.set(domain, company);
  }

  const companies = [...byDomain.values()];
  for (const company of companies) {
    company.senders.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
    company.count = company.senders.reduce((sum, s) => sum + s.count, 0);
    company.latestAt = company.senders[0].latestAt;
  }
  companies.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  return companies;
}
```

### 3.3 `infra/email/gmail.ts`

```ts
import type { EmailAddress, RawEmail } from '@/core/email/types';

const TIMEOUT_MS = 8000;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

export type GmailTokens = { accessToken: string; refreshToken: string; expiresAt: number };

export const TOKEN_COOKIE = 'agreed_gmail';
export const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 비어 있습니다.`);
  return value;
}

/** 사용자를 보낼 Google 인증 화면 주소를 만든다. */
export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env('GOOGLE_CLIENT_ID'),
    redirect_uri: env('GOOGLE_REDIRECT_URI'),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // 이게 없으면 refresh token이 오지 않는다
    prompt: 'consent', // 스코프가 바뀐 뒤 다시 연결해도 새 동의를 받으려면 필요하다
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function requestToken(form: Record<string, string>): Promise<GmailTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      ...form,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`토큰 요청 실패 ${res.status} ${await res.text()}`);

  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: json.access_token,
    // 갱신 응답에는 refresh token이 들어 있지 않다. 호출부가 기존 값을 채워 넣는다
    refreshToken: json.refresh_token ?? '',
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function exchangeCode(code: string): Promise<GmailTokens> {
  return requestToken({ code, redirect_uri: env('GOOGLE_REDIRECT_URI'), grant_type: 'authorization_code' });
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const tokens = await requestToken({ refresh_token: refreshToken, grant_type: 'refresh_token' });
  return { ...tokens, refreshToken };
}

async function gmailGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gmail ${path} 실패 ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

type GmailPart = { mimeType: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailMessage = {
  id: string;
  threadId: string;
  internalDate: string;
  snippet: string;
  payload: GmailPart & { headers: { name: string; value: string }[] };
};

function header(msg: GmailMessage, name: string): string {
  return msg.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

/** `"홍길동" <a@b.com>` 또는 `a@b.com` 형태를 쪼갠다. 쉼표로 여러 개가 올 수 있다. */
function parseAddresses(value: string): EmailAddress[] {
  if (!value.trim()) return [];
  return value.split(',').map((raw) => {
    const match = raw.match(/^\s*(.*?)\s*<(.+?)>\s*$/);
    if (match) return { name: match[1].replace(/^"|"$/g, ''), address: match[2].trim() };
    return { name: '', address: raw.trim() };
  });
}

function decode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

/** text/plain 조각을 먼저 찾고, 없으면 text/html에서 태그를 걷어내 쓴다. */
function extractBody(part: GmailPart): string {
  if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data);

  for (const child of part.parts ?? []) {
    const found = extractBody(child);
    if (found) return found;
  }

  if (part.mimeType === 'text/html' && part.body?.data) {
    return decode(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function toRawEmail(msg: GmailMessage): RawEmail {
  return {
    id: msg.id,
    threadId: msg.threadId,
    sentAt: new Date(Number(msg.internalDate)).toISOString(),
    from: parseAddresses(header(msg, 'From'))[0] ?? { name: '', address: '' },
    to: parseAddresses(header(msg, 'To')),
    cc: parseAddresses(header(msg, 'Cc')),
    subject: header(msg, 'Subject'),
    body: extractBody(msg.payload) || msg.snippet,
  };
}

/** 연결된 계정의 주소. 어느 쪽이 상대인지 가리려면 내 주소를 알아야 한다. */
export async function fetchMyAddress(accessToken: string): Promise<string> {
  const profile = await gmailGet<{ emailAddress: string }>('profile', accessToken);
  return profile.emailAddress;
}

export async function fetchRecent(accessToken: string, max: number): Promise<RawEmail[]> {
  const list = await gmailGet<{ messages?: { id: string }[] }>(
    `messages?maxResults=${max}&q=${encodeURIComponent('-in:chats -in:spam')}`,
    accessToken,
  );

  // 목록은 id만 준다. 본문은 한 통씩 따로 받아야 하는데, 순차로 돌면 20통에 수 초가 걸린다
  const details = await Promise.all(
    (list.messages ?? []).map((m) => gmailGet<GmailMessage>(`messages/${m.id}?format=full`, accessToken)),
  );
  return details.map(toRawEmail);
}

export type OutgoingEmail = { to: string; subject: string; body: string };

/** 제목에 한글이 들어가면 RFC 2047 인코딩이 필요하다. 안 하면 수신함에서 제목이 깨진다. */
function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

function buildRawMessage(email: OutgoingEmail): string {
  const message = [
    `To: ${email.to}`,
    `Subject: ${encodeSubject(email.subject)}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    email.body,
  ].join('\r\n');
  return Buffer.from(message, 'utf8').toString('base64url');
}

/** gmail.send 스코프로 실제 메일을 보낸다. */
export async function sendEmail(accessToken: string, email: OutgoingEmail): Promise<void> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: buildRawMessage(email) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gmail 전송 실패 ${res.status} ${await res.text()}`);
}
```

### 3.4 `app/api/email/token.ts`

`route.ts`가 아니라서 Next가 라우트로 취급하지 않는다. 아래 두 라우트가 공유하는 헬퍼다.

```ts
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, refreshAccessToken, type GmailTokens } from '@/infra/email/gmail';

/**
 * 쿠키에서 토큰을 읽는다. 만료됐으면 갱신하고 쿠키도 다시 쓴다.
 * 연결된 적이 없으면 null을 돌려주고, 호출부가 안내 문구로 바꾼다.
 */
export async function getValidTokens(): Promise<GmailTokens | null> {
  const store = await cookies();
  const raw = store.get(TOKEN_COOKIE)?.value;
  if (raw === undefined) return null;

  let tokens = JSON.parse(raw) as GmailTokens;
  if (tokens.expiresAt < Date.now()) {
    tokens = await refreshAccessToken(tokens.refreshToken);
    store.set(TOKEN_COOKIE, JSON.stringify(tokens), TOKEN_COOKIE_OPTIONS);
  }
  return tokens;
}
```

### 3.5 `app/api/email/connect/route.ts`

브라우저 주소창으로 직접 여는 진입점. GET + 리다이렉트라 `{ ok, data }` 응답 규약의 예외다.

```ts
import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/infra/email/gmail';

export function GET() {
  try {
    return NextResponse.redirect(buildAuthUrl());
  } catch {
    return new Response(
      'Google 연동 설정이 없습니다. .env.local에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI를 채우고 서버를 다시 시작해 주세요.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
}
```

### 3.6 `app/api/email/callback/route.ts`

Google이 인증 후 돌려보내는 주소. 토큰을 httpOnly 쿠키에 저장한다 (localStorage는 XSS에 취약해서 배제).

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, exchangeCode } from '@/infra/email/gmail';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (code === null) return NextResponse.redirect(new URL('/?gmail=denied', req.url));

  try {
    const tokens = await exchangeCode(code);
    const res = NextResponse.redirect(new URL('/?gmail=connected', req.url));
    res.cookies.set(TOKEN_COOKIE, JSON.stringify(tokens), TOKEN_COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error('[gmail] 토큰 교환 실패', error);
    return NextResponse.redirect(new URL('/?gmail=failed', req.url));
  }
}
```

### 3.7 `app/api/email/messages/route.ts`

```ts
import { groupByCompany } from '@/core/email/grouping';
import { fetchMyAddress, fetchRecent } from '@/infra/email/gmail';
import { fail, ok } from '@/lib/api-response';
import { getValidTokens } from '../token';

const MAX_MESSAGES = 20;

export async function POST() {
  const tokens = await getValidTokens();
  if (tokens === null) return fail('Gmail이 연결되어 있지 않습니다. 먼저 Gmail을 연결해 주세요.');

  try {
    const [myAddress, emails] = await Promise.all([
      fetchMyAddress(tokens.accessToken),
      fetchRecent(tokens.accessToken, MAX_MESSAGES),
    ]);
    return ok(groupByCompany(emails, [myAddress]));
  } catch (error) {
    console.error('[gmail] 메일 조회 실패', error);
    return fail('Gmail에서 메일을 가져오지 못했습니다. Gmail을 다시 연결해 주세요.', 500);
  }
}
```

### 3.8 `app/api/email/send/route.ts`

```ts
import { z } from 'zod';
import { sendEmail } from '@/infra/email/gmail';
import { fail, ok } from '@/lib/api-response';
import { getValidTokens } from '../token';

const requestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  const tokens = await getValidTokens();
  if (tokens === null) return fail('Gmail이 연결되어 있지 않습니다. 먼저 Gmail을 연결해 주세요.');

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('받는 사람, 제목, 본문을 모두 입력해 주세요.');

  try {
    await sendEmail(tokens.accessToken, parsed.data);
    return ok({ sent: true });
  } catch (error) {
    console.error('[gmail] 메일 전송 실패', error);
    return fail('메일을 보내지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
```

### 3.9 `components/EmailPanel.tsx`

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { post } from '@/lib/api-client';
import type { CompanyGroup } from '@/core/email/grouping';

const POLL_INTERVAL_MS = 20_000;

const CONNECT_NOTICE: Record<string, string> = {
  connected: 'Gmail이 연결되었습니다.',
  denied: 'Gmail 연결이 취소되었습니다.',
  failed: 'Gmail 연결에 실패했습니다. 다시 시도해 주세요.',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preview(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat;
}

export function EmailPanel() {
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await post<CompanyGroup[]>('/api/email/messages', {});
    setLoading(false);

    if (!res.ok) {
      setConnected(false);
      setMessage(res.error);
      return;
    }
    setConnected(true);
    setMessage(null);
    setGroups(res.data);
  }, []);

  // 콜백에서 돌아온 /?gmail=... 을 한 번 읽고 주소에서 지운다.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('gmail');
    if (param !== null) {
      setNotice(CONNECT_NOTICE[param] ?? null);
      window.history.replaceState(null, '', window.location.pathname);
    }
    load();
  }, [load]);

  // 연결된 뒤에만 폴링한다.
  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected, load]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">이메일</h2>
          <p className="text-sm text-ink-muted">
            {connected ? '20초마다 새 메일을 확인합니다.' : 'Gmail을 연결하면 상대방별 대화 내역을 가져옵니다.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && <span className="text-sm text-ink-muted">불러오는 중…</span>}
          {connected && (
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper"
            >
              새로고침
            </button>
          )}
          <a
            href="/api/email/connect"
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            {connected ? 'Gmail 다시 연결' : 'Gmail 연결'}
          </a>
        </div>
      </div>

      {notice !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm">{notice}</p>
      )}

      {message !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted">{message}</p>
      )}

      {connected && groups.length === 0 && !loading && (
        <p className="text-sm text-ink-muted">최근 메일이 없습니다.</p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((company) => (
          <div key={company.domain} className="rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
              <span className="font-medium">{company.domain}</span>
              <span className="text-sm text-ink-muted">
                {company.count}통 · {formatDate(company.latestAt)}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-line">
              {company.senders.map((sender) => (
                <div key={sender.address} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sender.name}</span>
                    <span className="text-ink-muted">
                      {sender.address} · {sender.count}통
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {sender.emails.map((email) => (
                      <li key={email.id} className="text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{email.subject || '(제목 없음)'}</span>
                          <span className="shrink-0 text-xs text-ink-muted">{formatDate(email.sentAt)}</span>
                        </div>
                        <p className="truncate text-ink-muted">{preview(email.body)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### 3.10 `components/EmailComposer.tsx`

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { post } from '@/lib/api-client';

export function EmailComposer() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setResult(null);

    const res = await post<{ sent: boolean }>('/api/email/send', { to, subject, body });
    setSending(false);

    if (!res.ok) {
      setResult(res.error);
      return;
    }
    setResult('메일을 보냈습니다.');
    setTo('');
    setSubject('');
    setBody('');
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold">테스트 메일 보내기</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="받는 사람 이메일"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="text"
          required
          placeholder="제목"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          required
          placeholder="본문"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending}
          className="self-start rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </form>

      {result !== null && <p className="text-sm text-ink-muted">{result}</p>}
    </section>
  );
}
```

### 3.11 `app/page.tsx`에 연결

```tsx
import { EmailPanel } from '@/components/EmailPanel';
import { EmailComposer } from '@/components/EmailComposer';
// ...
<EmailPanel />
<EmailComposer />
```

### 3.12 `.env.example`에 추가

```
# Gmail 연동. Google Cloud Console > 사용자 인증 정보 > OAuth 클라이언트 ID(웹 애플리케이션)에서 발급한다.
# GOOGLE_REDIRECT_URI는 콘솔의 '승인된 리디렉션 URI'와 글자 단위로 같아야 한다.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/email/callback
```

---

## 4. 로컬에서 확인하는 순서

```bash
pnpm dev
```

1. `http://localhost:3000/api/email/connect` 접속 → 테스트 사용자로 로그인 → 동의
2. `/?gmail=connected`로 돌아오면 연결 성공. 화면에 회사/발신인별 메일 트리가 뜬다
3. 20초 뒤 자동으로 다시 확인되는지 확인 (또는 새로고침 버튼)
4. 테스트 메일 보내기 폼에 받는사람/제목/본문을 채우고 보내기 → `메일을 보냈습니다.` 표시 확인
