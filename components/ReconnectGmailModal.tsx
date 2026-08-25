'use client';

// Gmail 연결이 실제로 끊겼을 때만 띄운다.
// 일시적인 조회 실패에는 띄우지 않는다. 그때마다 OAuth를 다시 태우면 안 되기 때문이다.

import { apiUrl } from '@/lib/api-client';
import { Button } from '@/components/Button';

export function ReconnectGmailModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-card-hover"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-ink">Gmail 연결이 끊어졌습니다</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Google에서 접근 권한이 만료되었거나 취소되어 메일을 읽을 수 없습니다. 다시 연결하면
          이어서 가져옵니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            나중에
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = apiUrl('/api/email/connect');
            }}
          >
            Gmail 다시 연결
          </Button>
        </div>
      </div>
    </div>
  );
}
