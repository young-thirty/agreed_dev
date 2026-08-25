// 백엔드 호출을 한 곳에 모은다. 화면은 여기 있는 함수만 부르고 경로를 알지 못한다.

import { get, patch, post } from '@/lib/api-client';
import { TICKET_STATUS_PARAM, type ReplyTone } from '@/types/api';
import type {
  ApiResult,
  Handling,
  InboundDecision,
  Project,
  ProcessingStatus,
  ProjectMaterial,
  SourceLink,
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

// ─────────────────────────────────────────────────────────────
// 프로젝트 채널 연결
//
// 이메일 주소·슬랙 채널·저장소는 Project가 아니라 이 목록에 행으로 쌓인다.
// ─────────────────────────────────────────────────────────────

export function listSourceLinks(projectId: string): Promise<ApiResult<SourceLink[]>> {
  return get<SourceLink[]>(`/api/projects/${projectId}/source-links`);
}

/** 등록할 채널 연결. 채널마다 채우는 칸이 다르다. */
export type SourceLinkInput =
  | { sourceChannel: 'GMAIL'; displayName: string; counterpartyEmail: string }
  | { sourceChannel: 'SLACK'; displayName: string; teamId: string; channelId: string }
  | { sourceChannel: 'GITHUB'; displayName: string; repoFullName: string };

/** 같은 연결을 두 번 등록하면 서버가 409로 막는다. */
export function createSourceLink(
  projectId: string,
  input: SourceLinkInput,
): Promise<ApiResult<SourceLink>> {
  return post<SourceLink>(`/api/projects/${projectId}/source-links`, {
    ...input,
    locatorKey: locatorKeyOf(input),
  });
}

/** 중복 판정에 쓰는 키. 채널마다 무엇이 같으면 같은 연결인지가 다르다. */
function locatorKeyOf(input: SourceLinkInput): string {
  if (input.sourceChannel === 'GMAIL') return input.counterpartyEmail;
  if (input.sourceChannel === 'SLACK') return `${input.teamId}:${input.channelId}`;
  return input.repoFullName;
}

/** 연결해 둔 슬랙 워크스페이스. 채널을 고르기 전에 워크스페이스를 먼저 고른다. */
export function listSlackWorkspaces(): Promise<ApiResult<{ teamId: string; teamName: string }[]>> {
  return post<{ teamId: string; teamName: string }[]>('/api/slack/workspaces', {});
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  /** 봇이 이미 들어가 있는 채널인지. 아니면 초대해야 대화를 읽는다. */
  isMember: boolean;
}

export function listSlackChannels(teamId: string): Promise<ApiResult<SlackChannel[]>> {
  return post<SlackChannel[]>('/api/slack/channels', { teamId });
}

/**
 * 이 연결에서 대화를 가져온다. 새 대화는 서버가 분석하고, 분석이 끝나면 티켓이 된다.
 * GitHub 연결에는 쓸 수 없다(서버가 400을 준다).
 */
export function syncSourceLink(
  projectId: string,
  sourceLinkId: string,
): Promise<ApiResult<{ newMessageCount: number; analysisRunIds: string[] }>> {
  return post<{ newMessageCount: number; analysisRunIds: string[] }>(
    `/api/projects/${projectId}/source-links/${sourceLinkId}/sync`,
    {},
  );
}

/** 분석 한 건의 진행 상태. 티켓이 언제 생기는지 이걸로 안다. */
export function getAnalysisRun(
  analysisRunId: string,
): Promise<ApiResult<{ status: ProcessingStatus }>> {
  return get<{ status: ProcessingStatus }>(`/api/analysis-runs/${analysisRunId}`);
}

/**
 * 공개 채널에 봇을 넣는다. 봇이 없으면 대화를 읽지 못한다.
 * 비공개 채널은 이걸로 안 되고, 슬랙에서 사람이 직접 초대해야 한다.
 */
export function joinSlackChannel(
  teamId: string,
  channelId: string,
): Promise<ApiResult<{ joined: boolean }>> {
  return post<{ joined: boolean }>('/api/slack/join', { teamId, channelId });
}

/** Gmail 계정 연동 상태. 연결은 설정 화면에서 한다. */
export function getGmailStatus(): Promise<ApiResult<{ connected: boolean; email: string | null }>> {
  return get<{ connected: boolean; email: string | null }>('/api/email/status');
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
