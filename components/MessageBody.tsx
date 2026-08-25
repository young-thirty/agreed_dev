'use client';

// 받은 메시지 본문. 인용된 이전 대화는 접어 두고, 서명은 걷어낸다.
// 인용된 내용은 티켓의 지난 대화에 이미 쌓여 있어서, 펼쳐 두면 같은 글을 여러 번 읽게 된다.

import { useState } from 'react';
import { splitQuoted } from '@/lib/email-clean';

/** 인용 겹 수를 들여쓰기로 보여준다. '>' 마커를 그대로 두면 읽히지 않는다. */
const INDENT = ['', 'ml-3', 'ml-6', 'ml-9', 'ml-12'] as const;

export function MessageBody({ body, className }: { body: string; className: string }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { kept, quoted } = splitQuoted(body);

  return (
    <>
      <p className={`whitespace-pre-wrap ${className}`}>
        {kept.length > 0 ? kept.join('\n') : '인용된 이전 대화만 있는 메시지입니다.'}
      </p>

      {quoted.length > 0 && (
        <button
          type="button"
          onClick={() => setShowQuoted((on) => !on)}
          className="mt-2 text-xs text-ink-faint hover:text-ink"
        >
          {showQuoted ? '인용된 이전 대화 접기' : `인용된 이전 대화 ${quoted.length}줄 보기`}
        </button>
      )}

      {showQuoted && (
        <div className="mt-1 flex flex-col gap-1">
          {quoted.map((line, order) => {
            // 머리말이 연달아 나오면(전달 메일의 보낸사람·날짜·제목) 한 덩어리로 붙인다.
            const continued = order > 0 && quoted[order - 1].header;
            return (
              <p
                key={order}
                className={`text-xs ${INDENT[Math.min(line.depth, INDENT.length - 1)]} ${
                  line.header
                    ? `font-medium text-ink-faint${continued ? '' : ' mt-1.5'}`
                    : 'border-l-2 border-line pl-2 text-ink-muted'
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      )}
    </>
  );
}
