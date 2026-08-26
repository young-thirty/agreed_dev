'use client';

// 프로젝트를 새로 만드는 자리.
//
// 만든 직후에는 계약 전(Draft)이다. 채널을 붙이고 대화를 가져와야 티켓이 쌓이기 시작하므로,
// 만들고 나면 곧바로 그 프로젝트의 채널 연결로 보낸다.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { createProject } from '@/lib/api';

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-3 focus:outline-accent-soft';

const EMPTY = {
  name: '',
  clientName: '',
  clientEmail: '',
  description: '',
  startDate: '',
  endDate: '',
  contractPrice: '',
};

export function NewProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim() === '') {
      setError('프로젝트 이름을 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createProject(form);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated();
    onClose();
    router.push(`/projects/${res.data.projectId}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0" />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg bg-surface shadow-card-hover"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <p className="text-sm font-medium text-ink">새 프로젝트</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
            프로젝트 이름
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="예: 달램 예약 웹앱"
              className={INPUT_CLASS}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              고객사
              <input
                value={form.clientName}
                onChange={set('clientName')}
                placeholder="예: (주)달램"
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              담당자 메일
              <input
                value={form.clientEmail}
                onChange={set('clientEmail')}
                placeholder="client@example.com"
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
            한 줄 설명
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              placeholder="무엇을 만드는 일인지 짧게 적습니다"
              className={`${INPUT_CLASS} resize-none`}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              시작일
              <input type="date" value={form.startDate} onChange={set('startDate')} className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              종료일
              <input type="date" value={form.endDate} onChange={set('endDate')} className={INPUT_CLASS} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              계약 금액
              <input
                type="number"
                value={form.contractPrice}
                onChange={set('contractPrice')}
                placeholder="12000000"
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <p className="text-xs text-ink-faint">
            계약 전이라 비워 두어도 됩니다. 만든 뒤 채널을 연결해야 고객 메시지가 이 프로젝트로 모입니다.
          </p>

          {error !== null && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            {busy ? '만드는 중…' : '만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
