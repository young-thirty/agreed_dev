'use client';

// 티켓 카드. 업무 추적용이라 AI 분석 화면과 다르게 담백하게 둔다.
// 상태는 사람이 직접 고른다. AI가 Active·Done으로 바꾸지 않는다.

import { Badge } from '@/components/Badge';
import { relativeTime } from '@/lib/format';
import { TICKET_STATUS, type Ticket, type TicketStatus } from '@/types';

export function TicketCard({
  ticket,
  highlighted = false,
  onStatusChange,
}: {
  ticket: Ticket;
  /** 인박스에서 방금 반영한 티켓이면 눈에 띄게 둔다. */
  highlighted?: boolean;
  onStatusChange: (status: TicketStatus) => void;
}) {
  return (
    <li
      className={`rounded-lg bg-surface p-5 shadow-card ${
        highlighted ? 'ring-2 ring-accent' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">{ticket.ticketId}</span>
            <Badge tone="neutral">{ticket.category}</Badge>
          </div>
          <p className="mt-1.5 text-sm font-medium text-ink">{ticket.title}</p>
        </div>

        <label className="flex shrink-0 items-center gap-2">
          <span className="sr-only">티켓 상태</span>
          <span className={`size-1.5 rounded-full ${DOT[ticket.status]}`} />
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-accent"
          >
            {TICKET_STATUS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-3 grid grid-cols-[76px_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-xs text-ink-faint">요구사항</dt>
        <dd className="text-ink">{ticket.requirement}</dd>

        {ticket.lastCustomerMessage !== null && (
          <>
            <dt className="text-xs text-ink-faint">최근 요청</dt>
            <dd className="text-ink-muted">“{ticket.lastCustomerMessage}”</dd>
          </>
        )}

        <dt className="text-xs text-ink-faint">현재 상태</dt>
        <dd className="leading-relaxed text-ink-muted">{ticket.summary}</dd>
      </dl>

      <p className="mt-3 text-xs text-ink-faint">
        마지막 업데이트 {relativeTime(ticket.updatedAt)}
      </p>
    </li>
  );
}

/** 상태 점. 배지와 같은 색 체계를 쓴다. */
const DOT: Record<TicketStatus, string> = {
  Active: 'bg-success',
  Done: 'bg-ink-faint',
  Reject: 'bg-danger',
};
