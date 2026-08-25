'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { post } from '@/lib/api-client';
import type { SlackMessage } from '@/core/slack/types';
import { SlackMessageItem } from './SlackMessage';

const POLL_INTERVAL_MS = 5_000;

type Props = { teamId: string; channelId: string; threadTs: string };

/** 펼쳐진 동안만 그 스레드를 폴링한다. 접으면 부모가 이 컴포넌트를 언마운트해서 자동으로 멈춘다. */
export function SlackThread({ teamId, channelId, threadTs }: Props) {
  const [replies, setReplies] = useState<SlackMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const oldestRef = useRef<string | undefined>(undefined);

  const poll = useCallback(async () => {
    const res = await post<SlackMessage[]>('/api/slack/thread', {
      teamId,
      channelId,
      threadTs,
      oldest: oldestRef.current,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    if (res.data.length === 0) return;

    oldestRef.current = res.data[res.data.length - 1].id;
    // 개발 모드는 effect를 두 번 실행해서 poll이 겹쳐 호출될 수 있다. 같은 id가 섞여 들어와도
    // 걸러지도록 병합 시점에 중복을 제거한다.
    setReplies((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...res.data.filter((r) => !seen.has(r.id))];
    });
  }, [teamId, channelId, threadTs]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadTs]);

  return (
    <div className="mt-2 ml-4 border-l border-line pl-4">
      {error !== null && <p className="text-xs text-ink-muted">{error}</p>}
      {error === null && replies.length === 0 && (
        <p className="text-xs text-ink-muted">답글을 불러오는 중…</p>
      )}
      <ul className="flex flex-col gap-2">
        {replies.map((reply) => (
          <li key={reply.id}>
            <SlackMessageItem message={reply} />
          </li>
        ))}
      </ul>
    </div>
  );
}
