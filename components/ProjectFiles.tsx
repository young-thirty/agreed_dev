'use client';

// 프로젝트의 파일 탭. 대화에 딸려온 첨부가 여기 쌓인다.
//
// 티켓 상세에서 보는 첨부는 그 티켓 것만이고, 여기서는 프로젝트 전체를 본다.

import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { MaterialList } from '@/components/MaterialList';
import { listMaterials } from '@/lib/api';
import type { ProjectMaterial } from '@/types';

export function ProjectFiles({ projectId }: { projectId: string }) {
  const [materials, setMaterials] = useState<ProjectMaterial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMaterials(projectId).then((res) => {
      if (cancelled) return;
      if (!res.ok) return setError(res.error);
      setMaterials(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (error !== null) return <p className="text-sm text-ink-muted">{error}</p>;

  if (materials === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-faint">
        <LoaderCircle className="size-4 animate-spin text-accent" />
        파일을 불러오는 중…
      </p>
    );
  }

  if (materials.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        아직 주고받은 파일이 없습니다. 메일이나 슬랙에서 파일을 주고받으면 여기 쌓입니다.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-faint">
        메일 첨부와 슬랙 파일을 모두 모았습니다. 요구사항을 파악할 자료로 함께 쓰세요.
      </p>
      <MaterialList projectId={projectId} materials={materials} />
    </div>
  );
}
