'use client';

// 새 고객 메시지가 기존 티켓과 비슷해 보이면 서버가 그 티켓을 알려준다(analysis.relatedTicketId).
// 프론트는 판단하지 않는다. 상단에 알려주기만 하고, 합칠지 따로 둘지는 사람이 정한다.

import Link from 'next/link';
import { ArrowRight, GitCompareArrows } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { TicketStatusBadge } from '@/components/StatusBadges';

export function SimilarTicketNotice({
  ticketId,
  relatedTicketId,
}: {
  /** 지금 보고 있는 티켓. 자기 자신은 알릴 것이 없다. */
  ticketId: string;
  relatedTicketId: string | null;
}) {
  const { workItems } = useAppStore();

  if (relatedTicketId === null || relatedTicketId === ticketId) return null;
  const related = workItems.find((item) => item.ticket.ticketId === relatedTicketId);
  if (related === undefined) return null;

  return (
    <Link
      href={`/tickets/${relatedTicketId}`}
      className="mb-4 flex items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <GitCompareArrows className="size-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-faint">이 요청과 비슷한 티켓이 있습니다</p>
        <p className="mt-0.5 truncate text-sm font-medium text-ink">{related.ticket.title}</p>
      </div>
      <TicketStatusBadge status={related.ticket.status} />
      <ArrowRight className="size-4 shrink-0 text-ink-faint" />
    </Link>
  );
}
