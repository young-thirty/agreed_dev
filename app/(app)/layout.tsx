import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';

// 온보딩 이후의 앱 화면 공통 레이아웃. 좌측 사이드바 + 본문.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
