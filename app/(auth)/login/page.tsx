'use client';

// 로그인 화면. 메일과 비밀번호가 맞으면 바로 앱으로 들어간다.
// 연동을 했는지 여부는 여기서 보지 않는다. 로그인은 로그인까지만 한다.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthField } from '@/components/AuthField';
import { HOME_PATH, login } from '@/lib/auth';

interface Errors {
  email?: string;
  password?: string;
  /** 입력은 형식에 맞는데 계정이 맞지 않을 때. 칸이 아니라 버튼 위에 붙는다. */
  form?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!email.trim()) next.email = '메일을 입력해 주세요.';
    else if (!email.includes('@')) next.email = '메일 주소를 다시 확인해 주세요.';
    if (!password) next.password = '비밀번호를 입력해 주세요.';

    if (next.email !== undefined || next.password !== undefined) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const res = await login({ email, password });
    if (!res.ok) {
      setErrors({ form: res.error });
      setSubmitting(false);
      return;
    }

    router.push(HOME_PATH);
  };

  return (
    <>
      <h1 className="text-[26px] leading-[1.42] font-bold tracking-[-0.025em] text-ink">
        메일과 비밀번호를
        <br />
        입력해 주세요
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <AuthField
          id="email"
          label="메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />

        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="비밀번호"
          autoComplete="current-password"
        />

        {errors.form !== undefined && (
          <p role="alert" className="text-[13px] text-danger">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-md bg-accent py-3 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? '확인하는 중…' : '로그인'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          회원가입
        </Link>
      </p>
    </>
  );
}
