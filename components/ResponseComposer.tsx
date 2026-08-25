'use client';

// 고객에게 보낼 답변 초안. 톤을 바꾸면 문구가 다시 만들어지고, 직접 편집할 수 있다.
// 톤을 바꾸면 사용자가 편집한 내용은 초안으로 되돌아간다(의도된 동작).

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/Button';
import { generateReply, TONE_OPTIONS } from '@/lib/reply';
import type { Tone } from '@/types';

export function ResponseComposer({ questions }: { questions: string[] }) {
  const [tone, setTone] = useState<Tone>('professional');
  const [copied, setCopied] = useState(false);

  const draft = useMemo(() => generateReply(tone, questions), [tone, questions]);
  const [text, setText] = useState(draft);

  // 톤이나 선택한 질문이 바뀌면 초안을 다시 반영한다.
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
            onClick={() => setTone(opt.value)}
            className={`rounded-md px-2.5 py-1 text-xs transition-all ${
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full resize-none rounded-md border border-line bg-surface p-3 text-sm leading-relaxed outline-none focus:border-ink-faint"
      />

      <div className="mt-2 flex justify-end">
        <Button variant="primary" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>
    </div>
  );
}
