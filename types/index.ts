// 공유 타입의 단일 원천이다. 백엔드가 소유하고 프론트는 읽기만 한다.
// 이 파일을 고치면 양쪽 화면이 함께 영향을 받으므로, 수정하기 전에 팀에 알린다.

/**
 * 모든 API 응답의 형태.
 * 성공이면 data가, 실패면 사용자가 그대로 읽을 수 있는 error 문장이 들어온다.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * 요구사항 상태.
 *
 * '미확정'은 진입 상태이자 강등 목적지다. 모델이 성격을 확정하지 못했거나
 * 제안한 상태가 이전 상태에서 도달 불가능할 때 여기로 내린다.
 * 거부하면 화면에 아무것도 남지 않지만, 강등하면 사람이 판단할 거리가 남는다.
 */
export const REQUIREMENT_STATUS = [
  '미확정',
  '문의',
  '요청',
  '제안',
  '내부검토',
  '고객검토',
  '합의',
  '거절',
  '완료',
] as const;

export type RequirementStatus = (typeof REQUIREMENT_STATUS)[number];

// ─────────────────────────────────────────────────────────────
// 프로토타입 도메인 타입
//
// 아래는 데모용 프로토타입이 화면을 그리기 위해 쓰는 타입이다.
// 실제 백엔드가 붙기 전까지 mocks/index.ts가 이 타입으로 목 데이터를 채운다.
// ─────────────────────────────────────────────────────────────

/** 온보딩에서 입력받는 사용자. 인증은 없고 데모용 프로필일 뿐이다. */
export interface User {
  name: string;
  email: string;
  role: string;
  isFreelancer: boolean;
}

/** 요청이 들어오는 입력 채널. */
export type Channel = 'gmail' | 'slack' | 'file' | 'text';

/** 연동 소스의 연결 상태. 실제 OAuth 없이 UI 상태만 바꾼다. */
export interface Integration {
  channel: Channel;
  label: string;
  connected: boolean;
}

/** 프로젝트 진행 상태. Draft에서 시작해 사람이 직접 Active로 올린다. */
export type ProjectStatus = 'draft' | 'active' | 'completed';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  /** 있으면 프로젝트 화면에서 Gmail 연동 결과 중 이 주소와 주고받은 메일만 걸러 보여준다. */
  clientEmail?: string;
  description: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  budget: number; // 원
  status: ProjectStatus;
}

/** 프로젝트 컨텍스트로 등록된 문서. 파일 자체는 분석하지 않는다. */
export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  kind: string; // 계약서, 제안서, 회의록 등
  uploadedAt: string; // ISO
  inContext: boolean; // AI 컨텍스트 포함 여부
}

/** AI가 요청을 검토한 결과의 성격. 색과 문구로 구분해 표시한다. */
export type AnalysisVerdict = 'needs_clarification' | 'scope_change' | 'in_scope';

/** 판단 근거가 된 문서 인용. sourceDocId로 좌측 문서를 강조 연결한다. */
export interface Evidence {
  id: string;
  sourceDocId: string;
  sourceLabel: string; // 화면에 보일 출처 이름
  quote: string;
}

export interface Analysis {
  summary: string[]; // 요청 요약
  verdict: AnalysisVerdict;
  reasons: string[]; // 왜 이렇게 판단했는가
  evidence: Evidence[];
  questions: ClarificationQuestion[]; // AI가 제안하는 역질문
}

/** 고객에게 되물을 확인 질문. 사용자가 체크로 고르거나 직접 추가한다. */
export interface ClarificationQuestion {
  id: string;
  text: string;
  defaultSelected: boolean;
}

/** 한 건의 클라이언트 요청과 그에 대한 분석. */
export interface ClientRequest {
  id: string;
  projectId: string;
  channel: Channel;
  from: string;
  receivedAt: string; // ISO
  subject: string;
  body: string;
  unread: boolean;
  analysis: Analysis;
}

/** 답변 톤. 같은 내용을 관계와 상황에 맞게 다르게 표현한다. */
export type Tone = 'friendly' | 'professional' | 'concise' | 'firm';

/** 요구사항이 시간에 따라 어떻게 변해왔는지 보여주는 타임라인 항목. */
export type TimelineKind = 'agreement' | 'request' | 'change';

export interface TimelineEvent {
  id: string;
  projectId: string;
  date: string; // ISO yyyy-mm-dd
  kind: TimelineKind;
  title: string;
  note?: string;
}
