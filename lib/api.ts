// 백엔드 호출을 한 곳에 모은다. 화면은 여기 있는 함수만 부르고 경로를 알지 못한다.

import { get, patch, post } from '@/lib/api-client';
import { TICKET_STATUS_PARAM, type ReplyTone } from '@/types/api';
import type {
  ApiResult,
  Handling,
  InboundDecision,
  Project,
  ProjectMaterial,
  TicketCategory,
  TicketDetail,
  TicketStatus,
  WorkItem,
} from '@/types';

export function listProjects(): Promise<ApiResult<Project[]>> {
  return get<Project[]>('/api/projects');
}

/** 티켓 목록. 미답변 메시지와 현재 단계까지 서버가 붙여 준다. */
export function listWorkItems(projectId?: string): Promise<ApiResult<WorkItem[]>> {
  return get<WorkItem[]>(projectId === undefined ? '/api/tickets' : `/api/tickets?projectId=${projectId}`);
}

/** 티켓 상세. 상세 화면 한 장에 필요한 것이 다 들어 있다. */
export function getTicketDetail(ticketId: string): Promise<ApiResult<TicketDetail>> {
  return get<TicketDetail>(`/api/tickets/${ticketId}`);
}

/** 이 메시지를 어떻게 처리할지 저장한다. handling이 null이면 판단을 되돌린다. */
export function saveDecision(
  ticketId: string,
  input: {
    sourceMessageId: string;
    handling: Handling | null;
    values: Record<string, string>;
    ticketProposal?: {
      title: string;
      category: TicketCategory;
      requirement: string;
      summary: string;
    } | null;
  },
): Promise<ApiResult<InboundDecision>> {
  return post<InboundDecision>(`/api/requests/${ticketId}/decision`, input);
}

/** 답변을 보냈다고 표시한다. 외부 채널로 실제 발송하지는 않는다. */
export function markSent(
  ticketId: string,
  input: { sourceMessageId: string; replyText: string },
): Promise<ApiResult<InboundDecision>> {
  return post<InboundDecision>(`/api/requests/${ticketId}/mark-sent`, input);
}

/** 티켓 상태를 바꾼다. 사람만 부른다. */
export function setTicketStatus(ticketId: string, status: TicketStatus): Promise<ApiResult<unknown>> {
  return patch(`/api/requests/${ticketId}/ticket-status`, {
    ticketStatus: TICKET_STATUS_PARAM[status],
  });
}

/** 답변 초안을 만든다. 사람이 고른 확인 항목만 반영된다. */
export function createReplyDraft(
  ticketId: string,
  input: { selectedItems: string[]; tone: ReplyTone },
): Promise<ApiResult<{ body: string }>> {
  return post<{ body: string }>(`/api/requests/${ticketId}/reply-draft`, {
    selectedItems: input.selectedItems.slice(0, 6),
    tone: input.tone,
  });
}

/** 답변 전에 확인할 항목. */
export function getChecklist(ticketId: string): Promise<ApiResult<{ items: string[] }>> {
  return post<{ items: string[] }>(`/api/requests/${ticketId}/checklist`, {});
}

export function listMaterials(projectId: string): Promise<ApiResult<ProjectMaterial[]>> {
  return get<ProjectMaterial[]>(`/api/projects/${projectId}/materials`);
}

/** 연결된 저장소에 물어본다. GitHub 저장소가 연결돼 있어야 한다. */
export function askGit(
  projectId: string,
  question: string,
): Promise<ApiResult<{ answer: string; repoFullName: string }>> {
  return post<{ answer: string; repoFullName: string }>(`/api/projects/${projectId}/git/ask`, {
    question,
  });
}
