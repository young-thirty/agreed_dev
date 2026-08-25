'use client';

// 프로젝트 워크스페이스. 프로토타입의 핵심 화면이다.
// 요구사항을 고르면 오른쪽에서 근거 · 확인 질문 · 답변 초안으로 이어진다.

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, PlayCircle } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { RequirementTimeline } from '@/components/RequirementTimeline';
import { ClientEmailThread } from '@/components/ClientEmailThread';
import { RequirementExtractor } from '@/components/RequirementExtractor';

const won = (n: number | null) => (n === null ? '금액 미정' : '₩' + n.toLocaleString('ko-KR'));

type Tab = 'requests' | 'timeline' | 'email';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { projects, projectsLoaded, setProjectStatus } = useAppStore();
  const project = projects.find((p) => p.projectId === id);

  const [tab, setTab] = useState<Tab>('requests');

  if (!project) {
    return (
      <div className="p-10">
        <p className="text-ink-muted">
          {projectsLoaded ? '프로젝트를 찾을 수 없습니다.' : '프로젝트를 불러오는 중…'}
        </p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-accent">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="border-b border-line px-8 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          대시보드
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.description !== '' && (
              <p className="mt-1 text-sm text-ink-muted">{project.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
              <span>고객: {project.clientName}</span>
              <span>
                {project.startDate ?? '시작일 미정'} ~ {project.endDate ?? '종료일 미정'}
              </span>
              <span>{won(project.contractPrice)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/projects/${project.projectId}/edit`}>
              <Button variant="outline">
                <Pencil className="size-4" />
                수정
              </Button>
            </Link>
            {project.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={() => setProjectStatus(project.projectId, 'ACTIVE')}
              >
                <PlayCircle className="size-4" />
                프로젝트 시작
              </Button>
            )}
          </div>
        </div>

        {/* 탭 — 토스식 세그먼트 컨트롤(회색 트랙 위 흰 활성 pill) */}
        <div className="mt-5 inline-flex gap-1 rounded-lg bg-paper p-1">
          {(
            [
              ['requests', '요청 분석'],
              ['timeline', '요구사항 타임라인'],
              ...(project.clientEmail ? ([['email', '고객 이메일']] as const) : []),
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-all ${
                tab === key
                  ? 'bg-surface font-medium text-ink shadow-pop'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* 본문 */}
      {tab === 'timeline' ? (
        <div className="p-8">
          <RequirementTimeline projectId={project.projectId} />
        </div>
      ) : tab === 'email' && project.clientEmail ? (
        <div className="p-8">
          <ClientEmailThread clientEmail={project.clientEmail} />
        </div>
      ) : project.status === 'DRAFT' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="max-w-sm text-sm text-ink-muted">
            아직 Draft 상태입니다. 계약이 체결되어 작업을 시작했다면 프로젝트를 시작하세요.
            시작하면 들어오는 고객 요청을 분석해 드립니다.
          </p>
          <Button variant="primary" onClick={() => setProjectStatus(project.projectId, 'ACTIVE')}>
            <PlayCircle className="size-4" />
            프로젝트 시작
          </Button>
        </div>
      ) : project.clientEmail !== null ? (
        <div className="p-8">
          <RequirementExtractor project={project} clientEmail={project.clientEmail} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
          <p className="max-w-sm text-sm text-ink-muted">
            이 프로젝트에는 클라이언트 메일 주소가 없습니다. 주소를 등록해야 주고받은 메일에서
            요구사항을 뽑을 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
