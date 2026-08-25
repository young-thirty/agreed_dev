'use client';

// 티켓 하나를 여는 화면. 이 프로토타입의 중심이다.
//
// 티켓에 새 고객 메시지가 붙어 있으면 처리 흐름(고객 메시지 → AI 분석 → 내 판단 → 답변)이 열리고,
// 그 아래에 이 티켓에 쌓인 지난 대화가 이어진다.

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, FolderKanban } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { MessageFlow } from '@/components/MessageFlow';
import { MessageHistory } from '@/components/MessageHistory';
import { StageBadge } from '@/components/StatusBadges';
import { relativeTime } from '@/lib/format';
import { TICKET_STATUS, type TicketStatus } from '@/types';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { workItems, projects, inbounds, decisionOf, stageOf, historyOf, setTicketStatus } =
    useAppStore();

  const item = workItems.find((w) => w.ticket.ticketId === id);

  // 메시지를 별도 티켓으로 분리했으면 그 티켓으로 따라간다.
  const splitTo =
    inbounds
      .filter((i) => i.ticketId === id)
      .map((i) => decisionOf(i.inboundId).ticketId)
      .find((ticketId) => ticketId !== null && ticketId !== id) ?? null;
  useEffect(() => {
    if (splitTo !== null) router.replace(`/tickets/${splitTo}`);
  }, [splitTo, router]);

  if (item === undefined) {
    return (
      <div className="p-10">
        <p className="text-sm text-ink-muted">티켓을 찾을 수 없습니다.</p>
        <Link href="/tickets" className="mt-2 inline-block text-sm text-accent">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { ticket, pending } = item;
  const project = projects.find((p) => p.projectId === ticket.projectId);
  if (project === undefined) return null;

  const stage = stageOf(item);

  return (
    <div className="mx-auto max-w-3xl px-8 py-7">
      <header>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.projectId}`}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-sm font-medium text-ink shadow-card transition-shadow hover:shadow-card-hover"
          >
            <FolderKanban className="size-3.5 shrink-0 text-ink-faint" />
            <span className="truncate">{project.name}</span>
            <ChevronRight className="size-3.5 shrink-0 text-ink-faint" />
          </Link>
          <span className="ml-auto">
            <StageBadge stage={stage} />
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <h1 className="min-w-0 flex-1 text-xl font-semibold leading-snug tracking-tight text-ink">
            {ticket.title}
          </h1>
          <label className="flex shrink-0 items-center gap-2">
            <span className="sr-only">티켓 상태</span>
            <select
              value={ticket.status}
              onChange={(e) => setTicketStatus(ticket.ticketId, e.target.value as TicketStatus)}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
            >
              {TICKET_STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <span className="font-mono">{ticket.ticketId}</span>
          <span>·</span>
          <span>{ticket.category}</span>
          <span>·</span>
          <span>마지막 업데이트 {relativeTime(item.lastActivityAt)}</span>
        </p>

        <dl className="mt-4 grid grid-cols-[76px_1fr] gap-x-4 gap-y-2 rounded-lg bg-surface p-5 text-sm shadow-card">
          <dt className="text-xs text-ink-faint">요구사항</dt>
          <dd className="text-ink">{ticket.requirement}</dd>
          <dt className="text-xs text-ink-faint">현재 상태</dt>
          <dd className="leading-relaxed text-ink-muted">{ticket.summary}</dd>
        </dl>
      </header>

      <div className="mt-7">
        {pending !== null ? (
          <MessageFlow key={pending.inboundId} inbound={pending} project={project} ticket={ticket} />
        ) : stage === 'waiting' ? (
          <p className="rounded-lg bg-surface px-5 py-4 text-sm leading-relaxed text-ink-faint shadow-card">
            답변을 보내고 고객 회신을 기다리는 중입니다. 이 요구가 마무리됐다면 위에서 상태를 직접
            Done으로 바꿔주세요. 상태는 자동으로 넘어가지 않습니다.
          </p>
        ) : (
          <p className="rounded-lg bg-surface px-5 py-4 text-sm text-ink-faint shadow-card">
            지금 답할 메시지는 없습니다. 새 고객 메시지가 오면 여기에서 이어집니다.
          </p>
        )}
      </div>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-sm font-semibold text-ink">지난 대화</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-faint">
          이 티켓에 쌓인 고객 메시지와 보낸 답변입니다.
        </p>
        <MessageHistory entries={historyOf(ticket.ticketId)} />
      </section>
    </div>
  );
}
