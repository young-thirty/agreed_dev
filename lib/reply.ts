// 답변 초안의 말투 목록.
//
// 실제 문구는 백엔드가 AI로 만든다(POST /projects/{id}/requirements/{id}/reply).
// 말투별 성격은 백엔드의 REPLY_SYSTEM_PROMPT에 적혀 있다. 화면은 어떤 말투로
// 만들지 고르는 것까지만 한다.

import type { Tone } from '@/types';

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'concise', label: 'Concise' },
  { value: 'firm', label: 'Firm' },
  // 거절은 말투가 아니라 사람이 내린 결정이다. 고를 때만 거절하는 초안이 나온다.
  { value: 'decline', label: '거절' },
];
