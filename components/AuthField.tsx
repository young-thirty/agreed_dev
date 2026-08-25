'use client';

// 로그인·회원가입 화면의 입력 한 칸. 두 화면이 같은 모양을 쓴다.
// 평소에는 옅은 회색 면이고, 포커스가 들어오면 흰 면 + 파란 테두리로 바뀐다.

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  /** 잘못 입력했을 때 칸 아래에 붙는 안내. 없으면 빈 자리도 만들지 않는다. */
  error?: string;
}

export function AuthField({ id, label, type = 'text', error, ...props }: AuthFieldProps) {
  // 비밀번호 찾기가 없으므로, 오타를 스스로 확인할 수 있게 보기 토글을 둔다.
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-ink-muted">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? `${id}-error` : undefined}
          className={`w-full rounded-md border bg-paper py-3 pl-4 text-[15px] text-ink transition-colors outline-transparent placeholder:text-ink-faint focus:bg-surface focus:outline-3 focus:outline-offset-0 ${
            isPassword ? 'pr-12' : 'pr-4'
          } ${error !== undefined ? 'border-danger focus:outline-danger-soft' : 'border-line focus:border-accent focus:outline-accent-soft'}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? '비밀번호 가리기' : '비밀번호 보기'}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-ink-faint transition-colors hover:text-ink-muted"
          >
            {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>

      {error !== undefined && (
        <p id={`${id}-error`} className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
