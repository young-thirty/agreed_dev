'use client';

// 고객에게 보낼 답변 초안. 말투를 바꾸면 백엔드가 다시 만들고, 직접 편집할 수 있다.
// 말투를 바꾸면 사용자가 편집한 내용은 새 초안으로 되돌아간다(의도된 동작).
//
// 보내지는 않는다. 사람이 읽고 고쳐서 직접 보낸다.

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/Button';
import { TONE_OPTIONS } from '@/lib/reply';
import type { Tone } from '@/types';

export function ResponseComposer({
  draft,
  tone,
  onToneChange,
  loading,
}: {
  draft: string;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  loading: boolean;
}) {
  const [text, setText] = useState(draft);
  const [copied, setCopied] = useState(false);

  useEffect(() => setText(draft), [draft]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드를 못 쓰는 환경이면 조용히 넘어간다. 사용자는 직접 선택해 복사할 수 있다.
    }
  };

  return (
    <div>
      <div className="mb-2 inline-flex flex-wrap gap-1 rounded-lg bg-paper p-1">
        {TONE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={loading}
            onClick={() => onToneChange(opt.value)}
            className={`rounded-md px-2.5 py-1 text-xs transition-all disabled:opacity-50 ${
              tone === opt.value
                ? 'bg-surface font-medium text-ink shadow-pop'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={loading ? '초안을 만드는 중…' : text}
        onChange={(e) => setText(e.target.value)}
        readOnly={loading}
        rows={12}
        className="w-full resize-none rounded-md border border-line bg-surface p-3 text-sm leading-relaxed outline-none focus:border-ink-faint"
      />

      <div className="mt-2 flex justify-end">
        <Button variant="primary" size="sm" onClick={copy} disabled={loading}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>
    </div>
  );
}
