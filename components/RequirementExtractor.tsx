'use client';

// 요청 분석 탭의 실제 데이터 경로.
// 고객 메일 원문을 규칙으로 정리해 백엔드 분석에 넘기고, 돌아온 요구사항 카드를 보여준다.
// 필요 없다고 판단한 카드는 사용자가 지운다. 지운 id만 프로젝트별로 남긴다.

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { post } from '@/lib/api-client';
import { buildRawText, humanEmails } from '@/lib/email-clean';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import type { AnalyzeResult, Requirement, RequirementStatus } from '@/types';
import type { CompanyGroup, RawEmail } from '@/types/integrations';

const MAX_MESSAGES = 100;

/** 상태별 색. 사람이 판단할 거리가 남은 쪽을 눈에 띄게 둔다. */
const STATUS_TONE: Record<RequirementStatus, BadgeTone> = {
  미확정: 'neutral',
  문의: 'info',
  요청: 'warn',
  제안: 'info',
  내부검토: 'neutral',
  고객검토: 'info',
  합의: 'success',
  거절: 'danger',
  완료: 'success',
};

/** 회사/발신인 트리에서 이 주소 하나와 주고받은 메일만 뽑는다. */
function clientEmails(groups: CompanyGroup[], address: string): RawEmail[] {
  const target = address.toLowerCase();
  return (
    groups
      .flatMap((company) => company.senders)
      .find((sender) => sender.address.toLowerCase() === target)?.emails ?? []
  );
}

export function RequirementExtractor({
  projectId,
  clientEmail,
}: {
  projectId: string;
  clientEmail: string;
}) {
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [dismissed, setDismissed] = usePersistedState<string[]>(`dismissed:${projectId}`, []);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setMessage(null);

    const inbox = await post<CompanyGroup[]>('/api/email/messages', { maxMessages: MAX_MESSAGES });
    if (!inbox.ok) {
      setLoading(false);
      setMessage(inbox.error);
      return;
    }

    const emails = humanEmails(clientEmails(inbox.data, clientEmail));
    const rawText = buildRawText(emails);
    if (rawText === '') {
      setLoading(false);
      setMessage('이 주소와 주고받은 메일에서 분석할 내용을 찾지 못했습니다.');
      return;
    }

    const result = await post<AnalyzeResult>('/api/analyze', { rawText, channel: '이메일' });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setAnalyzedCount(emails.length);
    setRequirements(result.data.requirements);
    if (result.data.requirements.length === 0) {
      setMessage('메일에서 요구사항으로 볼 만한 내용을 찾지 못했습니다.');
    }
  }

  const visible = (requirements ?? []).filter((item) => !dismissed.includes(item.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">메일에서 뽑은 요구사항</h2>
          <p className="text-xs text-ink-faint">
            {clientEmail}와 주고받은 메일에서 인용문·서명·자동 발송 메일을 걷어낸 뒤 분석합니다.
          </p>
        </div>
        <Button variant="primary" onClick={analyze} disabled={loading}>
          <Sparkles className="size-4" />
          {loading ? '분석 중…' : requirements === null ? '요구사항 추출' : '다시 분석'}
        </Button>
      </div>

      {message !== null && (
        <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
          {message}
        </p>
      )}

      {requirements !== null && (
        <p className="text-xs text-ink-faint">
          메일 {analyzedCount}통에서 {requirements.length}건을 뽑았고, {visible.length}건을 보고
          있습니다.
        </p>
      )}

      {visible.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface shadow-card">
          {visible.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                </div>
                {item.evidence.map((evidence, order) => (
                  <p
                    key={order}
                    className="border-l-2 border-line pl-2 text-xs leading-relaxed text-ink-muted"
                  >
                    {evidence.quote}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDismissed((prev) => [...prev, item.id])}
                title="요구사항이 아니면 목록에서 지웁니다"
                className="rounded-md p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
