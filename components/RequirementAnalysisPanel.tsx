'use client';

// 워크스페이스 우측. 고른 요구사항 하나를 놓고
// 근거 → 확인 질문 → 답변 초안 순으로 보여준다.
//
// 목 화면(AnalysisPanel)이 잡아둔 구조를 실제 데이터로 옮긴 것이다.
// 다른 점은 하나다. 확인 질문과 초안 문구를 화면이 만들지 않고 백엔드가 만든다.

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
  ReplyDraftResult,
  Requirement,
  RequirementStatus,
  Tone,
} from '@/types';

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

  const base = `/api/projects/${projectId}/requirements/${requirement.id}`;

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

  async function confirm() {
    if (pending === null) return;
    setConfirming(true);
    setMessage(null);

    const res = await post<Requirement>(`${base}/transition`, { to: pending });
    setConfirming(false);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    onConfirmed();
  }

  /** 초안은 말투와 '확정'에서 고른 상태를 함께 보고 만들어진다. */
  const generate = useCallback(
    async (nextTone: Tone, nextIntent: RequirementStatus | null) => {
      setTone(nextTone);
      setDraftLoading(true);
      setMessage(null);

      const res = await post<ReplyDraftResult>(`${base}/reply`, {
        tone: nextTone,
        intent: nextIntent,
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

      <Section title="확정">
        <p className="mb-2 text-xs text-ink-faint">
          고른 상태로 저장되고 요구사항 타임라인에 남습니다. 무엇으로 확정할지는 사람이 정합니다.
        </p>
        {allowed === null ? (
          <p className="text-xs text-ink-faint">고를 수 있는 상태를 확인하는 중…</p>
        ) : allowed.length === 0 ? (
          <p className="text-xs text-ink-faint">더 이상 바꿀 수 있는 상태가 없습니다.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {allowed.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setPending(status);
                    // 이미 만든 초안이 있으면 새 결정에 맞춰 다시 쓴다.
                    if (draft !== null) generate(tone, status);
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
            <Button
              variant="primary"
              onClick={confirm}
              disabled={pending === null || confirming}
              className="mt-2 w-full"
            >
              <Check className="size-4" />
              {confirming
                ? '저장하는 중…'
                : pending === null
                  ? '상태를 고르세요'
                  : `‘${pending}’(으)로 확정`}
            </Button>
          </>
        )}
      </Section>

      <Section title="고객에게 보낼 답변">
        <p className="mb-2 text-xs text-ink-faint">
          위에서 고른 상태에 맞춰 씁니다. 고르지 않으면 확인 후 회신하겠다는 답이 나옵니다.
        </p>
        {draft === null && !draftLoading ? (
          <Button
            variant="primary"
            onClick={() => generate(tone, pending)}
            disabled={questionsLoading}
            className="w-full"
          >
            <Sparkles className="size-4" />
            답변 초안 생성
          </Button>
        ) : (
          <ResponseComposer
            draft={draft ?? ''}
            tone={tone}
            onToneChange={(nextTone) => generate(nextTone, pending)}
            loading={draftLoading}
          />
        )}
      </Section>
    </div>
  );
}
