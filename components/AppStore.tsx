'use client';

// 화면이 공유하는 상태.
//
// 프로젝트·고객 메시지·AI 분석은 목 데이터(mocks/index.ts)에서 온다.
// 사람이 내린 판단(어느 티켓에 붙일지·결정값·발송·티켓 상태)만 localStorage에 남는다.
// AI는 티켓을 만들거나 상태를 바꾸지 않는다. 여기 있는 모든 변경은 사람이 누른 결과다.
//
// 목록의 단위는 티켓이다. 고객 메시지가 오면 관련 티켓에 붙고, 관련 티켓이 없으면
// Active 티켓이 새로 만들어진 채로 들어온다(백엔드 몫). 화면은 그 티켓을 사람이 처리하게 한다.

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { INBOUNDS, NOW, OUTBOUNDS, PROJECTS, SEED_DECISIONS, TICKETS } from '@/mocks';
import type {
  Handling,
  Inbound,
  InboundDecision,
  Outbound,
  Project,
  Ticket,
  TicketStatus,
  WorkItem,
  WorkStage,
} from '@/types';

const EMPTY_DECISION: InboundDecision = {
  handling: null,
  ticketId: null,
  values: {},
  replyText: null,
  sentAt: null,
};

interface AppStore {
  projects: Project[];
  inbounds: Inbound[];
  outbounds: Outbound[];
  tickets: Ticket[];
  /** 티켓과 거기 달린 미답변 메시지. 목록 화면이 이걸 그린다. */
  workItems: WorkItem[];

  decisionOf: (inboundId: string) => InboundDecision;
  /** 사람이 붙인 티켓이 우선이고, 없으면 목 데이터가 들고 있던 티켓이다. */
  ticketIdOf: (inbound: Inbound) => string | null;
  stageOf: (item: WorkItem) => WorkStage;
  isAnalyzed: (inbound: Inbound) => boolean;
  /** 티켓에 붙은 고객 메시지와 보낸 답변을 시간순으로. */
  historyOf: (ticketId: string) => (
    | { kind: 'in'; at: string; inbound: Inbound }
    | { kind: 'out'; at: string; text: string; channel: Outbound['channel'] }
  )[];

  markAnalyzed: (inboundId: string) => void;
  /** GitHub에서 개발 상황을 확인했는가. 분석과 별개로 사람이 눌러야 돈다. */
  hasDevRun: (inboundId: string) => boolean;
  runDev: (inboundId: string) => void;
  /** 처리 방식을 정한다. '별도 티켓으로 분리'면 이때 티켓이 만들어진다. */
  decideHandling: (inbound: Inbound, handling: Handling) => void;
  clearHandling: (inboundId: string) => void;
  setDecisionValue: (inboundId: string, fieldId: string, value: string) => void;
  setReplyText: (inboundId: string, text: string | null) => void;
  markSent: (inboundId: string) => void;
  setTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [decisions, setDecisions] = usePersistedState<Record<string, InboundDecision>>(
    'decisions',
    SEED_DECISIONS,
  );
  const [analyzedIds, setAnalyzedIds] = usePersistedState<string[]>('analyzed', []);
  const [devRunIds, setDevRunIds] = usePersistedState<string[]>('dev-runs', []);
  const [createdTickets, setCreatedTickets] = usePersistedState<Ticket[]>('created-tickets', []);
  const [statusOverrides, setStatusOverrides] = usePersistedState<Record<string, TicketStatus>>(
    'ticket-status',
    {},
  );

  const tickets = useMemo(
    () =>
      [...createdTickets, ...TICKETS].map((t) => ({
        ...t,
        status: statusOverrides[t.ticketId] ?? t.status,
      })),
    [createdTickets, statusOverrides],
  );

  const decisionOf = useCallback(
    (inboundId: string) => decisions[inboundId] ?? EMPTY_DECISION,
    [decisions],
  );

  const ticketIdOf = useCallback(
    (inbound: Inbound) => decisionOf(inbound.inboundId).ticketId ?? inbound.ticketId,
    [decisionOf],
  );

  const isAnalyzed = useCallback(
    (inbound: Inbound) =>
      inbound.initialStage !== 'to_analyze' || analyzedIds.includes(inbound.inboundId),
    [analyzedIds],
  );

  /** 아직 답하지 않았는가. 답변을 보내면 그 메시지는 목록에서 손을 뗀다. */
  const isOpen = useCallback(
    (inbound: Inbound) => decisionOf(inbound.inboundId).sentAt === null,
    [decisionOf],
  );

  const workItems = useMemo<WorkItem[]>(() => {
    return tickets
      .map((ticket) => {
        const attached = INBOUNDS.filter(
          (i) => (decisions[i.inboundId]?.ticketId ?? i.ticketId) === ticket.ticketId,
        );
        const open = attached.filter(isOpen).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const lastActivityAt = attached.reduce(
          (acc, i) => (i.createdAt > acc ? i.createdAt : acc),
          ticket.updatedAt,
        );
        return { ticket, pending: open[0] ?? null, lastActivityAt };
      })
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }, [decisions, isOpen, tickets]);

  const stageOf = useCallback(
    (item: WorkItem): WorkStage => {
      if (item.pending !== null) {
        return isAnalyzed(item.pending) ? 'to_reply' : 'to_analyze';
      }
      // 답할 메시지는 없다. 답변을 보낸 뒤라면 고객 회신을 기다리는 중이다.
      const answered = INBOUNDS.some(
        (i) =>
          (decisions[i.inboundId]?.ticketId ?? i.ticketId) === item.ticket.ticketId &&
          decisionOf(i.inboundId).sentAt !== null,
      );
      const closed = item.ticket.status === 'Done' || item.ticket.status === 'Reject';
      return answered && !closed ? 'waiting' : 'idle';
    },
    [decisionOf, decisions, isAnalyzed],
  );

  const historyOf = useCallback(
    (ticketId: string) => {
      const received = INBOUNDS.filter(
        (i) => (decisions[i.inboundId]?.ticketId ?? i.ticketId) === ticketId,
      ).map((inbound) => ({ kind: 'in' as const, at: inbound.createdAt, inbound }));

      // 사람이 이 화면에서 보낸 답변.
      const replied = INBOUNDS.filter(
        (i) => (decisions[i.inboundId]?.ticketId ?? i.ticketId) === ticketId,
      )
        .map((i) => ({ inbound: i, decision: decisionOf(i.inboundId) }))
        .filter((x) => x.decision.sentAt !== null)
        .map((x) => ({
          kind: 'out' as const,
          at: x.decision.sentAt as string,
          text: x.decision.replyText ?? x.inbound.analysis.drafts.base,
          channel: x.inbound.channel,
        }));

      const sent = OUTBOUNDS.filter((o) => o.ticketId === ticketId).map((o) => ({
        kind: 'out' as const,
        at: o.createdAt,
        text: o.body,
        channel: o.channel,
      }));

      return [...received, ...replied, ...sent].sort((a, b) => a.at.localeCompare(b.at));
    },
    [decisionOf, decisions],
  );

  const patchDecision = useCallback(
    (inboundId: string, patch: Partial<InboundDecision>) => {
      setDecisions((prev) => ({
        ...prev,
        [inboundId]: { ...EMPTY_DECISION, ...prev[inboundId], ...patch },
      }));
    },
    [setDecisions],
  );

  const markAnalyzed = useCallback(
    (inboundId: string) => {
      setAnalyzedIds((prev) => (prev.includes(inboundId) ? prev : [...prev, inboundId]));
    },
    [setAnalyzedIds],
  );

  const hasDevRun = useCallback(
    (inboundId: string) => devRunIds.includes(inboundId),
    [devRunIds],
  );

  const runDev = useCallback(
    (inboundId: string) => {
      setDevRunIds((prev) => (prev.includes(inboundId) ? prev : [...prev, inboundId]));
    },
    [setDevRunIds],
  );

  const decideHandling = useCallback(
    (inbound: Inbound, handling: Handling) => {
      const { analysis } = inbound;

      if (handling === 'create' && analysis.ticketProposal !== null) {
        // 시연 기준 시각을 쓴다. 실제 시각을 섞으면 목 데이터와 상대 시간이 어긋난다.
        const now = new Date(NOW).toISOString();
        const ticket: Ticket = {
          ticketId: nextTicketId([...createdTickets, ...TICKETS]),
          projectId: inbound.projectId,
          title: analysis.ticketProposal.title,
          summary: analysis.ticketProposal.summary,
          status: 'Active',
          category: analysis.ticketProposal.category,
          requirement: analysis.ticketProposal.requirement,
          lastCustomerMessage: inbound.preview,
          createdAt: now,
          updatedAt: now,
        };
        setCreatedTickets((prev) => [ticket, ...prev]);
        patchDecision(inbound.inboundId, { handling, ticketId: ticket.ticketId });
        return;
      }

      // 반영하든 안 하든 메시지는 지금 티켓에 그대로 남는다. 티켓을 옮기는 건 '분리'뿐이다.
      patchDecision(inbound.inboundId, { handling, ticketId: inbound.ticketId });
    },
    [createdTickets, patchDecision, setCreatedTickets],
  );

  const clearHandling = useCallback(
    (inboundId: string) => patchDecision(inboundId, { handling: null, ticketId: null }),
    [patchDecision],
  );

  const setDecisionValue = useCallback(
    (inboundId: string, fieldId: string, value: string) => {
      setDecisions((prev) => {
        const current = prev[inboundId] ?? EMPTY_DECISION;
        return {
          ...prev,
          [inboundId]: { ...current, values: { ...current.values, [fieldId]: value } },
        };
      });
    },
    [setDecisions],
  );

  const setReplyText = useCallback(
    (inboundId: string, text: string | null) => patchDecision(inboundId, { replyText: text }),
    [patchDecision],
  );

  const markSent = useCallback(
    (inboundId: string) => patchDecision(inboundId, { sentAt: new Date(NOW).toISOString() }),
    [patchDecision],
  );

  const setTicketStatus = useCallback(
    (ticketId: string, status: TicketStatus) => {
      setStatusOverrides((prev) => ({ ...prev, [ticketId]: status }));
    },
    [setStatusOverrides],
  );

  return (
    <Ctx.Provider
      value={{
        projects: PROJECTS,
        inbounds: INBOUNDS,
        outbounds: OUTBOUNDS,
        tickets,
        workItems,
        decisionOf,
        ticketIdOf,
        stageOf,
        isAnalyzed,
        historyOf,
        markAnalyzed,
        hasDevRun,
        runDev,
        decideHandling,
        clearHandling,
        setDecisionValue,
        setReplyText,
        markSent,
        setTicketStatus,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** 기존 티켓 번호 다음 번호를 준다. 화면에서 만든 티켓도 같은 규칙을 따른다. */
function nextTicketId(existing: Ticket[]): string {
  const max = existing.reduce((acc, t) => {
    const n = Number(t.ticketId.replace('TCK-', ''));
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `TCK-${max + 1}`;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (ctx === null) throw new Error('AppStoreProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
