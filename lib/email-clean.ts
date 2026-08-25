// 메일 원문에서 분석에 방해되는 부분을 규칙으로 지운다.
//
// 규칙은 지우는 데만 쓴다. 무엇이 요구사항인지 고르는 판단은 백엔드의 AI가 한다.
// 키워드로 골라내려 들면 "혹시 이건 어렵겠죠?" 같은 완곡한 요청을 놓친다.

import type { RawEmail } from '@/types/integrations';

/** 사람이 쓰지 않은 메일. 원문에 헤더가 없으므로 발신 주소 패턴으로만 판별한다. */
const AUTOMATED_SENDER =
  /(no-?reply|donotreply|do-not-reply|mailer-daemon|postmaster|bounce|newsletter|notification)/i;

/**
 * 인용된 이전 대화가 시작되는 머리말. 여기부터 끝까지가 인용이다.
 *
 * 줄 앞에 고정하지 않는다. 본문이 text/html뿐이면 백엔드가 줄바꿈을 공백으로
 * 눌러 한 줄로 내려보내는데, 그때도 찾아낼 수 있어야 하기 때문이다.
 */
const QUOTE_HEADER: RegExp[] = [
  // ---------- Forwarded message ---------- / -----Original Message-----
  /-{3,}\s*(forwarded message|original message|원본\s*(메시지|메일)|전달된\s*메시지)/i,
  // 2026년 8월 25일 (화) 오후 11:48, 홍길동 <hong@x.com>님이 작성:
  /\d{4}년\s.{0,120}?님이\s*(작성|씀)\s*[:：]/,
  // On Mon, Aug 25, 2026 at 3:14 PM Hong <hong@x.com> wrote:
  /\bon\s.{0,160}?@.{0,80}?\bwrote\s*[:：]/i,
  // 보낸 사람: 홍길동 <hong@x.com>
  /(^|\n)\s*(보낸\s*사람|from)\s*[:：]\s*[^\n]{0,80}@/i,
];

/** 본문이 끝나고 서명이 시작되는 줄. */
const SIGNATURE_LINE: RegExp[] = [
  /^--\s*$/, // 서명 구분자
  /^_{5,}$/, // Outlook 구분선
];

/** 백엔드 발화 분할은 콜론 앞 20자까지만 화자로 인식한다. 넉넉히 줄여 둔다. */
const MAX_SPEAKER_LENGTH = 12;

function quoteStart(text: string): number {
  let earliest = -1;
  for (const header of QUOTE_HEADER) {
    const found = header.exec(text);
    if (found !== null && (earliest === -1 || found.index < earliest)) {
      earliest = found.index;
    }
  }
  return earliest;
}

/**
 * 본문을 '이 메일에서 새로 쓴 부분'과 '인용된 이전 대화'로 가른다.
 *
 * 인용된 쪽은 목록에 자기 메일로 이미 따로 있으므로 화면에서는 접어 둔다.
 * 서명은 어느 쪽도 아니라서 버린다.
 */
export function splitQuoted(body: string): { kept: string[]; quoted: string[] } {
  const text = body.replace(/\r\n/g, '\n');
  const start = quoteStart(text);

  const lines = (start === -1 ? text : text.slice(0, start))
    .split('\n')
    .map((line) => line.trim());
  const signature = lines.findIndex((line) => SIGNATURE_LINE.some((rule) => rule.test(line)));
  const written = signature === -1 ? lines : lines.slice(0, signature);

  return {
    kept: written.filter((line) => line !== '' && !line.startsWith('>')),
    quoted:
      start === -1
        ? []
        : text
            .slice(start)
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== ''),
  };
}

/** 분석에 넘길 부분. 인용과 서명을 뺀 나머지다. */
export function cleanBody(body: string): string[] {
  return splitQuoted(body).kept;
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
