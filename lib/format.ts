// 화면 여러 곳(자료 아카이브 드로어, 메일 첨부 칩)이 같은 형식으로 파일 크기를 보여준다.

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
