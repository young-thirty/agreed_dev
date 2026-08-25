'use client';

// AI가 왜 그렇게 판단했는지. 기본은 출처 이름만 보여주고, 누르면 인용문이 펼쳐진다.
// 화면을 문서 검색 결과로 도배하지 않기 위한 구성이다.

import { useState } from 'react';
import { ChevronDown, CodeXml, FileText, MessageSquare, Ticket } from 'lucide-react';
import type { Evidence } from '@/types';

const SOURCE_ICON = {
  document: FileText,
  ticket: Ticket,
  github: CodeXml,
  message: MessageSquare,
} as const;

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-lg bg-surface shadow-card">
      {evidence.map((item, i) => {
        const Icon = SOURCE_ICON[item.source];
        const open = openIndex === i;
        return (
          <div key={item.title} className={i === 0 ? '' : 'border-t border-line'}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-paper"
            >
              <Icon className="size-4 shrink-0 text-ink-faint" />
              <span className="w-20 shrink-0 text-xs text-ink-faint">{item.label}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{item.title}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <p className="mx-5 mb-4 border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-muted">
                “{item.quote}”
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
