'use client';

// 프로젝트별 고객 이메일 내역. 회사/발신인 트리 전체를 보여주지 않고,
// 이 프로젝트의 clientEmail 한 명과 주고받은 메일만 걸러서 평평한 목록으로 보여준다.

import { useCallback, useEffect, useState } from 'react';
import { loadClientEmails } from '@/lib/client-emails';
import { splitQuoted } from '@/lib/email-clean';
import { Button } from './Button';
import { ReconnectGmailModal } from './ReconnectGmailModal';
import type { RawEmail } from '@/types/integrations';

/**
 * 메일 본문. 인용된 이전 대화는 접어 둔다.
 * 그 내용은 목록에 자기 메일로 이미 따로 있어서, 펼쳐 두면 같은 글을 여러 번 읽게 된다.
 */
function EmailBody({ body }: { body: string }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { kept, quoted } = splitQuoted(body);

  return (
    <>
      <p className="whitespace-pre-wrap text-xs text-ink-muted">
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
        <p className="whitespace-pre-wrap border-l-2 border-line pl-2 text-[11px] text-ink-faint">
          {quoted.join('\n')}
        </p>
      )}
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ClientEmailThread({ clientEmail }: { clientEmail: string }) {
  const [emails, setEmails] = useState<RawEmail[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconnect, setReconnect] = useState(false);

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      const res = await loadClientEmails(clientEmail, { refresh });
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
    [clientEmail],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">고객 이메일</h2>
          <p className="text-xs text-ink-faint">{clientEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
          {loading ? '확인 중…' : '새로고침'}
        </Button>
      </div>

      {message !== null && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">{message}</p>
      )}

      {message === null && !loading && emails.length === 0 && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
          아직 이 주소와 주고받은 메일이 없습니다.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface shadow-card">
        {emails.map((email) => (
          <li key={email.id} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink">{email.subject || '(제목 없음)'}</span>
              <span className="shrink-0 text-xs text-ink-faint">{formatDate(email.sentAt)}</span>
            </div>
            <EmailBody body={email.body} />
          </li>
        ))}
      </ul>

      {reconnect && <ReconnectGmailModal onClose={() => setReconnect(false)} />}
    </div>
  );
}
