import Anthropic from '@anthropic-ai/sdk';
import { groundEvidence } from '@/core/requirement/grounding';
import { demote } from '@/core/requirement/state-machine';
import type { Requirement, Utterance } from '@/types';
import { getAnthropicClient, EXTRACT_MODEL } from './client';
import { buildFallbackResult } from './fallback';
import { EXTRACT_SYSTEM_PROMPT } from './prompts/extract';
import { extractResultSchema, type ExtractResult } from './schema';
import { EXTRACT_TOOL, EXTRACT_TOOL_NAME } from './tool';

function formatConversation(utterances: readonly Utterance[]): string {
  return utterances.map((u) => `[${u.index}] ${u.speaker}: ${u.text}`).join('\n');
}

async function callModel(utterances: readonly Utterance[], retryHint?: string): Promise<ExtractResult> {
  const client = getAnthropicClient();
  const conversation = formatConversation(utterances);
  const userText = retryHint
    ? `${conversation}\n\n[이전 응답이 검증에 실패했다: ${retryHint}. 스키마에 맞게 다시 제출해라.]`
    : conversation;

  const response = await client.messages.create({
    model: EXTRACT_MODEL,
    max_tokens: 4096,
    system: EXTRACT_SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: EXTRACT_TOOL_NAME },
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: userText }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) throw new Error('모델이 도구를 호출하지 않았습니다.');
  return extractResultSchema.parse(toolUse.input);
}

/** L1: tool_use + Zod. 실패하면 오류를 덧붙여 1회만 재시도하고, 그래도 실패하면 빈 결과다. */
async function extractWithRetry(utterances: readonly Utterance[]): Promise<ExtractResult> {
  try {
    return await callModel(utterances);
  } catch (firstError) {
    try {
      return await callModel(utterances, String(firstError));
    } catch {
      return { items: [] };
    }
  }
}

/**
 * L0(발화)는 호출부(ingest)가 이미 끝낸 상태로 받는다. 여기서는
 * L1(스키마)→L2(근거)→L3(전이)를 거쳐 Requirement[]를 만든다.
 *
 * existingRequirements는 재분석 대상이다. 모델이 existingId로 기존 카드를
 * 가리키면 그 카드의 현재 status를 demote의 from으로 쓴다 — 신규 항목은
 * '미확정'에서 시작한다. 기존 decision(사람이 이미 확정한 금액·납기)은
 * 재분석으로 지워지지 않는다.
 */
export async function extractRequirements(
  utterances: readonly Utterance[],
  existingRequirements: readonly Requirement[] = [],
): Promise<Requirement[]> {
  if (utterances.length === 0) return [];

  const fallback = buildFallbackResult(utterances);
  const result = fallback.items.length > 0 ? fallback : await extractWithRetry(utterances);

  const existingById = new Map(existingRequirements.map((r) => [r.id, r] as const));
  const requirements: Requirement[] = [];

  for (const item of result.items) {
    const grounded = groundEvidence(utterances, item.evidence);
    if (grounded.length === 0) continue; // 근거가 전부 허구면 항목을 버린다 (L2)

    const existing = item.existingId ? existingById.get(item.existingId) : undefined;
    const from = existing?.status ?? '미확정';

    requirements.push({
      id: existing?.id ?? crypto.randomUUID(),
      title: item.title,
      status: demote(from, item.proposedStatus),
      evidence: grounded,
      basis: existing?.basis ?? { kind: '없음' },
      aiProposedDecision: item.proposedDecision,
      decision: existing?.decision ?? null,
    });
  }

  return requirements;
}
