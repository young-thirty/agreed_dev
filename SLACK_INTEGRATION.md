# Slack 채널 연동 구현 방법

> 실제 코드는 `feat/#6` 브랜치에 커밋되어 있다. 이 문서만 보고도 그대로 재현할 수 있도록
> 전체 코드를 그대로 옮겨 적었다. Gmail 연동(`EMAIL_INTEGRATION.md`)과 같은 화면에서 함께 동작한다.

---

## 1. 사전 준비 — Slack App 생성

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App → From scratch** → 앱 이름, 워크스페이스 선택
2. 좌측 메뉴 **OAuth & Permissions**
   - **Redirect URLs**에 `http://localhost:3000/api/slack/callback` 추가 → **Save URLs** (입력만 하고 저장을 안 누르면 등록 안 된 것으로 처리된다)
   - **Bot Token Scopes**에 아래 6개 추가:
     ```
     channels:read
     channels:history
     channels:join
     groups:read
     groups:history
     users:read
     ```
3. 좌측 메뉴 **Basic Information → App Credentials**에서 **Client ID**, **Client Secret** 확인
4. `.env.local`에 채운다

```
SLACK_CLIENT_ID=발급받은 값
SLACK_CLIENT_SECRET=발급받은 값
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback
```

새 npm 의존성은 없다. `@slack/web-api` SDK 대신 `fetch`로 REST를 직접 호출한다. 파일·이미지에 별도 스코프는 필요 없다 — `channels:history`/`groups:history`로 받는 메시지 안에 파일 메타데이터가 이미 포함된다.

**비공개 채널을 시연에 쓰려면** 슬랙에서 그 채널에 `/invite @봇이름`으로 봇을 미리 초대해둔다 — 코드로는 봇을 비공개 채널에 넣을 수 없다.

---

## 2. 파일 구조

```
core/slack/
└─ types.ts         SlackChannel, SlackMessage, SlackFile — Slack API 응답과 무관한 공통 형태

infra/slack/
└─ api.ts            OAuth 설치, 채널 목록·참가, 메시지·스레드·파일 조회 (Web API REST 호출)

app/api/slack/
├─ store.ts           워크스페이스 배열을 쿠키에 읽고 쓰는 헬퍼 (route.ts 아님)
├─ connect/route.ts    GET, Slack 설치 화면으로 리다이렉트
├─ callback/route.ts   GET, code를 봇 토큰으로 교환해 쿠키에 추가
├─ workspaces/route.ts POST, 연결된 워크스페이스 목록 (토큰은 절대 내려주지 않는다)
├─ channels/route.ts   POST, 워크스페이스의 채널 목록
├─ join/route.ts       POST, 공개 채널에 봇을 참가시킨다
├─ messages/route.ts   POST, 채널의 최상위 메시지 조회 (oldest 커서로 증분)
├─ thread/route.ts     POST, 스레드 답글 조회 (oldest 커서로 증분)
└─ file/route.ts       GET, Slack 파일을 봇 토큰으로 대신 인증해 그대로 흘려주는 프록시

components/
├─ SlackPanel.tsx      워크스페이스 선택 → 채널 선택 → 5초 폴링
├─ SlackMessage.tsx     메시지 한 건을 그리는 조각 (텍스트 + 파일). 채널 목록과 스레드가 공유한다
└─ SlackThread.tsx      펼쳐진 스레드의 답글 목록 + 그동안만 도는 5초 폴링
```

### Gmail과 다른 점

- **토큰이 배열이다.** 워크스페이스를 여러 개 연결하고 전환할 수 있어야 해서, 쿠키에 `{ teamId, teamName, botToken }[]`를 담는다. 어느 워크스페이스/채널을 **보고 있는지**는 쿠키가 아니라 클라이언트의 `usePersistedState`에 둔다 — 토큰(비밀)과 화면 선택 상태를 같은 저장소에 섞지 않는다.
- **Bot Token은 만료가 없다.** Gmail의 `refreshAccessToken` 같은 갱신 로직이 필요 없다.
- **`conversations.history`/`conversations.replies`가 `oldest` 커서를 기본 지원**해서 진짜 증분 폴링이 된다. (Gmail 쪽은 이 커서가 없어서 매번 최근 N통을 통째로 다시 받는다.)
- **HTTP 상태가 아니라 응답 본문의 `ok` 필드로 성공 여부를 판단한다.** Slack은 실패해도 대부분 200을 준다.
- **비공개 채널은 봇이 멤버가 아니면 아예 못 읽는다.** 공개 채널은 선택 시 봇이 스스로 참가(`conversations.join`)하지만, 비공개는 사람이 슬랙에서 직접 초대해야 한다.
- **스레드 답글은 별도 호출이다.** `conversations.history`는 채널의 최상위 메시지만 준다. 답글이 있는 메시지는 `replyCount`만 알려주고, 실제 답글은 `conversations.replies`로 그 메시지의 `ts`를 넘겨 따로 받는다. 매 폴링마다 보이는 스레드를 전부 펼쳐서 받으면 호출이 N+1로 늘어나므로, **사용자가 클릭해서 펼칠 때만** 그 스레드를 받고 그동안만 폴링한다. 접으면 멈춘다.
- **파일은 프록시를 거친다.** Slack 파일 URL(`url_private`)은 봇 토큰으로 인증해야 열린다. 브라우저에 토큰을 내려줄 수 없으니, 서버가 대신 인증해서 그대로 흘려주는 라우트(`/api/slack/file`)를 하나 둔다. 요청받은 URL이 실제 Slack 파일 도메인인지 검증해야 한다 — 안 하면 봇 토큰을 아무 주소로나 실어 보내는 열린 프록시가 된다.

---

## 3. 단계별 구현

### 3.1 `core/slack/types.ts`

```ts
export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
};

export type SlackFile = {
  id: string;
  name: string;
  isImage: boolean;
  /** 우리 서버의 프록시 주소다. 원본 Slack URL은 봇 토큰으로만 열리므로 화면에 직접 노출하지 않는다. */
  url: string;
};

export type SlackMessage = {
  id: string; // Slack의 ts
  userId: string;
  userName: string;
  text: string;
  sentAt: string; // ISO
  /** 0보다 크면 스레드가 있다는 뜻이다. 답글 자체는 이 메시지에 들어있지 않다. */
  replyCount: number;
  files: SlackFile[];
};
```

### 3.2 `infra/slack/api.ts`

```ts
import type { SlackChannel, SlackFile, SlackMessage } from '@/core/slack/types';

const TIMEOUT_MS = 8000;

const SCOPES = [
  'channels:read',
  'channels:history',
  'channels:join',
  'groups:read',
  'groups:history',
  'users:read',
].join(',');

export type SlackWorkspace = { teamId: string; teamName: string; botToken: string };

export const TOKEN_COOKIE = 'agreed_slack';
export const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 비어 있습니다.`);
  return value;
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env('SLACK_CLIENT_ID'),
    scope: SCOPES,
    redirect_uri: env('SLACK_REDIRECT_URI'),
  });
  return `https://slack.com/oauth/v2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<SlackWorkspace> {
  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('SLACK_CLIENT_ID'),
      client_secret: env('SLACK_CLIENT_SECRET'),
      code,
      redirect_uri: env('SLACK_REDIRECT_URI'),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = (await res.json()) as {
    ok: boolean;
    error?: string;
    access_token: string;
    team: { id: string; name: string };
  };
  if (!json.ok) throw new Error(`Slack 설치 실패: ${json.error}`);

  return { teamId: json.team.id, teamName: json.team.name, botToken: json.access_token };
}

async function slackApi<T>(method: string, botToken: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = (await res.json()) as T & { ok: boolean; error?: string };
  if (!json.ok) throw new Error(`Slack ${method} 실패: ${json.error}`);
  return json;
}

type RawChannel = { id: string; name: string; is_private: boolean; is_member: boolean };

export async function listChannels(botToken: string): Promise<SlackChannel[]> {
  const json = await slackApi<{ channels: RawChannel[] }>('conversations.list', botToken, {
    types: 'public_channel,private_channel',
    limit: '200',
  });

  return json.channels.map((c) => ({
    id: c.id,
    name: c.name,
    isPrivate: c.is_private,
    isMember: c.is_member,
  }));
}

/** 공개 채널에 봇을 참가시킨다. 비공개 채널은 API로 들어갈 수 없다 — 사람이 슬랙에서 직접 초대해야 한다. */
export async function joinChannel(botToken: string, channelId: string): Promise<void> {
  await slackApi('conversations.join', botToken, { channel: channelId });
}

type RawFile = { id: string; name: string; mimetype: string; url_private: string };
type RawMessage = {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  text?: string;
  reply_count?: number;
  files?: RawFile[];
};

function tsToIso(ts: string): string {
  return new Date(Number(ts) * 1000).toISOString();
}

/** 원본 Slack 파일 주소를 우리 서버의 프록시 주소로 바꾼다. url_private은 봇 토큰 없이는 안 열린다. */
function buildFileProxyUrl(teamId: string, urlPrivate: string): string {
  const params = new URLSearchParams({ teamId, url: urlPrivate });
  return `/api/slack/file?${params}`;
}

function toSlackFile(file: RawFile, teamId: string): SlackFile {
  return {
    id: file.id,
    name: file.name,
    isImage: file.mimetype.startsWith('image/'),
    url: buildFileProxyUrl(teamId, file.url_private),
  };
}

function toSlackMessage(m: RawMessage, teamId: string, names: Map<string, string>): SlackMessage {
  return {
    id: m.ts,
    userId: m.user ?? '',
    userName: (m.user && names.get(m.user)) || m.user || '알 수 없음',
    text: m.text ?? '',
    sentAt: tsToIso(m.ts),
    replyCount: m.reply_count ?? 0,
    files: (m.files ?? []).map((f) => toSlackFile(f, teamId)),
  };
}

async function resolveUserNames(botToken: string, userIds: string[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    userIds.map(async (id) => {
      try {
        const json = await slackApi<{ user: { real_name?: string; name: string } }>('users.info', botToken, {
          user: id,
        });
        return [id, json.user.real_name || json.user.name] as const;
      } catch {
        return [id, id] as const;
      }
    }),
  );
  return new Map(entries);
}

/**
 * 채널의 최상위 메시지를 가져온다. oldest를 넘기면 그 이후 메시지만 받는다 — 진짜 증분 폴링이 된다.
 * 스레드 답글은 여기 안 들어있다. replyCount가 0보다 크면 fetchReplies로 따로 받아야 한다.
 */
export async function fetchHistory(
  botToken: string,
  teamId: string,
  channelId: string,
  oldest?: string,
): Promise<SlackMessage[]> {
  const json = await slackApi<{ messages: RawMessage[] }>('conversations.history', botToken, {
    channel: channelId,
    limit: '50',
    ...(oldest ? { oldest } : {}),
  });

  const rawMessages = json.messages.filter((m) => m.type === 'message' && !m.subtype);
  const userIds = [...new Set(rawMessages.map((m) => m.user).filter((id): id is string => id !== undefined))];
  const names = await resolveUserNames(botToken, userIds);

  return rawMessages.map((m) => toSlackMessage(m, teamId, names)).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

/**
 * 스레드의 답글을 가져온다. Slack은 항상 부모 메시지를 첫 항목으로 끼워 주는데,
 * 부모는 채널 목록에 이미 떠 있으므로 여기서는 답글만 남긴다.
 */
export async function fetchReplies(
  botToken: string,
  teamId: string,
  channelId: string,
  threadTs: string,
  oldest?: string,
): Promise<SlackMessage[]> {
  const json = await slackApi<{ messages: RawMessage[] }>('conversations.replies', botToken, {
    channel: channelId,
    ts: threadTs,
    limit: '100',
    ...(oldest ? { oldest } : {}),
  });

  const rawReplies = json.messages.filter((m) => m.ts !== threadTs && m.type === 'message' && !m.subtype);
  const userIds = [...new Set(rawReplies.map((m) => m.user).filter((id): id is string => id !== undefined))];
  const names = await resolveUserNames(botToken, userIds);

  return rawReplies.map((m) => toSlackMessage(m, teamId, names)).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}
```

### 3.3 `app/api/slack/store.ts`

```ts
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, type SlackWorkspace } from '@/infra/slack/api';

export async function getWorkspaces(): Promise<SlackWorkspace[]> {
  const raw = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (raw === undefined) return [];
  return JSON.parse(raw) as SlackWorkspace[];
}

export async function addWorkspace(workspace: SlackWorkspace): Promise<void> {
  const existing = await getWorkspaces();
  const next = [...existing.filter((w) => w.teamId !== workspace.teamId), workspace];
  (await cookies()).set(TOKEN_COOKIE, JSON.stringify(next), TOKEN_COOKIE_OPTIONS);
}

export async function findBotToken(teamId: string): Promise<string | null> {
  const workspaces = await getWorkspaces();
  return workspaces.find((w) => w.teamId === teamId)?.botToken ?? null;
}
```

### 3.4 `app/api/slack/connect/route.ts`

```ts
import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/infra/slack/api';

export function GET() {
  try {
    return NextResponse.redirect(buildAuthUrl());
  } catch {
    return new Response(
      'Slack 연동 설정이 없습니다. .env.local에 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI를 채우고 서버를 다시 시작해 주세요.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
}
```

### 3.5 `app/api/slack/callback/route.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode } from '@/infra/slack/api';
import { addWorkspace } from '../store';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (code === null) return NextResponse.redirect(new URL('/?slack=denied', req.url));

  try {
    const workspace = await exchangeCode(code);
    await addWorkspace(workspace);
    return NextResponse.redirect(new URL('/?slack=connected', req.url));
  } catch (error) {
    console.error('[slack] 설치 실패', error);
    return NextResponse.redirect(new URL('/?slack=failed', req.url));
  }
}
```

### 3.6 `app/api/slack/workspaces/route.ts`

```ts
import { ok } from '@/lib/api-response';
import { getWorkspaces } from '../store';

export async function POST() {
  const workspaces = await getWorkspaces();
  return ok(workspaces.map((w) => ({ teamId: w.teamId, teamName: w.teamName })));
}
```

### 3.7 `app/api/slack/channels/route.ts`

```ts
import { z } from 'zod';
import { listChannels } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({ teamId: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('워크스페이스를 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    return ok(await listChannels(botToken));
  } catch (error) {
    console.error('[slack] 채널 목록 조회 실패', error);
    return fail('채널 목록을 가져오지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
```

### 3.8 `app/api/slack/join/route.ts`

```ts
import { z } from 'zod';
import { joinChannel } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({ teamId: z.string().min(1), channelId: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('채널을 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    await joinChannel(botToken, parsed.data.channelId);
    return ok({ joined: true });
  } catch (error) {
    console.error('[slack] 채널 참가 실패', error);
    return fail('이 채널에 봇을 추가하지 못했습니다. 비공개 채널이면 슬랙에서 봇을 직접 초대해 주세요.', 500);
  }
}
```

### 3.9 `app/api/slack/messages/route.ts`

```ts
import { z } from 'zod';
import { fetchHistory } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({
  teamId: z.string().min(1),
  channelId: z.string().min(1),
  oldest: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('채널을 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    const messages = await fetchHistory(botToken, parsed.data.teamId, parsed.data.channelId, parsed.data.oldest);
    return ok(messages);
  } catch (error) {
    console.error('[slack] 메시지 조회 실패', error);
    return fail('이 채널의 메시지를 가져오지 못했습니다. 봇이 채널에 있는지 확인해 주세요.', 500);
  }
}
```

### 3.10 `app/api/slack/thread/route.ts`

```ts
import { z } from 'zod';
import { fetchReplies } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({
  teamId: z.string().min(1),
  channelId: z.string().min(1),
  threadTs: z.string().min(1),
  oldest: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('스레드를 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    const replies = await fetchReplies(
      botToken,
      parsed.data.teamId,
      parsed.data.channelId,
      parsed.data.threadTs,
      parsed.data.oldest,
    );
    return ok(replies);
  } catch (error) {
    console.error('[slack] 스레드 조회 실패', error);
    return fail('스레드를 가져오지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
```

### 3.11 `app/api/slack/file/route.ts`

```ts
import { findBotToken } from '../store';

const ALLOWED_HOST_SUFFIX = '.slack.com';
const TIMEOUT_MS = 8000;

/**
 * Slack 파일(url_private)을 봇 토큰으로 대신 인증해 그대로 흘려준다.
 * <img src>가 GET으로 로드하므로 { ok, data } 규약의 예외다.
 *
 * url을 Slack 도메인으로 제한하지 않으면, 요청자가 아무 주소나 넣어서 우리 서버가
 * 봇 토큰을 실어 보내는 열린 프록시가 된다. 반드시 검증한다.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const fileUrl = searchParams.get('url');
  if (teamId === null || fileUrl === null) {
    return new Response('잘못된 요청입니다.', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(fileUrl);
  } catch {
    return new Response('잘못된 요청입니다.', { status: 400 });
  }
  if (target.protocol !== 'https:' || !target.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return new Response('허용되지 않은 주소입니다.', { status: 400 });
  }

  const botToken = await findBotToken(teamId);
  if (botToken === null) {
    return new Response('연결되지 않은 워크스페이스입니다.', { status: 401 });
  }

  try {
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${botToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok || res.body === null) {
      return new Response('파일을 가져오지 못했습니다.', { status: 502 });
    }
    return new Response(res.body, {
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream' },
    });
  } catch (error) {
    console.error('[slack] 파일 프록시 실패', error);
    return new Response('파일을 가져오지 못했습니다.', { status: 502 });
  }
}
```

### 3.12 `components/SlackMessage.tsx`

메시지 한 건(작성자·시각·본문·파일)을 그리는 조각이다. 채널 목록과 스레드 답글이 똑같은 모양으로 그려야 해서 공유한다.

```tsx
import type { SlackMessage } from '@/core/slack/types';

export function formatSlackTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SlackMessageItem({ message }: { message: SlackMessage }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{message.userName}</span>
        <span className="text-xs text-ink-muted">{formatSlackTime(message.sentAt)}</span>
      </div>

      {message.text !== '' && <p className="text-sm text-ink-muted">{message.text}</p>}

      {message.files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.files.map((file) =>
            file.isImage ? (
              <img
                key={file.id}
                src={file.url}
                alt={file.name}
                className="max-h-48 rounded-md border border-line object-contain"
              />
            ) : (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line px-2 py-1 text-xs hover:bg-paper"
              >
                📎 {file.name}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  );
}
```

### 3.13 `components/SlackThread.tsx`

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { post } from '@/lib/api-client';
import type { SlackMessage } from '@/core/slack/types';
import { SlackMessageItem } from './SlackMessage';

const POLL_INTERVAL_MS = 5_000;

type Props = { teamId: string; channelId: string; threadTs: string };

/** 펼쳐진 동안만 그 스레드를 폴링한다. 접으면 부모가 이 컴포넌트를 언마운트해서 자동으로 멈춘다. */
export function SlackThread({ teamId, channelId, threadTs }: Props) {
  const [replies, setReplies] = useState<SlackMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const oldestRef = useRef<string | undefined>(undefined);

  const poll = useCallback(async () => {
    const res = await post<SlackMessage[]>('/api/slack/thread', {
      teamId,
      channelId,
      threadTs,
      oldest: oldestRef.current,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    if (res.data.length === 0) return;

    oldestRef.current = res.data[res.data.length - 1].id;
    setReplies((prev) => [...prev, ...res.data]);
  }, [teamId, channelId, threadTs]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadTs]);

  return (
    <div className="mt-2 ml-4 border-l border-line pl-4">
      {error !== null && <p className="text-xs text-ink-muted">{error}</p>}
      {error === null && replies.length === 0 && (
        <p className="text-xs text-ink-muted">답글을 불러오는 중…</p>
      )}
      <ul className="flex flex-col gap-2">
        {replies.map((reply) => (
          <li key={reply.id}>
            <SlackMessageItem message={reply} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.14 `components/SlackPanel.tsx`

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { post } from '@/lib/api-client';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { SlackChannel, SlackMessage } from '@/core/slack/types';
import { SlackMessageItem } from './SlackMessage';
import { SlackThread } from './SlackThread';

const POLL_INTERVAL_MS = 5_000;

type Workspace = { teamId: string; teamName: string };

const CONNECT_NOTICE: Record<string, string> = {
  connected: 'Slack 워크스페이스가 연결되었습니다.',
  denied: 'Slack 연결이 취소되었습니다.',
  failed: 'Slack 연결에 실패했습니다. 다시 시도해 주세요.',
};

export function SlackPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedTeamId, setSelectedTeamId] = usePersistedState<string | null>('slack:team', null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = usePersistedState<string | null>('slack:channel', null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedThreadTs, setExpandedThreadTs] = useState<string | null>(null);

  const oldestRef = useRef<string | undefined>(undefined);

  const loadWorkspaces = useCallback(async () => {
    const res = await post<Workspace[]>('/api/slack/workspaces', {});
    if (!res.ok) return;
    setWorkspaces(res.data);
    if (selectedTeamId === null && res.data.length > 0) setSelectedTeamId(res.data[0].teamId);
  }, [selectedTeamId, setSelectedTeamId]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('slack');
    if (param !== null) {
      setNotice(CONNECT_NOTICE[param] ?? null);
      window.history.replaceState(null, '', window.location.pathname);
    }
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) {
      setChannels([]);
      return;
    }
    post<SlackChannel[]>('/api/slack/channels', { teamId: selectedTeamId }).then((res) => {
      if (res.ok) setChannels(res.data);
    });
  }, [selectedTeamId]);

  const selectChannel = useCallback(
    async (channel: SlackChannel) => {
      setError(null);
      setMessages([]);
      oldestRef.current = undefined;

      if (!channel.isMember) {
        if (channel.isPrivate) {
          setError('비공개 채널입니다. 슬랙에서 이 채널에 봇을 먼저 초대해 주세요.');
          return;
        }
        const joined = await post('/api/slack/join', { teamId: selectedTeamId, channelId: channel.id });
        if (!joined.ok) {
          setError(joined.error);
          return;
        }
      }
      setExpandedThreadTs(null);
      setSelectedChannelId(channel.id);
    },
    [selectedTeamId, setSelectedChannelId],
  );

  const poll = useCallback(async () => {
    if (selectedTeamId === null || selectedChannelId === null) return;
    setLoading(true);
    const res = await post<SlackMessage[]>('/api/slack/messages', {
      teamId: selectedTeamId,
      channelId: selectedChannelId,
      oldest: oldestRef.current,
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    if (res.data.length === 0) return;

    oldestRef.current = res.data[res.data.length - 1].id;
    setMessages((prev) => [...prev, ...res.data]);
  }, [selectedTeamId, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === null) return;
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === null) return;
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedChannelId, poll]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">슬랙</h2>
          <p className="text-sm text-ink-muted">채널을 선택하면 5초마다 새 대화를 확인합니다.</p>
        </div>
        <a
          href="/api/slack/connect"
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          워크스페이스 연결
        </a>
      </div>

      {notice !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm">{notice}</p>
      )}

      {workspaces.length === 0 && (
        <p className="text-sm text-ink-muted">연결된 워크스페이스가 없습니다. 먼저 연결해 주세요.</p>
      )}

      {workspaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((w) => (
            <button
              key={w.teamId}
              type="button"
              onClick={() => setSelectedTeamId(w.teamId)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                w.teamId === selectedTeamId
                  ? 'border-accent bg-accent text-white'
                  : 'border-line hover:bg-paper'
              }`}
            >
              {w.teamName}
            </button>
          ))}
        </div>
      )}

      {selectedTeamId !== null && channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectChannel(c)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                c.id === selectedChannelId ? 'border-accent bg-accent text-white' : 'border-line hover:bg-paper'
              }`}
            >
              {c.isPrivate ? '🔒 ' : '# '}
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted">{error}</p>
      )}

      {selectedChannel !== null && (
        <div className="rounded-md border border-line">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
            <span className="font-medium">
              {selectedChannel.isPrivate ? '🔒 ' : '# '}
              {selectedChannel.name}
            </span>
            {loading && <span className="text-xs text-ink-muted">확인 중…</span>}
          </div>

          <ul className="flex flex-col divide-y divide-line">
            {messages.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-muted">아직 대화가 없습니다.</li>
            )}
            {messages.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <SlackMessageItem message={m} />

                {m.replyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedThreadTs((prev) => (prev === m.id ? null : m.id))}
                    className="mt-1 text-xs text-accent hover:underline"
                  >
                    {expandedThreadTs === m.id ? '답글 숨기기' : `답글 ${m.replyCount}개 보기`}
                  </button>
                )}

                {expandedThreadTs === m.id && selectedTeamId !== null && selectedChannelId !== null && (
                  <SlackThread teamId={selectedTeamId} channelId={selectedChannelId} threadTs={m.id} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

### 3.15 `app/page.tsx`에 연결

```tsx
import { SlackPanel } from '@/components/SlackPanel';
// ...
<EmailPanel />
<EmailComposer />
<SlackPanel />
```

### 3.16 `.env.example`에 추가

```
# Slack 연동. api.slack.com/apps 에서 앱 생성 → OAuth & Permissions에서 발급/설정한다.
# SLACK_REDIRECT_URI는 'Redirect URLs'에 등록한 값과 글자 단위로 같아야 한다.
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback
```

---

## 4. 로컬에서 확인하는 순서

```bash
pnpm dev
```

1. 화면의 **워크스페이스 연결** 클릭 → Slack 설치 승인 화면(요청 스코프 목록이 보인다) → **허용**
2. `/?slack=connected`로 돌아오면 워크스페이스 버튼이 뜬다
3. 채널 버튼 목록에서 공개 채널(`#`)을 선택 → 봇이 자동 참가하고 메시지가 뜬다
4. 비공개 채널(🔒)을 선택했는데 봇이 아직 없다면 "슬랙에서 봇을 먼저 초대해 주세요" 안내가 뜨는지 확인
5. 슬랙에서 그 채널에 새 메시지를 보내고, 5초 안에 화면에 나타나는지 확인
6. 슬랙에서 어떤 메시지에 스레드 답글을 달고, 화면에서 그 메시지 아래 **"답글 N개 보기"**가 뜨는지, 클릭하면 답글이 들여쓰기로 나오는지 확인
7. 스레드를 펼쳐둔 채로 슬랙에서 답글을 하나 더 달고, 5초 안에 추가되는지 확인
8. 슬랙에서 이미지를 하나 올리고, 화면 메시지 아래 이미지가 실제로 렌더링되는지 확인 (안 뜨고 깨진 아이콘만 보이면 `/api/slack/file` 프록시나 스코프 문제다)
9. 이미지가 아닌 파일(PDF 등)을 올리고, 📎 파일명 링크가 뜨는지, 클릭하면 새 탭에서 열리는지 확인
