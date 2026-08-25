import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { extractResultSchema } from './schema';

export const EXTRACT_TOOL_NAME = 'submit_requirements';

/** extractResultSchema에서 JSON 스키마를 직접 뽑는다. 스키마를 두 번 쓰지 않는다. */
export const EXTRACT_TOOL: Anthropic.Tool = {
  name: EXTRACT_TOOL_NAME,
  description:
    '대화에서 찾아낸 요구사항 목록을 제출한다. 요구사항이 없으면 빈 배열을 제출한다.',
  input_schema: z.toJSONSchema(extractResultSchema) as unknown as Anthropic.Tool.InputSchema,
};
