// 프로젝트·티켓·처리 단계를 배지로 그린다. 라벨과 색을 한 곳에 모아 화면마다 달라지지 않게 한다.

import { Badge, type BadgeTone } from '@/components/Badge';
import type { ProjectStatus, TicketStatus, WorkStage } from '@/types';

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'warn' },
  ACTIVE: { label: 'Active', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

/** 티켓 상태. 진행 중인 것만 색이 살아 있고, 끝난 것은 조용해진다. */
export const TICKET_STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  Active: 'success',
  Done: 'neutral',
  Reject: 'danger',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge tone={TICKET_STATUS_TONE[status]} dot>
      {status}
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
