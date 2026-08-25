'use client';

// 요구사항이 어떻게 변해왔는지 git 그래프처럼 보여준다.
//
// 맨 왼쪽 세로선이 프로젝트의 시간축이다. 요구사항이 처음 발견되면 거기서
// 가지가 곡선으로 갈라져 나와 자기 줄기를 갖고, 마지막 변화에서 끝난다.
// 한 줄로 늘어놓으면 어느 변화가 같은 요구사항의 것인지 읽히지 않는다.
//
// 그래프는 SVG로 그린다. 곡선과 줄기 위치는 줄 높이에 맞춰 계산해야 해서
// 테두리로는 흉내 낼 수 없다. 색은 globals.css 토큰(stroke-*/fill-*)만 쓴다.
//
// 채운 점은 사람이 확정한 것, 빈 점은 AI가 감지만 한 것이다.

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api-client';
import type { Requirement, RequirementStatus } from '@/types';

const ROW_HEIGHT = 58;
const LANE_GAP = 16;
const TRUNK_X = 9;

/** 줄기 색. 네 가지를 돌려 쓴다. */
const LANE = [
  { stroke: 'stroke-accent', fill: 'fill-accent' },
  { stroke: 'stroke-warn', fill: 'fill-warn' },
  { stroke: 'stroke-success', fill: 'fill-success' },
  { stroke: 'stroke-danger', fill: 'fill-danger' },
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

const laneX = (index: number) => TRUNK_X + LANE_GAP * (index + 1);
const rowY = (index: number) => index * ROW_HEIGHT + ROW_HEIGHT / 2;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const graphWidth = laneX(lanes.length - 1) + 12;
  const graphHeight = rows.length * ROW_HEIGHT;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-ink-muted">
          요구사항 {lanes.length}건 · 변화 {rows.length}건
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="size-2.5 rounded-full bg-ink-faint" />
          사람 확정
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="size-2.5 rounded-full border-2 border-ink-faint bg-surface" />
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

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={graphWidth}
          height={graphHeight}
          aria-hidden
        >
          {/* 프로젝트 시간축 */}
          <path
            d={`M ${TRUNK_X} 0 L ${TRUNK_X} ${rowY(rows.length - 1)}`}
            className="stroke-ink-faint"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />

          {lanes.map((lane, index) => {
            const x = laneX(index);
            const branchY = rowY(lane.firstRow);
            // 시간축에서 갈라져 나오는 곡선. 한 줄 높이의 절반을 써서 부드럽게 넘어간다.
            const forkY = Math.max(0, branchY - ROW_HEIGHT / 2);
            const middleY = (forkY + branchY) / 2;
            const style = LANE[index % LANE.length];

            return (
              <g key={lane.requirementId}>
                <path
                  d={`M ${TRUNK_X} ${forkY} C ${TRUNK_X} ${middleY}, ${x} ${middleY}, ${x} ${branchY}`}
                  className={style.stroke}
                  strokeWidth={2}
                  fill="none"
                />
                {lane.lastRow > lane.firstRow && (
                  <path
                    d={`M ${x} ${branchY} L ${x} ${rowY(lane.lastRow)}`}
                    className={style.stroke}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </g>
            );
          })}

          {rows.map((row, index) => {
            const laneIndex = lanes.findIndex((lane) => lane.requirementId === row.requirementId);
            const style = LANE[laneIndex % LANE.length];
            return row.byHuman ? (
              <circle
                key={`${row.requirementId}-${row.at}`}
                cx={laneX(laneIndex)}
                cy={rowY(index)}
                r={4.5}
                className={style.fill}
              />
            ) : (
              <circle
                key={`${row.requirementId}-${row.at}`}
                cx={laneX(laneIndex)}
                cy={rowY(index)}
                r={4}
                strokeWidth={2}
                className={`${style.stroke} fill-surface`}
              />
            );
          })}
        </svg>

        <ol className="flex flex-col">
          {rows.map((row) => (
            <li
              key={`${row.requirementId}-${row.at}`}
              className="flex flex-col justify-center"
              style={{ height: ROW_HEIGHT, paddingLeft: graphWidth + 8 }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-ink">{row.title}</p>
                <span className="shrink-0 text-[11px] text-ink-faint">{formatDate(row.at)}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {row.fromStatus ?? '새로 발견'} <span className="text-ink-faint">→</span>{' '}
                <span className="font-medium text-ink">{row.toStatus}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

