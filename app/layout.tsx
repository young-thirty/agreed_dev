import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agreed',
  description: '계약 이후 고객 대화에서 새 요구사항을 찾아, 지금 합의된 계약 상태를 최신으로 유지합니다.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
