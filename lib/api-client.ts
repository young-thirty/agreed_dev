import { demoBlob, demoMaterialUrl, demoRequest } from '@/mocks/server';
import type { ApiResult } from '@/types';

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE_URL = (
  configuredApiBaseUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

/**
 * 시연 모드. 켜져 있으면 서버로 나가지 않고 mocks/server.ts가 응답한다.
 * 발표용 demo 브랜치라 기본이 켜짐이다. 실제 백엔드에 붙이려면 NEXT_PUBLIC_DEMO=0을 준다.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO !== '0';

/** OAuth 이동과 Slack 파일 URL도 같은 FastAPI 주소를 사용한다. */
export function apiUrl(path: string): string {
  if (DEMO) return demoMaterialUrl(path);
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
  if (DEMO) {
    const body = init.body === undefined ? undefined : JSON.parse(String(init.body));
    return demoRequest<T>(init.method ?? 'GET', path, body);
  }
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

export async function patch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request(path, { method: 'PATCH', body: JSON.stringify(body) });
}

/**
 * 파일 원본을 그대로 받는다. get()과 갈라 둔 이유는 응답이 JSON이 아니라서다.
 * 실패하면 서버가 { ok:false, error }를 JSON으로 돌려주므로 그걸 그대로 읽는다.
 */
export async function getBlob(path: string): Promise<ApiResult<Blob>> {
  if (DEMO) return demoBlob(path);
  try {
    const res = await fetch(apiUrl(path), { credentials: 'include' });
    if (!res.ok) {
      const payload: unknown = await res.json().catch(() => null);
      const error =
        isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : '파일을 가져오지 못했습니다.';
      return { ok: false, error };
    }
    return { ok: true, data: await res.blob() };
  } catch {
    return { ok: false, error: '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
}
