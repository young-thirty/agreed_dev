'use client';

// 프로젝트별 고객 이메일 내역. 회사/발신인 트리 전체를 보여주지 않고,
// 이 프로젝트의 clientEmail 한 명과 주고받은 메일만 걸러서 평평한 목록으로 보여준다.

import { useCallback, useEffect, useState } from 'react';
import { post } from '@/lib/api-client';
import { Button } from './Button';
import type { CompanyGroup, RawEmail } from '@/types/integrations';

const MAX_MESSAGES = 100;

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

/** 회사/발신인 트리에서 이 주소 하나와 주고받은 메일만 뽑아 최신순으로 편다. */
function emailsWith(groups: CompanyGroup[], address: string): RawEmail[] {
  const target = address.toLowerCase();
  for (const company of groups) {
    const sender = company.senders.find((s) => s.address.toLowerCase() === target);
    if (sender) return sender.emails;
  }
  return [];
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">고객 이메일</h2>
          <p className="mt-0.5 text-xs text-ink-faint">{clientEmail}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? '확인 중…' : '새로고침'}
        </Button>
      </div>

      {message !== null ? (
        <p className="rounded-lg border border-line bg-paper px-4 py-3 text-xs text-ink-faint">
          {message}
        </p>
      ) : loading ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-faint">
            메일을 불러오는 중이에요 · 최대 {MAX_MESSAGES}통
          </p>
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
                <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{email.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
