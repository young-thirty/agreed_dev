'use client';

// 앱 좌측 네비게이션. 티켓이 기본 화면이고, 그 아래에 내 프로젝트를 펼쳐 둔다.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ChevronDown, FolderKanban, LogOut, Ticket } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useAppStore } from '@/components/AppStore';
import { LOGIN_PATH, logout } from '@/lib/auth';
import type { ProjectStatus, WorkStage } from '@/types';

const needsWork = (stage: WorkStage) => stage === 'to_analyze' || stage === 'to_reply';

/** 프로젝트 상태를 점 하나로. 목록이 좁으므로 배지 대신 점만 쓴다. */
const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-success',
  DRAFT: 'bg-warn',
  COMPLETED: 'bg-ink-faint',
  REJECTED: 'bg-danger',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, workItems } = useAppStore();
  const [projectsOpen, setProjectsOpen] = usePersistedState('sidebar-projects', true);

  const todo = workItems.filter((item) => needsWork(item.workStage)).length;

  /** 이 프로젝트에서 사람 손이 필요한 건수. */
  const todoOf = (projectId: string) =>
    workItems.filter((item) => item.ticket.projectId === projectId && needsWork(item.workStage))
      .length;

  const ticketsActive = pathname.startsWith('/tickets');
  const projectsActive = pathname === '/projects';

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-5">
        <Link href="/tickets" className="text-base font-semibold tracking-tight">
          Agreed
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        <Link
          href="/tickets"
          className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
            ticketsActive ? 'bg-paper font-medium text-ink' : 'text-ink-muted hover:bg-paper'
          }`}
        >
          <Ticket className="size-4" />
          티켓
          {todo > 0 && (
            <span className="ml-auto rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              {todo}
            </span>
          )}
        </Link>

        <div
          className={`flex items-center rounded-md pr-1 transition-colors ${
            projectsActive ? 'bg-paper' : 'hover:bg-paper'
          }`}
        >
          <Link
            href="/projects"
            className={`flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
              projectsActive ? 'font-medium text-ink' : 'text-ink-muted'
            }`}
          >
            <FolderKanban className="size-4" />
            프로젝트
          </Link>
          <button
            type="button"
            onClick={() => setProjectsOpen((open) => !open)}
            aria-label={projectsOpen ? '프로젝트 목록 접기' : '프로젝트 목록 펼치기'}
            className="rounded p-1 text-ink-faint transition-colors hover:text-ink"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${projectsOpen ? '' : '-rotate-90'}`}
            />
          </button>
        </div>

        {projectsOpen && (
          <ul className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-line pl-2">
            {projects.map((project) => {
              const active = pathname === `/projects/${project.projectId}`;
              const count = todoOf(project.projectId);
              return (
                <li key={project.projectId}>
                  <Link
                    href={`/projects/${project.projectId}`}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      active ? 'bg-paper font-medium text-ink' : 'text-ink-muted hover:bg-paper'
                    }`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[project.status]}`}
                    />
                    <span className="truncate">{project.name}</span>
                    {count > 0 && (
                      <span className="ml-auto shrink-0 text-[11px] font-semibold text-accent">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace(LOGIN_PATH);
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-paper"
        >
          <LogOut className="size-3.5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
