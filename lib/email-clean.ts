// 메일 본문에서 읽는 데 방해되는 부분을 규칙으로 걷어낸다.
//
// 규칙은 걷어내는 데만 쓴다. 무엇이 요구사항인지 고르는 판단은 백엔드의 AI가 한다.

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

/** 접어 둔 인용 한 줄. depth는 '>'가 몇 겹인지, 곧 얼마나 이전 대화인지다. */
export type QuotedLine = {
  depth: number;
  text: string;
  /** '누가 작성:' 머리말이면 참. 화면에서 내용과 구분해 그린다. */
  header: boolean;
};

// 2026년 8월 25일 (화) 오후 11:48, 홍길동 <hong@x.com>님이 작성:
const KOREAN_HEADER = /^(\d{4}년\s[^,]+),\s*(.+?)\s*(?:<[^>]*>)?님이\s*(?:작성|씀)\s*[:：]$/;

/** 전달·회신 블록이 달고 오는 메타데이터 줄. 내용이 아니라 머리말로 그린다. */
const HEADER_FIELD =
  /^(보낸\s*사람|받는\s*사람|from|to|cc|date|subject|제목|날짜)\s*[:：]/i;

/** 대시로 그린 구분선. 대시를 걷어내고 무엇의 시작인지만 남긴다. */
const DIVIDER = /^-{3,}\s*(.+?)\s*-*$/;
const DIVIDER_LABEL: [RegExp, string][] = [
  [/forwarded message|전달된\s*메시지/i, '전달된 메일'],
  [/original message|원본\s*(메시지|메일)/i, '이전 메일'],
];

/** 머리말을 짧게 줄인다. 메일 주소와 '님이 작성:', 대시 줄은 읽는 데 방해만 된다. */
function shortHeader(text: string): string {
  const korean = KOREAN_HEADER.exec(text);
  if (korean !== null) return `${korean[2]} · ${korean[1]}`;

  const divider = DIVIDER.exec(text);
  if (divider !== null) {
    const label = DIVIDER_LABEL.find(([rule]) => rule.test(divider[1]));
    if (label !== undefined) return label[1];
  }

  return text;
}

/**
 * 인용 부분을 줄 단위로 편다.
 * '>' 마커는 겹 수로 바꾼다. 화면에서는 마커 대신 들여쓰기로 보여줘야 읽힌다.
 */
function toQuotedLines(tail: string): QuotedLine[] {
  const lines: QuotedLine[] = [];

  for (const raw of tail.split('\n')) {
    let depth = 0;
    let text = raw.trim();
    while (text.startsWith('>')) {
      depth += 1;
      text = text.slice(1).trimStart();
    }
    if (text === '') continue;

    const header = QUOTE_HEADER.some((rule) => rule.test(text)) || HEADER_FIELD.test(text);
    lines.push({ depth, text: header ? shortHeader(text) : text, header });
  }

  return lines;
}

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
 * 인용된 쪽은 티켓의 지난 대화에 이미 따로 쌓여 있으므로 화면에서는 접어 둔다.
 * 서명은 어느 쪽도 아니라서 버린다.
 */
export function splitQuoted(body: string): { kept: string[]; quoted: QuotedLine[] } {
  const text = body.replace(/\r\n/g, '\n');
  const start = quoteStart(text);

  const lines = (start === -1 ? text : text.slice(0, start))
    .split('\n')
    .map((line) => line.trim());
  const signature = lines.findIndex((line) => SIGNATURE_LINE.some((rule) => rule.test(line)));
  const written = signature === -1 ? lines : lines.slice(0, signature);

  return {
    kept: written.filter((line) => line !== '' && !line.startsWith('>')),
    quoted: start === -1 ? [] : toQuotedLines(text.slice(start)),
  };
}

/**
 * 목록에 한 줄로 보여줄 미리보기. 인용과 서명을 걷어낸 본문을 한 줄로 잇는다.
 * 새로 쓴 부분이 없는 메시지(인용만 있는 회신)는 인용 내용이라도 보여준다.
 */
export function previewLine(body: string): string {
  const { kept, quoted } = splitQuoted(body);
  if (kept.length > 0) return kept.join(' ');
  return quoted.find((line) => !line.header)?.text ?? '';
}
