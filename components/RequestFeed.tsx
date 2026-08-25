'use client';

// 워크스페이스 가운데. 들어온 클라이언트 요청 목록.
// 하나를 고르면 우측에 분석이 나타난다.

import { CHANNEL_META } from '@/components/channelMeta';
import { VerdictBadge } from '@/components/StatusBadges';
import type { ClientRequest } from '@/types';

function timeAgo(iso: string): string {
  return iso.replace('T', ' ').slice(5, 16); // MM-DD HH:mm
}

export function RequestFeed({
  requests,
  selectedId,
  onSelect,
}: {
  requests: ClientRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">클라이언트 요청</h2>
        <span className="text-xs text-ink-faint">{requests.length}건</span>
      </div>

      <div className="flex flex-col gap-2">
        {requests.map((req) => {
          const { label, icon: Icon } = CHANNEL_META[req.channel];
          const on = req.id === selectedId;
          return (
            <button
              key={req.id}
              type="button"
              onClick={() => onSelect(req.id)}
              className={`w-full rounded-md border p-3.5 text-left transition-colors ${
                on ? 'border-accent bg-surface' : 'border-line bg-surface hover:border-ink-faint'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Icon className="size-3.5" />
                <span>{label}</span>
                <span className="text-ink-faint">· {req.from}</span>
                {req.unread && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
              </div>

              <p className="mt-1.5 text-sm font-medium">{req.subject}</p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{req.body}</p>

              <div className="mt-2.5 flex items-center justify-between">
                <VerdictBadge verdict={req.analysis.verdict} />
                <span className="text-[11px] text-ink-faint">{timeAgo(req.receivedAt)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
