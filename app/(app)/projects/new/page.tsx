'use client';

// 새 프로젝트 생성 화면. 계약 전 단계라 항상 Draft로 만든다.
// status는 입력받지 않고, 워크스페이스에서 사람이 직접 시작으로 올린다.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore, type ProjectDraft } from '@/components/AppStore';
import { ProjectForm } from '@/components/ProjectForm';

const EMPTY: ProjectDraft = {
  name: '',
  clientName: '',
  clientEmail: null,
  description: '',
  startDate: null,
  endDate: null,
  contractPrice: null,
};

export default function NewProjectPage() {
  const { createProject } = useAppStore();
  const router = useRouter();

  return (
    <div className="max-w-xl px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        대시보드
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">새 프로젝트</h1>
      <p className="mt-1 text-xs text-ink-faint">
        새 프로젝트는 Draft로 생성됩니다. 계약이 체결되면 워크스페이스에서 &lsquo;프로젝트
        시작&rsquo;을 누르세요.
      </p>

      <ProjectForm
        initial={EMPTY}
        submitLabel="프로젝트 만들기"
        savingLabel="만드는 중…"
        onSubmit={async (draft) => {
          const created = await createProject(draft);
          if (!created.ok) return created.error;
          router.push(`/projects/${created.data.projectId}`);
          return null;
        }}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  );
}
