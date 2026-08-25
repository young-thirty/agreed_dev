import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/infra/email/gmail';

// 브라우저 주소창으로 직접 여는 진입점이라 GET이다. POST + JSON 응답 규약의 예외다.
export function GET() {
  try {
    return NextResponse.redirect(buildAuthUrl());
  } catch {
    // 설정이 빠진 상태는 개발자가 고쳐야 하므로, 무엇을 채워야 하는지 그대로 알려준다
    return new Response(
      'Google 연동 설정이 없습니다. .env.local에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI를 채우고 서버를 다시 시작해 주세요.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
}
