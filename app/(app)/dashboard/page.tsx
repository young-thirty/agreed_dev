'use client';

// 대시보드. 여러 프로젝트를 한눈에 보고, 지금 확인이 필요한 것부터 눈에 들어오게 정렬한다.
// 진행 중(active)에서 확인 필요·범위 변경이 많은 프로젝트를 위로 올리고 살짝 강조한다.
//
// [프로토타입용] 어떤 정보를 넣을지 고르기 위해 생각나는 걸 다 붙여본 상태다.
// 여기서 쓸 만한 것만 골라 정리한다. 그대로 유지할 화면이 아니다.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { CHANNEL_META } from '@/components/channelMeta';
import { summaryOf, requestsOf, timelineOf } from '@/mocks';
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

const won = (n: number) => '₩' + n.toLocaleString('ko-KR');

// 종료일까지 남은 일수. 음수면 이미 지난 것이다.
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - NOW) / 86_400_000);
}

// 시작~종료일 중 지금이 얼마나 지났는지 0~100 사이로.
function progressPct(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 100;
  return Math.min(100, Math.max(0, Math.round(((NOW - s) / (e - s)) * 100)));
}

// 상태별 정렬 우선순위. active를 가장 위로.
const STATUS_ORDER: Record<ProjectStatus, number> = { active: 0, draft: 1, completed: 2 };

const STATUS_TABS: { key: 'all' | ProjectStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'completed', label: 'Completed' },
];

type SortKey = 'urgency' | 'deadline' | 'budget' | 'name';

const SORT_LABEL: Record<SortKey, string> = {
  urgency: '확인 필요 순',
  deadline: '마감 임박 순',
  budget: '예산 높은 순',
  name: '이름순',
};

const inputClass =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink-faint';

export default function DashboardPage() {
  const { projects } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const urgencyOf = (p: Project) => {
    const s = summaryOf(p.id);
    return s.needsClarification + s.scopeChanges;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
    });
  }, [projects, search, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortKey) {
      case 'deadline':
        return list.sort((a, b) => a.endDate.localeCompare(b.endDate));
      case 'budget':
        return list.sort((a, b) => b.budget - a.budget);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'urgency':
      default:
        return list.sort((a, b) => {
          const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          if (byStatus !== 0) return byStatus;
          return urgencyOf(b) - urgencyOf(a);
        });
    }
  }, [filtered, sortKey]);

  // 상단 요약 바에 쓰는 전체 집계. (필터와 무관하게 항상 전체 기준)
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const totalNeedsClarification = projects.reduce(
    (sum, p) => sum + summaryOf(p.id).needsClarification,
    0,
  );
  const totalScopeChanges = projects.reduce((sum, p) => sum + summaryOf(p.id).scopeChanges, 0);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const dueSoonCount = projects.filter((p) => {
    const d = daysUntil(p.endDate);
    return p.status === 'active' && d >= 0 && d <= 7;
  }).length;

  // '전체' 탭에서만 완료 프로젝트를 따로 접어서 보여준다.
  const showCompletedSeparately = statusFilter === 'all';
  const mainList = showCompletedSeparately
    ? sorted.filter((p) => p.status !== 'completed')
    : sorted;
  const completedList = showCompletedSeparately
    ? sorted.filter((p) => p.status === 'completed')
    : [];

  return (
    <div className="max-w-5xl px-8 py-8">
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

      {/* 요약 바 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg bg-surface px-4 py-3 shadow-card">
          <p className="text-xs text-ink-faint">전체</p>
          <p className="mt-1 text-lg font-semibold text-ink">{projects.length}</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-3 shadow-card">
          <p className="text-xs text-ink-faint">진행 중</p>
          <p className="mt-1 text-lg font-semibold text-ink">{activeCount}</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-3 shadow-card">
          <p className="text-xs text-ink-faint">확인 필요</p>
          <p className="mt-1 text-lg font-semibold text-warn">{totalNeedsClarification}</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-3 shadow-card">
          <p className="text-xs text-ink-faint">범위 변경</p>
          <p className="mt-1 text-lg font-semibold text-danger">{totalScopeChanges}</p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-3 shadow-card">
          <p className="text-xs text-ink-faint">마감 임박(7일)</p>
          <p className="mt-1 text-lg font-semibold text-ink">{dueSoonCount}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-faint">전체 계약 규모 {won(totalBudget)}</p>

      {/* 툴바: 검색 · 상태 탭 · 정렬 · 보기 전환 */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="프로젝트·클라이언트 검색"
            className={`${inputClass} w-56 pl-8`}
          />
        </div>

        <div className="flex gap-1 rounded-md border border-line bg-surface p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === t.key
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className={inputClass}
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABEL[k]}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-1 rounded-md border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="리스트 보기"
            className={`rounded p-1.5 ${view === 'list' ? 'bg-accent-soft text-accent' : 'text-ink-faint hover:text-ink'}`}
          >
            <ListIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-label="그리드 보기"
            className={`rounded p-1.5 ${view === 'grid' ? 'bg-accent-soft text-accent' : 'text-ink-faint hover:text-ink'}`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      {projects.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">
          아직 프로젝트가 없습니다. 새 프로젝트를 만들어 시작하세요.
        </p>
      ) : sorted.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">조건에 맞는 프로젝트가 없습니다.</p>
      ) : (
        <>
          <ProjectList projects={mainList} view={view} />

          {showCompletedSeparately && completedList.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-ink-faint hover:text-ink-muted">
                완료된 프로젝트 ({completedList.length})
              </summary>
              <div className="mt-3">
                <ProjectList projects={completedList} view={view} />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function ProjectList({ projects, view }: { projects: Project[]; view: 'list' | 'grid' }) {
  return (
    <ul
      className={
        view === 'grid' ? 'mt-6 grid grid-cols-2 gap-3' : 'mt-6 flex flex-col gap-3'
      }
    >
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </ul>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  const summary = summaryOf(p.id);
  const isActive = p.status === 'active';
  // 확인 필요·범위 변경이 있는 active 프로젝트만 좌측을 살짝 강조한다.
  const highlight = isActive && (summary.needsClarification > 0 || summary.scopeChanges > 0);

  const channels = [...new Set(requestsOf(p.id).map((r) => r.channel))];
  const latestEvent = timelineOf(p.id).at(-1);

  const dLeft = daysUntil(p.endDate);
  const dDayTone = dLeft < 0 ? 'danger' : dLeft <= 3 ? 'danger' : dLeft <= 7 ? 'warn' : 'neutral';
  const dDayLabel = dLeft < 0 ? '기한 초과' : `D-${dLeft}`;

  return (
    <li>
      <Link
        href={`/projects/${p.id}`}
        className={`block rounded-lg bg-surface px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover ${
          highlight ? 'border-l-2 border-l-accent' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {p.clientName.slice(0, 1)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{p.name}</span>
              <ProjectStatusBadge status={p.status} />
              {p.status !== 'completed' && <Badge tone={dDayTone}>{dDayLabel}</Badge>}
            </div>

            <p className="mt-1 text-sm text-ink-muted">{p.clientName}</p>
            <p className="mt-0.5 truncate text-sm text-ink-muted">{p.description}</p>
            <p className="mt-1.5 text-xs text-ink-faint">
              {p.startDate} ~ {p.endDate} · {won(p.budget)}
            </p>

            {p.status !== 'completed' && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${progressPct(p.startDate, p.endDate)}%` }}
                />
              </div>
            )}

            {channels.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                {channels.map((c) => {
                  const meta = CHANNEL_META[c];
                  const Icon = meta.icon;
                  return (
                    <span key={c} title={meta.label} className="text-ink-faint">
                      <Icon className="size-3.5" />
                    </span>
                  );
                })}
              </div>
            )}

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
                  <span className="text-ink-faint">{relativeTime(summary.lastActivity)}</span>
                )}
              </div>
            )}

            {latestEvent && (
              <p className="mt-2 truncate text-xs text-ink-faint">
                최근 변화: {latestEvent.date} · {latestEvent.title}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
