import type { RequirementStatus } from '@/types';

/**
 * 정상 전이표. 각 상태에서 갈 수 있는 다음 상태를 나열한다.
 *
 * '미확정'은 진입 상태이자 강등 목적지다. 다른 상태에서 '미확정'으로 되돌아오는 길은
 * 이 표에 없다. 강등은 이 표를 거치지 않는 비상구이며 demote가 담당한다.
 * '거절'과 '완료'는 종료 상태라 나가는 길이 없다.
 * '문의'에는 '제안'으로 가는 길이 있다 — 사람이 문의를 보자마자 금액·납기를
 * 붙여 바로 제안하는 경우가 있어, '요청'을 거치지 않고도 갈 수 있어야 한다.
 */
const TRANSITIONS: Record<RequirementStatus, readonly RequirementStatus[]> = {
  미확정: ['문의', '요청', '거절'],
  문의: ['요청', '제안', '거절'],
  요청: ['내부검토', '제안', '거절'],
  내부검토: ['제안', '거절'],
  제안: ['고객검토', '합의', '거절'],
  고객검토: ['합의', '요청', '거절'],
  합의: ['완료'],
  거절: [],
  완료: [],
};

/**
 * LLM이 제안할 수 있는 상태.
 *
 * '합의'와 '완료', '거절'은 빠져 있다. 합의·완료·거절은 모두 사람이 결정하는
 * 사실 확인이지 추론의 대상이 아니기 때문이다. 특히 '거절'을 모델이 먼저
 * 결정해버리면 그 요구사항은 화면에서 사라져 사람이 판단할 기회 자체가 없어진다.
 *
 * `as const satisfies`로 리터럴 튜플 타입을 유지한다. infra/llm/schema.ts의
 * zod enum이 이 배열을 그대로 가져다 쓴다.
 */
export const LLM_PROPOSABLE = [
  '미확정',
  '문의',
  '요청',
  '제안',
  '내부검토',
  '고객검토',
] as const satisfies readonly RequirementStatus[];

/** 전이표상 from에서 to로 갈 수 있는지 판정한다. */
export function canTransition(from: RequirementStatus, to: RequirementStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * 사람 조작으로 상태를 바꾼다. 불가능한 전이면 예외를 던진다.
 *
 * 사람은 화면에서 고를 수 있는 것만 고르므로, 불가능한 전이가 들어왔다면 화면이나 호출부가
 * 잘못된 것이다. 조용히 다른 값으로 바꾸지 않고 드러낸다. LLM 출력에는 쓰지 않는다.
 */
export function transition(from: RequirementStatus, to: RequirementStatus): RequirementStatus {
  if (canTransition(from, to)) return to;

  const allowed = TRANSITIONS[from];
  throw new Error(
    allowed.length === 0
      ? `'${from}'에서는 상태를 더 이상 바꿀 수 없습니다.`
      : `'${from}'에서 '${to}'(으)로는 바꿀 수 없습니다. ${allowed.join(', ')} 중에서 선택해 주세요.`,
  );
}

/**
 * LLM이 제안한 상태를 안전하게 받아들인다. L3 검증 계층에서만 쓴다.
 *
 * 제안값이 9개 상태 중 하나라는 것은 앞선 L1(스키마 검증)이 보장한다.
 * 여기서는 세 가지를 본다. 이전과 같은 상태를 다시 맞혔는가, LLM이 제안해도
 * 되는 값인가, 그리고 전이표상 도달 가능한가.
 *
 * 재분석에서 같은 상태를 다시 제안한 경우는 먼저 통과시킨다. 대화가 추가로
 * 들어와 기존 요구사항을 다시 분석할 때, 상태가 그대로인데도 전이표에 자기
 * 자신으로 가는 길이 없다는 이유로 '미확정'까지 내려가면 안 된다.
 *
 * 나머지 경우 둘 중 하나라도 아니면 거부하지 않고 '미확정'으로 내린다. 거부하면
 * 화면에 아무것도 남지 않지만, 강등하면 사람이 판단할 거리가 남기 때문이다.
 */
export function demote(from: RequirementStatus, proposed: RequirementStatus): RequirementStatus {
  if (proposed === from) return from;
  if (!(LLM_PROPOSABLE as readonly RequirementStatus[]).includes(proposed)) return '미확정';
  return canTransition(from, proposed) ? proposed : '미확정';
}
