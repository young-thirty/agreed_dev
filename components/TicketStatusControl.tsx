'use client';

// 티켓 상태를 정하는 자리.
//
// 티켓은 고객 메시지가 들어온 순간 만들어져 그때부터 계속 진행 중이다.
// 그래서 '진행 중'은 고르는 값이 아니라 기본값이고, 사람이 정하는 것은
// 이 티켓을 끝낼지(Done) 받지 않을지(Reject) 뿐이다.

import { Ban, Check, Undo2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { TicketStatusBadge } from '@/components/StatusBadges';
import type { TicketStatus } from '@/types';

export function TicketStatusControl({
  status,
  size = 'md',
  onChange,
}: {
  status: TicketStatus;
  size?: 'sm' | 'md';
  onChange: (status: TicketStatus) => void;
}) {
  const icon = size === 'sm' ? 'size-3.5' : 'size-4';

  if (status === 'Active') {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size={size} onClick={() => onChange('Done')}>
          <Check className={icon} />
          완료
        </Button>
        <Button variant="ghost" size={size} onClick={() => onChange('Reject')}>
          <Ban className={icon} />
          거절
        </Button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <TicketStatusBadge status={status} />
      <Button variant="ghost" size={size} onClick={() => onChange('Active')}>
        <Undo2 className={icon} />
        되돌리기
      </Button>
    </div>
  );
}
