import { cookies } from 'next/headers';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, refreshAccessToken, type GmailTokens } from '@/infra/email/gmail';

// route.ts가 아니라서 Next가 라우트로 취급하지 않는다. /api/email/messages와 /send가 같이 쓰는 헬퍼다.

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
