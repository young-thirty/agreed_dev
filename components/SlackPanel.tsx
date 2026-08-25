'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, post } from '@/lib/api-client';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { SlackChannel, SlackMessage, SlackWorkspace } from '@/types/integrations';
import { SlackMessageItem } from './SlackMessage';
import { SlackThread } from './SlackThread';

const CONNECT_NOTICE: Record<string, string> = {
  connected: 'Slack 워크스페이스가 연결되었습니다.',
  denied: 'Slack 연결이 취소되었습니다.',
  failed: 'Slack 연결에 실패했습니다. 다시 시도해 주세요.',
  login_required: 'Agreed에 로그인한 뒤 Slack을 연결해 주세요.',
};

export function SlackPanel() {
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([]);
  const [selectedTeamId, setSelectedTeamId] = usePersistedState<string | null>('slack:team', null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = usePersistedState<string | null>('slack:channel', null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedThreadTs, setExpandedThreadTs] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    const res = await post<SlackWorkspace[]>('/api/slack/workspaces', {});
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setError(null);
    setWorkspaces(res.data);
    if (res.data.length === 0) {
      setSelectedTeamId(null);
      return;
    }
    if (!res.data.some((workspace) => workspace.teamId === selectedTeamId)) {
      setSelectedTeamId(res.data[0].teamId);
    }
  }, [selectedTeamId, setSelectedTeamId]);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('slack');
    if (param !== null) {
      setNotice(CONNECT_NOTICE[param] ?? null);
      window.history.replaceState(null, '', window.location.pathname);
    }
    loadWorkspaces();
    // 최초 진입과 OAuth callback 귀환 시 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) {
      setChannels([]);
      return;
    }

    post<SlackChannel[]>('/api/slack/channels', { teamId: selectedTeamId }).then((res) => {
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setChannels(res.data);
      if (!res.data.some((channel) => channel.id === selectedChannelId)) {
        setSelectedChannelId(null);
      }
    });
  }, [selectedTeamId, selectedChannelId, setSelectedChannelId]);

  const selectWorkspace = useCallback(
    (teamId: string) => {
      setMessages([]);
      setChannels([]);
      setExpandedThreadTs(null);
      setSelectedChannelId(null);
      setSelectedTeamId(teamId);
    },
    [setSelectedChannelId, setSelectedTeamId],
  );

  const selectChannel = useCallback(
    async (channel: SlackChannel) => {
      if (selectedTeamId === null) return;

      setError(null);
      setMessages([]);

      if (!channel.isMember) {
        if (channel.isPrivate) {
          setError('비공개 채널입니다. 슬랙에서 이 채널에 봇을 먼저 초대해 주세요.');
          return;
        }
        const joined = await post('/api/slack/join', {
          teamId: selectedTeamId,
          channelId: channel.id,
        });
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

  const loadMessages = useCallback(async () => {
    if (selectedTeamId === null || selectedChannelId === null) return;

    setLoading(true);
    const res = await post<SlackMessage[]>('/api/slack/messages', {
      teamId: selectedTeamId,
      channelId: selectedChannelId,
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setMessages(res.data);
  }, [selectedTeamId, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId !== null) loadMessages();
  }, [selectedChannelId, loadMessages]);

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">슬랙</h2>
          <p className="text-sm text-ink-muted">채널을 선택하거나 새로고침할 때 대화를 확인합니다.</p>
        </div>
        <a
          href={apiUrl('/api/slack/connect')}
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
          {workspaces.map((workspace) => (
            <button
              key={workspace.teamId}
              type="button"
              onClick={() => selectWorkspace(workspace.teamId)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                workspace.teamId === selectedTeamId
                  ? 'border-accent bg-accent text-white'
                  : 'border-line hover:bg-paper'
              }`}
            >
              {workspace.teamName}
            </button>
          ))}
        </div>
      )}

      {selectedTeamId !== null && channels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => selectChannel(channel)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                channel.id === selectedChannelId
                  ? 'border-accent bg-accent text-white'
                  : 'border-line hover:bg-paper'
              }`}
            >
              {channel.isPrivate ? '🔒 ' : '# '}
              {channel.name}
            </button>
          ))}
        </div>
      )}

      {error !== null && (
        <p className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted">{error}</p>
      )}

      {selectedChannel !== null && selectedTeamId !== null && (
        <div className="rounded-md border border-line">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2">
            <span className="font-medium">
              {selectedChannel.isPrivate ? '🔒 ' : '# '}
              {selectedChannel.name}
            </span>
            <div className="flex items-center gap-2">
              {loading && <span className="text-xs text-ink-muted">확인 중…</span>}
              <button
                type="button"
                onClick={loadMessages}
                className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface"
              >
                새로고침
              </button>
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-line">
            {messages.length === 0 && !loading && (
              <li className="px-4 py-3 text-sm text-ink-muted">아직 대화가 없습니다.</li>
            )}
            {messages.map((message) => (
              <li key={message.id} className="px-4 py-3 text-sm">
                <SlackMessageItem message={message} teamId={selectedTeamId} />

                {message.replyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedThreadTs((previous) => (
                      previous === message.id ? null : message.id
                    ))}
                    className="mt-1 text-xs text-accent hover:underline"
                  >
                    {expandedThreadTs === message.id
                      ? '답글 숨기기'
                      : `답글 ${message.replyCount}개 보기`}
                  </button>
                )}

                {expandedThreadTs === message.id && selectedChannelId !== null && (
                  <SlackThread
                    teamId={selectedTeamId}
                    channelId={selectedChannelId}
                    threadTs={message.id}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
