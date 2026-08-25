'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, get, post } from '@/lib/api-client';
import type { CompanyGroup, EmailConnectionStatus } from '@/types/integrations';

const CONNECT_NOTICE: Record<string, string> = {
  connected: 'Gmail이 연결되었습니다.',
  denied: 'Gmail 연결이 취소되었습니다.',
  failed: 'Gmail 연결에 실패했습니다. 다시 시도해 주세요.',
  login_required: 'Agreed에 로그인한 뒤 Gmail을 연결해 주세요.',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preview(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat;
}

export function EmailPanel() {
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const res = await post<CompanyGroup[]>('/api/email/messages', { maxMessages: 20 });
    setLoading(false);

    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setMessage(null);
    setGroups(res.data);
  }, []);

  const initialize = useCallback(async () => {
    const status = await get<EmailConnectionStatus>('/api/email/status');
    if (!status.ok) {
      setConnected(false);
      setMessage(status.error);
      return;
    }

    setConnected(status.data.connected);
    if (!status.data.connected) {
      setGroups([]);
      setMessage(null);
      return;
    }
    await loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('gmail');
    if (param !== null) {
      setNotice(CONNECT_NOTICE[param] ?? null);
      window.history.replaceState(null, '', window.location.pathname);
    }
    initialize();
  }, [initialize]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">이메일</h2>
          <p className="text-sm text-ink-muted">
            {connected ? '필요할 때 새로고침해 최근 메일을 확인합니다.' : 'Gmail을 연결하면 상대방별 대화 내역을 가져옵니다.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && <span className="text-sm text-ink-muted">불러오는 중…</span>}
          {connected && (
            <button
              type="button"
              onClick={loadMessages}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper"
            >
              새로고침
            </button>
          )}
          <a
            href={apiUrl('/api/email/connect')}
            className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            {connected ? 'Gmail 다시 연결' : 'Gmail 연결'}
          </a>
        </div>
      </div>

      {notice !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm">{notice}</p>
      )}

      {message !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted">{message}</p>
      )}

      {connected && groups.length === 0 && !loading && message === null && (
        <p className="text-sm text-ink-muted">최근 메일이 없습니다.</p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((company) => (
          <div key={company.domain} className="rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
              <span className="font-medium">{company.domain}</span>
              <span className="text-sm text-ink-muted">
                {company.count}통 · {formatDate(company.latestAt)}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-line">
              {company.senders.map((sender) => (
                <div key={sender.address} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sender.name}</span>
                    <span className="text-ink-muted">
                      {sender.address} · {sender.count}통
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {sender.emails.map((email) => (
                      <li key={email.id} className="text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{email.subject || '(제목 없음)'}</span>
                          <span className="shrink-0 text-xs text-ink-muted">{formatDate(email.sentAt)}</span>
                        </div>
                        <p className="truncate text-ink-muted">{preview(email.body)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
