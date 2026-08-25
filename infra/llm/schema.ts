import { z } from 'zod';
import { LLM_PROPOSABLE } from '@/core/requirement/state-machine';

/**
 * L1 스키마. tool_use로 강제한 뒤 이 스키마로 한 번 더 검증한다.
 *
 * proposedStatus는 LLM_PROPOSABLE(합의·완료·거절 제외)만 받는다. 도구
 * 입력 스키마(tool.ts)도 이 배열을 그대로 써서 모델이 애초에 그 값을
 * 낼 수 없게 만든다.
 *
 * proposedDecision은 대화에 금액·납기 근거가 있을 때만 모델이 채운다.
 * 근거 없이 채운 값이라도 사람이 확정(Requirement.decision)하기 전까지는
 * 화면에 참고용으로만 쓰이고 계약에는 반영되지 않는다.
 */
export const extractedItemSchema = z.object({
  title: z.string().max(40),
  proposedStatus: z.enum(LLM_PROPOSABLE),
  evidence: z
    .array(
      z.object({
        utteranceIndex: z.number().int(),
        quote: z.string(),
      }),
    )
    .min(1),
  existingId: z.string().nullable(),
  proposedDecision: z
    .object({
      amountDelta: z.number(),
      dueDate: z.string(),
      note: z.string().optional(),
    })
    .nullable(),
});

export const extractResultSchema = z.object({
  items: z.array(extractedItemSchema),
});

export type ExtractedItem = z.infer<typeof extractedItemSchema>;
export type ExtractResult = z.infer<typeof extractResultSchema>;
