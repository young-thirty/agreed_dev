'use client';

// 프로젝트 자료 아카이브. 오른쪽에서 드로어로 열린다.
// 메일 첨부·Slack 파일처럼 대화 중 오간 파일을 채널·시각과 함께 한 곳에 모은다.
// 요구사항 카드가 '뭐라고 말했는가'라면, 이 자료들은 '무엇을 주고받았는가'다 —
// 같은 요구사항을 파악하는 데 같이 쓰는 근거다.

import { useEffect, useState } from 'react';
import { FileText, GitBranch, Mail, MessageSquare, X } from 'lucide-react';
import { apiUrl, get } from '@/lib/api-client';
import { formatFileSize } from '@/lib/format';
import { FileViewerModal } from './FileViewerModal';
import type {
  MaterialClassificationStatus,
  MaterialDocumentType,
  MaterialSourceChannel,
  ProjectMaterial,
} from '@/types';

/** 서비스 안에서 바로 읽어 보여줄 수 있는 형식. 그 외에는 다운로드로 받는다. */
const VIEWABLE_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const CHANNEL_ICON: Record<MaterialSourceChannel, typeof Mail> = {
  GMAIL: Mail,
  SLACK: MessageSquare,
  GITHUB: GitBranch,
};

const DOCUMENT_TYPE_LABEL: Record<MaterialDocumentType, string> = {
  PROPOSAL: '제안서',
  CONTRACT: '계약서',
  REQUIREMENTS: '요구사항 정의서',
  MEETING_NOTES: '회의록',
  OTHER: '기타',
};

const CLASSIFICATION_LABEL: Record<MaterialClassificationStatus, string> = {
  PENDING: '분류 대기',
  PROCESSING: '분류 중…',
  COMPLETED: '',
  FAILED: '분류 실패',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MaterialRow({
  projectId,
  material,
  onView,
}: {
  projectId: string;
  material: ProjectMaterial;
  onView: (material: ProjectMaterial) => void;
}) {
  const Icon = material.sourceChannel ? CHANNEL_ICON[material.sourceChannel] : FileText;
  const status = CLASSIFICATION_LABEL[material.classificationStatus];
  const viewable = material.hasFile && VIEWABLE_MIME_TYPES.has(material.mimeType ?? '');

  const row = (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{material.fileName}</p>

        {(material.senderDisplay !== null || material.conversationTitle !== null) && (
          <p className="mt-0.5 truncate text-xs text-ink-faint">
            {material.senderDisplay}
            {material.senderDisplay !== null && material.conversationTitle !== null && ' · '}
            {material.conversationTitle}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
          <span>{formatDate(material.communicatedAt)}</span>
          {material.sizeBytes !== null && (
            <>
              <span>·</span>
              <span>{formatFileSize(material.sizeBytes)}</span>
            </>
          )}
          {material.documentType !== null && (
            <>
              <span>·</span>
              <span className="rounded bg-accent-soft px-1.5 py-0.5 font-medium text-accent">
                {DOCUMENT_TYPE_LABEL[material.documentType]}
              </span>
            </>
          )}
          {status !== '' && (
            <>
              <span>·</span>
              <span>{status}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!material.hasFile) {
    return <div className="opacity-60">{row}</div>;
  }

  if (viewable) {
    return (
      <button
        type="button"
        onClick={() => onView(material)}
        className="block w-full text-left transition-colors hover:bg-paper"
      >
        {row}
      </button>
    );
  }

  // 서비스 안에서 못 읽는 형식은 다운로드로 받는다.
  return (
    <a
      href={apiUrl(`/api/projects/${projectId}/materials/${material.materialId}/file`)}
      className="block transition-colors hover:bg-paper"
    >
      {row}
    </a>
  );
}

export function MaterialsDrawer({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [materials, setMaterials] = useState<ProjectMaterial[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ProjectMaterial | null>(null);

  useEffect(() => {
    let cancelled = false;
    get<ProjectMaterial[]>(`/api/projects/${projectId}/materials`).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMaterials(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 배경 — 누르면 닫힌다 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-card-hover">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">주고받은 파일</h2>
            <p className="mt-0.5 text-xs text-ink-faint">
              메일 첨부와 Slack 파일을 모두 모았습니다. 요구사항을 파악할 자료로 함께 쓰세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {message !== null ? (
            <p className="px-5 py-4 text-sm text-ink-muted">{message}</p>
          ) : materials === null ? (
            <p className="px-5 py-4 text-sm text-ink-muted">불러오는 중…</p>
          ) : materials.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-muted">
              아직 주고받은 파일이 없습니다. 메일이나 Slack에서 파일을 주고받으면 여기 쌓입니다.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {materials.map((material) => (
                <MaterialRow
                  key={material.materialId}
                  projectId={projectId}
                  material={material}
                  onView={setViewing}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {viewing && (
        <FileViewerModal
          fileName={viewing.fileName}
          mimeType={viewing.mimeType ?? ''}
          fetchPath={`/api/projects/${projectId}/materials/${viewing.materialId}/file`}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

