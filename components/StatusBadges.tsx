// 프로젝트 상태와 AI 판단 성격을 배지로 그린다. 대시보드·워크스페이스에서 공용으로 쓴다.

import { Badge, type BadgeTone } from '@/components/Badge';
import type { AnalysisVerdict, ProjectStatus, RequirementStatus } from '@/types';

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  ACTIVE: { label: 'Active', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'info' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

const VERDICT: Record<AnalysisVerdict, { label: string; tone: BadgeTone }> = {
  needs_clarification: { label: 'Needs Clarification', tone: 'warn' },
  scope_change: { label: 'Potential Scope Change', tone: 'danger' },
  in_scope: { label: 'In Scope', tone: 'success' },
};

export function VerdictBadge({ verdict }: { verdict: AnalysisVerdict }) {
  const v = VERDICT[verdict];
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

export const verdictLabel = (v: AnalysisVerdict): string => VERDICT[v].label;

/** 요구사항 상태. 사람이 판단할 거리가 남은 쪽을 눈에 띄게 둔다. */
const REQUIREMENT_STATUS: Record<RequirementStatus, BadgeTone> = {
  미확정: 'neutral',
  문의: 'info',
  요청: 'warn',
  제안: 'info',
  내부검토: 'neutral',
  고객검토: 'info',
  합의: 'success',
  거절: 'danger',
  완료: 'success',
};

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return <Badge tone={REQUIREMENT_STATUS[status]}>{status}</Badge>;
}
