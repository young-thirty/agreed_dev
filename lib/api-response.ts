import { NextResponse } from 'next/server';
import type { ApiResult } from '@/types';

/** 성공 응답. 상태 코드는 200이다. */
export function ok<T>(data: T) {
  return NextResponse.json<ApiResult<T>>({ ok: true, data });
}

/**
 * 실패 응답. 상태 코드는 잘못된 입력 400, 서버 오류 500만 쓴다.
 * error에는 사용자가 그대로 읽을 한국어 문장을 넣는다. 스택 트레이스나 내부 식별자를 넣지 않는다.
 */
export function fail(error: string, status = 400) {
  return NextResponse.json<ApiResult<never>>({ ok: false, error }, { status });
}
