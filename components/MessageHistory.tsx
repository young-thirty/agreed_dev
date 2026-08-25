'use client';

// 티켓에 쌓인 지난 대화. 받은 메시지와 보낸 답변을 시간순으로 둔다.
// 하나의 요구가 여러 메시지에 걸쳐 어떻게 움직였는지가 여기서 보인다.

import { CHANNEL_META } from '@/components/channelMeta';
import { formatDateTime } from '@/lib/format';
import type { HistoryEntry } from '@/types';

export function MessageHistory({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const incoming = entry.kind === 'in';
        const channel = incoming ? entry.inbound.channel : entry.outbound.channel;
        const { icon: Icon, label } = CHANNEL_META[channel];
        const text = incoming ? entry.inbound.body : entry.outbound.body;

        return (
          <li
            key={`${entry.at}-${i}`}
            className={`rounded-lg p-4 ${incoming ? 'bg-surface shadow-card' : 'border border-line bg-paper'}`}
          >
            <div className="flex items-center gap-1.5 text-xs text-ink-faint">
              <Icon className="size-3.5" />
              <span>{incoming ? `${entry.inbound.fromName} · 받음` : '보낸 답변'}</span>
              <span>·</span>
              <span>{label}</span>
              <span className="ml-auto">{formatDateTime(entry.at)}</span>
            </div>
            <p
              className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${
                incoming ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {text}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
