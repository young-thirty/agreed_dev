import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { toUtterances } from '@/infra/ingest/paste';
import { extractRequirements } from '@/infra/llm/extract';
import { CHANNELS, type Requirement } from '@/types';

// 도메인 로직은 없다. 요청을 파싱해 ingest→llm으로 넘기고 응답만 만든다.

const requestSchema = z.object({
  rawText: z.string().min(1),
  channel: z.enum(CHANNELS),
  existingRequirements: z.array(z.unknown()).default([]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail('요청 형식이 올바르지 않습니다.');

  const utterances = toUtterances(parsed.data.rawText, parsed.data.channel);
  if (utterances.length === 0) {
    return fail('대화 내용을 찾을 수 없습니다. 붙여넣은 내용을 확인해 주세요.');
  }

  try {
    const existingRequirements = parsed.data.existingRequirements as Requirement[];
    const requirements = await extractRequirements(utterances, existingRequirements);
    return ok({ utterances, requirements });
  } catch {
    return fail('대화 내용을 분석하지 못했습니다. 다시 시도해 주세요.', 500);
  }
}
