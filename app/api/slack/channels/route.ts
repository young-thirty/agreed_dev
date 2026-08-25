import { z } from 'zod';
import { listChannels } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({ teamId: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('워크스페이스를 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    return ok(await listChannels(botToken));
  } catch (error) {
    console.error('[slack] 채널 목록 조회 실패', error);
    return fail('채널 목록을 가져오지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
