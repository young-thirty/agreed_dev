import type { Contract, Requirement } from '@/types';

/**
 * 합의된 요구사항을 계약에 반영한다.
 *
 * 시스템 전체에서 계약을 변경하는 통로는 이 함수 하나뿐이다. status가 '합의'가
 * 아니거나 decision이 없으면 예외를 던진다 — 조용히 무시하지 않고 드러낸다.
 * 이 검사는 호출 위치(서버든 클라이언트든)와 무관하게 함수 자체에 있으므로
 * 우회할 다른 경로를 만들지 않는 한 항상 지켜진다.
 */
export function applyToContract(contract: Contract, requirement: Requirement): Contract {
  if (requirement.status !== '합의') {
    throw new Error(`'${requirement.title}'은(는) 아직 합의되지 않았습니다.`);
  }
  if (!requirement.decision) {
    throw new Error(`'${requirement.title}'에 확정된 금액·납기가 없습니다.`);
  }

  return {
    version: contract.version + 1,
    scope: [...contract.scope, requirement.title],
    dueDate: requirement.decision.dueDate,
    amount: contract.amount + requirement.decision.amountDelta,
  };
}
