'use client';

import { useCallback, useEffect, useState } from 'react';
import { post } from '@/lib/api-client';
import type { SlackMessage } from '@/types/integrations';
import { SlackMessageItem } from './SlackMessage';

type Props = { teamId: string; channelId: string; threadTs: string };

export function SlackThread({ teamId, channelId, threadTs }: Props) {
  const [replies, setReplies] = useState<SlackMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await post<SlackMessage[]>('/api/slack/thread', { teamId, channelId, threadTs });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setReplies(res.data);
  }, [teamId, channelId, threadTs]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-2 ml-4 border-l border-line pl-3">
      <div className="mb-1.5 flex items-center justify-between">
        {loading && <p className="text-xs text-ink-faint">답글을 불러오는 중…</p>}
        <button type="button" onClick={load} className="ml-auto text-xs text-accent hover:underline">
          답글 새로고침
        </button>
      </div>
      {error !== null && <p className="text-xs text-ink-faint">{error}</p>}
      {!loading && error === null && replies.length === 0 && (
        <p className="text-xs text-ink-faint">답글이 없습니다.</p>
      )}
      <ul className="flex flex-col gap-2">
        {replies.map((reply) => (
          <li key={reply.id}>
            <SlackMessageItem message={reply} teamId={teamId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
