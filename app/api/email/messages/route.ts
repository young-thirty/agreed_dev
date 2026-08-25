import { groupByCompany } from '@/core/email/grouping';
import { fetchMyAddress, fetchRecent } from '@/infra/email/gmail';
import { fail, ok } from '@/lib/api-response';
import { getValidTokens } from '../token';

const MAX_MESSAGES = 20;

export async function POST() {
  const tokens = await getValidTokens();
  if (tokens === null) return fail('Gmail이 연결되어 있지 않습니다. 먼저 Gmail을 연결해 주세요.');

  try {
    const [myAddress, emails] = await Promise.all([
      fetchMyAddress(tokens.accessToken),
      fetchRecent(tokens.accessToken, MAX_MESSAGES),
    ]);

    return ok(groupByCompany(emails, [myAddress]));
  } catch (error) {
    // 원인은 서버 로그에만 남긴다. 화면에는 내부 사정을 노출하지 않는다
    console.error('[gmail] 메일 조회 실패', error);
    return fail('Gmail에서 메일을 가져오지 못했습니다. Gmail을 다시 연결해 주세요.', 500);
  }
}
