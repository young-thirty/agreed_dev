'use client';

// AI 솔루션을 만드는 자리.
//
// 서버가 계약 범위 대조 · 개발 현황 · 영향 범위 · 작업 가능 여부를 각각 판단한 뒤
// 하나로 종합한다. 한 번 만들면 저장되므로 티켓을 열 때 한 번만 부른다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { createTicketSolution } from '@/lib/api';

export function SolutionRunner({
  ticketId,
  onDone,
}: {
  ticketId: string;
  /** 만들어졌으면 상세를 다시 읽는다. 결과는 analysis에 실려 온다. */
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const alive = useRef(true);
  // 티켓 하나에 한 번만 부른다. 실패하면 사람이 다시 누른다.
  const started = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    const res = await createTicketSolution(ticketId);
    if (!alive.current) return;
    setRunning(false);
    if (!res.ok) return setError(res.error);
    onDone();
  }, [ticketId, onDone]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  if (error !== null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <p className="text-sm text-ink">{error}</p>
        <Button variant="outline" size="sm" onClick={run} className="mt-3">
          <RefreshCw className="size-3.5" />
          다시 시도
        </Button>
      </div>
    );
  }

  if (!running) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-faint">아직 분석 결과가 없습니다.</p>
        <Button variant="primary" size="sm" onClick={run} className="mt-3">
          <Sparkles className="size-4" />
          분석하기
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        <LoaderCircle className="size-4 animate-spin text-accent" />
        계약·과거 대화·자료·개발 현황을 확인하는 중입니다
      </p>
      <p className="mt-1 text-xs text-ink-faint">
        요구를 해석하고, 합의된 범위인지 대조하고, 저장소에서 구현 상태와 영향 범위를 봅니다.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <span className="skeleton-bar h-3 w-2/3" />
        <span className="skeleton-bar h-3 w-1/2" />
        <span className="skeleton-bar h-3 w-3/5" />
      </div>
    </div>
  );
}
