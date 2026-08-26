// 목 데이터의 시각. 언제 시연하든 "3시간 전"처럼 읽히도록 지금을 기준으로 만든다.

const BASE = Date.now();

export function minutesAgo(n: number): string {
  return new Date(BASE - n * 60_000).toISOString();
}

export function hoursAgo(n: number): string {
  return minutesAgo(n * 60);
}

export function daysAgo(n: number): string {
  return hoursAgo(n * 24);
}

/** YYYY-MM-DD. 계약 시작·종료일처럼 날짜만 쓰는 자리. */
export function dateOnly(offsetDays: number): string {
  return new Date(BASE + offsetDays * 86_400_000).toISOString().slice(0, 10);
}
