'use client';

// 티켓에 새로 붙은 고객 메시지 하나를 처리하는 흐름.
//
//   1 고객 메시지 → 2 AI 분석 → 3 내 판단 → 4 답변 초안
//
// AI는 2번까지만 한다. 개발 상황 확인도 2번 안에서 사람이 누를 때만 돈다.
// 티켓 반영·분리와 발송 표시는 3·4번에서 사람이 누를 때만 일어나고, 그때 서버에 남는다.

import { useState } from 'react';
import { AnalysisCard } from '@/components/AnalysisCard';
import { AnalysisRunner } from '@/components/AnalysisRunner';
import { CHANNEL_META } from '@/components/channelMeta';
import { DecisionPanel } from '@/components/DecisionPanel';
import { DevContextSection } from '@/components/DevContextSection';
import { EvidenceList } from '@/components/EvidenceList';
import { FlowSection } from '@/components/FlowSection';
import { ReplyDraft } from '@/components/ReplyDraft';
import { saveDecision } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Handling, Inbound, InboundDecision, Project, Ticket } from '@/types';

export function MessageFlow({
  inbound,
  project,
  ticket,
  decision,
  analyzed,
  onChanged,
}: {
  inbound: Inbound;
  project: Project;
  /** 이 메시지가 붙어 있는 티켓. */
  ticket: Ticket;
  decision: InboundDecision;
  /** 서버 분석이 끝났는지. */
  analyzed: boolean;
  /** 판단·발송이 서버에 반영된 뒤 상세를 다시 읽는다. */
  onChanged: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const { analysis } = inbound;
  const { icon: ChannelIcon, label: channelLabel } = CHANNEL_META[inbound.channel];

  async function choose(handling: Handling | null) {
    setMessage(null);
    const res = await saveDecision(ticket.ticketId, {
      sourceMessageId: inbound.inboundId,
      handling,
      values: decision.values,
      ticketProposal: handling === 'create' ? analysis.ticketProposal : null,
    });
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    onChanged();
  }

  async function changeValue(fieldId: string, value: string) {
    setMessage(null);
    const res = await saveDecision(ticket.ticketId, {
      sourceMessageId: inbound.inboundId,
      handling: decision.handling,
      values: { ...decision.values, [fieldId]: value },
      ticketProposal: decision.handling === 'create' ? analysis.ticketProposal : null,
    });
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    onChanged();
  }

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
            {inbound.fromName !== '' && (
              <>
                <span>·</span>
                {inbound.fromName}
              </>
            )}
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

            <DevContextSection projectId={project.projectId} subject={ticket.title} />

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
          <AnalysisRunner onRefresh={onChanged} />
        )}
      </FlowSection>

      {/* 3 — 사람의 판단 */}
      {analyzed && (
        <FlowSection step={3} label="내 판단" hint="여기서부터는 사람이 정합니다">
          <div className="flex flex-col gap-3">
            <DecisionPanel
              analysis={analysis}
              decision={decision}
              relatedTicket={null}
              currentTicket={ticket}
              splitTicket={null}
              onChoose={choose}
              onClear={() => choose(null)}
              onValueChange={changeValue}
            />
            {message !== null && (
              <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-faint">
                {message}
              </p>
            )}
          </div>
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
              ticketId={ticket.ticketId}
              sourceMessageId={inbound.inboundId}
              fields={analysis.decisionFields}
              values={decision.values}
              selectedItems={[]}
              savedReplyText={decision.replyText}
              sentAt={decision.sentAt}
              onSent={onChanged}
            />
          )}
        </FlowSection>
      )}
    </div>
  );
}
