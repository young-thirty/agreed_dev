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

// 백엔드가 메일 조회에 쓰는 형식과 같은 기준이다. 여기서 통과한 주소는 조회에서도 통과한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export default function NewProjectPage() {
  const { addProject } = useAppStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
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

    const email = clientEmail.trim();
    if (email !== '' && !EMAIL_PATTERN.test(email)) {
      setError('클라이언트 메일 주소를 확인하세요. 예: client@company.com');
      return;
    }

    const id = crypto.randomUUID();
    addProject({
      id,
      name: name.trim(),
      clientName: clientName.trim(),
      ...(email === '' ? {} : { clientEmail: email }),
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
      {/* 검증은 handleSubmit이 전담한다. 브라우저 기본 검증이 먼저 걸리면
          이 폼의 다른 항목과 다른 말투·다른 언어로 안내가 뜬다. */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
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
          <label htmlFor="clientEmail" className="text-sm text-ink">
            클라이언트 메일
          </label>
          <input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@company.com"
            className={inputClass}
          />
          <p className="text-xs text-ink-faint">
            이 주소와 주고받은 메일에서 요구사항을 뽑습니다. 나중에 알아도 되지만, 없으면 메일
            분석을 쓸 수 없습니다.
          </p>
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
