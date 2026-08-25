import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { applyToContract } from '@/core/contract/apply';
import { diffContract } from '@/core/contract/diff';
import type { Contract, Requirement } from '@/types';

// L4 승인 게이트. 계약을 바꾸는 통로는 이 라우트 하나뿐이다.

const requestSchema = z.object({
  contract: z.unknown(),
  requirement: z.unknown(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('요청 형식이 올바르지 않습니다.');

  try {
    const contract = parsed.data.contract as Contract;
    const requirement = parsed.data.requirement as Requirement;
    const next = applyToContract(contract, requirement);
    return ok({ contract: next, diff: diffContract(contract, next) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '계약에 반영하지 못했습니다.');
  }
}
