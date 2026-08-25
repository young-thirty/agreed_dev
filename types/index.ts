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

// 나머지 도메인 타입은 기능 명세가 확정된 뒤에 여기에 추가한다. 지금은 자리만 표시한다.
//
// Contract     계약. 범위, 일정, 비용을 담는다
// Requirement  대화에서 추출한 요구사항
// Utterance    발화 단위. { index; speaker; text } 형태로 정규화한다
