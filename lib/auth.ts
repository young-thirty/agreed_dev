// 로그인·회원가입의 유일한 접점.
//
// 세션은 서버가 HttpOnly 쿠키(agreed_session)로 내려준다. 브라우저 코드가 토큰을
// 들고 있지 않으므로 여기서 저장할 것이 없다. 로그인한 사람이 필요하면
// GET /api/auth/me를 부른다.

import { post } from '@/lib/api-client';
import type { UserSummary } from '@/types/api';

/** 로그인한 뒤 들어가는 화면. 앱의 첫 화면이 바뀌면 여기만 고친다. */
export const HOME_PATH = '/tickets';

export type AuthResult = { ok: true; user: UserSummary } | { ok: false; error: string };

/** 인증 API는 { ok, data: { user } } 로 돌려준다. */
async function authenticate(path: string, body: unknown): Promise<AuthResult> {
  const res = await post<{ user: UserSummary }>(path, body);
  // 실패 문구는 서버가 사용자가 읽을 한국어로 내려준다. 여기서 다시 쓰지 않는다.
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, user: res.data.user };
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}): Promise<AuthResult> {
  // 가입이 성공하면 서버가 곧바로 로그인 상태로 만들어 준다. 따로 로그인하지 않는다.
  return authenticate('/api/auth/signup', {
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    phoneNumber: input.phoneNumber.trim(),
  });
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  return authenticate('/api/auth/login', {
    email: input.email.trim(),
    password: input.password,
  });
}

/** 로그아웃. 서버가 세션 쿠키를 지운다. 실패해도 화면은 로그인으로 보낸다. */
export async function logout(): Promise<void> {
  await post('/api/auth/logout', {});
}

/** 로그아웃한 뒤 들어가는 화면. */
export const LOGIN_PATH = '/login';
