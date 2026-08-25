import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/infra/slack/api';

// 브라우저 주소창으로 직접 여는 진입점이라 GET이다. POST + JSON 응답 규약의 예외다.
export function GET() {
  try {
    return NextResponse.redirect(buildAuthUrl());
  } catch {
    return new Response(
      'Slack 연동 설정이 없습니다. .env.local에 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI를 채우고 서버를 다시 시작해 주세요.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
}
