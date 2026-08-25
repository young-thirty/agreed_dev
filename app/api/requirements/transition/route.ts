import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { transition } from '@/core/requirement/state-machine';
import { REQUIREMENT_STATUS } from '@/types';

// 사람 조작으로 상태를 바꾼다. 불가능한 전이면 400과 안내 문구를 돌려준다.

const requestSchema = z.object({
  from: z.enum(REQUIREMENT_STATUS),
  to: z.enum(REQUIREMENT_STATUS),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('요청 형식이 올바르지 않습니다.');

  try {
    const status = transition(parsed.data.from, parsed.data.to);
    return ok({ status });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '상태를 바꾸지 못했습니다.');
  }
}
