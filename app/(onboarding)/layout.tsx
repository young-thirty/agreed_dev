import type { ReactNode } from 'react';

// 회원가입·연동 등 온보딩 화면 레이아웃. 사이드바 없이 중앙 정렬.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
