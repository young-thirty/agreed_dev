// 메시지 상세의 뼈대.
// 고객 메시지 → AI 분석 → 내 판단 → 답변 순서가 눈에 보이도록 번호와 세로선으로 잇는다.

import type { ReactNode } from 'react';

export function FlowSection({
  step,
  label,
  hint,
  last = false,
  children,
}: {
  step: number;
  label: string;
  hint?: string;
  /** 마지막 단계는 아래로 이어지는 선을 그리지 않는다. */
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[28px_1fr] gap-x-4">
      <div className="flex flex-col items-center">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-semibold text-ink-muted">
          {step}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>

      <div className={`min-w-0 ${last ? 'pb-2' : 'pb-9'}`}>
        <div className="flex items-baseline gap-2 pt-1">
          <h2 className="text-sm font-semibold text-ink">{label}</h2>
          {hint !== undefined && <span className="text-xs text-ink-faint">{hint}</span>}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}
