// 상태·성격을 나타내는 작은 배지. 색은 globals.css 토큰으로만 쓴다.

import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warn' | 'danger' | 'info';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-ink-muted border-line',
  success: 'bg-success-soft text-success border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
};

export function Badge({
  tone = 'neutral',
  children,
  dot = false,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
