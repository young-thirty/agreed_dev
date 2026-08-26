'use client';

// AI가 무엇을 보고 그렇게 판단했는지.
//
// 분석 결과만 있으면 사람은 그 말을 믿을지 말지부터 정해야 한다.
// 어느 문서 몇 줄을 봤는지 원문 그대로 붙여 두면, 판단이 아니라 확인이 된다.

import { useState } from 'react';
import { ChevronDown, FileText, GitBranch, Mail, Ticket } from 'lucide-react';
import type { Evidence } from '@/types';

const SOURCE: Record<Evidence['source'], { icon: typeof FileText; className: string }> = {
  document: { icon: FileText, className: 'text-ink-faint' },
  ticket: { icon: Ticket, className: 'text-accent' },
  github: { icon: GitBranch, className: 'text-ink-faint' },
  message: { icon: Mail, className: 'text-ink-faint' },
};

export function EvidenceList({
  evidence,
  onViewDocument,
}: {
  evidence: Evidence[];
  /** 문서 근거를 눌렀을 때. 없으면 문서도 눌리지 않는다. */
  onViewDocument?: (item: Evidence) => void;
}) {
  const [open, setOpen] = useState(false);

  if (evidence.length === 0) return null;

  return (
    <div className="rounded-lg bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((on) => !on)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink">이렇게 판단한 근거</span>
        <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
          {evidence.length}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-faint">
          {open ? '접기' : '원문 보기'}
          <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* 접혀 있을 때는 어디를 봤는지만 알려준다. 목록이 길어도 화면을 먹지 않는다. */}
      {!open && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {evidence.map((item) => {
            const { icon: Icon, className } = SOURCE[item.source];
            return (
              <span
                key={item.title}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink-muted"
              >
                <Icon className={`size-3 shrink-0 ${className}`} />
                {item.label}
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <ul className="border-t border-line">
          {evidence.map((item) => {
            const { icon: Icon, className } = SOURCE[item.source];
            const clickable = item.source === 'document' && onViewDocument !== undefined;
            const body = (
              <>
                <p className="flex items-center gap-2 text-xs text-ink-faint">
                  <Icon className={`size-3.5 shrink-0 ${className}`} />
                  <span className="font-medium text-ink-muted">{item.label}</span>
                  <span className="min-w-0 truncate">{item.title}</span>
                </p>
                <p className="mt-2 border-l-2 border-line pl-3 text-sm leading-relaxed text-ink">
                  “{item.quote}”
                </p>
                {clickable && (
                  <p className="mt-2 text-xs text-accent">문서에서 원문 위치 보기</p>
                )}
              </>
            );

            return (
              <li key={item.title} className="border-b border-line last:border-b-0">
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onViewDocument?.(item)}
                    className="block w-full px-5 py-3.5 text-left transition-colors hover:bg-paper"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="px-5 py-3.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
