import type { EmailAddress, RawEmail } from '@/core/email/types';

// Gmail은 REST라 fetch로 충분하다. googleapis SDK는 수십 MB짜리라 쓰지 않는다.

const TIMEOUT_MS = 8000;

// gmail.readonly는 restricted, gmail.send는 sensitive 스코프다. 각각 검증 요건이 다르지만
// 둘 다 테스트 모드에서는 테스트 사용자로 등록된 계정에 한해 심사 없이 쓸 수 있다.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

export type GmailTokens = { accessToken: string; refreshToken: string; expiresAt: number };

/** 토큰을 담는 쿠키 이름과 옵션. 여러 라우트가 같은 값을 써야 한다. */
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
  return requestToken({
    code,
    redirect_uri: env('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code',
  });
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
