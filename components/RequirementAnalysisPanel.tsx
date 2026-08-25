'use client';

// 워크스페이스 우측. 고른 요구사항 하나를 놓고
// 근거 → 확인 질문 → 답변 초안 → 확정 순으로 이어진다.
//
// 순서가 중요하다. 초안을 먼저 보고 나서 확정한다. 무엇을 보낼지 읽어보지도
// 않고 상태부터 확정하면, 사람이 판단한다는 원칙이 이름만 남는다.

import { useCallback, useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { get, post } from '@/lib/api-client';
import { Button } from './Button';
import { ClarificationList, type EditableQuestion } from './ClarificationList';
import { RequirementStatusBadge } from './StatusBadges';
import { ResponseComposer } from './ResponseComposer';
import type {
  AllowedTransitions,
  ClarificationResult,
  Decision,
  ReplyDraftResult,
  Requirement,
  RequirementStatus,
  Tone,
} from '@/types';

/** 금액과 납기를 함께 정하는 상태. 나머지는 상태만 바꾼다. */
const NEEDS_DECISION: RequirementStatus[] = ['제안', '합의'];

const inputClass =
  'rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-ink-faint';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function RequirementAnalysisPanel({
  projectId,
  requirement,
  onConfirmed,
}: {
  projectId: string;
  requirement: Requirement;
  /** 상태를 확정한 뒤 목록을 다시 읽게 한다. 타임라인에도 그때 반영된다. */
  onConfirmed: () => void;
}) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>('professional');
  const [draftLoading, setDraftLoading] = useState(false);
  // null이면 아직 못 받아온 것이다. 빈 배열(정말 갈 곳이 없음)과 구분한다.
  const [allowed, setAllowed] = useState<RequirementStatus[] | null>(null);
  const [pending, setPending] = useState<RequirementStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // AI가 대화 근거로 채워본 값이 있으면 출발점으로 쓴다. 확정은 사람이 한다.
  const suggested = requirement.decision ?? requirement.aiProposedDecision;
  const [amountDelta, setAmountDelta] = useState(
    suggested === null ? '' : String(suggested.amountDelta),
  );
  const [dueDate, setDueDate] = useState(suggested?.dueDate ?? '');
  const [note, setNote] = useState(suggested?.note ?? '');

  const base = `/api/projects/${projectId}/requirements/${requirement.id}`;
  const needsDecision = pending !== null && NEEDS_DECISION.includes(pending);

  /** 화면에 채워진 금액·납기. 납기가 비어 있으면 넘기지 않는다. */
  const currentDecision = (): Decision | null => {
    if (!needsDecision || dueDate === '') return null;
    return {
      amountDelta: amountDelta === '' ? 0 : Number(amountDelta),
      dueDate,
      note: note === '' ? null : note,
    };
  };

  // 요구사항이 바뀌면 확인 질문을 새로 받아온다. 초안은 사람이 누를 때 만든다.
  useEffect(() => {
    let cancelled = false;
    setQuestions([]);
    setDraft(null);
    setMessage(null);
    setQuestionsLoading(true);

    post<ClarificationResult>(`${base}/questions`, {}).then((res) => {
      if (cancelled) return;
      setQuestionsLoading(false);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setQuestions(
        res.data.questions.map((text, order) => ({
          id: `q-${order}`,
          text,
          selected: true,
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [base]);

  // 지금 상태에서 갈 수 있는 곳만 보여준다. 못 가는 상태를 고르게 두면 저장에서 막힌다.
  useEffect(() => {
    let cancelled = false;
    setPending(null);
    setAllowed(null);
    get<AllowedTransitions>(`${base}/allowed`).then((res) => {
      if (!cancelled && res.ok) setAllowed(res.data.allowed);
    });
    return () => {
      cancelled = true;
    };
  }, [base, requirement.status]);

  /** 초안은 말투와 고른 방향, 채운 금액·납기를 함께 보고 만들어진다. */
  const generate = useCallback(
    async (nextTone: Tone, nextIntent: RequirementStatus | null, decision: Decision | null) => {
      setTone(nextTone);
      setDraftLoading(true);
      setMessage(null);

      const res = await post<ReplyDraftResult>(`${base}/reply`, {
        tone: nextTone,
        intent: nextIntent,
        decision,
        questions: questions.filter((q) => q.selected).map((q) => q.text),
      });
      setDraftLoading(false);

      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setDraft(res.data.draft);
    },
    [base, questions],
  );

  async function confirm() {
    if (pending === null) return;
    setConfirming(true);
    setMessage(null);

    const res = await post<Requirement>(`${base}/transition`, {
      to: pending,
      decision: currentDecision(),
    });
    setConfirming(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    onConfirmed();
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <Section title="요구사항">
        <div className="flex items-start gap-2">
          <RequirementStatusBadge status={requirement.status} />
          <p className="text-sm font-medium leading-relaxed text-ink">{requirement.title}</p>
        </div>
      </Section>

      <Section title="근거">
        <p className="mb-2 text-xs text-ink-faint">
          고객이 실제로 한 말입니다. 원문에 있는 문장만 남습니다.
        </p>
        <div className="flex flex-col gap-2">
          {requirement.evidence.map((evidence, order) => (
            <p
              key={order}
              className="border-l-2 border-line pl-2.5 text-sm italic leading-snug text-ink-muted"
            >
              “{evidence.quote}”
            </p>
          ))}
        </div>
      </Section>

      {message !== null && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
          {message}
        </p>
      )}

      <Section title="답변 전 확인할 것">
        {questionsLoading ? (
          <p className="text-xs text-ink-faint">확인 질문을 만드는 중…</p>
        ) : (
          <ClarificationList
            questions={questions}
            onToggle={(id) =>
              setQuestions((prev) =>
                prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)),
              )
            }
            onRemove={(id) => setQuestions((prev) => prev.filter((q) => q.id !== id))}
            onAdd={(text) =>
              setQuestions((prev) => [
                ...prev,
                { id: `custom-${Date.now()}`, text, selected: true },
              ])
            }
          />
        )}
      </Section>

      <Section title="고객에게 보낼 답변">
        <p className="mb-2 text-xs text-ink-faint">
          어떻게 답할지 고르면 그 방향으로 씁니다. 고르지 않으면 확인 후 회신하겠다는 답이
          나옵니다.
        </p>

        {allowed === null ? (
          <p className="text-xs text-ink-faint">고를 수 있는 방향을 확인하는 중…</p>
        ) : allowed.length === 0 ? (
          <p className="text-xs text-ink-faint">더 이상 바꿀 수 있는 상태가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allowed.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPending(status);
                  // 이미 만든 초안이 있으면 새 방향에 맞춰 다시 쓴다.
                  if (draft !== null) generate(tone, status, currentDecision());
                }}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  pending === status
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}

        {needsDecision && (
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-line bg-paper p-3">
            <p className="text-xs text-ink-faint">
              ‘{pending}’은 금액과 납기를 함께 정합니다. 여기 넣은 값이 초안 문장에도
              들어갑니다.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                금액 변동 (원)
                <input
                  type="number"
                  value={amountDelta}
                  onChange={(e) => setAmountDelta(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                납기
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 (선택)"
              className={inputClass}
            />
          </div>
        )}

        <Button
          variant="primary"
          onClick={() => generate(tone, pending, currentDecision())}
          disabled={draftLoading || questionsLoading}
          className="mt-3 w-full"
        >
          <Sparkles className="size-4" />
          {draftLoading ? '초안을 만드는 중…' : draft === null ? '답변 초안 생성' : '초안 다시 만들기'}
        </Button>

        {draft !== null && (
          <div className="mt-3">
            <ResponseComposer
              draft={draft}
              tone={tone}
              onToneChange={(nextTone) => generate(nextTone, pending, currentDecision())}
              loading={draftLoading}
            />
          </div>
        )}
      </Section>

      <Section title="확정">
        <p className="mb-2 text-xs text-ink-faint">
          고른 상태로 저장되고 요구사항 타임라인에 남습니다. 무엇으로 확정할지는 사람이 정합니다.
        </p>
        {draft === null ? (
          <p className="text-xs text-ink-faint">
            먼저 답변 초안을 만들어, 무엇을 보내게 되는지 확인해 주세요.
          </p>
        ) : (
          <Button
            variant="primary"
            onClick={confirm}
            disabled={pending === null || confirming}
            className="w-full"
          >
            <Check className="size-4" />
            {confirming
              ? '저장하는 중…'
              : pending === null
                ? '어떻게 답할지 먼저 고르세요'
                : `‘${pending}’(으)로 확정`}
          </Button>
        )}
      </Section>
    </div>
  );
}
