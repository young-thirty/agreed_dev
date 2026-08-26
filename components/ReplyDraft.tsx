'use client';

// 답변 초안. 사람이 판단을 마친 뒤에 보인다.
//
// 초안은 서버가 만든다. 서버에는 발송 endpoint가 없으므로 여기서 보내지 않는다 —
// 복사해서 메일·슬랙으로 직접 보내고, 보냈다고 표시만 남긴다.

import { useState } from 'react';
import { Check, Copy, LoaderCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/Button';
import { createReplyDraft, markSent } from '@/lib/api';
import { formatDateTime, won } from '@/lib/format';
import type { ReplyTone } from '@/types/api';
import type { DecisionField } from '@/types';

/**
 * 이 답변으로 무엇을 하려는가. 서버 초안 API에는 이 자리가 없어서,
 * 확인 항목과 같은 방식으로 문장 하나를 얹어 보낸다(아래 valueSentences와 같다).
 */
const STANCES = [
  {
    key: 'ask',
    label: '문의',
    hint: '애매한 부분을 되묻습니다',
    sentence: '아직 확정할 수 없는 부분을 고객에게 되묻는 답변으로 쓴다.',
  },
  {
    key: 'request',
    label: '요청',
    hint: '필요한 것을 요청합니다',
    sentence: '진행에 필요한 것을 고객에게 요청하는 답변으로 쓴다.',
  },
  {
    key: 'decline',
    label: '거절',
    hint: '이번 요청은 어렵다고 답합니다',
    sentence: '이 요청은 받아들이기 어렵다고 정중히 거절하는 답변으로 쓴다.',
  },
] as const;

type Stance = (typeof STANCES)[number]['key'];

/** 화면의 말투 이름과 서버가 받는 값. */
const TONES: { value: ReplyTone; label: string }[] = [
  { value: 'professional', label: '기본' },
  { value: 'friendly', label: '조금 더 친절하게' },
  { value: 'concise', label: '짧게' },
  { value: 'firm', label: '단호하게' },
];

/** 사람이 넣은 값을 서버가 읽을 문장으로 바꾼다. 초안에 이 내용이 반영된다. */
function valueSentences(fields: DecisionField[], values: Record<string, string>): string[] {
  return fields.flatMap((field) => {
    const raw = values[field.id] ?? '';
    if (raw === '') return [];
    if (field.type === 'money' && !Number.isNaN(Number(raw))) {
      return [`${field.label}은 ${won(Number(raw))}이다.`];
    }
    return [`${field.label}은 ${raw}이다.`];
  });
}

export function ReplyDraft({
  ticketId,
  sourceMessageId,
  fields,
  values,
  selectedItems,
  savedReplyText,
  sentAt,
  onSent,
}: {
  ticketId: string;
  /** 어느 고객 메시지에 대한 답인지. 발송 표시가 이걸 기준으로 남는다. */
  sourceMessageId: string;
  fields: DecisionField[];
  values: Record<string, string>;
  /** 답변 전에 확인하기로 고른 항목. */
  selectedItems: string[];
  /** 이미 보낸 답변이 있으면 그 본문. */
  savedReplyText: string | null;
  sentAt: string | null;
  onSent: () => void;
}) {
  const [stance, setStance] = useState<Stance | null>(null);
  const [tone, setTone] = useState<ReplyTone>('professional');
  const [draft, setDraft] = useState<string | null>(savedReplyText);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(nextTone: ReplyTone, nextStance: Stance) {
    setTone(nextTone);
    setStance(nextStance);
    setLoading(true);
    setMessage(null);
    const stanceSentence = STANCES.find((item) => item.key === nextStance)!.sentence;
    const res = await createReplyDraft(ticketId, {
      sourceMessageId,
      // 성격을 먼저 둔다. 서버가 6개까지만 반영하므로 잘려도 이건 남는다.
      selectedItems: [stanceSentence, ...selectedItems, ...valueSentences(fields, values)],
      tone: nextTone,
    });
    setLoading(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setDraft(res.data.body);
  }

  async function send() {
    if (draft === null || draft.trim() === '') return;
    setSending(true);
    setMessage(null);
    const res = await markSent(ticketId, { sourceMessageId, replyText: draft });
    setSending(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    onSent();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드를 못 쓰는 환경이면 조용히 넘어간다. 직접 선택해 복사할 수 있다.
    }
  }

  if (sentAt !== null) {
    return (
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <p className="flex items-center gap-2 text-sm text-success">
          <Send className="size-4" />
          {formatDateTime(sentAt)}에 보냈다고 표시했습니다
        </p>
        {savedReplyText !== null && (
          <p className="mt-3 whitespace-pre-wrap border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-muted">
            {savedReplyText}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-faint">고객 회신을 기다리는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink">이 답변으로 무엇을 하시겠어요?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {STANCES.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={loading}
            onClick={() => generate(tone, option.key)}
            className={`rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
              stance === option.key
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-paper hover:border-ink-faint'
            }`}
          >
            <span
              className={`block text-sm font-medium ${
                stance === option.key ? 'text-accent' : 'text-ink'
              }`}
            >
              {option.label}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-ink-faint">{option.hint}</span>
          </button>
        ))}
      </div>

      {stance !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-faint">말투</span>
          <div className="inline-flex flex-wrap gap-1 rounded-lg bg-paper p-1">
            {TONES.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() => generate(option.value, stance)}
                className={`rounded-md px-2.5 py-1 text-xs transition-all disabled:opacity-50 ${
                  tone === option.value && draft !== null
                    ? 'bg-surface font-medium text-ink shadow-pop'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {draft !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generate(tone, stance)}
              disabled={loading}
            >
              <RefreshCw className="size-3.5" />
              다시 생성
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-3 flex h-44 flex-col justify-center gap-2 rounded-md border border-line px-3">
          <span className="flex items-center gap-2 text-xs text-ink-faint">
            <LoaderCircle className="size-3.5 animate-spin text-accent" />
            초안을 쓰는 중…
          </span>
          <span className="skeleton-bar h-3 w-4/5" />
          <span className="skeleton-bar h-3 w-3/5" />
        </div>
      ) : draft === null ? (
        <div className="mt-3 rounded-md border border-line px-4 py-5">
          <p className="text-sm text-ink-faint">
            위에서 답변의 성격을 고르면, 고른 확인 항목과 정한 값을 반영해 초안을 만듭니다.
          </p>
        </div>
      ) : (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="mt-3 w-full resize-none rounded-md border border-line bg-surface p-3.5 text-sm leading-relaxed outline-none focus:border-accent"
        />
      )}

      {message !== null && (
        <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
          {message}
        </p>
      )}

      {draft !== null && !loading && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-faint">
            메일·슬랙으로는 직접 보냅니다. 여기서 발송하지는 않습니다.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? '복사됨' : '복사'}
            </Button>
            <Button variant="primary" onClick={send} disabled={sending}>
              <Send className="size-4" />
              {sending ? '기록하는 중…' : '보냈다고 표시'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
