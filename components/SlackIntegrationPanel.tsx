'use client';

// feat/#6에서 검증한 Slack 연동을 이 화면(연동 탭) 톤에 맞춰 옮긴 것이다.
// 워크스페이스 선택 → 채널 선택(비공개는 봇 초대 필요) → 메시지·스레드·파일까지 그대로 가져왔다.

import { useCallback, useEffect, useState } from 'react';
import { apiUrl, post } from '@/lib/api-client';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Button } from './Button';
import { Badge } from './Badge';
import { SlackMessageItem } from './SlackMessage';
import { SlackThread } from './SlackThread';
import type { SlackChannel, SlackMessage, SlackWorkspace } from '@/types/integrations';

function pillClass(active: boolean): string {
  return `rounded-md border px-2.5 py-1 text-xs font-medium ${
    active ? 'border-transparent bg-accent-soft text-accent' : 'border-line bg-surface text-ink-muted hover:bg-paper'
  }`;
}

export function SlackIntegrationPanel() {
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([]);
  const [selectedTeamId, setSelectedTeamId] = usePersistedState<string | null>('slack:team', null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = usePersistedState<string | null>('slack:channel', null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
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
    if (!res.data.some((w) => w.teamId === selectedTeamId)) setSelectedTeamId(res.data[0].teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

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
      if (!res.data.some((c) => c.id === selectedChannelId)) setSelectedChannelId(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

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

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  return (
    <li className="rounded-lg border border-line bg-surface px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">Slack</span>
            {workspaces.length > 0 ? (
              <Badge tone="success">Connected</Badge>
            ) : (
              <Badge tone="neutral">Not connected</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">연결한 채널의 고객 메시지를 요청으로 가져옵니다.</p>
        </div>

        <Button
          variant={workspaces.length > 0 ? 'outline' : 'primary'}
          size="sm"
          onClick={() => {
            window.location.href = apiUrl('/api/slack/connect');
          }}
        >
          {workspaces.length > 0 ? '워크스페이스 추가' : '연결'}
        </Button>
      </div>

      {workspaces.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex flex-wrap gap-1.5">
            {workspaces.map((w) => (
              <button
                key={w.teamId}
                type="button"
                onClick={() => setSelectedTeamId(w.teamId)}
                className={pillClass(w.teamId === selectedTeamId)}
              >
                {w.teamName}
              </button>
            ))}
          </div>

          {channels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChannel(c)}
                  className={pillClass(c.id === selectedChannelId)}
                >
                  {c.isPrivate ? '🔒 ' : '# '}
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {error !== null && <p className="text-xs text-ink-faint">{error}</p>}

          {selectedChannel !== null && selectedTeamId !== null && (
            <div className="rounded-md border border-line">
              <div className="flex items-center justify-between border-b border-line bg-paper px-3 py-1.5">
                <span className="text-xs font-medium text-ink">
                  {selectedChannel.isPrivate ? '🔒 ' : '# '}
                  {selectedChannel.name}
                </span>
                <div className="flex items-center gap-2">
                  {loading && <span className="text-xs text-ink-faint">확인 중…</span>}
                  <button type="button" onClick={loadMessages} className="text-xs text-accent hover:underline">
                    새로고침
                  </button>
                </div>
              </div>

              <ul className="flex flex-col divide-y divide-line">
                {messages.length === 0 && !loading && (
                  <li className="px-3 py-2 text-xs text-ink-faint">아직 대화가 없습니다.</li>
                )}
                {messages.map((m) => (
                  <li key={m.id} className="px-3 py-2">
                    <SlackMessageItem message={m} teamId={selectedTeamId} />

                    {m.replyCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedThreadTs((prev) => (prev === m.id ? null : m.id))}
                        className="mt-1 text-xs text-accent hover:underline"
                      >
                        {expandedThreadTs === m.id ? '답글 숨기기' : `답글 ${m.replyCount}개 보기`}
                      </button>
                    )}

                    {expandedThreadTs === m.id && selectedChannelId !== null && (
                      <SlackThread teamId={selectedTeamId} channelId={selectedChannelId} threadTs={m.id} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
