'use client';

// 진입점. 온보딩을 마쳤으면 대시보드로, 아니면 회원가입으로 보낸다.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/components/AppStore';

export default function Home() {
  const router = useRouter();
  const { user } = useAppStore();

  useEffect(() => {
    router.replace(user ? '/dashboard' : '/signup');
  }, [user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-ink-muted">
      불러오는 중…
    </main>
  );
}
