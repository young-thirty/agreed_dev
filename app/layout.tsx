import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agreed',
  description: '고객 메시지를 분석해 무엇이 바뀌는지 알려주고, 보낼 답변 초안까지 만들어 줍니다.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-paper text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
