'use client';

// 요구사항이 어떻게 변해왔는지 시간순으로 보여준다.
// 상태가 바뀔 때마다 백엔드가 남긴 기록(Requirement.history)을 그대로 편다.
//
// 사람이 확정한 변화와 AI가 감지한 변화를 구분해 그린다. 같은 색으로 두면
// 아직 아무도 확인하지 않은 변화가 확정된 것처럼 보인다.

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api-client';
import { Badge } from '@/components/Badge';
import type { Requirement, RequirementStatus } from '@/types';

interface Entry {
  key: string;
  title: string;
  at: string;
  fromStatus: RequirementStatus | null;
  toStatus: RequirementStatus;
  byHuman: boolean;
}

function toEntries(requirements: Requirement[]): Entry[] {
  return requirements
    .flatMap((requirement) =>
      requirement.history.map((change, order) => ({
        key: `${requirement.id}-${order}`,
        title: requirement.title,
        at: change.at,
        fromStatus: change.fromStatus,
        toStatus: change.toStatus,
        byHuman: change.byHuman,
      })),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RequirementTimeline({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    get<Requirement[]>(`/api/projects/${projectId}/requirements`).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setEntries(toEntries(res.data));
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (message !== null) return <p className="text-sm text-ink-muted">{message}</p>;
  if (entries === null) return <p className="text-sm text-ink-muted">불러오는 중…</p>;
  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        아직 기록된 요구사항 변화가 없습니다. 요청 분석에서 요구사항을 뽑으면 여기에 쌓입니다.
      </p>
    );
  }

  const unconfirmed = entries.filter((entry) => !entry.byHuman).length;

  return (
    <div className="mx-auto max-w-2xl">
      {unconfirmed >= 3 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-line bg-warn-soft p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-sm text-ink">
            AI가 감지한 변화 <span className="font-semibold">{unconfirmed}건</span>이 아직 사람
            확인을 거치지 않았습니다.
          </p>
        </div>
      )}

      <ol className="relative flex flex-col gap-6 border-l border-line pl-6">
        {entries.map((entry) => (
          <li key={entry.key} className="relative">
            <span
              className={`absolute -left-[1.85rem] top-1 size-2.5 rounded-full ring-4 ring-paper ${
                entry.byHuman ? 'bg-accent' : 'bg-line'
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-faint">{formatDate(entry.at)}</span>
              <Badge tone={entry.byHuman ? 'success' : 'neutral'}>
                {entry.byHuman ? '사람 확정' : 'AI 감지'}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium">{entry.title}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {entry.fromStatus ?? '새로 발견'} → {entry.toStatus}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

