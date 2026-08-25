'use client';

// 파일을 서비스 안에서 그대로 읽는다. 지금은 PDF와 DOCX만 지원한다.
// 다른 형식은 다운로드로 대신한다 — 다운로드 링크 자체는 항상 연결해 둔다.
//
// 서버가 내려주는 Content-Type은 보안 정책상 대부분 octet-stream으로
// 뭉개져 있다(Slack 파일 응답과 같은 방식). 그래서 화면이 이미 알고 있는
// MIME 타입으로 Blob을 다시 씌운다. 서버 응답 헤더를 믿지 않는다.

import { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import { Download, X } from 'lucide-react';
import { apiUrl, getBlob } from '@/lib/api-client';
import { Button } from './Button';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'pdf'; objectUrl: string }
  | { kind: 'docx'; html: string }
  | { kind: 'unsupported' };

export function FileViewerModal({
  fileName,
  mimeType,
  fetchPath,
  onClose,
}: {
  fileName: string;
  mimeType: string;
  /** 서버에서 원본을 받아올 경로. 쿼리스트링까지 포함해 넘긴다. */
  fetchPath: string;
  onClose: () => void;
}) {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const downloadUrl = apiUrl(fetchPath);

  useEffect(() => {
    if (mimeType !== PDF_MIME && mimeType !== DOCX_MIME) {
      setState({ kind: 'unsupported' });
      return;
    }

    let cancelled = false;
    let createdObjectUrl: string | null = null;

    getBlob(fetchPath).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setState({ kind: 'error', message: res.error });
        return;
      }

      if (mimeType === PDF_MIME) {
        // 서버 응답의 Content-Type은 신뢰하지 않는다. 우리가 이미 아는 타입으로 다시 씌운다.
        const typed = new Blob([res.data], { type: PDF_MIME });
        createdObjectUrl = URL.createObjectURL(typed);
        setState({ kind: 'pdf', objectUrl: createdObjectUrl });
        return;
      }

      res.data
        .arrayBuffer()
        .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
        .then((result) => {
          if (!cancelled) setState({ kind: 'docx', html: result.value });
        })
        .catch(() => {
          if (!cancelled) setState({ kind: 'error', message: '문서를 읽지 못했습니다.' });
        });
    });

    return () => {
      cancelled = true;
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPath, mimeType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-surface shadow-card-hover">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <p className="truncate text-sm font-medium text-ink">{fileName}</p>
          <div className="flex shrink-0 items-center gap-2">
            <a href={downloadUrl} download={fileName}>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" />
                다운로드
              </Button>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {state.kind === 'loading' && (
            <p className="p-6 text-sm text-ink-muted">불러오는 중…</p>
          )}
          {state.kind === 'error' && (
            <p className="p-6 text-sm text-ink-muted">{state.message}</p>
          )}
          {state.kind === 'unsupported' && (
            <p className="p-6 text-sm text-ink-muted">
              이 형식은 서비스 안에서 미리 볼 수 없습니다. 다운로드해서 확인해 주세요.
            </p>
          )}
          {state.kind === 'pdf' && (
            <iframe src={state.objectUrl} title={fileName} className="h-full min-h-[70vh] w-full" />
          )}
          {state.kind === 'docx' && (
            <div
              className="docx-preview px-6 py-5 text-sm text-ink"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
