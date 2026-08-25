import Anthropic from '@anthropic-ai/sdk';

/** 간단한 예시 용도라 sonnet을 쓴다. */
export const EXTRACT_MODEL = 'claude-sonnet-5';

let client: Anthropic | null = null;

/**
 * 서버에서만 호출한다. API 키는 환경변수(ANTHROPIC_API_KEY)에서만 읽는다.
 *
 * 재시도는 이 클라이언트가 아니라 extract.ts가 L1 검증 실패 시 최대 1회
 * 직접 한다. maxRetries를 0으로 둬야 타임아웃까지 중복 재시도되지 않는다
 * (SDK 기본값 2 + 8초 타임아웃을 그대로 두면 최악 24초까지 걸린다).
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ timeout: 8000, maxRetries: 0 });
  }
  return client;
}
