import { z } from 'zod';
import { sendEmail } from '@/infra/email/gmail';
import { fail, ok } from '@/lib/api-response';
import { getValidTokens } from '../token';

const requestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  const tokens = await getValidTokens();
  if (tokens === null) return fail('Gmail이 연결되어 있지 않습니다. 먼저 Gmail을 연결해 주세요.');

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('받는 사람, 제목, 본문을 모두 입력해 주세요.');

  try {
    await sendEmail(tokens.accessToken, parsed.data);
    return ok({ sent: true });
  } catch (error) {
    console.error('[gmail] 메일 전송 실패', error);
    return fail('메일을 보내지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
