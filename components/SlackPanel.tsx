'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { post } from '@/lib/api-client';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { SlackChannel, SlackMessage } from '@/core/slack/types';
import { SlackMessageItem } from './SlackMessage';
import { SlackThread } from './SlackThread';

const POLL_INTERVAL_MS = 5_000;

type Workspace = { teamId: string; teamName: string };

const CONNECT_NOTICE: Record<string, string> = {
  connected: 'Slack 워크스페이스가 연결되었습니다.',
  denied: 'Slack 연결이 취소되었습니다.',
  failed: 'Slack 연결에 실패했습니다. 다시 시도해 주세요.',
};

export function SlackPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedTeamId, setSelectedTeamId] = usePersistedState<string | null>('slack:team', null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = usePersistedState<string | null>('slack:channel', null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedThreadTs, setExpandedThreadTs] = useState<string | null>(null);

  // 폴링마다 마지막으로 본 메시지 시각을 들고 있는다. 상태로 두면 클로저가 오래된 값을 참조하니 ref로 둔다.
  const oldestRef = useRef<string | undefined>(undefined);

  const loadWorkspaces = useCallback(async () => {
    const res = await post<Workspace[]>('/api/slack/workspaces', {});
    if (!res.ok) return;
    setWorkspaces(res.data);
    if (selectedTeamId === null && res.data.length > 0) setSelectedTeamId(res.data[0].teamId);
  }, [selectedTeamId, setSelectedTeamId]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('slack');
    if (param !== null) {
      setNotice(CONNECT_NOTICE[param] ?? null);
      window.history.replaceState(null, '', window.location.pathname);
    }
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) {
      setChannels([]);
      return;
    }
    post<SlackChannel[]>('/api/slack/channels', { teamId: selectedTeamId }).then((res) => {
      if (res.ok) setChannels(res.data);
    });
  }, [selectedTeamId]);

  const selectChannel = useCallback(
    async (channel: SlackChannel) => {
      setError(null);
      setMessages([]);
      oldestRef.current = undefined;

      if (!channel.isMember) {
        if (channel.isPrivate) {
          setError('비공개 채널입니다. 슬랙에서 이 채널에 봇을 먼저 초대해 주세요.');
          return;
        }
        const joined = await post('/api/slack/join', { teamId: selectedTeamId, channelId: channel.id });
        if (!joined.ok) {
          setError(joined.error);
          return;
        }
      }
      setExpandedThreadTs(null);
      setSelectedChannelId(channel.id);
    },
    [selectedTeamId, setSelectedChannelId],
  );

  const poll = useCallback(async () => {
    if (selectedTeamId === null || selectedChannelId === null) return;
    setLoading(true);
    const res = await post<SlackMessage[]>('/api/slack/messages', {
      teamId: selectedTeamId,
      channelId: selectedChannelId,
      oldest: oldestRef.current,
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    if (res.data.length === 0) return;

    oldestRef.current = res.data[res.data.length - 1].id;
    setMessages((prev) => [...prev, ...res.data]);
  }, [selectedTeamId, selectedChannelId]);

  // 채널이 바뀌면 처음부터 다시 받는다
  useEffect(() => {
    if (selectedChannelId === null) return;
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === null) return;
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedChannelId, poll]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">슬랙</h2>
          <p className="text-sm text-ink-muted">채널을 선택하면 5초마다 새 대화를 확인합니다.</p>
        </div>
        <a
          href="/api/slack/connect"
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          워크스페이스 연결
        </a>
      </div>

      {notice !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm">{notice}</p>
      )}

      {workspaces.length === 0 && (
        <p className="text-sm text-ink-muted">연결된 워크스페이스가 없습니다. 먼저 연결해 주세요.</p>
      )}

      {workspaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((w) => (
            <button
              key={w.teamId}
              type="button"
              onClick={() => setSelectedTeamId(w.teamId)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                w.teamId === selectedTeamId
                  ? 'border-accent bg-accent text-white'
                  : 'border-line hover:bg-paper'
              }`}
            >
              {w.teamName}
            </button>
          ))}
        </div>
      )}

      {selectedTeamId !== null && channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectChannel(c)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                c.id === selectedChannelId ? 'border-accent bg-accent text-white' : 'border-line hover:bg-paper'
              }`}
            >
              {c.isPrivate ? '🔒 ' : '# '}
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted">{error}</p>
      )}

      {selectedChannel !== null && (
        <div className="rounded-md border border-line">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
            <span className="font-medium">
              {selectedChannel.isPrivate ? '🔒 ' : '# '}
              {selectedChannel.name}
            </span>
            {loading && <span className="text-xs text-ink-muted">확인 중…</span>}
          </div>

          <ul className="flex flex-col divide-y divide-line">
            {messages.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-muted">아직 대화가 없습니다.</li>
            )}
            {messages.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <SlackMessageItem message={m} />

                {m.replyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedThreadTs((prev) => (prev === m.id ? null : m.id))}
                    className="mt-1 text-xs text-accent hover:underline"
                  >
                    {expandedThreadTs === m.id ? '답글 숨기기' : `답글 ${m.replyCount}개 보기`}
                  </button>
                )}

                {expandedThreadTs === m.id && selectedTeamId !== null && selectedChannelId !== null && (
                  <SlackThread teamId={selectedTeamId} channelId={selectedChannelId} threadTs={m.id} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
