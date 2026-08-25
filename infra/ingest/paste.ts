import type { Channel, Utterance } from '@/types';

/**
 * "화자: 내용" 형식의 줄로 이루어진 붙여넣은 대화를 발화 단위로 정규화한다.
 * L0(발화 분할)에 해당한다.
 *
 * 콜론이 줄 앞쪽(20자 이내)에 있을 때만 화자로 인식한다 — URL이나 시각
 * 표기에 섞인 콜론과 구분하기 위해서다. 화자를 못 찾으면 통째로 본문으로 둔다.
 */
export function toUtterances(rawText: string, channel: Channel): Utterance[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    const colonIndex = line.indexOf(':');
    const hasSpeaker = colonIndex > 0 && colonIndex < 20;

    return {
      index,
      channel,
      speaker: hasSpeaker ? line.slice(0, colonIndex).trim() : '알수없음',
      text: hasSpeaker ? line.slice(colonIndex + 1).trim() : line,
    };
  });
}
