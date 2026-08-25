import { cookies } from 'next/headers';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, type SlackWorkspace } from '@/infra/slack/api';

// route.ts가 아니라서 라우트로 취급되지 않는다. 여러 라우트가 공유하는 쿠키 접근 헬퍼다.
// 어느 워크스페이스/채널을 보고 있는지(화면 선택 상태)는 여기서 다루지 않는다 — 그건 클라이언트가
// usePersistedState로 들고 있는다. 여기 쿠키에는 봇 토큰(비밀)만 둔다.

export async function getWorkspaces(): Promise<SlackWorkspace[]> {
  const raw = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (raw === undefined) return [];
  return JSON.parse(raw) as SlackWorkspace[];
}

/** 워크스페이스를 추가한다. 같은 팀을 다시 연결하면 토큰만 최신 값으로 바뀐다. */
export async function addWorkspace(workspace: SlackWorkspace): Promise<void> {
  const existing = await getWorkspaces();
  const next = [...existing.filter((w) => w.teamId !== workspace.teamId), workspace];
  (await cookies()).set(TOKEN_COOKIE, JSON.stringify(next), TOKEN_COOKIE_OPTIONS);
}

export async function findBotToken(teamId: string): Promise<string | null> {
  const workspaces = await getWorkspaces();
  return workspaces.find((w) => w.teamId === teamId)?.botToken ?? null;
}
