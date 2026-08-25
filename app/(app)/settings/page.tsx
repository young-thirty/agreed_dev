'use client';

// 설정. 계정 단위 연동을 여기서 한 번 한다.
//
// 프로젝트마다 다른 것(어느 슬랙 채널을 볼지, 어느 고객 주소를 볼지, 어느 저장소를 볼지)은
// 여기가 아니라 프로젝트 화면에서 정한다.

import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Mail } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { apiUrl } from '@/lib/api-client';
import { getGmailStatus } from '@/lib/api';

export default function SettingsPage() {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const res = await getGmailStatus();
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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7">
        <h1 className="text-xl font-semibold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-ink-muted">
          계정에 한 번 연결해 두면 모든 프로젝트가 함께 씁니다.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-ink">연동</h2>

          <div className="mt-3 rounded-lg bg-surface px-5 py-4 shadow-card">
            <div className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-ink-faint" />
              <span className="text-sm font-medium text-ink">Gmail</span>

              {loading ? (
                <LoaderCircle className="size-3.5 animate-spin text-accent" />
              ) : connected ? (
                <Badge tone="success" dot>
                  연결됨
                </Badge>
              ) : (
                <Badge tone="neutral">연결 안 됨</Badge>
              )}

              <div className="ml-auto">
                {connected ? (
                  <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
                    {loading ? '확인 중…' : '다시 확인'}
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
            </div>

            <p className="mt-2 text-xs text-ink-faint">
              {connected && email !== null
                ? `${email} 계정으로 메일을 읽습니다. 어느 고객 주소를 볼지는 프로젝트마다 정합니다.`
                : '받은 편지함의 고객 메일을 가져옵니다. 연결한 뒤 프로젝트마다 볼 주소를 등록합니다.'}
            </p>

            {message !== null && <p className="mt-2 text-xs text-danger">{message}</p>}
          </div>

          <p className="mt-3 text-xs text-ink-faint">
            슬랙과 GitHub은 프로젝트마다 연결합니다. 그 밖의 채널은 나중에 도입 예정입니다.
          </p>
        </section>
      </div>
    </div>
  );
}
