import Link from 'next/link';
import type { ReactNode } from 'react';

// 로그인·회원가입 레이아웃. 앱 화면과 달리 사이드바가 없다.
// 흰 면에 좁은 한 칼럼만 두고, 시선이 첫 입력칸으로 바로 가도록 나머지를 비운다.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="px-10 py-7">
        <Link href="/login" className="text-[17px] font-bold tracking-[-0.02em] text-ink">
          Agreed
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-6">
        <div className="w-full max-w-[380px] pt-[3vh] pb-10">{children}</div>
      </main>
    </div>
  );
}
