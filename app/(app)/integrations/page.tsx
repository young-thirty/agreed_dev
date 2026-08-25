'use client';

// 연동 화면. 고객 요청이 들어오는 입력 채널을 관리한다.
// gmail·slack은 실제 OAuth 없이 UI 상태만 토글하고, file·text는 항상 사용 가능한 직접 입력 소스다.

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '@/components/AppStore';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { CHANNEL_META } from '@/components/channelMeta';
import type { Channel } from '@/types';

// 채널별 한 줄 설명. 무엇이 연결되는지 사용자 말로 적는다.
const DESCRIPTION: Record<Channel, string> = {
  gmail: '받은 편지함에 도착한 고객 메일을 요청으로 가져옵니다.',
  slack: '연결한 채널의 고객 메시지를 요청으로 가져옵니다.',
  file: '계약서·회의록 같은 문서를 직접 올려 분석합니다.',
  text: '고객과 나눈 대화를 붙여넣어 바로 분석합니다.',
};

export default function IntegrationsPage() {
  const { integrations, toggleIntegration } = useAppStore();
  const router = useRouter();

  return (
    <div className="max-w-2xl px-8 py-8">
      {/* 상단 */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">연동</h1>
          <p className="mt-1 text-sm text-ink-muted">
            고객 요청은 아래 채널로 들어와 분석됩니다.
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/dashboard')}>
          대시보드로 이동
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* 소스 목록 */}
      <ul className="mt-6 flex flex-col gap-3">
        {integrations.map((it) => {
          const meta = CHANNEL_META[it.channel];
          const Icon = meta.icon;
          const toggleable = it.channel === 'gmail' || it.channel === 'slack';

          return (
            <li
              key={it.channel}
              className="flex items-center gap-4 rounded-md border border-line bg-surface px-4 py-3.5"
            >
              <Icon className="size-5 shrink-0 text-ink-muted" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{meta.label}</span>
                  {toggleable ? (
                    it.connected ? (
                      <Badge tone="success">Connected</Badge>
                    ) : (
                      <Badge tone="neutral">Not connected</Badge>
                    )
                  ) : (
                    <Badge tone="success">사용 가능</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">{DESCRIPTION[it.channel]}</p>
              </div>

              {toggleable && (
                <Button
                  variant={it.connected ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => toggleIntegration(it.channel)}
                >
                  {it.connected ? '연결 해제' : '연결'}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
