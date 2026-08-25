'use client';

// 프로젝트 워크스페이스. 프로토타입의 핵심 화면이다.
// 요청을 고르면 3분할(자료 · 요청 · 분석)로 맥락 비교부터 답변 초안까지 이어진다.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { ProjectStatusBadge } from '@/components/StatusBadges';
import { DocumentsPanel } from '@/components/DocumentsPanel';
import { RequestFeed } from '@/components/RequestFeed';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { RequirementTimeline } from '@/components/RequirementTimeline';
import { documentsOf, requestsOf, timelineOf } from '@/mocks';

const won = (n: number) => '₩' + n.toLocaleString('ko-KR');

type Tab = 'requests' | 'timeline';

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { projects, setProjectStatus } = useAppStore();
  const project = projects.find((p) => p.id === id);

  const documents = useMemo(() => (id ? documentsOf(id) : []), [id]);
  const requests = useMemo(() => (id ? requestsOf(id) : []), [id]);
  const timeline = useMemo(() => (id ? timelineOf(id) : []), [id]);

  const [tab, setTab] = useState<Tab>('requests');
  const [selectedId, setSelectedId] = useState<string | null>(requests[0]?.id ?? null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="p-10">
        <p className="text-ink-muted">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-accent">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const selected = requests.find((r) => r.id === selectedId) ?? null;

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
            <p className="mt-1 text-sm text-ink-muted">{project.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
              <span>고객: {project.clientName}</span>
              <span>
                {project.startDate} ~ {project.endDate}
              </span>
              <span>{won(project.budget)}</span>
            </div>
          </div>
          {project.status === 'draft' && (
            <Button variant="primary" onClick={() => setProjectStatus(project.id, 'active')}>
              <PlayCircle className="size-4" />
              프로젝트 시작
            </Button>
          )}
        </div>

        {/* 탭 */}
        <div className="mt-5 flex gap-1">
          {(
            [
              ['requests', '요청 분석'],
              ['timeline', '요구사항 타임라인'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === key ? 'bg-paper font-medium text-ink' : 'text-ink-muted hover:bg-paper'
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
          <RequirementTimeline events={timeline} />
        </div>
      ) : project.status === 'draft' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="max-w-sm text-sm text-ink-muted">
            아직 Draft 상태입니다. 계약이 체결되어 작업을 시작했다면 프로젝트를 시작하세요.
            시작하면 들어오는 고객 요청을 분석해 드립니다.
          </p>
          <Button variant="primary" onClick={() => setProjectStatus(project.id, 'active')}>
            <PlayCircle className="size-4" />
            프로젝트 시작
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-ink-muted">
          아직 들어온 요청이 없습니다. 새 고객 요청이 도착하면 여기에 표시됩니다.
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-[260px_1fr_440px] gap-6 p-8">
          <DocumentsPanel documents={documents} highlightedDocId={activeDocId} />
          <RequestFeed
            requests={requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="rounded-lg border border-line bg-surface p-5">
            {selected ? (
              <AnalysisPanel
                key={selected.id}
                request={selected}
                activeDocId={activeDocId}
                onHighlightDoc={setActiveDocId}
              />
            ) : (
              <p className="text-sm text-ink-muted">
                왼쪽에서 요청을 선택하면 분석 결과가 여기에 나타납니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
