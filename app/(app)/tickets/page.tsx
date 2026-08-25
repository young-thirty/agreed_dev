// 아직 아무것도 고르지 않은 상태.
export default function TicketsEmptyPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-10 text-center">
      <p className="text-sm text-ink-muted">왼쪽에서 티켓을 선택하세요.</p>
      <p className="max-w-sm text-xs text-ink-faint">
        새 고객 메시지가 붙은 티켓을 열면 계약·과거 대화·기존 티켓을 확인한 분석과 답변 초안이 함께 나타납니다.
      </p>
    </div>
  );
}
