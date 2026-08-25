'use client';

// 사람이 판단하는 영역. AI 분석과 시각적으로 분리돼 있어야 한다.
//
// 티켓은 메시지가 들어올 때 이미 만들어져 있다. 여기서 사람이 정하는 것은
// 이 요구를 티켓에 반영할지, 별도 티켓으로 분리할지, 반영하지 않을지다.
// 요구사항 확정과 상태 변경은 사람만 한다.

import { useState } from 'react';
import Link from 'next/link';
import { Ban, Check, Link2, ListChecks, LoaderCircle, Plus, Undo2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { TicketStatusBadge } from '@/components/StatusBadges';
import { getChecklist } from '@/lib/api';
import type { Analysis, Handling, InboundDecision, Ticket } from '@/types';

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent';

export function DecisionPanel({
  analysis,
  decision,
  relatedTicket,
  currentTicket,
  splitTicket,
  selectedItems,
  onToggleItem,
  onChoose,
  onClear,
  onValueChange,
}: {
  analysis: Analysis;
  decision: InboundDecision;
  /** AI가 함께 본 다른 티켓. 참고용이다. */
  relatedTicket: Ticket | null;
  /** 이 메시지가 붙어 있는 티켓. */
  currentTicket: Ticket;
  /** 분리를 골라 새로 만들어진 티켓. */
  splitTicket: Ticket | null;
  /** 답변에 반영하려고 고른 확인 항목. */
  selectedItems: string[];
  onToggleItem: (text: string) => void;
  onChoose: (handling: Handling) => void;
  onClear: () => void;
  onValueChange: (fieldId: string, value: string) => void;
}) {
  const chosen = decision.handling;
  const [items, setItems] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadChecklist() {
    setLoading(true);
    setMessage(null);
    const res = await getChecklist(currentTicket.ticketId);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setItems(res.data.items);
  }

  const resultLabel = (handling: Handling): string => {
    if (handling === 'ignore') return '티켓 내용은 그대로 두고 답변만 보냅니다';
    if (handling === 'create') return '별도 티켓으로 분리했습니다';
    return '이 티켓의 변경으로 반영합니다';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-surface p-5 shadow-card">
        {chosen === null ? (
          <>
            <p className="text-sm font-medium text-ink">이 요구를 티켓에 반영할까요?</p>

            <div className="mt-3 flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-2.5">
              <span className="whitespace-nowrap font-mono text-xs text-ink-faint">
                {currentTicket.ticketId}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{currentTicket.title}</span>
              <TicketStatusBadge status={currentTicket.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onChoose('link')}>
                <Link2 className="size-4" />이 티켓에 반영
              </Button>
              <Button onClick={() => onChoose('create')} disabled={analysis.ticketProposal === null}>
                <Plus className="size-4" />별도 티켓으로 분리
              </Button>
              <Button variant="ghost" onClick={() => onChoose('ignore')}>
                <Ban className="size-4" />
                반영하지 않음
              </Button>
            </div>

            <p className="mt-3 text-xs text-ink-faint">
              {relatedTicket !== null && relatedTicket.ticketId !== currentTicket.ticketId
                ? `AI는 ${relatedTicket.ticketId} ${relatedTicket.title}도 함께 봤습니다. `
                : ''}
              요구사항 확정과 상태 변경은 사람만 합니다. 누르기 전에는 아무것도 바뀌지 않습니다.
            </p>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{resultLabel(chosen)}</p>
              {splitTicket !== null && (
                <Link
                  href={`/tickets/${splitTicket.ticketId}`}
                  className="mt-1 inline-flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <span className="whitespace-nowrap font-mono text-xs">
                    {splitTicket.ticketId}
                  </span>
                  {splitTicket.title}
                </Link>
              )}
            </div>
            {decision.sentAt === null && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <Undo2 className="size-3.5" />
                되돌리기
              </Button>
            )}
          </div>
        )}
      </div>

      {chosen !== null && decision.sentAt === null && (
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-ink">답변 전에 확인할 것</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            AI가 짚어 준 것 중 고른 항목만 답변 초안에 반영됩니다.
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
      )}

      {chosen !== null && analysis.decisionFields.length > 0 && (
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-ink">결정이 필요합니다</p>
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
                  disabled={decision.sentAt !== null}
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
