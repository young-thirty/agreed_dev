'use client';

// 프로젝트별 고객 이메일 내역. 회사/발신인 트리 전체를 보여주지 않고,
// 이 프로젝트의 clientEmail 한 명과 주고받은 메일만 걸러서 평평한 목록으로 보여준다.

import { useCallback, useEffect, useState } from 'react';
import { post } from '@/lib/api-client';
import { Button } from './Button';
import type { CompanyGroup, RawEmail } from '@/types/integrations';

const MAX_MESSAGES = 100;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 회사/발신인 트리에서 이 주소 하나와 주고받은 메일만 뽑아 최신순으로 편다. */
function emailsWith(groups: CompanyGroup[], address: string): RawEmail[] {
  const target = address.toLowerCase();
  for (const company of groups) {
    const sender = company.senders.find((s) => s.address.toLowerCase() === target);
    if (sender) return sender.emails;
  }
  return [];
}

export function ClientEmailThread({ clientEmail }: { clientEmail: string }) {
  const [emails, setEmails] = useState<RawEmail[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await post<CompanyGroup[]>('/api/email/messages', { maxMessages: MAX_MESSAGES });
    setLoading(false);

    if (!res.ok) {
      setMessage(res.error);
      setEmails([]);
      return;
    }
    setMessage(null);
    setEmails(emailsWith(res.data, clientEmail));
  }, [clientEmail]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">고객 이메일</h2>
          <p className="text-xs text-ink-faint">{clientEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
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
            <p className="whitespace-pre-wrap text-xs text-ink-muted">{email.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
