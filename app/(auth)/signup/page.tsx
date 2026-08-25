'use client';

// 회원가입 화면. 가입이 끝나면 로그인된 상태로 바로 앱에 들어간다.
// 비밀번호 찾기가 없으므로 오타가 치명적이다. 비밀번호 칸의 보기 토글이 그 몫을 한다.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthField } from '@/components/AuthField';
import { HOME_PATH, signup } from '@/lib/auth';

const MIN_PASSWORD = 8;

interface Errors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  /** 형식은 맞는데 가입이 안 되는 경우. 버튼 위에 붙는다. */
  form?: string;
}

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!name.trim()) next.name = '이름을 입력해 주세요.';
    if (!email.trim()) next.email = '메일을 입력해 주세요.';
    else if (!email.includes('@')) next.email = '메일 주소를 다시 확인해 주세요.';
    if (!phoneNumber.trim()) next.phoneNumber = '전화번호를 입력해 주세요.';
    if (password.length < MIN_PASSWORD) {
      next.password = `비밀번호는 ${MIN_PASSWORD}자 이상으로 만들어 주세요.`;
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const res = await signup({ name, email, password, phoneNumber });
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
        Agreed 계정을
        <br />
        만들어 주세요
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <AuthField
          id="name"
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="고객에게 보이는 이름"
          autoComplete="name"
          autoFocus
        />

        <AuthField
          id="email"
          label="메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <AuthField
          id="phoneNumber"
          label="전화번호"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          error={errors.phoneNumber}
          placeholder="010-1234-5678"
          autoComplete="tel"
        />

        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder={`${MIN_PASSWORD}자 이상`}
          autoComplete="new-password"
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
          {submitting ? '계정을 만드는 중…' : '가입하고 시작하기'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}
