'use client';

// feat/#6에서 검증한 Gmail 연동을 이 화면(연동 탭) 톤에 맞춰 옮긴 것이다.
// 연결 안 됐을 때는 카드 한 줄, 연결됐을 때는 그 아래 회사/발신인별 메일 트리를 편다.

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, get, post } from '@/lib/api-client';
import { Button } from './Button';
import { Badge } from './Badge';
import type { CompanyGroup, EmailConnectionStatus } from '@/types/integrations';

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

export function EmailIntegrationPanel() {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const checkStatus = useCallback(async () => {
    const res = await get<EmailConnectionStatus>('/api/email/status');
    if (!res.ok) {
      setConnected(false);
      setMessage(res.error);
      return;
    }
    setConnected(res.data.connected);
    setEmail(res.data.email);
    if (res.data.connected) await loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <li className="rounded-lg border border-line bg-surface px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Gmail</span>
            {connected ? (
              <Badge tone="success">Connected{email ? ` · ${email}` : ''}</Badge>
            ) : (
              <Badge tone="neutral">Not connected</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">받은 편지함에 도착한 고객 메일을 요청으로 가져옵니다.</p>
        </div>

        {connected ? (
          <Button variant="outline" size="sm" onClick={loadMessages} disabled={loading}>
            {loading ? '확인 중…' : '새로고침'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = apiUrl('/api/email/connect');
            }}
          >
            연결
          </Button>
        )}
      </div>

      {message !== null && <p className="mt-3 text-xs text-ink-faint">{message}</p>}

      {connected && groups.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
          {groups.map((company) => (
            <div key={company.domain} className="rounded-md border border-line">
              <div className="flex items-center justify-between border-b border-line bg-paper px-3 py-1.5">
                <span className="text-xs font-medium text-ink">{company.domain}</span>
                <span className="text-xs text-ink-faint">
                  {company.count}통 · {formatDate(company.latestAt)}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-line">
                {company.senders.map((sender) => (
                  <div key={sender.address} className="flex flex-col gap-1.5 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{sender.name}</span>
                      <span className="text-ink-faint">
                        {sender.address} · {sender.count}통
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {sender.emails.map((emailItem) => (
                        <li key={emailItem.id} className="text-xs">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-ink">{emailItem.subject || '(제목 없음)'}</span>
                            <span className="shrink-0 text-ink-faint">{formatDate(emailItem.sentAt)}</span>
                          </div>
                          <p className="truncate text-ink-faint">{preview(emailItem.body)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
