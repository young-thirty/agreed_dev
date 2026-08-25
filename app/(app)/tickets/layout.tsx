import type { ReactNode } from 'react';
import { WorkList } from '@/components/WorkList';

// 좌측 목록을 고정한 채 우측에서 하나를 처리한다.
export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <WorkList />
      <div className="min-w-0 flex-1 overflow-y-auto bg-paper">{children}</div>
    </div>
  );
}
