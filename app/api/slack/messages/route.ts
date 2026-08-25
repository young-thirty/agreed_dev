import { z } from 'zod';
import { fetchHistory } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({
  teamId: z.string().min(1),
  channelId: z.string().min(1),
  oldest: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('채널을 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    const messages = await fetchHistory(botToken, parsed.data.channelId, parsed.data.oldest);
    return ok(messages);
  } catch (error) {
    // not_in_channel이 대부분이다 — 비공개 채널에 봇이 아직 없는 경우
    console.error('[slack] 메시지 조회 실패', error);
    return fail('이 채널의 메시지를 가져오지 못했습니다. 봇이 채널에 있는지 확인해 주세요.', 500);
  }
}
