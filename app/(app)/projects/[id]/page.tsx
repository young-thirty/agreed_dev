'use client';

// 프로젝트 화면. 티켓 · 고객 메시지 · AI가 참고하는 컨텍스트를 나눠 본다.
// 티켓 상태는 여기서 사람이 직접 바꾼다.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Circle, CircleCheck, Clock, CodeXml, FileText, GitPullRequest, Paperclip, Plug,
} from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { CHANNEL_META } from '@/components/channelMeta';
import { Badge } from '@/components/Badge';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { MaterialsDrawer } from '@/components/MaterialsDrawer';
import { TicketCard } from '@/components/TicketCard';
import { relativeTime } from '@/lib/format';
import { documentsOf, repoSnapshotOf } from '@/mocks';
import type { DevState } from '@/types';

type Tab = 'tickets' | 'messages' | 'context';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tickets', label: '티켓' },
  { key: 'messages', label: '고객 메시지' },
  { key: 'context', label: '프로젝트 컨텍스트' },
];

const STATE_ICON: Record<DevState, { Icon: typeof Circle; className: string }> = {
  done: { Icon: CircleCheck, className: 'text-success' },
  progress: { Icon: Clock, className: 'text-warn' },
  todo: { Icon: Circle, className: 'text-ink-faint' },
};

export default function ProjectPage() {
  return (
    <Suspense fallback={null}>
      <ProjectWorkspace />
    </Suspense>
  );
}

function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const highlightedTicketId = useSearchParams().get('ticket');
  const { projects, inbounds, tickets, ticketIdOf, decisionOf, setTicketStatus } = useAppStore();
  const [tab, setTab] = useState<Tab>('tickets');
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const project = projects.find((p) => p.projectId === id);
  if (project === undefined) {
    return (
      <div className="p-10">
        <p className="text-sm text-ink-muted">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/projects" className="mt-2 inline-block text-sm text-accent">
          프로젝트 목록으로
        </Link>
      </div>
    );
  }

  const projectTickets = tickets.filter((t) => t.projectId === project.projectId);
  const projectInbounds = [...inbounds]
    .filter((i) => i.projectId === project.projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const documents = documentsOf(project.projectId);
  const snapshot = repoSnapshotOf(project.projectId);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          프로젝트
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
          <button
            type="button"
            onClick={() => setMaterialsOpen(true)}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <Paperclip className="size-3.5" />
            주고받은 파일
          </button>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          {project.clientName} · {project.clientEmail}
          <span className="text-ink-faint">·</span>
          {project.githubRepo !== null ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
              <CodeXml className="size-3.5" />
              {project.githubRepo}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
              <Plug className="size-3.5" />
              GitHub 미연결
            </span>
          )}
        </p>

        <div className="mt-5 inline-flex gap-1 rounded-lg bg-paper p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-all ${
                tab === t.key
                  ? 'bg-surface font-medium text-ink shadow-pop'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'tickets' && (
          <div className="mt-5">
            <p className="text-xs text-ink-faint">
              티켓은 고객 메시지가 오면 Active로 만들어집니다. 요구사항 확정과 상태 변경은 사람이 직접 합니다.
            </p>
            {projectTickets.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">
                아직 티켓이 없습니다. 인박스에서 고객 메시지를 처리하면 여기에 쌓입니다.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {projectTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    highlighted={ticket.ticketId === highlightedTicketId}
                    onStatusChange={(status) => setTicketStatus(ticket.ticketId, status)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <ul className="mt-5 flex flex-col gap-2">
            {projectInbounds.length === 0 && (
              <li className="text-sm text-ink-faint">들어온 고객 메시지가 없습니다.</li>
            )}
            {projectInbounds.map((inbound) => {
              const { icon: Icon, label } = CHANNEL_META[inbound.channel];
              const answered = decisionOf(inbound.inboundId).sentAt !== null;
              const ticketId = ticketIdOf(inbound);
              return (
                <li key={inbound.inboundId}>
                  <Link
                    href={`/tickets/${ticketIdOf(inbound) ?? inbound.inboundId}`}
                    className="block rounded-lg bg-surface px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex items-center gap-2 text-xs text-ink-faint">
                      <Icon className="size-3.5" />
                      {label} · {inbound.fromName}
                      <span className="ml-auto">{relativeTime(inbound.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink">
                      {inbound.preview}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={answered ? 'neutral' : 'info'}>
                        {answered ? '답변 보냄' : '답변 필요'}
                      </Badge>
                      <span className="text-xs text-ink-faint">
                        {ticketId ?? '티켓 없음'} · {inbound.category}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'context' && (
          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-lg bg-surface p-5 shadow-card">
              <h2 className="text-sm font-semibold">프로젝트 문서</h2>
              <p className="mt-0.5 text-xs text-ink-faint">
                AI가 근거를 찾을 때 함께 확인하는 자료입니다.
              </p>
              {documents.length === 0 ? (
                <p className="mt-3 text-sm text-ink-faint">등록된 문서가 없습니다.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2.5 text-sm">
                      <FileText className="size-4 shrink-0 text-ink-faint" />
                      <span className="text-ink">{doc.fileName}</span>
                      <span className="text-xs text-ink-faint">{doc.kind}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg bg-surface p-5 shadow-card">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">개발 현황</h2>
                {snapshot !== null && (
                  <span className="font-mono text-xs text-ink-faint">{snapshot.repo}</span>
                )}
              </div>

              {snapshot === null ? (
                <p className="mt-3 text-sm text-ink-faint">
                  GitHub이 연결되어 있지 않아 개발 현황을 확인할 수 없습니다. 연결하면 고객 메시지에
                  필요한 구현 상태를 함께 분석합니다.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-col gap-4">
                    {snapshot.features.map((feature) => (
                      <div key={feature.name}>
                        <p className="text-xs text-ink-faint">{feature.name}</p>
                        <ul className="mt-1.5 flex flex-col gap-1.5">
                          {feature.items.map((item) => {
                            const { Icon, className } = STATE_ICON[item.state];
                            return (
                              <li key={item.text} className="flex items-center gap-2.5 text-sm">
                                <Icon className={`size-4 shrink-0 ${className}`} />
                                <span
                                  className={item.state === 'todo' ? 'text-ink-muted' : 'text-ink'}
                                >
                                  {item.text}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {snapshot.openWork.length > 0 && (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="text-xs text-ink-faint">진행 중인 작업</p>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {snapshot.openWork.map((work) => (
                          <li key={work.title} className="flex items-center gap-2 text-sm">
                            <GitPullRequest className="size-3.5 shrink-0 text-ink-faint" />
                            <span className="text-ink">{work.title}</span>
                            <span className="text-xs text-ink-faint">{work.note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {materialsOpen && (
        <MaterialsDrawer projectId={project.projectId} onClose={() => setMaterialsOpen(false)} />
      )}
    </div>
  );
}
