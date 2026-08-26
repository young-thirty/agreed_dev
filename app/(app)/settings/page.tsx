'use client';

// 설정. 계정 단위 연동을 여기서 한 번 한다.
//
// 프로젝트마다 다른 것(어느 슬랙 채널을 볼지, 어느 고객 주소를 볼지, 어느 저장소를 볼지)은
// 여기가 아니라 프로젝트 화면에서 정한다.

import { useCallback, useEffect, useState } from 'react';
import { GitBranch, LoaderCircle, Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { getIntegrations, setIntegration, type IntegrationProvider, type IntegrationStatus } from '@/lib/api';

const PROVIDERS: {
  key: IntegrationProvider;
  label: string;
  icon: LucideIcon;
  /** 연결하면 무엇이 되는지. 연결 전에 읽는 문장이다. */
  before: string;
  /** 연결한 뒤에 무엇을 더 해야 하는지. */
  after: (account: string) => string;
}[] = [
  {
    key: 'gmail',
    label: 'Gmail',
    icon: Mail,
    before: '받은 편지함의 고객 메일을 가져옵니다. 연결한 뒤 프로젝트마다 볼 주소를 등록합니다.',
    after: (account) =>
      `${account} 계정으로 메일을 읽습니다. 어느 고객 주소를 볼지는 프로젝트마다 정합니다.`,
  },
  {
    key: 'slack',
    label: 'Slack',
    icon: MessageSquare,
    before: '워크스페이스를 연결하면 프로젝트마다 볼 채널을 고를 수 있습니다.',
    after: (account) => `${account}에 연결되어 있습니다. 어느 채널을 볼지는 프로젝트마다 정합니다.`,
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: GitBranch,
    before: '저장소를 읽어 개발 현황을 확인합니다. 연결한 뒤 프로젝트마다 저장소를 등록합니다.',
    after: (account) => `${account} 계정 권한으로 저장소를 읽습니다. 코드를 쓰지는 않습니다.`,
  },
];

const EMPTY: IntegrationStatus = { connected: false, account: null };

export default function SettingsPage() {
  const [status, setStatus] = useState<Record<IntegrationProvider, IntegrationStatus> | null>(null);
  const [busy, setBusy] = useState<IntegrationProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getIntegrations();
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setMessage(null);
    setStatus(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(provider: IntegrationProvider, connected: boolean) {
    setBusy(provider);
    setMessage(null);
    const res = await setIntegration(provider, connected);
    setBusy(null);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setStatus((prev) => (prev === null ? prev : { ...prev, [provider]: res.data }));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-7">
        <h1 className="text-xl font-semibold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-ink-muted">
          계정에 한 번 연결해 두면 모든 프로젝트가 함께 씁니다.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-ink">연동</h2>

          <ul className="mt-3 flex flex-col gap-2">
            {PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              const state = status?.[provider.key] ?? EMPTY;
              const working = busy === provider.key;

              return (
                <li key={provider.key} className="rounded-lg bg-surface px-5 py-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-ink-faint" />
                    <span className="text-sm font-medium text-ink">{provider.label}</span>

                    {status === null ? (
                      <LoaderCircle className="size-3.5 animate-spin text-accent" />
                    ) : state.connected ? (
                      <Badge tone="success" dot>
                        연결됨
                      </Badge>
                    ) : (
                      <Badge tone="neutral">연결 안 됨</Badge>
                    )}

                    <div className="ml-auto">
                      {state.connected ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggle(provider.key, false)}
                          disabled={working}
                        >
                          {working ? '해제하는 중…' : '연결 해제'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => toggle(provider.key, true)}
                          disabled={working || status === null}
                        >
                          {working && <LoaderCircle className="size-3.5 animate-spin" />}
                          {working ? '연결하는 중…' : '연결'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-ink-faint">
                    {state.connected && state.account !== null
                      ? provider.after(state.account)
                      : provider.before}
                  </p>
                </li>
              );
            })}
          </ul>

          {message !== null && <p className="mt-3 text-xs text-danger">{message}</p>}

          <p className="mt-3 text-xs text-ink-faint">
            어느 주소·채널·저장소를 볼지는 프로젝트 화면의 채널 연결에서 정합니다. 그 밖의 채널은
            나중에 도입 예정입니다.
          </p>
        </section>
      </div>
    </div>
  );
}
