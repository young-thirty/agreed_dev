// 프로젝트·티켓·처리 단계를 배지로 그린다. 라벨과 색을 한 곳에 모아 화면마다 달라지지 않게 한다.

import { Badge, type BadgeTone } from '@/components/Badge';
import type { ProjectStatus, TicketStatus, WorkStage } from '@/types';

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'warn' },
  ACTIVE: { label: 'Active', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

/**
 * 티켓 상태 배지. 진행 중(Active)에는 붙이지 않는다.
 * 티켓은 만들어진 순간부터 계속 진행 중이라, 모든 줄에 같은 배지가 붙으면 뜻이 없다.
 */
const TICKET_STATUS_TONE: Record<Exclude<TicketStatus, 'Active'>, BadgeTone> = {
  Done: 'neutral',
  Reject: 'danger',
};

const TICKET_STATUS_LABEL: Record<Exclude<TicketStatus, 'Active'>, string> = {
  Done: '완료',
  Reject: '거절',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  if (status === 'Active') return null;
  return (
    <Badge tone={TICKET_STATUS_TONE[status]} dot>
      {TICKET_STATUS_LABEL[status]}
    </Badge>
  );
}

/** 지금 사람이 무엇을 해야 하는지. 티켓 목록과 티켓 상세가 같은 말을 쓴다. */
const STAGE: Record<WorkStage, { label: string; tone: BadgeTone } | null> = {
  to_analyze: { label: '분석 필요', tone: 'neutral' },
  to_reply: { label: '답변 필요', tone: 'info' },
  waiting: { label: '고객 회신 대기', tone: 'neutral' },
  idle: null, // 할 일이 없으면 아무것도 붙이지 않는다
};

export const stageLabel = (stage: WorkStage): string | null => STAGE[stage]?.label ?? null;

export function StageBadge({ stage }: { stage: WorkStage }) {
  const s = STAGE[stage];
  if (s === null) return null;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
