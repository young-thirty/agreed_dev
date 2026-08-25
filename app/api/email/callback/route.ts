import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS, exchangeCode } from '@/infra/email/gmail';

// Google이 인증을 마치면 사용자를 이 주소로 돌려보낸다. 결과는 물음표 뒤에 붙여 화면에 알린다.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (code === null) return NextResponse.redirect(new URL('/?gmail=denied', req.url));

  try {
    const tokens = await exchangeCode(code);
    const res = NextResponse.redirect(new URL('/?gmail=connected', req.url));

    // 토큰은 브라우저 스크립트가 읽을 수 없어야 한다.
    // localStorage에 두면 XSS 한 번에 메일함 전체가 열린다.
    res.cookies.set(TOKEN_COOKIE, JSON.stringify(tokens), TOKEN_COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error('[gmail] 토큰 교환 실패', error);
    return NextResponse.redirect(new URL('/?gmail=failed', req.url));
  }
}
