'use client';

// 사용자가 가장 먼저 보는 목록. 단위는 티켓이다.
// 새 고객 메시지는 관련 티켓에 붙고, 관련 티켓이 없으면 Active 티켓으로 새로 들어온다.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FolderKanban, RefreshCw, Search, X } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { ChannelChip } from '@/components/channelMeta';
import { IncomingToast, type Arrived } from '@/components/IncomingToast';
import { TicketStatusBadge } from '@/components/StatusBadges';
import { DEMO } from '@/lib/api-client';
import { previewLine } from '@/lib/email-clean';
import { relativeTime } from '@/lib/format';
import { deliverNextIncoming, incomingLeft } from '@/mocks/server';
import type { WorkItem, WorkStage } from '@/types';

// 진행 중은 티켓의 기본값이라 거르는 값이 되지 않는다. 끝난 것만 따로 본다.
type Filter = 'todo' | 'all' | 'Done' | 'Reject';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todo', label: '처리 필요' },
  { key: 'all', label: '전체' },
  { key: 'Done', label: '완료' },
  { key: 'Reject', label: '거절' },
];

const needsWork = (stage: WorkStage) => stage === 'to_analyze' || stage === 'to_reply';

/** 지금 이 줄에서 무슨 일이 벌어지고 있는지 한 마디. */
function hintOf(item: WorkItem, stage: WorkStage): string {
  if (stage === 'to_analyze') return '분석 대기';
  if (stage === 'waiting') return '답변 보냄';
  if (item.pending === null) return '';
  return item.pending.analysis.missingInfo.length > 0 ? '추가 정보 필요' : '답변 준비됨';
}

export function WorkList() {
  const { workItems, projects, loaded, error, reload } = useAppStore();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('todo');
  const [query, setQuery] = useState('');

  // 시연용: 새 고객 메시지를 하나 받아와 티켓을 만든다. 남은 게 없으면 버튼을 막는다.
  const [demoLeft, setDemoLeft] = useState(0);
  const [arrived, setArrived] = useState<Arrived | null>(null);

  useEffect(() => {
    if (DEMO) setDemoLeft(incomingLeft());
  }, []);

  async function receiveDemoTicket() {
    const next = deliverNextIncoming();
    setDemoLeft(incomingLeft());
    if (next === null) return;
    setArrived(next);
    await reload();
  }

  const counts = useMemo(() => {
    const todo = workItems.filter((item) => needsWork(item.workStage)).length;
    return { todo, all: workItems.length };
  }, [workItems]);

  const visible = useMemo(() => {
    // 제목·요구사항·고객 이름·프로젝트 이름 중 어디에 걸려도 찾아 준다.
    const keyword = query.trim().toLowerCase();
    const matches = (item: WorkItem) => {
      if (keyword === '') return true;
      const project = projects.find((p) => p.projectId === item.ticket.projectId);
      return [
        item.ticket.title,
        item.ticket.requirement,
        item.ticket.category,
        item.pending?.fromName ?? '',
        item.pending?.preview ?? '',
        project?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    };

    return workItems.filter((item) => {
      if (!matches(item)) return false;
      if (filter === 'all') return true;
      if (filter === 'todo') return needsWork(item.workStage);
      return item.ticket.status === filter;
    });
  }, [workItems, projects, filter, query]);

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-r border-line bg-surface">
      {arrived !== null && (
        <IncomingToast
          arrived={arrived}
          onOpen={() => {
            router.push(`/tickets/${arrived.ticketId}`);
            setArrived(null);
          }}
          onClose={() => setArrived(null)}
        />
      )}

      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold tracking-tight">티켓</h1>
          {DEMO && (
            <button
              type="button"
              onClick={receiveDemoTicket}
              disabled={demoLeft === 0}
              aria-label="새 티켓 받기(시연용 새로고침)"
              title="시연용: 새 고객 메시지를 하나 받아옵니다"
              className="ml-auto rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-faint">
          고객 메시지는 관련 티켓에 붙고, 관련 티켓이 없으면 새 티켓으로 들어옵니다.
        </p>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="티켓 · 고객 · 프로젝트 검색"
            aria-label="티켓 검색"
            className="w-full rounded-md border border-line bg-paper py-1.5 pl-8 pr-8 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-3 focus:outline-accent-soft"
          />
          {query !== '' && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1 rounded-lg bg-paper p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs transition-all ${
                filter === f.key
                  ? 'bg-surface font-medium text-ink shadow-pop'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {f.label}
              {f.key === 'todo' && counts.todo > 0 && (
                <span className="ml-1 text-ink-faint">{counts.todo}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {error !== null && <li className="px-5 py-8 text-sm text-ink-faint">{error}</li>}

        {error === null && !loaded && (
          <li className="px-5 py-8 text-sm text-ink-faint">티켓을 불러오는 중…</li>
        )}

        {error === null && loaded && visible.length === 0 && (
          <li className="px-5 py-8 text-sm text-ink-faint">
            {query !== ''
              ? `“${query}”에 해당하는 티켓이 없습니다.`
              : filter === 'todo'
                ? '지금 처리할 것이 없습니다.'
                : '해당하는 티켓이 없습니다.'}
          </li>
        )}

        {visible.map((item) => {
          const stage = item.workStage;
          const { ticket, pending } = item;
          const selected = params.id === ticket.ticketId;
          const project = projects.find((p) => p.projectId === ticket.projectId);
          const hint = hintOf(item, stage);

          return (
            <li key={ticket.ticketId}>
              <Link
                href={`/tickets/${ticket.ticketId}`}
                className={`block border-b border-line px-5 py-3.5 transition-colors ${
                  selected ? 'bg-accent-soft' : 'hover:bg-paper'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 어느 채널로 온 메시지인지. 답을 다 한 티켓에는 붙일 근거가 없다. */}
                  {pending !== null && <ChannelChip channel={pending.channel} />}
                  <TicketStatusBadge status={ticket.status} />
                  <span className="ml-auto shrink-0 text-xs text-ink-faint">
                    {relativeTime(item.lastActivityAt)}
                  </span>
                </div>

                <p className="mt-1.5 text-sm font-medium leading-snug text-ink">{ticket.title}</p>

                {pending !== null && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-ink-muted">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="line-clamp-2">
                      <span className="font-medium text-ink">{pending.fromName}</span> —{' '}
                      {previewLine(pending.preview)}
                    </span>
                  </p>
                )}

                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-faint">
                  <FolderKanban className="size-3 shrink-0" />
                  <span className="truncate text-ink-muted">{project?.name ?? '미분류'}</span>
                  {hint !== '' && <span className="ml-auto shrink-0 text-ink-muted">{hint}</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
