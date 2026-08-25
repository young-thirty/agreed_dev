import type { ApiResult } from '@/types';

/**
 * 서버 호출 래퍼. 화면에서는 fetch를 직접 부르지 않고 이 함수를 쓴다.
 *
 * 실패해도 예외를 던지지 않는다. 항상 ApiResult로 돌려주므로 호출부는 ok만 확인하면 된다.
 * 시연 중 네트워크가 끊겨도 화면이 흰 화면으로 가지 않게 하기 위한 규칙이다.
 */
export async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    // 연결 실패, 응답이 JSON이 아닌 경우가 모두 여기로 온다
    return { ok: false, error: '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
}
