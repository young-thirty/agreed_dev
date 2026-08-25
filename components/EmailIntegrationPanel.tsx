'use client';

// feat/#6에서 검증한 Gmail 연동을 이 화면(연동 탭) 톤에 맞춰 옮긴 것이다.
// 이 카드는 연결 상태만 보여준다 — 실제 메일 내역은 각 프로젝트의 '고객 이메일' 탭
// (ClientEmailThread)에서 그 프로젝트의 clientEmail 한 명으로 걸러서 보여준다.

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, get } from '@/lib/api-client';
import { Button } from './Button';
import { Badge } from './Badge';
import type { EmailConnectionStatus } from '@/types/integrations';

export function EmailIntegrationPanel() {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const res = await get<EmailConnectionStatus>('/api/email/status');
    setLoading(false);

    if (!res.ok) {
      setConnected(false);
      setMessage(res.error);
      return;
    }
    setMessage(null);
    setConnected(res.data.connected);
    setEmail(res.data.email);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
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
    </li>
  );
}
