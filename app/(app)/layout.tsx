import type { ReactNode } from 'react';
import { AppStoreProvider } from '@/components/AppStore';
import { DemoPanel } from '@/components/DemoPanel';
import { Sidebar } from '@/components/Sidebar';

// 앱 공통 레이아웃. 좌측 네비게이션 + 본문.
//
// 프로젝트·티켓 조회는 여기서 시작한다. 로그인 화면에는 세션이 없으므로
// 루트가 아니라 이 안쪽에 둔다. 로그인을 마치고 들어올 때마다 새로 조회된다.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppStoreProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <DemoPanel />
    </AppStoreProvider>
  );
}
