import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode } from '@/infra/slack/api';
import { addWorkspace } from '../store';

// Slack이 설치를 마치면 사용자를 이 주소로 돌려보낸다. 결과는 물음표 뒤에 붙여 화면에 알린다.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (code === null) return NextResponse.redirect(new URL('/?slack=denied', req.url));

  try {
    const workspace = await exchangeCode(code);
    await addWorkspace(workspace);
    return NextResponse.redirect(new URL('/?slack=connected', req.url));
  } catch (error) {
    console.error('[slack] 설치 실패', error);
    return NextResponse.redirect(new URL('/?slack=failed', req.url));
  }
}
