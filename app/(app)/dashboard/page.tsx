'use client';

// 대시보드. 여러 프로젝트를 한눈에 보고, 지금 확인이 필요한 것부터 눈에 들어오게 정렬한다.
// 진행 중(active)에서 확인 필요·범위 변경이 많은 프로젝트를 위로 올리고 살짝 강조한다.

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { summaryOf } from '@/mocks';
import type { Project, ProjectStatus } from '@/types';

// 데모 기준 오늘. mocks의 receivedAt이 이 날짜 근처라 상대 시각이 자연스럽게 나온다.
const NOW = new Date('2026-08-25T18:00:00').getTime();

// ISO 시각을 "N시간 전"·"N일 전"처럼 사람이 읽는 문구로 바꾼다.
function relativeTime(iso: string): string {
  const diffMs = NOW - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// 상태별 정렬 우선순위. active를 가장 위로.
const STATUS_ORDER: Record<ProjectStatus, number> = { active: 0, draft: 1, completed: 2 };

export default function DashboardPage() {
  const { projects } = useAppStore();

  // 상태 우선순위 → active 내에서는 확인 필요+범위 변경 건수가 많은 순으로 정렬한다.
  const sorted = [...projects].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    const urgency = (p: Project) => {
      const s = summaryOf(p.id);
      return s.needsClarification + s.scopeChanges;
    };
    return urgency(b) - urgency(a);
  });

  return (
    <div className="max-w-3xl px-8 py-8">
      {/* 상단 */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-ink-muted">
            진행 중인 프로젝트에서 확인이 필요한 변화를 먼저 보여줍니다.
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary">
            <Plus className="size-4" />새 프로젝트
          </Button>
        </Link>
      </div>

      {/* 프로젝트 목록 */}
      {sorted.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">
          아직 프로젝트가 없습니다. 새 프로젝트를 만들어 시작하세요.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {sorted.map((p) => {
            const summary = summaryOf(p.id);
            const isActive = p.status === 'active';
            // 확인 필요·범위 변경이 있는 active 프로젝트만 좌측을 살짝 강조한다.
            const highlight =
              isActive && (summary.needsClarification > 0 || summary.scopeChanges > 0);

            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className={`block rounded-lg border border-line bg-surface px-5 py-4 transition-colors hover:border-ink-faint ${
                    highlight ? 'border-l-2 border-l-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{p.name}</span>
                    <ProjectStatusBadge status={p.status} />
                  </div>

                  <p className="mt-1 text-sm text-ink-muted">{p.clientName}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{p.description}</p>

                  {isActive && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
                      <span>새 요청 {summary.newRequests}</span>
                      {summary.needsClarification > 0 && (
                        <Badge tone="warn">확인 필요 {summary.needsClarification}</Badge>
                      )}
                      {summary.scopeChanges > 0 && (
                        <Badge tone="danger">범위 변경 {summary.scopeChanges}</Badge>
                      )}
                      {summary.lastActivity && (
                        <span className="text-ink-faint">
                          {relativeTime(summary.lastActivity)}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
