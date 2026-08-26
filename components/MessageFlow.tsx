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
import { FeasibilityCard } from '@/components/FeasibilityCard';
import { FlowSection } from '@/components/FlowSection';
import { MaterialList } from '@/components/MaterialList';
import { MessageBody } from '@/components/MessageBody';
import { ReplyDraft } from '@/components/ReplyDraft';
import { SolutionRunner } from '@/components/SolutionRunner';
import { saveDecision } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type {
  Inbound,
  InboundDecision,
  Project,
  ProjectMaterial,
  Ticket,
} from '@/types';

export function MessageFlow({
  inbound,
  project,
  ticket,
  materials,
  decision,
  analyzed,
  onChanged,
}: {
  inbound: Inbound;
  project: Project;
  /** 이 메시지가 붙어 있는 티켓. */
  ticket: Ticket;
  /** 이 프로젝트의 자료. 이 티켓에 딸린 것만 골라 메시지 아래에 붙인다. */
  materials: ProjectMaterial[];
  decision: InboundDecision;
  /** 서버 분석이 끝났는지. */
  analyzed: boolean;
  /** 판단·발송이 서버에 반영된 뒤 상세를 다시 읽는다. */
  onChanged: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  // 답변에 반영할 확인 항목. 서버 decision에는 자리가 없어 이 화면에서만 들고 있다.
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { analysis } = inbound;
  const { icon: ChannelIcon, label: channelLabel } = CHANNEL_META[inbound.channel];
  // 프로젝트 전체 자료(ticketId가 없는 것)는 파일 탭에서 본다. 여기서는 이 대화 것만.
  const attachments = materials.filter((item) => item.ticketId === ticket.ticketId);
  // 서버가 필드를 아예 안 보낼 수도 있다. null과 undefined를 같이 걸러 낸다.
  const feasibility = analysis.feasibility ?? null;
  // 솔루션까지 나와야 답변을 준비할 수 있다.
  const ready = analyzed && feasibility !== null;

  async function changeValue(fieldId: string, value: string) {
    setMessage(null);
    const res = await saveDecision(ticket.ticketId, {
      sourceMessageId: inbound.inboundId,
      // 인바운드가 작업 단위로 들어온 순간 이미 티켓이다. 반영 여부를 묻지 않는다.
      handling: 'link',
      values: { ...decision.values, [fieldId]: value },
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
          <MessageBody body={inbound.body} className="text-sm leading-relaxed text-ink" />
        </div>

        {attachments.length > 0 && (
          <div className="mt-2">
            <p className="mb-2 text-xs text-ink-faint">첨부 {attachments.length}개</p>
            <MaterialList projectId={project.projectId} materials={attachments} />
          </div>
        )}
      </FlowSection>

      {/* 2 — AI 분석 (+ 원하면 개발 상황까지) */}
      <FlowSection
        step={2}
        label="AI 분석"
        hint={analyzed ? 'AI가 확인한 내용입니다' : undefined}
        last={!analyzed}
      >
        {!analyzed ? (
          <AnalysisRunner onRefresh={onChanged} />
        ) : feasibility === null ? (
          // 서버 분석은 끝났지만 솔루션 패키지가 아직 없다. 열었을 때 한 번 만든다.
          <SolutionRunner ticketId={ticket.ticketId} onDone={onChanged} />
        ) : (
          <div className="flex flex-col gap-3">
            <AnalysisCard
              headline={analysis.headline}
              reason={analysis.adviceReason}
              intents={analysis.intents}
              fields={analysis.fields}
              missingInfo={analysis.missingInfo}
            />

            <FeasibilityCard feasibility={feasibility} />

            <DevContextSection projectId={project.projectId} subject={ticket.title} />
          </div>
        )}
      </FlowSection>

      {/* 3 — 답변 준비 */}
      {ready && (
        <FlowSection step={3} label="답변 준비" hint="여기서부터는 사람이 정합니다">
          <div className="flex flex-col gap-3">
            <DecisionPanel
              ticketId={ticket.ticketId}
              analysis={analysis}
              decision={decision}
              selectedItems={selectedItems}
              onToggleItem={(text) =>
                setSelectedItems((prev) =>
                  prev.includes(text) ? prev.filter((item) => item !== text) : [...prev, text],
                )
              }
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
      {ready && (
        <FlowSection step={4} label="답변 초안" last>
          <ReplyDraft
            ticketId={ticket.ticketId}
            sourceMessageId={inbound.inboundId}
            fields={analysis.decisionFields}
            values={decision.values}
            selectedItems={selectedItems}
            savedReplyText={decision.replyText}
            sentAt={decision.sentAt}
            onSent={onChanged}
          />
        </FlowSection>
      )}
    </div>
  );
}
