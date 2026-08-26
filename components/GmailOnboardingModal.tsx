'use client';

// 로그인할 때마다, Gmail을 아직 연결하지 않았으면 안내한다.
// 연결 여부를 실제로 물어보고 판단하므로, 이미 연결한 사람에게는 뜨지 않는다.
// "나중에"를 누르면 이번 로그인 동안은 다시 묻지 않는다 — 다음 로그인에 초기화된다.
// 설정 화면 자체에는 같은 안내가 이미 있으므로 거기서는 띄우지 않는다.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { usePersistedState } from '@/hooks/usePersistedState';
import { getGmailStatus } from '@/lib/api';

export function GmailOnboardingModal() {
  const pathname = usePathname();
  const router = useRouter();
  const [dismissed, setDismissed] = usePersistedState('gmail-onboarding-dismissed', false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (dismissed || pathname === '/settings') return;

    let alive = true;
    getGmailStatus().then((res) => {
      if (!alive) return;
      if (res.ok && !res.data.connected) setShow(true);
    });
    return () => {
      alive = false;
    };
  }, [dismissed, pathname]);

  if (!show || pathname === '/settings') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-card-hover">
        <h2 className="text-base font-semibold text-ink">Gmail을 연결해 보세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          받은 편지함의 고객 메일을 가져와 티켓으로 만듭니다. 계정에 한 번만 연결하면 모든
          프로젝트가 함께 씁니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setDismissed(true);
              setShow(false);
            }}
          >
            나중에
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShow(false);
              router.push('/settings');
            }}
          >
            설정으로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
