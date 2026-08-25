'use client';

// 고객에게 되물을 확인 질문 목록. 체크로 고르고, 필요 없으면 지우고, 직접 추가한다.
// 상태는 상위(RequirementAnalysisPanel)가 소유하고 여기서는 표시와 조작만 한다.

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface EditableQuestion {
  id: string;
  text: string;
  selected: boolean;
}

export function ClarificationList({
  questions,
  onToggle,
  onRemove,
  onAdd,
}: {
  questions: EditableQuestion[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      {questions.map((q) => (
        <div key={q.id} className="group flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={q.selected}
            onChange={() => onToggle(q.id)}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          <span className="flex-1 text-sm leading-snug">{q.text}</span>
          <button
            type="button"
            onClick={() => onRemove(q.id)}
            aria-label="질문 삭제"
            className="shrink-0 rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="직접 질문 추가"
          className="flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-ink-faint"
        />
        <button
          type="button"
          onClick={add}
          aria-label="질문 추가"
          className="rounded-md border border-line p-1.5 text-ink-muted hover:bg-paper"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
