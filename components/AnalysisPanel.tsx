'use client';

// 워크스페이스 우측. 선택한 요청을 프로젝트 맥락과 비교한 AI 분석.
// 요약 → 판단 → 근거(문서 강조) → 확인 질문 → 답변 초안 순으로 구조화해 보여준다.

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { VerdictBadge } from '@/components/StatusBadges';
import { ClarificationList, type EditableQuestion } from '@/components/ClarificationList';
import { ResponseComposer } from '@/components/ResponseComposer';
import type { ClientRequest } from '@/types';

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

export function AnalysisPanel({
  request,
  activeDocId,
  onHighlightDoc,
}: {
  request: ClientRequest;
  activeDocId: string | null;
  onHighlightDoc: (docId: string | null) => void;
}) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [generated, setGenerated] = useState(false);

  // 요청이 바뀌면 질문·답변 상태를 초기화한다.
  useEffect(() => {
    setQuestions(
      request.analysis.questions.map((q) => ({
        id: q.id,
        text: q.text,
        selected: q.defaultSelected,
      })),
    );
    setGenerated(false);
    onHighlightDoc(null);
  }, [request, onHighlightDoc]);

  const selectedTexts = questions.filter((q) => q.selected).map((q) => q.text);

  return (
    <div className="flex h-full flex-col gap-6">
      <Section title="요청 원문">
        <div className="rounded-md border border-line bg-paper p-3">
          <p className="text-sm font-medium">{request.subject}</p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
            {request.body}
          </p>
        </div>
      </Section>

      <Section title="요청 요약">
        <ul className="flex flex-col gap-1.5">
          {request.analysis.summary.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-ink-faint">·</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="AI 판단">
        <VerdictBadge verdict={request.analysis.verdict} />
        <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          왜 이렇게 봤나요?
        </p>
        <ul className="flex flex-col gap-1.5">
          {request.analysis.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-ink-faint">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {request.analysis.evidence.length > 0 && (
        <Section title="근거 문서">
          <p className="mb-2 text-xs text-ink-faint">누르면 왼쪽에서 해당 문서가 강조됩니다.</p>
          <div className="flex flex-col gap-2">
            {request.analysis.evidence.map((ev) => {
              const on = ev.sourceDocId === activeDocId;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onHighlightDoc(on ? null : ev.sourceDocId)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-paper'
                  }`}
                >
                  <p className="text-xs font-medium text-ink-muted">{ev.sourceLabel}</p>
                  <p className="mt-1 border-l-2 border-line pl-2.5 text-sm italic leading-snug">
                    “{ev.quote}”
                  </p>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="답변 전 확인할 것">
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
      </Section>

      <Section title="고객에게 보낼 답변">
        {generated ? (
          <ResponseComposer questions={selectedTexts} />
        ) : (
          <Button variant="primary" onClick={() => setGenerated(true)} className="w-full">
            <Sparkles className="size-4" />
            답변 초안 생성
          </Button>
        )}
      </Section>
    </div>
  );
}
