'use client';

// 새 프로젝트 생성 화면. 계약 전 단계라 항상 Draft로 만든다.
// status는 입력받지 않고, 워크스페이스에서 사람이 직접 시작으로 올린다.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';

const inputClass =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink-faint';

export default function NewProjectPage() {
  const { addProject } = useAppStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !clientName.trim()) {
      setError('프로젝트 이름과 클라이언트 이름을 입력하세요.');
      return;
    }

    const id = crypto.randomUUID();
    addProject({
      id,
      name: name.trim(),
      clientName: clientName.trim(),
      description: description.trim(),
      startDate,
      endDate,
      budget: Number(budget),
      status: 'draft',
    });
    router.push(`/projects/${id}`);
  };

  return (
    <div className="max-w-xl px-8 py-8">
      {/* 상단 */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        대시보드
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">새 프로젝트</h1>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-ink">
            프로젝트 이름
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientName" className="text-sm text-ink">
            클라이언트 이름
          </label>
          <input
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm text-ink">
            간단 설명
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDate" className="text-sm text-ink">
              시작일
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="endDate" className="text-sm text-ink">
              예상 종료일
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="budget" className="text-sm text-ink">
            계약 금액 (원)
          </label>
          <input
            id="budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <p className="text-xs text-ink-faint">
          새 프로젝트는 Draft로 생성됩니다. 계약이 체결되면 워크스페이스에서 &lsquo;프로젝트 시작&rsquo;을
          누르세요.
        </p>

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary">
            프로젝트 만들기
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
