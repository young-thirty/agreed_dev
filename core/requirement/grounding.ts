import type { Evidence, Utterance } from '@/types';

/** 공백과 따옴표 종류 차이를 무시하고 비교하기 위해 정규화한다. */
function normalize(text: string): string {
  return text.replace(/\s+/g, '').replace(/['"'"'"]/g, '');
}

/** 인용문이 해당 발화 원문에 실제로 존재하는지 확인한다. */
export function isGrounded(utterances: readonly Utterance[], evidence: Evidence): boolean {
  const utterance = utterances.find((u) => u.index === evidence.utteranceIndex);
  if (!utterance) return false;
  return normalize(utterance.text).includes(normalize(evidence.quote));
}

/**
 * 근거 없는 인용은 버리고 나머지는 살린다. 부분 수용 원칙.
 * 하나도 안 남으면 빈 배열이 되고, 호출부가 그 항목 전체를 버릴지 판단한다.
 */
export function groundEvidence(utterances: readonly Utterance[], evidence: readonly Evidence[]): Evidence[] {
  return evidence.filter((e) => isGrounded(utterances, e));
}
