'use client';

// 프로젝트 자료 한 줄과 그 목록. 프로젝트의 파일 탭과 티켓의 첨부가 같이 쓴다.
//
// 메일 첨부·Slack 파일처럼 대화 중 오간 파일이다. 요구사항 카드가 '뭐라고 말했는가'라면
// 이 자료들은 '무엇을 주고받았는가'다 — 같은 요구사항을 파악하는 데 같이 쓰는 근거다.

import { useState } from 'react';
import { FileText, GitBranch, Mail, MessageSquare } from 'lucide-react';
import { apiUrl } from '@/lib/api-client';
import { formatFileSize } from '@/lib/format';
import { FileViewerModal } from '@/components/FileViewerModal';
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

export function MaterialRow({
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

/** 파일 목록. 어떤 파일을 어떻게 여는지는 MaterialRow가 안다. */
export function MaterialList({
  projectId,
  materials,
}: {
  projectId: string;
  materials: ProjectMaterial[];
}) {
  const [viewing, setViewing] = useState<ProjectMaterial | null>(null);

  return (
    <>
      <div className="divide-y divide-line overflow-hidden rounded-lg bg-surface shadow-card">
        {materials.map((material) => (
          <MaterialRow
            key={material.materialId}
            projectId={projectId}
            material={material}
            onView={setViewing}
          />
        ))}
      </div>

      {viewing && (
        <FileViewerModal
          fileName={viewing.fileName}
          mimeType={viewing.mimeType ?? ''}
          fetchPath={`/api/projects/${projectId}/materials/${viewing.materialId}/file`}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
