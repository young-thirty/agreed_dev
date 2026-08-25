'use client';

// 요구사항이 어떻게 변해왔는지 브랜치 그래프로 보여준다.
//
// 맨 왼쪽 굵은 선이 프로젝트의 시간축이다. 요구사항이 처음 발견되면 거기서
// 가지가 갈라져 나와 자기 줄기를 갖고, 마지막 변화에서 끝난다.
// 한 줄로 늘어놓으면 어느 변화가 같은 요구사항의 것인지 읽히지 않는다.
//
// 채운 점은 사람이 확정한 것, 빈 점은 AI가 감지만 한 것이다.

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api-client';
import type { Requirement, RequirementStatus } from '@/types';

/** 줄기 색. 다섯을 돌려 쓴다. 색은 globals.css 토큰으로만 쓴다. */
const LANE = [
  { dot: 'bg-accent', line: 'bg-accent', ring: 'border-accent' },
  { dot: 'bg-success', line: 'bg-success', ring: 'border-success' },
  { dot: 'bg-warn', line: 'bg-warn', ring: 'border-warn' },
  { dot: 'bg-danger', line: 'bg-danger', ring: 'border-danger' },
  { dot: 'bg-info', line: 'bg-info', ring: 'border-info' },
];

interface Row {
  requirementId: string;
  title: string;
  at: string;
  fromStatus: RequirementStatus | null;
  toStatus: RequirementStatus;
  byHuman: boolean;
}

interface Lane {
  requirementId: string;
  firstRow: number;
  lastRow: number;
}

function toRows(requirements: Requirement[]): Row[] {
  return requirements
    .flatMap((requirement) =>
      requirement.history.map((change) => ({
        requirementId: requirement.id,
        title: requirement.title,
        at: change.at,
        fromStatus: change.fromStatus,
        toStatus: change.toStatus,
        byHuman: change.byHuman,
      })),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** 처음 나타난 순서대로 줄기를 배정하고, 각 줄기가 어디서 갈라져 어디서 끝나는지 잡는다. */
function toLanes(rows: Row[]): Lane[] {
  const lanes: Lane[] = [];
  rows.forEach((row, index) => {
    const existing = lanes.find((lane) => lane.requirementId === row.requirementId);
    if (existing) {
      existing.lastRow = index;
      return;
    }
    lanes.push({ requirementId: row.requirementId, firstRow: index, lastRow: index });
  });
  return lanes;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 줄기가 이 줄에서 그리는 세로선 모양.
 * 갈라지는 줄은 점 아래로만, 끝나는 줄은 점 위로만 그린다. 그래야 시작과 끝이 보인다.
 */
function verticalShape(lane: Lane, index: number): string | null {
  if (index < lane.firstRow || index > lane.lastRow) return null;
  if (lane.firstRow === lane.lastRow) return null;
  if (index === lane.firstRow) return 'top-[15px] bottom-0';
  if (index === lane.lastRow) return 'top-0 h-[15px]';
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

  const lanes = toLanes(rows);
  const unconfirmed = rows.filter((row) => !row.byHuman).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-ink-muted">
          요구사항 {lanes.length}건 · 변화 {rows.length}건
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="size-3 rounded-full bg-ink-faint" />
          사람 확정
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="size-3 rounded-full border-2 border-ink-faint bg-surface" />
          AI 감지
        </span>
      </div>

      {unconfirmed >= 3 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-md border border-line bg-warn-soft p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-sm text-ink">
            AI가 감지한 변화 <span className="font-semibold">{unconfirmed}건</span>이 아직 사람
            확인을 거치지 않았습니다.
          </p>
        </div>
      )}

      <ol className="flex flex-col">
        {rows.map((row, index) => {
          const laneIndex = lanes.findIndex((lane) => lane.requirementId === row.requirementId);
          const style = LANE[laneIndex % LANE.length];
          const branching = lanes[laneIndex].firstRow === index;

          return (
            <li key={`${row.requirementId}-${row.at}`} className="flex items-stretch">
              {/* 프로젝트 시간축. 모든 가지가 여기서 갈라져 나온다. */}
              <span className="relative w-[26px] shrink-0">
                <span
                  className={`absolute left-1/2 top-0 w-0.5 -translate-x-1/2 bg-line ${
                    index === rows.length - 1 ? 'h-[15px]' : 'bottom-0'
                  }`}
                />
                {branching && (
                  <span
                    className={`absolute left-1/2 right-0 top-[14px] h-0.5 ${style.line}`}
                  />
                )}
              </span>

              {lanes.map((lane, cellIndex) => {
                const cellStyle = LANE[cellIndex % LANE.length];
                const shape = verticalShape(lane, index);
                const isNode = lane.requirementId === row.requirementId;
                // 가지가 시간축에서 자기 줄기까지 건너오는 가로선.
                const crossing = branching && cellIndex < laneIndex;

                return (
                  <span key={lane.requirementId} className="relative w-[26px] shrink-0">
                    {shape !== null && (
                      <span
                        className={`absolute left-1/2 w-0.5 -translate-x-1/2 ${shape} ${cellStyle.line}`}
                      />
                    )}
                    {crossing && (
                      <span className={`absolute inset-x-0 top-[14px] h-0.5 ${style.line}`} />
                    )}
                    {branching && isNode && (
                      <span className={`absolute left-0 right-1/2 top-[14px] h-0.5 ${style.line}`} />
                    )}
                    {isNode && (
                      <span
                        className={`absolute left-1/2 top-2 size-3 -translate-x-1/2 rounded-full ${
                          row.byHuman ? style.dot : `border-2 bg-surface ${style.ring}`
                        }`}
                      />
                    )}
                  </span>
                );
              })}

              <div className="min-w-0 flex-1 pb-6 pl-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-ink">{row.title}</p>
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {formatDate(row.at)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {row.fromStatus ?? '새로 발견'} <span className="text-ink-faint">→</span>{' '}
                  <span className="font-medium text-ink">{row.toStatus}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

