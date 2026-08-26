'use client';

// 개발 상황 확인. 요구 분석과 분리된 선택 단계다.
//
// 저장소를 뒤지는 일은 시간이 걸리고 모든 티켓에 필요하지도 않다.
// 그래서 분석이 끝난 뒤, 사람이 누를 때만 GitHub에 물어본다.
//
// 분석이 이미 기능 단위로 접어 둔 현황(devContext)을 갖고 있으면 그것을 보여주고,
// 없으면 저장소에 그대로 물어 답을 줄글로 보여준다.

import { useState } from 'react';
import { Check, CodeXml, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { DevContextCard } from '@/components/DevContextCard';
import { askGit } from '@/lib/api';
import type { DevContext } from '@/types';

export function DevContextSection({
  projectId,
  subject,
  devContext = null,
}: {
  projectId: string;
  /** 무엇에 대해 물어볼지. 티켓 제목을 그대로 쓴다. */
  subject: string;
  /** 분석이 이미 정리해 둔 개발 현황. 있으면 저장소에 다시 묻지 않는다. */
  devContext?: DevContext | null;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setMessage(null);

    if (devContext !== null) {
      // 이미 확인해 둔 내용이다. 읽어 오는 시간만큼만 기다렸다가 펼친다.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setLoading(false);
      setShown(true);
      return;
    }

    const res = await askGit(
      projectId,
      `"${subject}" 관련해서 지금 저장소에 구현된 부분, 진행 중인 작업, 아직 없는 부분을 짧게 정리해줘.`,
    );
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setAnswer(res.data.answer);
    setRepo(res.data.repoFullName);
  }

  if (shown && devContext !== null) {
    return <DevContextCard dev={devContext} repo={devContext.repoFullName} />;
  }

  if (answer !== null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Check className="size-4 text-success" />
            개발 상황
          </h3>
          {repo !== null && <span className="font-mono text-xs text-ink-faint">{repo}</span>}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{answer}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <CodeXml className="mt-0.5 size-4 shrink-0 text-ink-faint" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-ink">개발 상황도 확인할까요?</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            연결된 저장소에서 이 요청과 관련된 구현 상태를 확인합니다. 답변에 넣을 근거가 됩니다.
          </p>
          {message !== null && <p className="mt-2 text-xs text-ink-faint">{message}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={ask} disabled={loading}>
          {loading && <LoaderCircle className="size-3.5 animate-spin" />}
          {loading ? '확인 중…' : '개발 상황 확인'}
        </Button>
      </div>
    </div>
  );
}
