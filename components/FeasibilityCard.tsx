'use client';

// 작업 가능 여부. 계약 범위 판정과는 다른 축이다 —
// 계약 밖이어도 기술적으로 쉬울 수 있고, 계약 안이어도 막힐 수 있다.
//
// 금액·납기·수락 여부는 여기서 정하지 않는다. 사람이 정한다.

import { Badge, type BadgeTone } from '@/components/Badge';
import type { Feasibility, FeasibilityVerdict } from '@/types';

const VERDICT: Record<FeasibilityVerdict, { label: string; tone: BadgeTone }> = {
  feasible: { label: '지금 범위로 가능', tone: 'success' },
  feasible_with_scope_change: { label: '범위를 바꾸면 가능', tone: 'warn' },
  needs_clarification: { label: '확인이 더 필요', tone: 'neutral' },
  blocked: { label: '지금은 막힘', tone: 'danger' },
};

export function FeasibilityCard({ feasibility }: { feasibility: Feasibility }) {
  const verdict = VERDICT[feasibility.verdict];

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">작업 가능 여부</span>
        <Badge tone={verdict.tone} dot>
          {verdict.label}
        </Badge>
      </div>

      {feasibility.reason !== '' && (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feasibility.reason}</p>
      )}

      {feasibility.requiredHumanInput.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-xs text-ink-faint">AI가 정할 수 없어 사람이 정해야 합니다</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {feasibility.requiredHumanInput.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warn" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
