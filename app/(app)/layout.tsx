import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';

// 앱 공통 레이아웃. 좌측 네비게이션 + 본문.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
