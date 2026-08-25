// GitHub에서 확인한 개발 현황. 대시보드가 아니라, 이 메시지에 답하는 데 필요한 만큼만 보여준다.

import { Circle, CircleCheck, Clock, GitPullRequest } from 'lucide-react';
import type { DevContext, DevState } from '@/types';

const STATE_ICON: Record<DevState, { Icon: typeof Circle; className: string }> = {
  done: { Icon: CircleCheck, className: 'text-success' },
  progress: { Icon: Clock, className: 'text-warn' },
  todo: { Icon: Circle, className: 'text-ink-faint' },
};

export function DevContextCard({ dev, repo }: { dev: DevContext; repo: string | null }) {
  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">개발 현황 · {dev.subject}</h3>
        {repo !== null && <span className="font-mono text-xs text-ink-faint">{repo}</span>}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {dev.items.map((item) => {
          const { Icon, className } = STATE_ICON[item.state];
          return (
            <li key={item.text} className="flex items-center gap-2.5 text-sm">
              <Icon className={`size-4 shrink-0 ${className}`} />
              <span className={item.state === 'todo' ? 'text-ink-muted' : 'text-ink'}>
                {item.text}
              </span>
            </li>
          );
        })}
      </ul>

      {dev.relatedWork.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs text-ink-faint">관련 작업</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {dev.relatedWork.map((work) => (
              <li key={work.title} className="flex items-center gap-2 text-sm">
                <GitPullRequest className="size-3.5 shrink-0 text-ink-faint" />
                <span className="text-ink">{work.title}</span>
                <span className="text-xs text-ink-faint">{work.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dev.impactAreas.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs text-ink-faint">영향 가능 영역</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dev.impactAreas.map((area) => (
              <span
                key={area}
                className="rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-xs text-ink-muted"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
