// 선택한 확인 질문과 톤으로 고객에게 보낼 답변 초안을 만든다.
// 프레임워크에 의존하지 않는 순수 함수다. 화면은 이 결과를 그대로 보여주고 사용자가 편집한다.

import type { Tone } from '@/types';

interface ToneVoice {
  label: string;
  intro: string;
  bridge: string; // 질문 목록 앞 한 줄
  outro: string;
}

const VOICES: Record<Tone, ToneVoice> = {
  friendly: {
    label: 'Friendly',
    intro: '안녕하세요! 요청 내용 잘 확인했습니다 :)',
    bridge:
      '말씀 주신 내용을 진행하기 전에, 아래 몇 가지만 함께 확인하면 더 정확하게 반영할 수 있을 것 같아요.',
    outro: '확인해 주시면 작업 범위와 일정 정리해서 바로 다시 안내드릴게요. 감사합니다!',
  },
  professional: {
    label: 'Professional',
    intro: '안녕하세요. 보내주신 요청 확인했습니다.',
    bridge:
      '요청 주신 내용 중 일부는 기존에 정리된 개발 범위에서 명확하게 확인되지 않아, 아래 사항을 여쭙고자 합니다.',
    outro:
      '위 내용 확인해 주시면 작업 범위와 일정을 점검하여 다시 안내드리겠습니다. 감사합니다.',
  },
  concise: {
    label: 'Concise',
    intro: '요청 확인했습니다. 진행 전 아래만 확인 부탁드립니다.',
    bridge: '',
    outro: '회신 주시면 범위·일정 정리해 다시 공유드리겠습니다.',
  },
  firm: {
    label: 'Firm',
    intro: '안녕하세요. 요청 내용 확인했습니다.',
    bridge:
      '요청하신 항목 중 일부는 기존 계약 범위에 포함되어 있지 않아, 별도의 추가 작업으로 진행될 수 있습니다. 정확한 범위 산정을 위해 아래 사항을 먼저 확인 부탁드립니다.',
    outro:
      '확인해 주시면 추가 작업 범위와 그에 따른 일정·비용 조정안을 정리해 회신드리겠습니다. 기존 일정 내 반영이 필요한 경우, 현재 작업 우선순위 조정이 함께 필요할 수 있는 점 미리 안내드립니다.',
  },
};

export const TONE_OPTIONS: { value: Tone; label: string }[] = (
  Object.keys(VOICES) as Tone[]
).map((value) => ({ value, label: VOICES[value].label }));

/**
 * 톤과 선택된 질문 목록으로 답변 초안을 만든다.
 * 질문이 없으면 확인 절차 없이 짧게 수락 형태로 마무리한다.
 */
export function generateReply(tone: Tone, questions: string[]): string {
  const v = VOICES[tone];

  if (questions.length === 0) {
    return [v.intro, '요청하신 내용은 현재 계약 범위 안에서 반영 가능합니다. 진행하겠습니다.'].join(
      '\n\n',
    );
  }

  const list = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  return [v.intro, v.bridge, list, v.outro].filter(Boolean).join('\n\n');
}
