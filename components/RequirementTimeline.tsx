'use client';

// 요구사항이 최초 합의 이후 어떻게 변해왔는지 시간순으로 보여준다.
// 확장·변경이 감지되면 상단에 요약 메시지를 띄운다.

import { TrendingUp } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/Badge';
import type { TimelineEvent, TimelineKind } from '@/types';

const KIND: Record<TimelineKind, { label: string; tone: BadgeTone; dot: string }> = {
  agreement: { label: '합의', tone: 'success', dot: 'bg-success' },
  request: { label: '요청', tone: 'info', dot: 'bg-info' },
  change: { label: '변경', tone: 'danger', dot: 'bg-danger' },
};

export function RequirementTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-ink-muted">아직 기록된 요구사항 변화가 없습니다.</p>
    );
  }

  const changeCount = events.filter((e) => e.kind !== 'agreement').length;

  return (
    <div className="mx-auto max-w-2xl">
      {changeCount >= 3 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-line bg-warn-soft p-3.5">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-sm text-ink">
            최초 합의 이후 회원 관리 관련 요구사항이{' '}
            <span className="font-semibold">{changeCount}건</span>에 걸쳐 확장되었습니다.
          </p>
        </div>
      )}

      <ol className="relative flex flex-col gap-6 border-l border-line pl-6">
        {events.map((e) => {
          const k = KIND[e.kind];
          return (
            <li key={e.id} className="relative">
              <span
                className={`absolute -left-[1.85rem] top-1 size-2.5 rounded-full ring-4 ring-paper ${k.dot}`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-faint">{e.date}</span>
                <Badge tone={k.tone}>{k.label}</Badge>
              </div>
              <p className="mt-1 text-sm font-medium">{e.title}</p>
              {e.note && <p className="mt-0.5 text-xs text-ink-muted">{e.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
