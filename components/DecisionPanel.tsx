'use client';

// 사람이 정하는 영역. AI 분석과 시각적으로 분리돼 있어야 한다.
//
// 티켓에 반영할지 말지는 묻지 않는다. 인바운드가 작업 단위로 들어온 순간 이미 티켓이다.
// 여기서 정하는 것은 답변에 무엇을 담을지, 그리고 AI가 정할 수 없는 값이다.

import { useState } from 'react';
import { ListChecks, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { getChecklist } from '@/lib/api';
import type { Analysis, InboundDecision } from '@/types';

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent';

export function DecisionPanel({
  ticketId,
  analysis,
  decision,
  selectedItems,
  onToggleItem,
  onValueChange,
}: {
  ticketId: string;
  analysis: Analysis;
  decision: InboundDecision;
  /** 답변에 반영하려고 고른 확인 항목. */
  selectedItems: string[];
  onToggleItem: (text: string) => void;
  onValueChange: (fieldId: string, value: string) => void;
}) {
  const [items, setItems] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const locked = decision.sentAt !== null;

  async function loadChecklist() {
    setLoading(true);
    setMessage(null);
    const res = await getChecklist(ticketId);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setItems(res.data.items);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <p className="text-sm font-medium text-ink">답변 전에 확인할 것</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          고른 항목만 답변 초안에 들어갑니다. 아직 모르는 것은 고객에게 되물을 수 있습니다.
        </p>

        {items === null ? (
          <Button variant="outline" onClick={loadChecklist} disabled={loading} className="mt-3">
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ListChecks className="size-4" />
            )}
            {loading ? '확인 항목을 만드는 중…' : '확인 항목 만들기'}
          </Button>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">따로 확인할 항목이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={item}>
                <label className="flex items-start gap-2.5 text-sm leading-snug text-ink">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => onToggleItem(item)}
                    disabled={locked}
                    className="mt-0.5 size-4 shrink-0 accent-accent"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {message !== null && (
          <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
            {message}
          </p>
        )}
      </div>

      {analysis.decisionFields.length > 0 && (
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-ink">사람이 정해야 합니다</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            AI가 정할 수 없는 값입니다. 여기 넣은 값이 아래 답변 초안에 그대로 들어갑니다.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {analysis.decisionFields.map((field) => (
              <label key={field.id} className="flex flex-col gap-1.5 text-xs text-ink-muted">
                {field.label}
                <input
                  type={field.type === 'money' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={decision.values[field.id] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => onValueChange(field.id, e.target.value)}
                  disabled={locked}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
