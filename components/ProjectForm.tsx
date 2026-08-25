'use client';

// 프로젝트 입력 폼. 새로 만들 때와 고칠 때가 같은 항목을 받으므로 한 곳에 둔다.
// 저장은 호출부가 한다. 여기서는 입력과 검증까지만 맡는다.

import { useState } from 'react';
import { Button } from '@/components/Button';
import type { ProjectDraft } from '@/components/AppStore';

const inputClass =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink-faint';

// 백엔드가 메일 조회에 쓰는 형식과 같은 기준이다. 여기서 통과한 주소는 조회에서도 통과한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export function ProjectForm({
  initial,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProjectDraft;
  submitLabel: string;
  savingLabel: string;
  /** 저장하고, 실패하면 사용자가 읽을 문장을 돌려준다. 성공이면 null이다. */
  onSubmit: (draft: ProjectDraft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [clientName, setClientName] = useState(initial.clientName);
  const [clientEmail, setClientEmail] = useState(initial.clientEmail ?? '');
  const [description, setDescription] = useState(initial.description);
  const [startDate, setStartDate] = useState(initial.startDate ?? '');
  const [endDate, setEndDate] = useState(initial.endDate ?? '');
  const [budget, setBudget] = useState(
    initial.contractPrice === null ? '' : String(initial.contractPrice),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setSaving(true);
    setError('');
    const failure = await onSubmit({
      name: name.trim(),
      clientName: clientName.trim(),
      clientEmail: email === '' ? null : email,
      description: description.trim(),
      startDate: startDate === '' ? null : startDate,
      endDate: endDate === '' ? null : endDate,
      contractPrice: budget === '' ? null : Number(budget),
    });
    setSaving(false);
    if (failure !== null) setError(failure);
  };

  return (
    // 검증은 handleSubmit이 전담한다. 브라우저 기본 검증이 먼저 걸리면
    // 이 폼의 다른 항목과 다른 말투·다른 언어로 안내가 뜬다.
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

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          취소
        </Button>
      </div>
    </form>
  );
}
