'use client';

// 사용자가 가장 먼저 보는 목록. 단위는 티켓이다.
// 새 고객 메시지는 관련 티켓에 붙고, 관련 티켓이 없으면 Active 티켓으로 새로 들어온다.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { CHANNEL_META } from '@/components/channelMeta';
import { TicketStatusBadge } from '@/components/StatusBadges';
import { relativeTime } from '@/lib/format';
import type { Channel, WorkItem, WorkStage } from '@/types';

type Filter = 'todo' | 'all' | 'Active' | 'Done' | 'Reject';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todo', label: '처리 필요' },
  { key: 'all', label: '전체' },
  { key: 'Active', label: 'Active' },
  { key: 'Done', label: 'Done' },
  { key: 'Reject', label: 'Reject' },
];

const needsWork = (stage: WorkStage) => stage === 'to_analyze' || stage === 'to_reply';

/** 메시지가 들어온 채널. 좁은 줄이라 이름 대신 아이콘으로 둔다. */
function ChannelIcon({ channel }: { channel: Channel }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span title={meta.label} className="shrink-0 text-ink-faint">
      <Icon className="size-3.5" aria-label={meta.label} />
    </span>
  );
}

/** 지금 이 줄에서 무슨 일이 벌어지고 있는지 한 마디. */
function hintOf(item: WorkItem, stage: WorkStage): string {
  if (stage === 'to_analyze') return '분석 대기';
  if (stage === 'waiting') return '답변 보냄';
  if (item.pending === null) return '';
  return item.pending.analysis.missingInfo.length > 0 ? '추가 정보 필요' : '답변 준비됨';
}

export function WorkList() {
  const { workItems, projects, loaded, error } = useAppStore();
  const params = useParams<{ id?: string }>();
  const [filter, setFilter] = useState<Filter>('todo');

  const counts = useMemo(() => {
    const todo = workItems.filter((item) => needsWork(item.workStage)).length;
    return { todo, all: workItems.length };
  }, [workItems]);

  const visible = useMemo(
    () =>
      workItems.filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'todo') return needsWork(item.workStage);
        return item.ticket.status === filter;
      }),
    [workItems, filter],
  );

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 pb-3 pt-5">
        <h1 className="text-base font-semibold tracking-tight">티켓</h1>
        <p className="mt-0.5 text-xs text-ink-faint">
          고객 메시지는 관련 티켓에 붙고, 관련 티켓이 없으면 새 티켓으로 들어옵니다.
        </p>

        <div className="mt-3 flex gap-1 rounded-lg bg-paper p-1">
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
            {filter === 'todo' ? '지금 처리할 것이 없습니다.' : '해당하는 티켓이 없습니다.'}
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
                  {pending !== null && <ChannelIcon channel={pending.channel} />}
                  <TicketStatusBadge status={ticket.status} />
                  <span className="ml-auto shrink-0 text-xs text-ink-faint">
                    {relativeTime(item.lastActivityAt)}
                  </span>
                </div>

                <p className="mt-1.5 text-sm font-medium leading-snug text-ink">{ticket.title}</p>

                {pending !== null && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-snug text-ink-muted">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="line-clamp-2">새 메시지 — {pending.preview}</span>
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
