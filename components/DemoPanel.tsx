'use client';

// 시연 조작 패널. 시연 모드에서만 보인다.
//
// 발표 중에 "지금 고객 메시지가 하나 도착했다고 칩시다"를 말이 아니라 화면으로 보여주기 위한 것이다.
// 실제 제품 기능이 아니므로 평소에는 접혀 있고, 백엔드를 붙이면(NEXT_PUBLIC_DEMO=0) 사라진다.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RotateCcw, X } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { IncomingToast, type Arrived } from '@/components/IncomingToast';
import { DEMO } from '@/lib/api-client';
import { deliverNextIncoming, incomingLeft, resetDemo } from '@/mocks/server';

export function DemoPanel() {
  const router = useRouter();
  const { reload } = useAppStore();
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(0);
  const [arrived, setArrived] = useState<Arrived | null>(null);

  // 남은 메시지 수는 브라우저에만 있다. 첫 렌더와, 티켓 목록 쪽에서 받아왔을 수 있으니
  // 패널을 열 때마다 다시 읽는다.
  useEffect(() => {
    if (DEMO && open) setLeft(incomingLeft());
  }, [open]);

  if (!DEMO) return null;

  async function receive() {
    const next = deliverNextIncoming();
    setLeft(incomingLeft());
    if (next === null) return;
    setArrived(next);
    await reload();
  }

  function reset() {
    resetDemo();
    window.location.href = '/tickets';
  }

  return (
    <>
      {/* 새 메시지 알림. 눌러서 바로 그 티켓으로 간다. */}
      {arrived !== null && (
        <IncomingToast
          arrived={arrived}
          onOpen={() => {
            router.push(`/tickets/${arrived.ticketId}`);
            setArrived(null);
          }}
          onClose={() => setArrived(null)}
        />
      )}

      <div className="fixed bottom-5 right-5 z-40">
        {open ? (
          <div className="w-64 rounded-lg bg-surface p-4 shadow-card-hover">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">시연 패널</span>
              <button
                type="button"
                aria-label="시연 패널 접기"
                onClick={() => setOpen(false)}
                className="ml-auto rounded p-1 text-ink-faint transition-colors hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-ink-faint">
              목 데이터로 도는 화면입니다. 백엔드를 붙이면 이 패널은 사라집니다.
            </p>

            <button
              type="button"
              onClick={receive}
              disabled={left === 0}
              className="mt-3 flex w-full items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="size-3.5" />
              새 고객 메시지 받기
              <span className="ml-auto opacity-80">{left}</span>
            </button>

            <button
              type="button"
              onClick={reset}
              className="mt-1.5 flex w-full items-center gap-2 rounded-md border border-line px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-paper hover:text-ink"
            >
              <RotateCcw className="size-3.5" />
              처음 상태로 되돌리기
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="시연 패널 열기"
            className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-xs font-medium text-ink-muted shadow-card-hover transition-colors hover:text-ink"
          >
            <Play className="size-3.5 text-accent" />
            시연
          </button>
        )}
      </div>
    </>
  );
}
