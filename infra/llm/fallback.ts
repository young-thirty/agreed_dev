import type { Utterance } from '@/types';
import type { ExtractResult } from './schema';

const DEMO_MARKER = '영문 페이지도 가능할까요';

/**
 * 고정 시연 시나리오를 감지해 즉시 결과를 돌려준다. 네트워크를 타지 않아
 * 시연 중 호출 실패·지연 위험이 없다. 이 시나리오가 아니면 빈 결과이고,
 * 호출부가 실제 API 호출로 넘어간다.
 */
export function buildFallbackResult(utterances: readonly Utterance[]): ExtractResult {
  const match = utterances.find((u) => u.text.includes(DEMO_MARKER));
  if (!match) return { items: [] };

  return {
    items: [
      {
        title: '영문 페이지 추가',
        proposedStatus: '문의',
        evidence: [{ utteranceIndex: match.index, quote: DEMO_MARKER }],
        existingId: null,
        proposedDecision: null,
      },
    ],
  };
}
