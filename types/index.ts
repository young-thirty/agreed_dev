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

/**
 * 대화가 들어온 채널. 예선 시연은 텍스트 붙여넣기로 받지만, 값 자체는
 * 나중에 실제로 연동할 두 채널(이메일·슬랙)을 그대로 쓴다. 카카오톡은
 * API가 없어 채널로 두지 않는다.
 */
export const CHANNELS = ['이메일', '슬랙'] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * 발화 단위. L0(발화 분할)의 산출물이다.
 * index가 있어야 L2 근거 검증과 화면의 원문 하이라이트가 가능하다.
 */
export type Utterance = {
  index: number;
  channel: Channel;
  speaker: string;
  text: string;
};

/** 요구사항 카드가 원문 어디에 근거하는지. L2가 인용문을 원문과 대조한다. */
export type Evidence = {
  utteranceIndex: number;
  quote: string;
};

/** 계약서·제안서 어디에 근거가 있는지. 없으면 '없음'이다. */
export type Basis =
  | { kind: '계약서'; clause: string }
  | { kind: '제안서'; clause: string }
  | { kind: '없음' };

/**
 * 금액·일정 결정. 사람만 채운다.
 *
 * `aiProposedDecision`은 AI가 대화 근거로 미리 채워보는 초안이고,
 * `decision`은 사람이 확정한 값이다. 화면에 반영되는 건 `decision`뿐이다.
 */
export type Decision = {
  amountDelta: number;
  dueDate: string;
  note?: string;
};

export type Requirement = {
  id: string;
  title: string;
  status: RequirementStatus;
  evidence: Evidence[];
  basis: Basis;
  aiProposedDecision: Decision | null;
  decision: Decision | null;
};

export type Contract = {
  version: number;
  scope: string[];
  dueDate: string;
  amount: number;
};

/** 계약 버전 간 변경분. 우측 화면의 diff 표시가 이 값을 그대로 그린다. */
export type ContractDiff = {
  scopeAdded: string[];
  scopeRemoved: string[];
  dueDateChanged: { before: string; after: string } | null;
  amountDelta: number;
};
