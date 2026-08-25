'use client';

// 개발 상황 확인. 요구 분석과 분리된 선택 단계다.
//
// 분석은 대화·문서·티켓만 보고 먼저 끝난다. GitHub까지 볼지는 사람이 정한다.
// 코드를 뒤지는 일은 시간이 걸리고, 모든 메시지에 필요하지도 않다.

import { useEffect, useState } from 'react';
import { Check, CodeXml, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { DevContextCard } from '@/components/DevContextCard';
import type { DevContext } from '@/types';

const STEP_MS = 600;

export function DevContextSection({
  dev,
  repo,
  hasRun,
  onRun,
}: {
  /** 확인했을 때 나올 내용. null이면 이 요청과 엮인 구현 내용을 찾지 못한 것이다. */
  dev: DevContext | null;
  repo: string | null;
  hasRun: boolean;
  onRun: () => void;
}) {
  const [running, setRunning] = useState(false);

  const steps = [
    '최근 커밋과 브랜치 확인',
    '진행 중인 PR 확인',
    '관련 코드 영역 확인',
  ];

  if (repo === null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <h3 className="text-sm font-medium text-ink">개발 상황</h3>
        <p className="mt-1 text-sm text-ink-faint">
          이 프로젝트는 GitHub이 연결되어 있지 않습니다. 연결하면 이 요청과 관련된 구현 상태를 확인해
          드립니다.
        </p>
      </div>
    );
  }

  if (running) {
    return <RunningCard steps={steps} onDone={() => { setRunning(false); onRun(); }} />;
  }

  if (!hasRun) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <CodeXml className="mt-0.5 size-4 shrink-0 text-ink-faint" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-ink">개발 상황도 확인할까요?</h3>
            <p className="mt-0.5 text-xs text-ink-faint">
              {dev !== null
                ? `${dev.subject} 관련 구현이 어디까지 됐는지 GitHub에서 확인합니다. 답변에 넣을 근거가 됩니다.`
                : '이 요청은 코드와 직접 엮이지 않아 보입니다. 필요하면 확인할 수 있습니다.'}
            </p>
            <p className="mt-1 font-mono text-xs text-ink-faint">{repo}</p>
          </div>
          <Button
            variant={dev !== null ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setRunning(true)}
          >
            개발 상황 확인
          </Button>
        </div>
      </div>
    );
  }

  if (dev === null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm text-ink">
          <Check className="size-4 text-success" />
          개발 상황을 확인했습니다
        </div>
        <p className="mt-1 text-sm text-ink-faint">
          이 요청과 엮이는 구현 내용을 찾지 못했습니다. 코드 변경 없이 답할 수 있는 요청으로 보입니다.
        </p>
      </div>
    );
  }

  return <DevContextCard dev={dev} repo={repo} />;
}

function RunningCard({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= steps.length) {
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [done, steps.length, onDone]);

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink">GitHub에서 개발 상황을 확인하는 중</p>
      <ul className="mt-3 flex flex-col gap-2.5">
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
    </div>
  );
}
