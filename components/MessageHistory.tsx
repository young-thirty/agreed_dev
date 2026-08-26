'use client';

// 티켓에 쌓인 지난 대화. 받은 메시지와 보낸 답변을 시간순으로 둔다.
// 하나의 요구가 여러 메시지에 걸쳐 어떻게 움직였는지가 여기서 보인다.

import { ChannelChip } from '@/components/channelMeta';
import { MessageBody } from '@/components/MessageBody';
import { Sender } from '@/components/Sender';
import { formatDateTime } from '@/lib/format';
import type { HistoryEntry } from '@/types';

export function MessageHistory({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const incoming = entry.kind === 'in';
        const channel = incoming ? entry.inbound.channel : entry.outbound.channel;
        const text = incoming ? entry.inbound.body : entry.outbound.body;

        return (
          <li
            key={`${entry.at}-${i}`}
            className={`rounded-lg p-4 ${incoming ? 'bg-surface shadow-card' : 'border border-line bg-paper'}`}
          >
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              {incoming ? (
                <Sender name={entry.inbound.fromName} email={entry.inbound.fromEmail} />
              ) : (
                <span className="font-medium text-ink-muted">보낸 답변</span>
              )}
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                <ChannelChip channel={channel} />
                {formatDateTime(entry.at)}
              </span>
            </div>
            <div className="mt-2">
              {incoming ? (
                <MessageBody body={text} className="text-sm leading-relaxed text-ink" />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{text}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
