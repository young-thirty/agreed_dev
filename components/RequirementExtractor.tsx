'use client';

// 요청 분석 탭. 왼쪽은 메일에서 뽑은 요구사항 목록, 오른쪽은 고른 하나의 분석이다.
//
// 요구사항은 백엔드에 프로젝트별로 저장된다. 화면에 들어오면 저장된 것을 읽어오고,
// '다시 분석'을 눌러야 메일을 새로 받아 AI를 부른다.
// 필요 없다고 판단한 카드는 사용자가 지운다. 지운 id만 이 브라우저에 남는다.

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { get, post } from '@/lib/api-client';
import { loadClientEmails } from '@/lib/client-emails';
import { buildRawText, humanEmails } from '@/lib/email-clean';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Button } from './Button';
import { ReconnectGmailModal } from './ReconnectGmailModal';
import { RequirementAnalysisPanel } from './RequirementAnalysisPanel';
import { RequirementStatusBadge } from './StatusBadges';
import type { AnalyzeResult, Project, Requirement } from '@/types';

export function RequirementExtractor({
  project,
  clientEmail,
}: {
  project: Project;
  clientEmail: string;
}) {
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = usePersistedState<string[]>(
    `dismissed:${project.projectId}`,
    [],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconnect, setReconnect] = useState(false);

  /**
   * 저장된 요구사항을 불러온다.
   * 화면을 떠났다 돌아왔다고 다시 분석할 이유가 없다. AI 호출도 메일 조회도 없다.
   */
  const loadSaved = useCallback(async () => {
    const saved = await get<Requirement[]>(`/api/projects/${project.projectId}/requirements`);
    // 실패해도 조용히 둔다. 아직 아무것도 안 한 화면에 오류부터 띄우지 않는다.
    if (saved.ok) setRequirements(saved.data);
  }, [project.projectId]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  async function analyze() {
    setLoading(true);
    setMessage(null);

    // '다시 분석'은 메일을 새로 받아온다. 첫 분석은 이미 받아둔 게 있으면 그걸 쓴다.
    const inbox = await loadClientEmails(project.projectId, clientEmail, {
      refresh: analyzedCount !== null,
    });
    if (!inbox.ok) {
      setLoading(false);
      setMessage(inbox.error);
      setReconnect(inbox.reconnect);
      return;
    }

    const emails = humanEmails(inbox.emails);
    const rawText = buildRawText(emails, clientEmail);
    if (rawText === '') {
      setLoading(false);
      setMessage('이 주소와 주고받은 메일에서 분석할 내용을 찾지 못했습니다.');
      return;
    }

    const result = await post<AnalyzeResult>('/api/analyze', {
      projectId: project.projectId,
      rawText,
      channel: '이메일',
    });
    if (!result.ok) {
      setLoading(false);
      setMessage(result.error);
      return;
    }

    // 응답에는 이번에 뽑힌 것만 들어 있다. 화면에는 이 프로젝트에 쌓인 전부를 보여준다.
    await loadSaved();
    setLoading(false);
    setAnalyzedCount(emails.length);
    if (result.data.requirements.length === 0) {
      setMessage('메일에서 요구사항으로 볼 만한 내용을 찾지 못했습니다.');
    }
  }

  const visible = (requirements ?? []).filter((item) => !dismissed.includes(item.id));
  const selected = visible.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-[1fr_440px] gap-6">
      {/* 왼쪽 — 요구사항 목록 */}
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
            {loading
              ? '분석 중…'
              : requirements !== null && requirements.length > 0
                ? '다시 분석'
                : '요구사항 추출'}
          </Button>
        </div>

        {message !== null && (
          <p className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-faint">
            {message}
          </p>
        )}

        {requirements !== null && requirements.length > 0 && (
          <p className="text-xs text-ink-faint">
            {analyzedCount !== null && `메일 ${analyzedCount}통을 분석했습니다. `}
            요구사항 {requirements.length}건 중 {visible.length}건을 보고 있습니다.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {visible.map((item) => {
            const on = item.id === selectedId;
            return (
              <li key={item.id} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex-1 rounded-md border p-3.5 text-left transition-colors ${
                    on ? 'border-accent bg-surface' : 'border-line bg-surface hover:border-ink-faint'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <RequirementStatusBadge status={item.status} />
                    <span className="text-sm font-medium leading-relaxed">{item.title}</span>
                  </div>
                  {item.evidence[0] !== undefined && (
                    <p className="mt-1.5 line-clamp-2 border-l-2 border-line pl-2 text-xs text-ink-muted">
                      {item.evidence[0].quote}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed((prev) => [...prev, item.id])}
                  title="요구사항이 아니면 목록에서 지웁니다"
                  className="mt-1 rounded-md p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 오른쪽 — 고른 요구사항의 분석 */}
      <div className="rounded-lg bg-surface p-5 shadow-card">
        {selected ? (
          <RequirementAnalysisPanel
            key={selected.id}
            projectId={project.projectId}
            requirement={selected}
            onConfirmed={loadSaved}
          />
        ) : (
          <p className="text-sm text-ink-muted">
            왼쪽에서 요구사항을 선택하면 분석 결과가 여기에 나타납니다.
          </p>
        )}
      </div>

      {reconnect && <ReconnectGmailModal onClose={() => setReconnect(false)} />}
    </div>
  );
}
