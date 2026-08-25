import type { ApiResult } from '@/types';

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE_URL = (
  configuredApiBaseUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

/** OAuth 이동과 Slack 파일 URL도 같은 FastAPI 주소를 사용한다. */
export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseApiResult<T>(payload: unknown, status: number): ApiResult<T> {
  if (isRecord(payload) && payload.ok === true && 'data' in payload) {
    return { ok: true, data: payload.data as T };
  }
  if (isRecord(payload) && payload.ok === false && typeof payload.error === 'string') {
    return { ok: false, error: payload.error };
  }
  if (status === 422) {
    return { ok: false, error: '입력값 형식을 확인해 주세요.' };
  }
  return { ok: false, error: '서버 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요.' };
}

async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const headers = init.body === undefined
      ? init.headers
      : { 'Content-Type': 'application/json', ...init.headers };
    const res = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers,
    });
    return parseApiResult<T>(await res.json(), res.status);
  } catch {
    return { ok: false, error: '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
}

/**
 * 서버 호출 래퍼. 화면에서는 fetch를 직접 부르지 않고 이 함수를 쓴다.
 *
 * 실패해도 예외를 던지지 않는다. 항상 ApiResult로 돌려주므로 호출부는 ok만 확인하면 된다.
 * 시연 중 네트워크가 끊겨도 화면이 흰 화면으로 가지 않게 하기 위한 규칙이다.
 */
export async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function get<T>(path: string): Promise<ApiResult<T>> {
  return request(path, { method: 'GET' });
}
