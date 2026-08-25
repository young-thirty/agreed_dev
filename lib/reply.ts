// 답변 초안의 말투 목록.
//
// 실제 문구는 백엔드가 AI로 만든다(POST /projects/{id}/requirements/{id}/reply).
// 말투별 성격은 백엔드의 REPLY_SYSTEM_PROMPT에 적혀 있다.
//
// 말투는 어떻게 말할지만 정한다. 수락할지 거절할지 검토할지는 '확정'에서
// 고른 상태가 정한다. 그 둘을 한 목록에 섞으면 서로 어긋난 지시가 나간다.

import type { Tone } from '@/types';

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'concise', label: 'Concise' },
  { value: 'firm', label: 'Firm' },
];
