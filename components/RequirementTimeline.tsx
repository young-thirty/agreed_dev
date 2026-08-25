'use client';

// 요구사항이 어떻게 변해왔는지 브랜치 그래프로 보여준다.
//
// 요구사항 하나가 한 줄기다. 시간순으로 한 줄씩 내려가되, 각자의 줄기에 점을
// 찍는다. 한 줄로 늘어놓으면 어느 변화가 같은 요구사항의 것인지 읽히지 않는다.
//
// 채운 점은 사람이 확정한 것, 빈 점은 AI가 감지만 한 것이다.

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api-client';
import type { Requirement, RequirementStatus } from '@/types';

/** 줄기 색. 다섯을 돌려 쓴다. 색은 globals.css 토큰으로만 쓴다. */
const LANE = [
  { dot: 'bg-accent', line: 'bg-accent/30', ring: 'border-accent' },
  { dot: 'bg-success', line: 'bg-success/30', ring: 'border-success' },
  { dot: 'bg-warn', line: 'bg-warn/30', ring: 'border-warn' },
  { dot: 'bg-danger', line: 'bg-danger/30', ring: 'border-danger' },
  { dot: 'bg-info', line: 'bg-info/30', ring: 'border-info' },
];

interface Row {
  requirementId: string;
  at: string;
  fromStatus: RequirementStatus | null;
  toStatus: RequirementStatus;
  byHuman: boolean;
}

interface Lane {
  requirementId: string;
  title: string;
  firstRow: number;
  lastRow: number;
}

function toRows(requirements: Requirement[]): Row[] {
  return requirements
    .flatMap((requirement) =>
      requirement.history.map((change) => ({
        requirementId: requirement.id,
        at: change.at,
        fromStatus: change.fromStatus,
        toStatus: change.toStatus,
        byHuman: change.byHuman,
      })),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** 처음 나타난 순서대로 줄기를 배정하고, 각 줄기가 어디서 시작해 어디서 끝나는지 잡는다. */
function toLanes(rows: Row[], requirements: Requirement[]): Lane[] {
  const lanes: Lane[] = [];
  rows.forEach((row, index) => {
    const existing = lanes.find((lane) => lane.requirementId === row.requirementId);
    if (existing) {
      existing.lastRow = index;
      return;
    }
    lanes.push({
      requirementId: row.requirementId,
      title: requirements.find((r) => r.id === row.requirementId)?.title ?? '',
      firstRow: index,
      lastRow: index,
    });
  });
  return lanes;
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

/** 줄기가 이 줄에서 어떤 모양의 선을 그리는지. 시작 줄은 점 아래로만, 끝 줄은 점 위로만 그린다. */
function lineShape(lane: Lane, index: number): string | null {
  if (index < lane.firstRow || index > lane.lastRow) return null;
  if (lane.firstRow === lane.lastRow) return null;
  if (index === lane.firstRow) return 'top-2 bottom-0';
  if (index === lane.lastRow) return 'top-0 h-2';
  return 'top-0 bottom-0';
}

export function RequirementTimeline({ projectId }: { projectId: string }) {
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    get<Requirement[]>(`/api/projects/${projectId}/requirements`).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setRequirements(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (message !== null) return <p className="text-sm text-ink-muted">{message}</p>;
  if (requirements === null) return <p className="text-sm text-ink-muted">불러오는 중…</p>;

  const rows = toRows(requirements);
  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        아직 기록된 요구사항 변화가 없습니다. 요청 분석에서 요구사항을 뽑으면 여기에 쌓입니다.
      </p>
    );
  }

  const lanes = toLanes(rows, requirements);
  const unconfirmed = rows.filter((row) => !row.byHuman).length;

  return (
    <div className="mx-auto max-w-3xl">
      {unconfirmed >= 3 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-md border border-line bg-warn-soft p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-sm text-ink">
            AI가 감지한 변화 <span className="font-semibold">{unconfirmed}건</span>이 아직 사람
            확인을 거치지 않았습니다.
          </p>
        </div>
      )}

      {/* 줄기 안내 */}
      <ul className="mb-5 flex flex-col gap-1.5 rounded-md border border-line bg-paper p-3">
        {lanes.map((lane, index) => (
          <li key={lane.requirementId} className="flex items-center gap-2 text-xs">
            <span
              className={`size-2.5 shrink-0 rounded-full ${LANE[index % LANE.length].dot}`}
            />
            <span className="truncate text-ink-muted">{lane.title}</span>
          </li>
        ))}
        <li className="mt-1 flex items-center gap-3 border-t border-line pt-2 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ink-faint" />
            사람 확정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-ink-faint bg-surface" />
            AI 감지
          </span>
        </li>
      </ul>

      {/* 그래프 */}
      <ol className="flex flex-col">
        {rows.map((row, index) => (
          <li key={`${row.requirementId}-${row.at}`} className="flex items-stretch">
            {lanes.map((lane, laneIndex) => {
              const style = LANE[laneIndex % LANE.length];
              const shape = lineShape(lane, index);
              const isNode = lane.requirementId === row.requirementId;
              return (
                <span key={lane.requirementId} className="relative w-[18px] shrink-0">
                  {shape !== null && (
                    <span
                      className={`absolute left-1/2 w-px -translate-x-1/2 ${shape} ${style.line}`}
                    />
                  )}
                  {isNode && (
                    <span
                      className={`absolute left-1/2 top-1.5 size-2.5 -translate-x-1/2 rounded-full ${
                        row.byHuman ? style.dot : `border-2 bg-surface ${style.ring}`
                      }`}
                    />
                  )}
                </span>
              );
            })}

            <div className="min-w-0 flex-1 pb-6 pl-3">
              <span className="text-xs font-medium text-ink-faint">{formatDate(row.at)}</span>
              <p className="mt-0.5 text-sm">
                {row.fromStatus ?? '새로 발견'} <span className="text-ink-faint">→</span>{' '}
                <span className="font-medium">{row.toStatus}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

