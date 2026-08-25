import { findBotToken } from '../store';

const ALLOWED_HOST_SUFFIX = '.slack.com';
const TIMEOUT_MS = 8000;

/**
 * Slack 파일(url_private)을 봇 토큰으로 대신 인증해 그대로 흘려준다.
 * <img src>가 GET으로 로드하므로 { ok, data } 규약의 예외다.
 *
 * url을 Slack 도메인으로 제한하지 않으면, 요청자가 아무 주소나 넣어서 우리 서버가
 * 봇 토큰을 실어 보내는 열린 프록시가 된다. 반드시 검증한다.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const fileUrl = searchParams.get('url');
  if (teamId === null || fileUrl === null) {
    return new Response('잘못된 요청입니다.', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(fileUrl);
  } catch {
    return new Response('잘못된 요청입니다.', { status: 400 });
  }
  if (target.protocol !== 'https:' || !target.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return new Response('허용되지 않은 주소입니다.', { status: 400 });
  }

  const botToken = await findBotToken(teamId);
  if (botToken === null) {
    return new Response('연결되지 않은 워크스페이스입니다.', { status: 401 });
  }

  try {
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${botToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok || res.body === null) {
      // Slack이 왜 거절했는지(권한 부족, 만료된 링크 등)를 알아야 다음에 원인을 좁힐 수 있다
      console.error('[slack] 파일 프록시 실패', res.status, await res.text().catch(() => ''));
      return new Response('파일을 가져오지 못했습니다.', { status: 502 });
    }
    return new Response(res.body, {
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream' },
    });
  } catch (error) {
    console.error('[slack] 파일 프록시 실패', error);
    return new Response('파일을 가져오지 못했습니다.', { status: 502 });
  }
}
