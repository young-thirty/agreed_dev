'use client';

// 연결 하나에서 대화를 가져오는 자리.
//
// 가져오기(sync)가 곧 티켓 생성이다. 서버가 대화를 받아 저장하고, 새 대화만
// 백그라운드로 분석한다. 분석이 끝나야 티켓이 생기므로 응답이 왔다고 바로
// 목록을 갱신하면 아직 아무것도 없다. 그래서 분석이 끝날 때까지 지켜본다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { ReconnectGmailModal } from '@/components/ReconnectGmailModal';
import { getAnalysisRun, syncSourceLink } from '@/lib/api';
import type { SourceLink } from '@/types';

/** 분석 상태를 물어보는 간격과 최대 횟수. 90초쯤 보고 그만둔다. */
const POLL_MS = 1500;
const POLL_LIMIT = 60;

export function ChannelSync({
  projectId,
  link,
  autoStart,
  onDone,
}: {
  projectId: string;
  link: SourceLink;
  /** 방금 등록한 연결이면 누르지 않아도 한 번 가져온다. */
  autoStart: boolean;
  /** 분석이 끝나 티켓이 생겼을 수 있을 때. 목록을 다시 읽는다. */
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnect, setReconnect] = useState(false);
  // 화면을 떠난 뒤에도 폴링이 도는 것을 막는다.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatus('대화를 가져오는 중…');

    const res = await syncSourceLink(projectId, link.sourceLinkId);
    if (!alive.current) return;

    if (!res.ok) {
      setBusy(false);
      setStatus(null);
      setError(res.error);
      // 토큰이 만료되면 다시 연결해야 이어서 가져온다.
      if (link.sourceChannel === 'GMAIL' && res.error.includes('연결 상태')) setReconnect(true);
      return;
    }

    const { newMessageCount, analysisRunIds } = res.data;
    if (newMessageCount === 0) {
      setBusy(false);
      setStatus('새로 온 대화가 없습니다.');
      return;
    }

    setStatus(`대화 ${newMessageCount}건을 가져왔습니다. 분석하는 중…`);

    // 분석이 다 끝나야 티켓이 보인다. 남은 것이 없어질 때까지 물어본다.
    let pending = [...analysisRunIds];
    for (let tries = 0; tries < POLL_LIMIT && pending.length > 0; tries += 1) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      if (!alive.current) return;

      const checked = await Promise.all(pending.map((id) => getAnalysisRun(id)));
      if (!alive.current) return;

      pending = pending.filter((id, i) => {
        const one = checked[i];
        // 못 물어본 건은 다음 차례에 다시 본다.
        if (!one.ok) return true;
        return one.data.status === 'PENDING' || one.data.status === 'PROCESSING';
      });
      onDone(); // 끝난 것부터 티켓에 나타난다
    }

    setBusy(false);
    setStatus(
      pending.length === 0
        ? `대화 ${newMessageCount}건을 분석했습니다.`
        : '분석이 아직 끝나지 않았습니다. 잠시 뒤 다시 확인해 주세요.',
    );
    onDone();
  }, [projectId, link.sourceLinkId, link.sourceChannel, onDone]);

  // 방금 등록한 연결은 바로 한 번 가져온다. 이후에는 사람이 누른다.
  const started = useRef(false);
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      run();
    }
  }, [autoStart, run]);

  return (
    <>
      <Button size="sm" variant="ghost" onClick={run} disabled={busy}>
        {busy ? (
          <LoaderCircle className="size-3.5 animate-spin text-accent" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        {busy ? '가져오는 중' : '가져오기'}
      </Button>

      {status !== null && <span className="text-xs text-ink-faint">{status}</span>}
      {error !== null && <span className="text-xs text-danger">{error}</span>}

      {reconnect && <ReconnectGmailModal onClose={() => setReconnect(false)} />}
    </>
  );
}
