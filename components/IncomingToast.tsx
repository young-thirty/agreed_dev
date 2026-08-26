'use client';

// 새 티켓이 도착했다는 알림. 시연 패널과 티켓 목록의 새로고침 버튼이 함께 쓴다.

import { Inbox, X } from 'lucide-react';

export interface Arrived {
  ticketId: string;
  title: string;
  from: string;
}

export function IncomingToast({
  arrived,
  onOpen,
  onClose,
}: {
  arrived: Arrived;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed left-1/2 top-5 z-50 w-[380px] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-lg bg-surface px-4 py-3.5 shadow-card-hover">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft">
          <Inbox className="size-3.5 text-accent" />
        </span>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold text-accent">새로운 티켓(요구사항)이 도착했어요!</p>
          <p className="mt-1 truncate text-sm font-medium text-ink">{arrived.title}</p>
          <p className="mt-0.5 text-xs text-ink-faint">{arrived.from} 님 · 열어서 분석 보기</p>
        </button>
        <button
          type="button"
          aria-label="알림 닫기"
          onClick={onClose}
          className="rounded p-1 text-ink-faint transition-colors hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
