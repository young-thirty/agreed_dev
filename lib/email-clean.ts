// 메일 원문에서 분석에 방해되는 부분을 규칙으로 지운다.
//
// 규칙은 지우는 데만 쓴다. 무엇이 요구사항인지 고르는 판단은 백엔드의 AI가 한다.
// 키워드로 골라내려 들면 "혹시 이건 어렵겠죠?" 같은 완곡한 요청을 놓친다.

import type { RawEmail } from '@/types/integrations';

/** 사람이 쓰지 않은 메일. 원문에 헤더가 없으므로 발신 주소 패턴으로만 판별한다. */
const AUTOMATED_SENDER =
  /(no-?reply|donotreply|do-not-reply|mailer-daemon|postmaster|bounce|newsletter|notification)/i;

/** 이 줄부터 아래는 이전 메일의 인용이거나 서명이다. 만나면 그 아래를 통째로 버린다. */
const TAIL_MARKER: RegExp[] = [
  /^--\s*$/, // 서명 구분자
  /^_{5,}$/, // Outlook 구분선
  /^-{3,}.*(original message|원본\s*(메시지|메일)).*$/i, // 회신 원문 머리말
  /^on\s.+\bwrote:$/i, // Gmail 영문 회신 머리말
  /^\d{4}년\s.+(작성|씀)\s*[:：]?$/, // Gmail 한국어 회신 머리말
  /^(보낸\s*사람|from)\s*[:：]\s*\S+/i, // Outlook 회신 머리말
];

/** 백엔드 발화 분할은 콜론 앞 20자까지만 화자로 인식한다. 넉넉히 줄여 둔다. */
const MAX_SPEAKER_LENGTH = 12;

/**
 * 본문에서 인용 블록과 서명을 지우고 남은 줄만 돌려준다.
 * 회신 머리말 아래는 전부 이전 대화이므로 한 줄씩 보지 않고 통째로 버린다.
 */
export function cleanBody(body: string): string[] {
  const lines = body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim());

  const tail = lines.findIndex((line) => TAIL_MARKER.some((marker) => marker.test(line)));
  const kept = tail === -1 ? lines : lines.slice(0, tail);

  return kept.filter((line) => line !== '' && !line.startsWith('>'));
}

/** 자동 발송 메일을 뺀 목록. 사람이 쓴 메일만 남는다. */
export function humanEmails(emails: RawEmail[]): RawEmail[] {
  return emails.filter((email) => !AUTOMATED_SENDER.test(email.from.address));
}

function speakerOf(email: RawEmail): string {
  const name = (email.from.name || email.from.address).replace(/[:：]/g, ' ').trim();
  return name.slice(0, MAX_SPEAKER_LENGTH) || '고객';
}

/**
 * 정리한 메일들을 백엔드 분석이 읽는 '보낸사람: 내용' 줄 목록으로 만든다.
 * 한 줄이 발화 하나가 되므로, 돌아온 근거 인용이 원문 어느 줄이었는지 되짚을 수 있다.
 */
export function buildRawText(emails: RawEmail[]): string {
  return [...emails]
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    .flatMap((email) => {
      const speaker = speakerOf(email);
      return cleanBody(email.body).map((line) => `${speaker}: ${line}`);
    })
    .join('\n');
}
