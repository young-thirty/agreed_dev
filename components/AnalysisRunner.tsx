'use client';

// 아직 분석이 끝나지 않은 티켓에 보이는 자리.
// 분석은 서버가 대화를 수집할 때 돌린다. 화면은 상태를 보여주고 다시 조회만 한다.

import { LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';

export function AnalysisRunner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        <LoaderCircle className="size-4 animate-spin text-accent" />
        관련 컨텍스트를 확인하는 중입니다
      </p>
      <p className="mt-1 text-xs text-ink-faint">
        과거 대화 · 제안서 · 계약서 · 기존 티켓을 함께 봅니다. 직접 찾지 않아도 됩니다.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <span className="skeleton-bar h-3 w-2/3" />
        <span className="skeleton-bar h-3 w-1/2" />
      </div>

      <Button variant="outline" size="sm" onClick={onRefresh} className="mt-4">
        <RefreshCw className="size-3.5" />
        다시 확인
      </Button>
    </div>
  );
}
