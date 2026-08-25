'use client';

// 슬랙 채널을 고르는 두 단계. 워크스페이스를 먼저 고르고 그 안의 채널을 고른다.
// 워크스페이스가 하나뿐이면 고르는 단계를 건너뛴다.

import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { listSlackChannels, listSlackWorkspaces, type SlackChannel } from '@/lib/api';

const SELECT_CLASS =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:bg-surface focus:outline-3 focus:outline-accent-soft';

export function SlackChannelPicker({
  onPick,
  onCancel,
  busy,
}: {
  onPick: (picked: { teamId: string; channelId: string; channelName: string }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [workspaces, setWorkspaces] = useState<{ teamId: string; teamName: string }[]>([]);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [teamId, setTeamId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSlackWorkspaces().then((res) => {
      setLoading(false);
      if (!res.ok) return setError(res.error);
      setWorkspaces(res.data);
      if (res.data.length === 1) setTeamId(res.data[0].teamId);
    });
  }, []);

  useEffect(() => {
    if (teamId === '') return;
    setChannels([]);
    setChannelId('');
    setLoading(true);
    listSlackChannels(teamId).then((res) => {
      setLoading(false);
      if (!res.ok) return setError(res.error);
      setError(null);
      setChannels(res.data);
    });
  }, [teamId]);

  if (loading && workspaces.length === 0) {
    return (
      <p className="flex items-center gap-2 text-xs text-ink-faint">
        <LoaderCircle className="size-3.5 animate-spin text-accent" />
        슬랙 워크스페이스를 불러오는 중…
      </p>
    );
  }

  if (error !== null && workspaces.length === 0) {
    return <p className="text-xs text-danger">{error}</p>;
  }

  if (workspaces.length === 0) {
    return (
      <p className="text-xs text-ink-faint">
        연결된 슬랙 워크스페이스가 없습니다. 먼저 슬랙을 연결한 뒤 채널을 붙일 수 있습니다.
      </p>
    );
  }

  const picked = channels.find((c) => c.id === channelId);

  return (
    <div className="flex flex-col gap-2">
      {workspaces.length > 1 && (
        <select
          aria-label="슬랙 워크스페이스"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">워크스페이스 선택</option>
          {workspaces.map((w) => (
            <option key={w.teamId} value={w.teamId}>
              {w.teamName}
            </option>
          ))}
        </select>
      )}

      {teamId !== '' && (
        <select
          aria-label="슬랙 채널"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={loading}
          className={SELECT_CLASS}
        >
          <option value="">{loading ? '채널을 불러오는 중…' : '채널 선택'}</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
              {c.isPrivate && ' (비공개)'}
            </option>
          ))}
        </select>
      )}

      {error !== null && <p className="text-xs text-danger">{error}</p>}

      {picked !== undefined && !picked.isMember && (
        <p className="text-xs text-warn">
          이 채널에 봇이 아직 들어가 있지 않습니다. 슬랙에서 채널에 초대해야 대화를 읽습니다.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={picked === undefined || busy}
          onClick={() =>
            picked !== undefined &&
            onPick({ teamId, channelId: picked.id, channelName: picked.name })
          }
        >
          {busy ? '연결하는 중…' : '채널 연결'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
          취소
        </Button>
      </div>
    </div>
  );
}
