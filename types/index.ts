// 화면이 쓰는 도메인 타입의 단일 원천이다.
//
// 백엔드 응답 타입은 types/api.ts에 있다. 응답 규약(ApiResult)만 여기서 다시 내보내
// 호출부가 '@/types' 하나만 보면 되게 한다.

export type { ApiResult } from './api';
// 지금은 백엔드가 없고 mocks/index.ts가 이 타입으로 목 데이터를 채운다.
// 서버가 붙으면 같은 이름으로 응답이 내려오도록 백엔드와 맞춘다.

// ─────────────────────────────────────────────────────────────
// 프로젝트
// ─────────────────────────────────────────────────────────────

/** 고객 메시지가 들어오는 채널. */
export type Channel = 'email' | 'slack';

/**
 * 프로젝트 진행 상태. 문의 단계는 Draft, 계약 이후가 Active다.
 * Draft에서 Active·Rejected로 가는 판단은 AI가 하고, Completed는 사람만 바꾼다.
 * 어느 전환이든 사람이 직접 바꾸는 길은 남아 있다.
 */
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';

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

/** 자료·대화가 들어오는 외부 채널. 백엔드 core/project_data.py의 SourceChannel과 같다. */
export type SourceChannel = 'GMAIL' | 'SLACK' | 'GITHUB';

/**
 * 프로젝트에 붙은 채널 연결 하나.
 *
 * 이메일·슬랙 채널·저장소는 Project의 컬럼이 아니라 이 목록의 행으로 있다.
 * 그래서 이메일을 여러 개 등록하는 것도 행을 늘리는 일이다.
 * GET /api/projects/{id}/source-links
 */
export interface SourceLink {
  sourceLinkId: string;
  projectId: string;
  sourceChannel: SourceChannel;
  /** 화면에 보여줄 이름. 사람이 정한다. */
  displayName: string;
  /** 어느 계정·워크스페이스로 수집하는지. 서버가 채운다. */
  connectionId: string | null;
  /** GMAIL 전용. 이 주소와 주고받은 메일만 읽는다. */
  counterpartyEmail: string | null;
  /** SLACK 전용. 이 프로젝트 대화의 상위 스레드다. */
  threadId: string | null;
  /** SLACK 전용. 워크스페이스와 채널. */
  teamId: string | null;
  channelId: string | null;
  /** GITHUB 전용. "owner/repo" 형식이다. */
  repoFullName: string | null;
  /** 같은 연결을 두 번 등록하지 않기 위한 키. */
  locatorKey: string;
  createdAt: string; // ISO
  updatedAt: string;
}

/** 서버가 백그라운드로 도는 일의 진행 상태. */
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/** 프로젝트 컨텍스트로 등록된 문서. AI가 근거를 찾는 곳이다. */
export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  kind: string; // 제안서, 계약서, 회의록 …
}

/** 구현 항목 한 줄. 프로젝트 컨텍스트와 분석의 개발 현황이 함께 쓴다. */
export type DevState = 'done' | 'progress' | 'todo';

export interface DevItem {
  state: DevState;
  text: string;
}

/** GitHub에서 읽어온 프로젝트 개발 현황. 원본을 그대로 늘어놓지 않고 기능 단위로 접는다. */
export interface RepoSnapshot {
  projectId: string;
  repo: string;
  features: { name: string; items: DevItem[] }[];
  openWork: { title: string; note: string }[];
}

// ─────────────────────────────────────────────────────────────
// 티켓
// ─────────────────────────────────────────────────────────────

/**
 * 티켓 상태. 만들어진 순간부터 끝날 때까지 Active이고, 끝나면 Done 또는 Reject다.
 * 셋 다 사람이 직접 바꾼다. 자동으로 넘어가지 않는다.
 */
export const TICKET_STATUS = ['Active', 'Done', 'Reject'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

/** 티켓 카테고리. 생성 시점에 정하고 이후 바꾸지 않는다. */
export type TicketCategory =
  | '기능 요청'
  | '버그'
  | '일반 질문'
  | '계약 문의'
  | '일정 문의'
  | '디자인 수정';

export interface Ticket {
  ticketId: string;
  /** 화면에 보여주는 짧은 번호(TCK-01). 조회 키는 ticketId다. */
  ticketCode: string;
  projectId: string;
  /** 짧은 요약 제목. */
  title: string;
  /** 지금 이 티켓이 어떤 상태인지 줄글 요약. */
  summary: string;
  status: TicketStatus;
  category: TicketCategory;
  /** 사람이 확정한 요구사항 한 줄. */
  requirement: string;
  /** 이 티켓에 마지막으로 붙은 고객 메시지. */
  lastCustomerMessage: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ─────────────────────────────────────────────────────────────
// 고객 메시지(Inbound)와 AI 분석
// ─────────────────────────────────────────────────────────────

/**
 * 목록에서 지금 사람이 무엇을 해야 하는지. 티켓에 붙은 미답변 메시지가 이 단계를 정한다.
 */
export type WorkStage =
  | 'to_analyze' // 새 메시지가 왔고 아직 분석 전
  | 'to_reply' // 분석은 끝났고 사람이 판단·답변할 차례
  | 'waiting' // 답변을 보내고 고객 회신을 기다리는 중
  | 'idle'; // 지금 할 일이 없는 티켓

/** 분석 결과 한 줄. 라벨과 값으로만 이뤄져 항목 구성이 메시지마다 달라진다. */
export interface AnalysisField {
  label: string;
  /** 한 줄이면 value, 여러 줄이면 items를 쓴다. */
  value?: string;
  items?: string[];
  /** 사람이 판단해야 하는 항목은 caution으로 표시한다. */
  tone?: 'neutral' | 'caution';
}

/** 한 메시지 안에 섞여 있는 요청. 복합 메시지에서만 채운다. */
export interface Intent {
  kind: string; // 기능 요청, 일정 문의 …
  text: string;
}

/** AI가 판단 근거로 삼은 컨텍스트 한 조각. */
export interface Evidence {
  source: 'document' | 'ticket' | 'github' | 'message';
  label: string; // 제안서, 관련 Ticket, GitHub …
  title: string;
  quote: string;
}

/** 고객 메시지에 필요한 만큼만 잘라 보여주는 개발 현황. */
export interface DevContext {
  /** 어떤 기능에 대한 현황인지. */
  subject: string;
  items: DevItem[];
  /** 진행 중인 관련 작업(PR·브랜치). */
  relatedWork: { title: string; note: string }[];
  /** 이 요청이 건드리게 될 코드 영역. */
  impactAreas: string[];
  /** 어느 저장소를 읽었는지. 연결이 없으면 null이다. */
  repoFullName: string | null;
  /** 저장소를 실제로 확인했는지. 아직이면 값이 비어 있다. */
  checked: boolean;
}

/**
 * 기술적으로 만들 수 있는가. 계약 범위 판정과는 다른 축이다.
 * 계약 밖이어도 기술적으로는 쉬울 수 있고, 계약 안이어도 막힐 수 있다.
 */
export type FeasibilityVerdict =
  | 'feasible'
  | 'feasible_with_scope_change'
  | 'needs_clarification'
  | 'blocked';

export interface Feasibility {
  verdict: FeasibilityVerdict;
  reason: string;
  /** AI가 정할 수 없어 사람에게 물어야 하는 것들. */
  requiredHumanInput: string[];
}

/** AI가 확정할 수 없어 사람에게 입력받는 값. */
export interface DecisionField {
  id: string;
  label: string;
  type: 'money' | 'date' | 'text';
  placeholder?: string;
}

/** 답변 초안의 어조. */
export const TONES = ['base', 'friendly', 'short', 'firm'] as const;
export type Tone = (typeof TONES)[number];

export interface Analysis {
  /** 지금 무슨 상황인지 한 줄. 서버 솔루션의 조언이다. */
  headline: string;
  /** 그렇게 판단한 이유. 솔루션이 없으면 빈 문자열이다. */
  adviceReason: string;
  /** 여러 요청이 섞여 있으면 채운다. 비어 있으면 단일 요청이다. */
  intents: Intent[];
  fields: AnalysisField[];
  /** 정보가 부족해 원인·범위를 특정할 수 없을 때 필요한 것들. */
  missingInfo: string[];
  devContext: DevContext | null;
  /** 작업 가능 여부. 솔루션을 만들기 전에는 null이다. */
  feasibility: Feasibility | null;
  evidence: Evidence[];
  /** 관련 있어 보이는 기존 티켓. 반영 여부는 사람이 정한다. */
  relatedTicketId: string | null;
  /** 새 티켓을 만들 때 채워질 값. 사람이 누르기 전에는 만들지 않는다. */
  ticketProposal: {
    title: string;
    category: TicketCategory;
    requirement: string;
    summary: string;
  } | null;
  decisionFields: DecisionField[];
  /**
   * 어조별 답변 초안.
   * {{amount}} · {{dueDate}}는 사람이 확정한 값으로 치환된다. 확정 전에는 미정 문구가 들어간다.
   */
  drafts: Record<Tone, string>;
}

export interface Inbound {
  inboundId: string;
  channel: Channel;
  projectId: string;
  /** 티켓에 연결돼 있으면 티켓 id. 사람이 반영을 눌러야 채워진다. */
  ticketId: string | null;
  fromName: string;
  fromEmail: string;
  /** 슬랙이면 채널 이름, 이메일이면 제목. */
  subject: string;
  /** 목록과 제목에 쓰는 한 줄. 인사말을 걷어낸 핵심 문장이다. */
  preview: string;
  body: string;
  attachments: string[];
  createdAt: string; // ISO
  /** 목 데이터의 출발 상태. 사람이 분석·발송한 뒤에는 저장된 판단이 단계를 정한다. */
  initialStage: Exclude<WorkStage, 'idle'>;
  /** 인박스 목록에 보여줄 성격 라벨. */
  category: TicketCategory;
  analysis: Analysis;
}

/** 고객에게 보낸 답변. 티켓의 지난 대화를 그리는 데 쓴다. */
export interface Outbound {
  outboundId: string;
  channel: Channel;
  projectId: string;
  ticketId: string | null;
  toEmail: string;
  body: string;
  createdAt: string; // ISO
}

/**
 * 목록에 한 줄로 서는 일감. 단위는 언제나 티켓이다.
 * 고객 메시지가 들어오면 관련 티켓에 붙고, 관련 티켓이 없으면 Active 티켓이 새로 만들어진다.
 */
export interface WorkItem {
  ticket: Ticket;
  /** 아직 답하지 않은 고객 메시지. 없으면 지금 할 일이 없다. */
  pending: Inbound | null;
  lastActivityAt: string;
  /** 지금 사람이 무엇을 해야 하는지. 서버가 계산해 준다. */
  workStage: WorkStage;
}

/** 티켓에 쌓인 지난 대화 한 줄. */
export type HistoryEntry =
  | { kind: 'in'; at: string; inbound: Inbound }
  | { kind: 'out'; at: string; outbound: Outbound };

/** GET /api/tickets/{id} — 상세 화면 한 장에 필요한 것을 모아 준다. */
export interface TicketDetail extends WorkItem {
  project: Project;
  decision: InboundDecision;
  history: HistoryEntry[];
  materials: ProjectMaterial[];
}

// ─────────────────────────────────────────────────────────────
// 사람의 판단 (localStorage에 남는다)
// ─────────────────────────────────────────────────────────────

/**
 * 이 메시지를 어떻게 처리하기로 했는가.
 * link   — 이 티켓의 변경으로 반영한다
 * create — 별도 티켓으로 분리한다
 * ignore — 티켓은 그대로 두고 답변만 한다
 */
export type Handling = 'link' | 'create' | 'ignore';

export interface InboundDecision {
  /** 처리 방식. null이면 아직 정하지 않았다. */
  handling: Handling | null;
  /** 반영·생성한 티켓 id. */
  ticketId: string | null;
  /** 결정 입력값. DecisionField.id를 키로 쓴다. */
  values: Record<string, string>;
  /** 사람이 고쳐 쓴 답변. null이면 초안 그대로다. */
  replyText: string | null;
  /** 발송 시각. null이면 아직 보내지 않았다. */
  sentAt: string | null;
}

// ─────────────────────────────────────────────────────────────
// 프로젝트 자료 (첨부 파일 아카이브)
//
// GET /api/projects/{id}/materials가 돌려주는 형태다.
// 백엔드 core/project_data.py·app/public_data.py의 public_material을 따라간다.
// ─────────────────────────────────────────────────────────────

/** 자료가 들어온 채널. GITHUB은 저장소 대화라 파일 아카이브에는 잘 안 나온다. */
export type MaterialSourceChannel = SourceChannel;

/** 자료 분류 진행 상태. 분석 실행(AnalysisRun)도 같은 값을 쓴다. */
export type MaterialClassificationStatus = ProcessingStatus;

/** AI가 붙인 문서 종류. 분류가 끝나기 전에는 null이다. */
export type MaterialDocumentType =
  | 'PROPOSAL'
  | 'CONTRACT'
  | 'REQUIREMENTS'
  | 'MEETING_NOTES'
  | 'OTHER';

/** 메일 첨부·Slack 파일 등, 대화 중 오간 자료 하나. */
export interface ProjectMaterial {
  materialId: string;
  projectId: string;
  /** 어느 티켓의 대화에 딸려온 파일인지. 프로젝트 전체 자료는 null이다. */
  ticketId: string | null;
  fileName: string;
  direction: 'RECEIVED' | 'SENT';
  communicatedAt: string; // ISO
  classificationStatus: MaterialClassificationStatus;
  documentType: MaterialDocumentType | null;
  sourceChannel: MaterialSourceChannel | null;
  mimeType: string | null;
  sizeBytes: number | null;
  /** 어느 대화에서 온 파일인지. */
  conversationTitle: string | null;
  senderDisplay: string | null;
  /** 원본을 내려받을 수 있는지. 큰 첨부는 목록에만 남고 원본은 없을 수 있다. */
  hasFile: boolean;
}
