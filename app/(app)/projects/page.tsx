'use client';

// 프로젝트 목록. 지금 사람 손이 필요한 메시지가 몇 건인지만 빠르게 보이면 된다.

import Link from 'next/link';
import { CodeXml, Plug } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { relativeTime } from '@/lib/format';

export default function ProjectsPage() {
  const { projects, inbounds, tickets, decisionOf } = useAppStore();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7">
        <h1 className="text-xl font-semibold tracking-tight">프로젝트</h1>
        <p className="mt-1 text-sm text-ink-muted">
          고객 메시지는 등록된 메일 주소를 보고 프로젝트에 자동으로 분류됩니다.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {projects.map((project) => {
            const unanswered = inbounds.filter(
              (i) => i.projectId === project.projectId && decisionOf(i.inboundId).sentAt === null,
            ).length;
            const activeTickets = tickets.filter(
              (t) => t.projectId === project.projectId && t.status === 'Active',
            ).length;

            return (
              <li key={project.projectId}>
                <Link
                  href={`/projects/${project.projectId}`}
                  className="block rounded-lg bg-surface px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{project.name}</span>
                    <ProjectStatusBadge status={project.status} />
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
                  </div>

                  <p className="mt-1 text-sm text-ink-muted">
                    {project.clientName} · {project.clientEmail}
                  </p>

                  <p className="mt-2.5 truncate text-sm text-ink">
                    “{project.lastMessage}”
                    <span className="ml-2 text-xs text-ink-faint">
                      {relativeTime(project.lastMessageAt)}
                    </span>
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className={unanswered > 0 ? 'text-accent' : 'text-ink-faint'}>
                      답변 안 한 메시지 {unanswered}건
                    </span>
                    <span className="text-ink-faint">Active 티켓 {activeTickets}건</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
