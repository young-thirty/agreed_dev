// 화면에 값을 찍을 때 쓰는 표시 규칙. 날짜·금액 포맷을 한 곳에 모은다.

import { NOW } from '@/mocks';
import type { DecisionField } from '@/types';

/** "10분 전" · "3시간 전" · "2일 전". 시연 기준 시각(NOW)을 기준으로 계산한다. */
export function relativeTime(iso: string): string {
  const diff = NOW - new Date(iso).getTime();
  if (diff < 60_000) return '방금 전';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/** 2026.08.26 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 2026.08.26 09:12 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 9월 2일. 답변 문장 안에 들어가는 형태다. 날짜로 못 읽으면 입력값을 그대로 둔다. */
export function formatDayInSentence(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 300000 → 30만원. 문장에 넣어도 어색하지 않게 만 단위로 줄인다. */
export function won(value: number): string {
  if (value === 0) return '없음';
  if (value >= 10_000 && value % 10_000 === 0) {
    return `${(value / 10_000).toLocaleString('ko-KR')}만원`;
  }
  return `${value.toLocaleString('ko-KR')}원`;
}

/**
 * 답변 초안의 {{필드id}} 자리에 사람이 확정한 값을 넣는다.
 * 아직 정하지 않은 값은 "(추가 비용 미정)"처럼 남겨, 확정 전에 그대로 보내는 일을 막는다.
 */
export function fillDraft(
  text: string,
  fields: DecisionField[],
  values: Record<string, string>,
): string {
  return fields.reduce((acc, field) => {
    const raw = values[field.id];
    const filled =
      raw === undefined || raw === ''
        ? `(${field.label} 미정)`
        : field.type === 'money' && !Number.isNaN(Number(raw))
          ? won(Number(raw))
          : field.type === 'date'
            ? formatDayInSentence(raw)
            : raw;
    return acc.replaceAll(`{{${field.id}}}`, filled);
  }, text);
}

/** 화면 여러 곳(자료 드로어, 첨부 칩)이 같은 형식으로 파일 크기를 보여준다. */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
