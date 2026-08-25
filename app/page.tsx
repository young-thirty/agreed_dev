import { redirect } from 'next/navigation';

// 진입점. 티켓 목록이 기본 화면이다.
export default function Home() {
  redirect('/tickets');
}
