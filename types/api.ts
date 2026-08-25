// 백엔드와 공유하는 규약 중, 화면 도메인 타입(types/index.ts)에 담기 애매한 것.

/** 모든 API 응답의 형태. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** 티켓 상태를 서버에 보낼 때 쓰는 값. 화면 표기(Active·Done·Reject)와 짝이 맞는다. */
export const TICKET_STATUS_PARAM = {
  Active: 'active',
  Done: 'done',
  Reject: 'rejected',
} as const;

/** 답변 초안 말투. 백엔드 ReplyDraftRequest.tone과 값이 같아야 한다. */
export const REPLY_TONES = ['friendly', 'professional', 'concise', 'firm'] as const;
export type ReplyTone = (typeof REPLY_TONES)[number];

/** POST /api/auth/signup·login, GET /api/auth/me 가 data.user로 내려주는 값. */
export interface UserSummary {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
}
