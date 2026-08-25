'use client';

// 워크스페이스 우측. 고른 요구사항 하나를 놓고
// 근거 → 확인 질문 → 답변 초안 순으로 보여준다.
//
// 목 화면(AnalysisPanel)이 잡아둔 구조를 실제 데이터로 옮긴 것이다.
// 다른 점은 하나다. 확인 질문과 초안 문구를 화면이 만들지 않고 백엔드가 만든다.

import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { post } from '@/lib/api-client';
import { Button } from './Button';
import { ClarificationList, type EditableQuestion } from './ClarificationList';
import { RequirementStatusBadge } from './StatusBadges';
import { ResponseComposer } from './ResponseComposer';
import type { ClarificationResult, ReplyDraftResult, Requirement, Tone } from '@/types';

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
}: {
  projectId: string;
  requirement: Requirement;
}) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>('professional');
  const [draftLoading, setDraftLoading] = useState(false);
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

  const generate = useCallback(
    async (nextTone: Tone) => {
      setTone(nextTone);
      setDraftLoading(true);
      setMessage(null);

      const res = await post<ReplyDraftResult>(`${base}/reply`, {
        tone: nextTone,
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

      <Section title="고객에게 보낼 답변">
        {draft === null && !draftLoading ? (
          <Button
            variant="primary"
            onClick={() => generate(tone)}
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
            onToneChange={generate}
            loading={draftLoading}
          />
        )}
      </Section>
    </div>
  );
}
