'use client';

// 프로젝트 목록. 지금 사람 손이 필요한 티켓이 몇 건인지만 빠르게 보이면 된다.

import { useState } from 'react';
import Link from 'next/link';
import { LoaderCircle, Plus } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { previewLine } from '@/lib/email-clean';
import { relativeTime } from '@/lib/format';

const won = (n: number | null) => (n === null ? '금액 미정' : '₩' + n.toLocaleString('ko-KR'));

export default function ProjectsPage() {
  const { projects, workItems, loaded, error, reload } = useAppStore();
  const [creating, setCreating] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">프로젝트</h1>
            <p className="mt-1 text-sm text-ink-muted">
              고객 메시지는 등록된 메일 주소와 슬랙 채널을 보고 프로젝트에 분류됩니다.
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            새 프로젝트
          </Button>
        </div>

        {error !== null && <p className="mt-8 text-sm text-ink-faint">{error}</p>}

        {error === null && !loaded && (
          <p className="mt-8 flex items-center gap-2 text-sm text-ink-faint">
            <LoaderCircle className="size-4 animate-spin text-accent" />
            프로젝트를 불러오는 중…
          </p>
        )}

        {error === null && loaded && projects.length === 0 && (
          <p className="mt-8 text-sm text-ink-faint">아직 프로젝트가 없습니다.</p>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {projects.map((project) => {
            const tickets = workItems.filter((item) => item.ticket.projectId === project.projectId);
            const activeTickets = tickets.filter((item) => item.ticket.status === 'Active').length;
            const raw = tickets.find((item) => item.ticket.lastCustomerMessage !== null)?.ticket
              .lastCustomerMessage;
            // 인용된 이전 대화와 서명을 걷어낸 한 줄만 보여준다.
            const lastMessage = raw === undefined || raw === null ? '' : previewLine(raw);

            return (
              <li key={project.projectId}>
                <Link
                  href={`/projects/${project.projectId}`}
                  className="block rounded-lg bg-surface px-5 py-4 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{project.name}</span>
                    <ProjectStatusBadge status={project.status} />
                    <span className="ml-auto shrink-0 text-xs text-ink-faint">
                      {relativeTime(project.updatedAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-ink-muted">
                    {project.clientName}
                    {project.clientEmail !== null && ` · ${project.clientEmail}`}
                  </p>

                  {lastMessage !== '' && (
                    <p className="mt-2.5 truncate text-sm text-ink">“{lastMessage}”</p>
                  )}

                  <p className="mt-1.5 text-xs text-ink-faint">
                    {project.startDate ?? '시작일 미정'} ~ {project.endDate ?? '종료일 미정'} ·{' '}
                    {won(project.contractPrice)}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span
                      className={
                        project.unansweredRequestCount > 0 ? 'text-accent' : 'text-ink-faint'
                      }
                    >
                      답변 안 한 요청 {project.unansweredRequestCount}건
                    </span>
                    <span className="text-ink-faint">진행 중 {activeTickets}건</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {creating && <NewProjectDialog onClose={() => setCreating(false)} onCreated={reload} />}
    </div>
  );
}
