'use client';

// 프로젝트 화면. 이 프로젝트에 쌓인 티켓과 주고받은 파일을 본다.
// 티켓 상태는 여기서도 사람이 직접 바꾼다.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Paperclip } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { MaterialsDrawer } from '@/components/MaterialsDrawer';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { TicketCard } from '@/components/TicketCard';
import type { TicketStatus } from '@/types';

const won = (n: number | null) => (n === null ? '금액 미정' : '₩' + n.toLocaleString('ko-KR'));

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, workItems, loaded, error, changeTicketStatus } = useAppStore();
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const project = projects.find((p) => p.projectId === id);

  if (error !== null) return <div className="p-10 text-sm text-ink-muted">{error}</div>;

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-faint">
        <LoaderCircle className="size-4 animate-spin text-accent" />
        불러오는 중…
      </div>
    );
  }

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

  const projectTickets = workItems.filter((item) => item.ticket.projectId === project.projectId);

  async function onStatusChange(ticketId: string, status: TicketStatus) {
    setMessage(await changeTicketStatus(ticketId, status));
  }

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

        <p className="mt-1 text-sm text-ink-muted">
          {project.clientName}
          {project.clientEmail !== null && ` · ${project.clientEmail}`}
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {project.startDate ?? '시작일 미정'} ~ {project.endDate ?? '종료일 미정'} ·{' '}
          {won(project.contractPrice)}
        </p>
        {project.description !== '' && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{project.description}</p>
        )}

        <div className="mt-6">
          <p className="text-xs text-ink-faint">
            고객 메시지가 오면 티켓이 Active로 만들어집니다. 요구사항 확정과 상태 변경은 사람이 직접
            합니다.
          </p>

          {message !== null && (
            <p className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-faint">
              {message}
            </p>
          )}

          {projectTickets.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">
              아직 티켓이 없습니다. 채널을 연결하고 대화를 수집하면 여기에 쌓입니다.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {projectTickets.map((item) => (
                <TicketCard
                  key={item.ticket.ticketId}
                  ticket={item.ticket}
                  onStatusChange={(status) => onStatusChange(item.ticket.ticketId, status)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {materialsOpen && (
        <MaterialsDrawer projectId={project.projectId} onClose={() => setMaterialsOpen(false)} />
      )}
    </div>
  );
}
