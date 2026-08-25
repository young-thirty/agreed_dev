'use client';

import { useResetAll } from '@/hooks/usePersistedState';

export default function Home() {
  const resetAll = useResetAll();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-8 py-16">
      <header className="flex items-start justify-between gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Agreed</h1>
          <p className="text-ink-muted">
            계약 이후 고객 대화에서 새 요구사항을 찾아, 지금 합의된 계약 상태를 최신으로 유지합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="shrink-0 rounded-md border border-line px-4 py-2 text-sm hover:bg-surface"
        >
          처음부터 다시
        </button>
      </header>

      <section className="rounded-lg border border-line bg-surface px-8 py-20 text-center text-ink-muted">
        아직 화면이 없습니다. 기능 명세가 확정되면 계약과 요구사항이 여기에 표시됩니다.
      </section>
    </main>
  );
}
