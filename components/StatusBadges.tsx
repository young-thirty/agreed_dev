// 프로젝트 상태와 AI 판단 성격을 배지로 그린다. 대시보드·워크스페이스에서 공용으로 쓴다.

import { Badge, type BadgeTone } from '@/components/Badge';
import type { AnalysisVerdict, ProjectStatus } from '@/types';

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
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
