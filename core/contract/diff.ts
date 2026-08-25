import type { Contract, ContractDiff } from '@/types';

/** 계약 두 버전 사이의 변경분을 계산한다. 우측 화면의 diff 표시가 이 값을 그대로 그린다. */
export function diffContract(before: Contract, after: Contract): ContractDiff {
  const beforeSet = new Set(before.scope);
  const afterSet = new Set(after.scope);

  return {
    scopeAdded: after.scope.filter((s) => !beforeSet.has(s)),
    scopeRemoved: before.scope.filter((s) => !afterSet.has(s)),
    dueDateChanged: before.dueDate === after.dueDate ? null : { before: before.dueDate, after: after.dueDate },
    amountDelta: after.amount - before.amount,
  };
}
