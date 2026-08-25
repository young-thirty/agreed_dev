'use client';

// 앱 좌측 네비게이션. 복잡하지 않게 최소 항목만 둔다.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plug, Plus, RotateCcw } from 'lucide-react';
import { useResetAll } from '@/hooks/usePersistedState';
import { useAppStore } from '@/components/AppStore';

const NAV = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/integrations', label: '연동', icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  const resetAll = useResetAll();
  const { user } = useAppStore();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Agreed
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? 'bg-paper font-medium text-ink' : 'text-ink-muted hover:bg-paper'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        <Link
          href="/projects/new"
          className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-paper"
        >
          <Plus className="size-4" />새 프로젝트
        </Link>
      </nav>

      <div className="border-t border-line p-3">
        {user && (
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink-faint">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={resetAll}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-paper"
        >
          <RotateCcw className="size-3.5" />
          처음부터 다시
        </button>
      </div>
    </aside>
  );
}
