'use client';

// 답변 초안. 사람이 판단을 마친 뒤에 보인다.
// 어조를 바꾸거나 직접 고칠 수 있고, 보내는 것도 사람이 누를 때만 일어난다.

import { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/Button';
import { fillDraft, formatDateTime } from '@/lib/format';
import { TONES, type DecisionField, type Tone } from '@/types';

const TONE_LABEL: Record<Tone, string> = {
  base: '기본',
  friendly: '조금 더 친절하게',
  short: '짧게',
  firm: '단호하게',
};

const REGENERATE_MS = 450;

export function ReplyDraft({
  drafts,
  fields,
  values,
  editedText,
  sentAt,
  onEdit,
  onSend,
}: {
  drafts: Record<Tone, string>;
  fields: DecisionField[];
  values: Record<string, string>;
  /** 사람이 고쳐 쓴 본문. null이면 초안 그대로다. */
  editedText: string | null;
  sentAt: string | null;
  onEdit: (text: string | null) => void;
  onSend: () => void;
}) {
  const [tone, setTone] = useState<Tone>('base');
  const [regenerating, setRegenerating] = useState(false);

  const generated = fillDraft(drafts[tone], fields, values);
  const text = editedText ?? generated;
  const undecided = fields.some((f) => (values[f.id] ?? '') === '');

  useEffect(() => {
    if (!regenerating) return;
    const t = setTimeout(() => setRegenerating(false), REGENERATE_MS);
    return () => clearTimeout(t);
  }, [regenerating]);

  const regenerate = (nextTone: Tone) => {
    setTone(nextTone);
    onEdit(null); // 다시 만들면 사람이 고친 내용은 초안으로 되돌아간다
    setRegenerating(true);
  };

  if (sentAt !== null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm text-success">
          <Send className="size-4" />
          {formatDateTime(sentAt)}에 보냈습니다
        </div>
        <p className="mt-3 whitespace-pre-wrap border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-muted">
          {text}
        </p>
        <p className="mt-3 text-xs text-ink-faint">고객 회신을 기다리는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-paper p-1">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => regenerate(t)}
              className={`rounded-md px-2.5 py-1 text-xs transition-all ${
                tone === t ? 'bg-surface font-medium text-ink shadow-pop' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {TONE_LABEL[t]}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => regenerate(tone)}>
          <RefreshCw className="size-3.5" />
          다시 생성
        </Button>
      </div>

      {regenerating ? (
        <div className="mt-3 flex h-52 flex-col justify-center gap-2 rounded-md border border-line px-3">
          <span className="flex items-center gap-2 text-xs text-ink-faint">
            <LoaderCircle className="size-3.5 animate-spin text-accent" />
            초안을 다시 쓰는 중…
          </span>
          <span className="skeleton-bar h-3 w-4/5" />
          <span className="skeleton-bar h-3 w-3/5" />
          <span className="skeleton-bar h-3 w-2/3" />
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => onEdit(e.target.value)}
          rows={12}
          className="mt-3 w-full resize-none rounded-md border border-line bg-surface p-3.5 text-sm leading-relaxed outline-none focus:border-accent"
        />
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          {undecided
            ? '아직 정하지 않은 값이 (  ) 로 남아 있습니다. 위에서 채우면 문장에 들어갑니다.'
            : '보내기 전에 직접 고칠 수 있습니다.'}
        </p>
        <Button variant="primary" onClick={onSend} disabled={regenerating}>
          <Send className="size-4" />
          답변 보내기
        </Button>
      </div>
    </div>
  );
}
