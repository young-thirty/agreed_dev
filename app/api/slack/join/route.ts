import { z } from 'zod';
import { joinChannel } from '@/infra/slack/api';
import { fail, ok } from '@/lib/api-response';
import { findBotToken } from '../store';

const requestSchema = z.object({ teamId: z.string().min(1), channelId: z.string().min(1) });

// 공개 채널에 봇을 참가시킨다. 비공개 채널은 여기서 실패한다 — 사람이 슬랙에서 직접 초대해야 한다.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('채널을 먼저 선택해 주세요.');

  const botToken = await findBotToken(parsed.data.teamId);
  if (botToken === null) return fail('연결되지 않은 워크스페이스입니다. Slack을 다시 연결해 주세요.');

  try {
    await joinChannel(botToken, parsed.data.channelId);
    return ok({ joined: true });
  } catch (error) {
    console.error('[slack] 채널 참가 실패', error);
    return fail(
      '이 채널에 봇을 추가하지 못했습니다. 비공개 채널이면 슬랙에서 봇을 직접 초대해 주세요.',
      500,
    );
  }
}
