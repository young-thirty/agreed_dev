'use client';

// 프로젝트 내용 수정 화면.
// 진행 상태(Draft·Active·Completed)는 여기서 바꾸지 않는다. 워크스페이스에서 바꾼다.

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { ProjectForm } from '@/components/ProjectForm';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, projectsLoaded, updateProject } = useAppStore();
  const router = useRouter();

  const project = projects.find((p) => p.projectId === id);

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
    <div className="max-w-xl px-8 py-8">
      <Link
        href={`/projects/${project.projectId}`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        {project.name}
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">프로젝트 수정</h1>
      <p className="mt-1 text-xs text-ink-faint">
        클라이언트 메일을 바꾸면 다음 분석부터 새 주소의 메일을 읽습니다. 이미 뽑아 둔
        요구사항은 그대로 남습니다.
      </p>

      <ProjectForm
        initial={{
          name: project.name,
          clientName: project.clientName,
          clientEmail: project.clientEmail,
          description: project.description,
          startDate: project.startDate,
          endDate: project.endDate,
          contractPrice: project.contractPrice,
        }}
        submitLabel="저장"
        savingLabel="저장하는 중…"
        onSubmit={async (draft) => {
          const saved = await updateProject(project.projectId, draft);
          if (!saved.ok) return saved.error;
          router.push(`/projects/${project.projectId}`);
          return null;
        }}
        onCancel={() => router.push(`/projects/${project.projectId}`)}
      />
    </div>
  );
}
