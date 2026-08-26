'use client';

// 티켓 카드. 업무 추적용이라 AI 분석 화면과 다르게 담백하게 둔다.
// 상태는 사람이 직접 고른다. AI가 Active·Done으로 바꾸지 않는다.

import { Badge } from '@/components/Badge';
import { ChannelChip } from '@/components/channelMeta';
import { TicketStatusControl } from '@/components/TicketStatusControl';
import { previewLine } from '@/lib/email-clean';
import { relativeTime } from '@/lib/format';
import type { Channel, Ticket, TicketStatus } from '@/types';

export function TicketCard({
  ticket,
  channel,
  highlighted = false,
  onStatusChange,
}: {
  ticket: Ticket;
  /** 어느 채널로 온 티켓인지. 아직 답하지 않은 메시지가 있을 때만 알 수 있다. */
  channel: Channel | null;
  /** 인박스에서 방금 반영한 티켓이면 눈에 띄게 둔다. */
  highlighted?: boolean;
  onStatusChange: (status: TicketStatus) => void;
}) {
  // 인용된 이전 대화와 서명을 걷어낸 한 줄. 원문 그대로면 목록이 읽히지 않는다.
  const recent = ticket.lastCustomerMessage === null ? '' : previewLine(ticket.lastCustomerMessage);

  return (
    <li
      className={`rounded-lg bg-surface p-5 shadow-card ${
        highlighted ? 'ring-2 ring-accent' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {channel !== null && <ChannelChip channel={channel} />}
            <Badge tone="neutral">{ticket.category}</Badge>
          </div>
          <p className="mt-1.5 text-sm font-medium text-ink">{ticket.title}</p>
        </div>

        <TicketStatusControl status={ticket.status} size="sm" onChange={onStatusChange} />
      </div>

      <dl className="mt-3 grid grid-cols-[76px_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-xs text-ink-faint">요구사항</dt>
        <dd className="text-ink">{ticket.requirement}</dd>

        {recent !== '' && (
          <>
            <dt className="text-xs text-ink-faint">최근 요청</dt>
            <dd className="text-ink-muted">“{recent}”</dd>
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
