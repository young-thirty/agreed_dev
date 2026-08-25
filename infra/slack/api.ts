import type { SlackChannel, SlackFile, SlackMessage } from '@/core/slack/types';

// Slack Web API도 REST라 fetch로 충분하다. 공식 SDK(@slack/web-api)는 쓰지 않는다.
// 참고: Slack은 HTTP 상태 코드가 아니라 응답 본문의 ok 필드로 성공 여부를 알린다.
// 실패해도 대부분 200을 준다 — 여기서 res.ok가 아니라 json.ok를 본다.

const TIMEOUT_MS = 8000;

// 콤마로 구분한다. Slack의 문서화된 스코프 구분자다.
const SCOPES = [
  'channels:read', // 공개 채널 목록
  'channels:history', // 공개 채널 메시지
  'channels:join', // 사용자가 고른 공개 채널에 봇이 스스로 들어가기
  'groups:read', // 봇이 이미 속한 비공개 채널 목록
  'groups:history', // 비공개 채널 메시지
  'users:read', // user id → 실제 이름
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

/** 사용자를 보낼 Slack 설치 화면 주소를 만든다. */
export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env('SLACK_CLIENT_ID'),
    scope: SCOPES,
    redirect_uri: env('SLACK_REDIRECT_URI'),
  });
  return `https://slack.com/oauth/v2/authorize?${params}`;
}

/** code를 봇 토큰으로 교환한다. Slack Bot Token은 Gmail과 달리 만료가 없어 갱신 로직이 필요 없다. */
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
        // 이름 조회가 실패해도 화면은 안 깨지게 id라도 보여준다
        return [id, id] as const;
      }
    }),
  );
  return new Map(entries);
}

/**
 * 채널의 최상위 메시지를 가져온다. oldest를 넘기면 그 이후 메시지만 받는다 — 진짜 증분 폴링이 된다.
 * (이메일 API는 이 커서 개념이 없어서 매번 최근 N통을 통째로 다시 받았다.)
 *
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

  // 채널 입장/봇 알림 같은 subtype 있는 메시지는 대화가 아니라 시스템 이벤트라 제외한다
  const rawMessages = json.messages.filter((m) => m.type === 'message' && !m.subtype);
  const userIds = [...new Set(rawMessages.map((m) => m.user).filter((id): id is string => id !== undefined))];
  const names = await resolveUserNames(botToken, userIds);

  return rawMessages
    .map((m) => toSlackMessage(m, teamId, names))
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt)); // Slack은 최신순으로 주므로 오래된 순으로 뒤집는다
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
