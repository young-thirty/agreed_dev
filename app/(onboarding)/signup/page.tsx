'use client';

// 회원가입 화면. 인증은 없고 데모용 프로필만 입력받는다.
// 제출하면 전역 상태에 사용자를 저장하고 연동 화면으로 넘어간다.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { useAppStore } from '@/components/AppStore';

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink-faint';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('이름을 입력하세요.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('이메일을 @ 를 포함해 입력하세요.');
      return;
    }

    setError('');
    setUser({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      isFreelancer,
    });
    router.push('/integrations');
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-lg font-semibold text-ink">Agreed</p>
        <p className="mt-1 text-sm text-ink-muted">
          계약 이후 바뀌는 요구사항을 놓치지 않게 추적합니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-ink">
            이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="홍길동"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-ink">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm text-ink">
            직업 / 역할
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
            placeholder="예: 웹 개발자, 디자이너"
          />
        </div>

        <label htmlFor="isFreelancer" className="flex items-center gap-2 text-sm text-ink">
          <input
            id="isFreelancer"
            type="checkbox"
            checked={isFreelancer}
            onChange={(e) => setIsFreelancer(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          프리랜서 개발자입니다
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" variant="primary" className="w-full">
          시작하기
        </Button>
      </form>
    </div>
  );
}
