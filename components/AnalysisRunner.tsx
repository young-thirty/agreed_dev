'use client';

// 아직 분석하지 않은 메시지를 열면 보이는 화면.
// 사용자가 컨텍스트를 직접 뒤지지 않는다는 점이 보이도록, 무엇을 확인하고 있는지 한 줄씩 보여준다.
// (지금은 목 데이터라 실제 조회는 일어나지 않는다.)

import { useEffect, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

const STEP_MS = 550;

export function AnalysisRunner({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= steps.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [done, steps.length, onDone]);

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink">관련 컨텍스트를 찾고 있습니다</p>
      <p className="mt-0.5 text-xs text-ink-faint">
        이 메시지와 관련된 자료만 골라 확인합니다. 직접 찾지 않아도 됩니다.
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            {i < done ? (
              <Check className="size-4 shrink-0 text-success" />
            ) : i === done ? (
              <LoaderCircle className="size-4 shrink-0 animate-spin text-accent" />
            ) : (
              <span className="size-4 shrink-0" />
            )}
            <span className={i <= done ? 'text-ink' : 'text-ink-faint'}>{step}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        <span className="skeleton-bar h-3 w-2/3" />
        <span className="skeleton-bar h-3 w-1/2" />
      </div>
    </div>
  );
}
