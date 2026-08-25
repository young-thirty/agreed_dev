// 백엔드(agreed_be)가 내려주는 응답 타입.
//
// 이름과 형태는 백엔드가 원천이다. core/project_data.py와 app/api/projects.py를 따라간다.
// 여기서 임의로 바꾸면 화면이 조용히 깨지므로, 바꿔야 하면 먼저 백엔드에 알린다.
//
// 화면 용어와의 대응
//   티켓        = ClientRequest (requestId)
//   티켓 제목   = summaryTitle
//   티켓 상태   = ticketStatus (active | done | rejected, 사람만 바꾼다)
//   AI 판정     = aiDecisionStatus + decisionReason

/** 모든 API 응답의 형태. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ProjectStatus = 'ACTIVE' | 'DRAFT' | 'COMPLETED';
export type SourceChannel = 'GMAIL' | 'SLACK' | 'GITHUB';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type Direction = 'RECEIVED' | 'SENT';
export type DocumentType =
  | 'PROPOSAL'
  | 'CONTRACT'
  | 'REQUIREMENTS'
  | 'MEETING_NOTES'
  | 'OTHER';

/** AI가 본 이 요청의 성격. 초록 · 주황 · 빨강 순으로 무게가 올라간다. */
export type AiDecisionStatus =
  | 'IN_SCOPE_ACTION_REQUIRED'
  | 'OUT_OF_SCOPE_COORDINATION_REQUIRED'
  | 'EXTRA_REQUEST';

/** 티켓 상태. pending은 없다. active에서 나가는 유일한 경로는 사람의 변경이다. */
export const TICKET_STATUS = ['active', 'done', 'rejected'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

/** 답변 초안 말투. 백엔드 ReplyDraftRequest.tone과 값이 같아야 한다. */
export const REPLY_TONES = ['friendly', 'professional', 'concise', 'firm'] as const;
export type ReplyTone = (typeof REPLY_TONES)[number];

/** GET /api/projects, GET /api/projects/{id} */
export interface Project {
  projectId: string;
  name: string;
  clientName: string;
  clientEmail: string | null;
  description: string;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  contractPrice: number | null;
  unansweredRequestCount: number;
  createdAt: string; // ISO
  updatedAt: string;
  status: ProjectStatus;
}

/** GET /api/projects/{id}/requests — 목록에 서는 티켓 한 줄. */
export interface Ticket {
  requestId: string;
  projectId: string;
  sourceChannel: SourceChannel;
  senderDisplay: string | null;
  occurredAt: string; // ISO
  aiProcessingStatus: ProcessingStatus;
  summaryTitle: string | null;
  aiDecisionStatus: AiDecisionStatus | null;
  ticketStatus: TicketStatus;
}

/** 고객이 실제로 한 말. */
export interface RequestEvidence {
  quote: string;
  sourceMessageId: string;
}

/** 문서에서 찾은 근거. */
export interface DocumentEvidence {
  quote: string;
  documentId: string;
}

/** 조언의 판단에 쓰인 프로젝트 자료. */
export interface RelatedFile {
  materialId: string;
  fileName: string;
  documentType: DocumentType | null;
  summary: string | null;
}

/** POST /api/requests/{id}/solution — 티켓 하나에 붙는 AI 산출물. */
export interface TicketSolution {
  adviceMessage: string;
  adviceReason: string;
  basisQuote: string;
  basisDocumentId: string;
  relatedFiles: RelatedFile[];
  generatedAt: string;
}

/** GET /api/requests/{id} — 목록 필드에 원문과 근거가 붙는다. */
export interface TicketDetail extends Ticket {
  requestEvidence: RequestEvidence[];
  documentEvidence: DocumentEvidence[];
  decisionReason: string | null;
  solution: TicketSolution | null;
  sourceText: string | null;
  conversationDisplay: string | null;
}

/** GET /api/projects/{id}/materials */
export interface ProjectMaterial {
  materialId: string;
  projectId: string;
  ticketId: string | null;
  fileName: string;
  direction: Direction;
  communicatedAt: string;
  classificationStatus: ProcessingStatus;
  documentType: DocumentType | null;
  summary: string | null;
  sourceChannel: SourceChannel;
  mimeType: string | null;
  sizeBytes: number | null;
  conversationTitle: string | null;
  senderDisplay: string | null;
  hasFile: boolean;
}

/** POST /api/requests/{id}/checklist */
export interface ChecklistResult {
  items: string[];
}

/** POST /api/requests/{id}/reply-draft */
export interface ReplyDraftResult {
  body: string;
}
