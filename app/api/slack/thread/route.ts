import { z } from 'zod';
import { fetchReplies } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({
  teamId: z.string().min(1),
  channelId: z.string().min(1),
  threadTs: z.string().min(1),
  oldest: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('스레드를 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    const replies = await fetchReplies(
      botToken,
      parsed.data.teamId,
      parsed.data.channelId,
      parsed.data.threadTs,
      parsed.data.oldest,
    );
    return ok(replies);
  } catch (error) {
    console.error('[slack] 스레드 조회 실패', error);
    return fail('스레드를 가져오지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
