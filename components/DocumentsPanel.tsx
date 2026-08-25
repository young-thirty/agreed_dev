'use client';

// 워크스페이스 좌측. 프로젝트 컨텍스트 문서 목록.
// 우측 분석에서 근거를 누르면 해당 문서가 강조된다(highlightedDocId).

import { FileText } from 'lucide-react';
import type { ProjectDocument } from '@/types';

export function DocumentsPanel({
  documents,
  highlightedDocId,
}: {
  documents: ProjectDocument[];
  highlightedDocId: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">프로젝트 자료</h2>
        <span className="text-xs text-ink-faint">{documents.length}개</span>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => {
          const on = doc.id === highlightedDocId;
          return (
            <div
              key={doc.id}
              className={`rounded-md border p-3 transition-colors ${
                on ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <FileText className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.fileName}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {doc.kind} · {doc.uploadedAt}
                  </p>
                </div>
              </div>
              {doc.inContext && (
                <p className="mt-2 text-[11px] text-ink-faint">AI 컨텍스트 포함</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
