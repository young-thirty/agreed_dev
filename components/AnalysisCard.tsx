// AI 요구 분석. 메시지마다 필요한 항목만 들어오므로 여기서는 들어온 것만 그린다.
// 확정하지 못한 것은 '판단 보류'·'확인 필요'로 들어와 caution으로 표시된다.

import { CircleAlert } from 'lucide-react';
import type { AnalysisField, Intent } from '@/types';

export function AnalysisCard({
  headline,
  reason,
  intents,
  fields,
  missingInfo,
}: {
  headline: string;
  /** 그렇게 판단한 이유. 없으면 자리를 만들지 않는다. */
  reason: string;
  intents: Intent[];
  fields: AnalysisField[];
  missingInfo: string[];
}) {
  return (
    <div className="rounded-lg bg-surface shadow-card">
      <div className="p-5">
        <p className="text-[15px] font-medium leading-relaxed text-ink">{headline}</p>
        {reason !== '' && (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{reason}</p>
        )}
      </div>

      {intents.length > 0 && (
        <div className="border-t border-line p-5">
          <p className="text-xs text-ink-faint">
            한 메시지에서 {intents.length}개의 요청을 찾았습니다
          </p>
          <ol className="mt-3 flex flex-col gap-2.5">
            {intents.map((intent, i) => (
              <li key={intent.text} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-[11px] font-semibold text-ink-muted">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-ink-faint">{intent.kind}</p>
                  <p className="text-sm text-ink">{intent.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <dl className="grid grid-cols-[92px_1fr] gap-x-5 gap-y-3.5 border-t border-line p-5">
        {fields.map((field) => (
          <FieldRow key={field.label} field={field} />
        ))}
      </dl>

      {missingInfo.length > 0 && (
        <div className="border-t border-line p-5">
          <div className="rounded-md bg-warn-soft p-3.5">
            <p className="text-xs font-semibold text-warn">추가로 필요한 정보</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {missingInfo.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink">
                  <span className="text-warn">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ field }: { field: AnalysisField }) {
  const caution = field.tone === 'caution';
  return (
    <>
      <dt className={`pt-px text-xs ${caution ? 'text-warn' : 'text-ink-faint'}`}>{field.label}</dt>
      <dd className="min-w-0 text-sm leading-relaxed text-ink">
        {field.value !== undefined && (
          <p className="flex gap-1.5">
            {caution && <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />}
            <span>{field.value}</span>
          </p>
        )}
        {field.items !== undefined && (
          <ul className="flex flex-col gap-1">
            {field.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className={caution ? 'text-warn' : 'text-ink-faint'}>·</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </>
  );
}
