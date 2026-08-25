'use client';

// 프로젝트별 고객 이메일 내역. 회사/발신인 트리 전체를 보여주지 않고,
// 이 프로젝트의 clientEmail 한 명과 주고받은 메일만 걸러서 평평한 목록으로 보여준다.

import { useCallback, useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { loadClientEmails } from '@/lib/client-emails';
import { splitQuoted } from '@/lib/email-clean';
import { formatFileSize } from '@/lib/format';
import { Button } from './Button';
import { FileViewerModal } from './FileViewerModal';
import { ReconnectGmailModal } from './ReconnectGmailModal';
import type { EmailAttachment, RawEmail } from '@/types/integrations';

/** 클릭하면 파일 뷰어가 여는 대상. 메일 첨부는 partId·messageId로 그 자리에서 읽는다. */
type OpenAttachment = { messageId: string; attachment: EmailAttachment };

const MAX_MESSAGES = 100;

/** 인용 겹 수를 들여쓰기로 보여준다. '>' 마커를 그대로 두면 읽히지 않는다. */
const INDENT = ['', 'ml-3', 'ml-6', 'ml-9', 'ml-12'] as const;

/** 목록에서는 짧게 읽히도록 올해 메일은 연도를 생략한다. */
function formatDate(iso: string): string {
  const sentAt = new Date(iso);
  const thisYear = sentAt.getFullYear() === new Date().getFullYear();
  return sentAt.toLocaleString('ko-KR', {
    ...(thisYear ? {} : { year: 'numeric' }),
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// 스켈레톤 각 줄의 폭. 실제 메일처럼 제목·본문 길이가 제각각이라 벽처럼 보이지 않는다.
const SKELETON_ROWS = [
  { subject: 'w-2/5', body: 'w-11/12', bodyTail: 'w-3/5' },
  { subject: 'w-3/5', body: 'w-4/5', bodyTail: 'w-2/5' },
  { subject: 'w-1/3', body: 'w-11/12', bodyTail: 'w-1/2' },
];

/** 로딩 중 자리표시자. 실제 메일 카드와 같은 골격이라 목록이 도착해도 화면이 튀지 않는다. */
function EmailListSkeleton() {
  return (
    <ul
      aria-hidden
      className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface shadow-card"
    >
      {SKELETON_ROWS.map((row) => (
        <li key={row.subject} className="flex flex-col gap-2.5 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className={`skeleton-bar h-3.5 ${row.subject}`} />
            <div className="skeleton-bar h-3 w-20 shrink-0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className={`skeleton-bar h-2.5 ${row.body}`} />
            <div className={`skeleton-bar h-2.5 ${row.bodyTail}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * 메일 본문. 인용된 이전 대화는 접어 둔다.
 * 그 내용은 목록에 자기 메일로 이미 따로 있어서, 펼쳐 두면 같은 글을 여러 번 읽게 된다.
 */
function EmailBody({ body }: { body: string }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { kept, quoted } = splitQuoted(body);

  return (
    <>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-muted">
        {kept.length > 0 ? kept.join('\n') : '인용된 이전 대화만 있는 메일입니다.'}
      </p>

      {quoted.length > 0 && (
        <button
          type="button"
          onClick={() => setShowQuoted((on) => !on)}
          className="self-start text-[11px] text-ink-faint hover:text-ink"
        >
          {showQuoted ? '인용된 이전 대화 접기' : `인용된 이전 대화 ${quoted.length}줄 보기`}
        </button>
      )}

      {showQuoted && (
        <div className="mt-1 flex flex-col gap-1">
          {quoted.map((line, order) => {
            // 머리말이 연달아 나오면(전달 메일의 보낸사람·날짜·제목) 한 덩어리로 붙인다.
            const continued = order > 0 && quoted[order - 1].header;
            return (
              <p
                key={order}
                className={`text-[11px] ${INDENT[Math.min(line.depth, INDENT.length - 1)]} ${
                  line.header
                    ? `font-medium text-ink-faint${continued ? '' : ' mt-1.5'}`
                    : 'border-l-2 border-line pl-2 text-ink-muted'
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      )}
    </>
  );
}

/** 메일 하나에 딸린 첨부 목록. 눌러서 그 자리에서 읽는다(지금은 PDF·DOCX만). */
function AttachmentChips({
  messageId,
  attachments,
  onOpen,
}: {
  messageId: string;
  attachments: EmailAttachment[];
  onOpen: (target: OpenAttachment) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {attachments.map((attachment) => (
        <button
          key={attachment.id}
          type="button"
          onClick={() => onOpen({ messageId, attachment })}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
        >
          <Paperclip className="size-3" />
          <span className="max-w-[220px] truncate">{attachment.filename}</span>
          <span className="text-ink-faint">{formatFileSize(attachment.sizeBytes)}</span>
        </button>
      ))}
    </div>
  );
}

export function ClientEmailThread({
  projectId,
  clientEmail,
}: {
  projectId: string;
  clientEmail: string;
}) {
  const [emails, setEmails] = useState<RawEmail[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const [openAttachment, setOpenAttachment] = useState<OpenAttachment | null>(null);

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      const res = await loadClientEmails(projectId, clientEmail, { refresh });
      setLoading(false);

      if (!res.ok) {
        setMessage(res.error);
        setEmails([]);
        setReconnect(res.reconnect);
        return;
      }
      setMessage(null);
      setEmails(res.emails);
    },
    [projectId, clientEmail],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">고객 이메일</h2>
          <p className="mt-0.5 text-xs text-ink-faint">{clientEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
          {loading ? '확인 중…' : '새로고침'}
        </Button>
      </div>

      {message !== null ? (
        <p className="rounded-lg border border-line bg-paper px-4 py-3 text-xs text-ink-faint">
          {message}
        </p>
      ) : loading ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-faint">메일을 불러오는 중이에요 · 최대 {MAX_MESSAGES}통</p>
          <EmailListSkeleton />
        </div>
      ) : emails.length === 0 ? (
        <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-xs text-ink-faint">
          아직 이 주소와 주고받은 메일이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-faint">총 {emails.length}건</p>
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface shadow-card">
            {emails.map((email) => (
              <li key={email.id} className="flex flex-col gap-1.5 px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={`truncate text-sm font-medium ${
                      email.subject ? 'text-ink' : 'text-ink-faint'
                    }`}
                  >
                    {email.subject || '(제목 없음)'}
                  </span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {formatDate(email.sentAt)}
                  </span>
                </div>
                <EmailBody body={email.body} />
                <AttachmentChips
                  messageId={email.id}
                  attachments={email.attachments}
                  onOpen={setOpenAttachment}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {reconnect && <ReconnectGmailModal onClose={() => setReconnect(false)} />}

      {openAttachment && (
        <FileViewerModal
          fileName={openAttachment.attachment.filename}
          mimeType={openAttachment.attachment.mimeType}
          fetchPath={`/api/email/attachment?messageId=${encodeURIComponent(openAttachment.messageId)}&partId=${encodeURIComponent(openAttachment.attachment.id)}`}
          onClose={() => setOpenAttachment(null)}
        />
      )}
    </div>
  );
}
