'use client';

// 티켓에 새로 붙은 고객 메시지 하나를 처리하는 흐름.
//
//   1 고객 메시지 → 2 AI 분석 → 3 내 판단 → 4 답변 초안
//
// AI는 2번까지만 한다. 개발 상황 확인도 2번 안에서 사람이 누를 때만 돈다.
// 티켓과 발송은 3·4번에서 사람이 누를 때만 일어난다.

import { useCallback } from 'react';
import { AnalysisCard } from '@/components/AnalysisCard';
import { AnalysisRunner } from '@/components/AnalysisRunner';
import { useAppStore } from '@/components/AppStore';
import { CHANNEL_META } from '@/components/channelMeta';
import { DecisionPanel } from '@/components/DecisionPanel';
import { DevContextSection } from '@/components/DevContextSection';
import { EvidenceList } from '@/components/EvidenceList';
import { FlowSection } from '@/components/FlowSection';
import { ReplyDraft } from '@/components/ReplyDraft';
import { formatDateTime } from '@/lib/format';
import type { Inbound, Project, Ticket } from '@/types';

const ANALYSIS_STEPS = ['과거 고객 대화 확인', '제안서 · 계약서 확인', '기존 티켓 확인'];

export function MessageFlow({
  inbound,
  project,
  ticket,
}: {
  inbound: Inbound;
  project: Project;
  /** 이 메시지가 붙어 있는 티켓. */
  ticket: Ticket;
}) {
  const {
    tickets,
    decisionOf,
    isAnalyzed,
    markAnalyzed,
    hasDevRun,
    runDev,
    decideHandling,
    clearHandling,
    setDecisionValue,
    setReplyText,
    markSent,
  } = useAppStore();

  const onAnalyzed = useCallback(
    () => markAnalyzed(inbound.inboundId),
    [inbound.inboundId, markAnalyzed],
  );
  const onDevRun = useCallback(() => runDev(inbound.inboundId), [inbound.inboundId, runDev]);

  const { analysis } = inbound;
  const decision = decisionOf(inbound.inboundId);
  const analyzed = isAnalyzed(inbound);
  const { icon: ChannelIcon, label: channelLabel } = CHANNEL_META[inbound.channel];

  const relatedTicket = tickets.find((t) => t.ticketId === analysis.relatedTicketId) ?? null;
  // 분리를 골랐다면 그때 만들어진 티켓.
  const splitTicket =
    decision.handling === 'create'
      ? (tickets.find((t) => t.ticketId === decision.ticketId) ?? null)
      : null;

  return (
    <div>
      {/* 1 — 고객 메시지 원문 */}
      <FlowSection step={1} label="고객 메시지" hint={inbound.subject}>
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <p className="mb-3 flex items-center gap-1.5 border-b border-line pb-3 text-xs text-ink-faint">
            {formatDateTime(inbound.createdAt)}
            <span>·</span>
            <ChannelIcon className="size-3.5" />
            {channelLabel}
            <span>·</span>
            {inbound.fromName}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{inbound.body}</p>
        </div>
      </FlowSection>

      {/* 2 — AI 분석 (+ 원하면 개발 상황까지) */}
      <FlowSection
        step={2}
        label="AI 분석"
        hint={analyzed ? 'AI가 확인한 내용입니다' : undefined}
        last={!analyzed}
      >
        {analyzed ? (
          <div className="flex flex-col gap-3">
            <AnalysisCard
              headline={analysis.headline}
              intents={analysis.intents}
              fields={analysis.fields}
              missingInfo={analysis.missingInfo}
            />

            <DevContextSection
              dev={analysis.devContext}
              repo={project.githubRepo}
              hasRun={hasDevRun(inbound.inboundId)}
              onRun={onDevRun}
            />

            {analysis.evidence.length > 0 && (
              <div>
                <p className="mb-2 mt-1 text-xs text-ink-faint">
                  근거 — 눌러서 원문을 확인할 수 있습니다
                </p>
                <EvidenceList evidence={analysis.evidence} />
              </div>
            )}
          </div>
        ) : (
          <AnalysisRunner steps={ANALYSIS_STEPS} onDone={onAnalyzed} />
        )}
      </FlowSection>

      {/* 3 — 사람의 판단 */}
      {analyzed && (
        <FlowSection step={3} label="내 판단" hint="여기서부터는 사람이 정합니다">
          <DecisionPanel
            analysis={analysis}
            decision={decision}
            relatedTicket={relatedTicket}
            currentTicket={ticket}
            splitTicket={splitTicket}
            onChoose={(handling) => decideHandling(inbound, handling)}
            onClear={() => clearHandling(inbound.inboundId)}
            onValueChange={(fieldId, value) => setDecisionValue(inbound.inboundId, fieldId, value)}
          />
        </FlowSection>
      )}

      {/* 4 — 답변 초안 */}
      {analyzed && (
        <FlowSection step={4} label="답변 초안" last>
          {decision.handling === null ? (
            <p className="rounded-lg bg-surface px-5 py-4 text-sm text-ink-faint shadow-card">
              위에서 처리 방식을 정하면 그 판단을 반영한 답변 초안을 만들어 드립니다.
            </p>
          ) : (
            <ReplyDraft
              drafts={analysis.drafts}
              fields={analysis.decisionFields}
              values={decision.values}
              editedText={decision.replyText}
              sentAt={decision.sentAt}
              onEdit={(text) => setReplyText(inbound.inboundId, text)}
              onSend={() => markSent(inbound.inboundId)}
            />
          )}
        </FlowSection>
      )}
    </div>
  );
}
