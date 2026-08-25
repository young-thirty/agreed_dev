'use client';

// 이 프로젝트가 어느 채널을 보고 있는지, 그리고 아직 안 붙은 채널을 붙이는 곳.
//
// 이메일·슬랙 채널·저장소는 Project의 컬럼이 아니라 연결 목록의 행이다.
// 그래서 이메일을 여러 개 등록하는 것도 여기서 행을 늘리는 일로 끝난다.

import { useEffect, useState } from 'react';
import { GitBranch, LoaderCircle, Mail, MessageSquare, Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/Button';
import { SlackChannelPicker } from '@/components/SlackChannelPicker';
import {
  createSourceLink,
  getGithubStatus,
  getGmailStatus,
  type SourceLinkInput,
} from '@/lib/api';
import type { SourceChannel, SourceLink } from '@/types';

const CHANNEL: Record<SourceChannel, { label: string; icon: LucideIcon; addLabel: string }> = {
  GMAIL: { label: '이메일', icon: Mail, addLabel: '이메일 주소 추가' },
  SLACK: { label: '슬랙 채널', icon: MessageSquare, addLabel: '슬랙 채널 연결' },
  GITHUB: { label: '저장소', icon: GitBranch, addLabel: '저장소 연결' },
};

const ORDER: SourceChannel[] = ['GMAIL', 'SLACK', 'GITHUB'];

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-3 focus:outline-accent-soft';

/** 아직 한 줄도 없는 채널. 프로젝트 설정이 덜 끝났다는 뜻이다. */
export function missingChannels(links: SourceLink[]): SourceChannel[] {
  return ORDER.filter((channel) => !links.some((link) => link.sourceChannel === channel));
}

export function ProjectChannels({
  projectId,
  links,
  onAdded,
}: {
  projectId: string;
  links: SourceLink[];
  /** 등록에 성공하면 새 연결을 올려보낸다. 목록은 화면이 들고 있다. */
  onAdded: (link: SourceLink) => void;
}) {
  const [open, setOpen] = useState<SourceChannel | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 프로젝트에 채널을 붙이기 전에 계정 연동이 먼저 돼 있어야 한다.
  const [gmail, setGmail] = useState<string | null>(null);
  const [github, setGithub] = useState<string | null>(null);

  useEffect(() => {
    getGmailStatus().then((res) => {
      if (res.ok && res.data.connected) setGmail(res.data.email);
    });
    getGithubStatus().then((res) => {
      if (res.ok && res.data.connected) setGithub(res.data.accountName);
    });
  }, []);

  function openForm(channel: SourceChannel) {
    setOpen(channel);
    setValue('');
    setError(null);
  }

  async function submit(input: SourceLinkInput) {
    setBusy(true);
    const res = await createSourceLink(projectId, input);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onAdded(res.data);
    setOpen(null);
    setValue('');
  }

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium text-ink">채널 연결</h2>
      <p className="mt-1 text-xs text-ink-faint">
        여기 등록한 주소와 채널로 들어온 대화만 이 프로젝트로 모입니다.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {ORDER.map((channel) => {
          const meta = CHANNEL[channel];
          const Icon = meta.icon;
          const rows = links.filter((link) => link.sourceChannel === channel);

          return (
            <li key={channel} className="rounded-lg bg-surface px-4 py-3 shadow-card">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-ink-faint" />
                <span className="text-sm font-medium text-ink">{meta.label}</span>
                {rows.length === 0 && (
                  <span className="text-xs text-warn">아직 연결되지 않았습니다</span>
                )}
                {/* 슬랙과 저장소는 하나면 충분하다. 이메일만 계속 늘릴 수 있다. */}
                {(channel === 'GMAIL' || rows.length === 0) && open !== channel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => openForm(channel)}
                  >
                    <Plus className="size-3.5" />
                    {meta.addLabel}
                  </Button>
                )}
              </div>

              {rows.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {rows.map((link) => (
                    <li key={link.sourceLinkId} className="text-sm text-ink-muted">
                      {link.displayName}
                    </li>
                  ))}
                </ul>
              )}

              {open === channel && (
                <div className="mt-3 border-t border-line pt-3">
                  {channel === 'SLACK' ? (
                    <SlackChannelPicker
                      busy={busy}
                      onCancel={() => setOpen(null)}
                      onPick={({ teamId, channelId, channelName }) =>
                        submit({
                          sourceChannel: 'SLACK',
                          displayName: `#${channelName}`,
                          teamId,
                          channelId,
                        })
                      }
                    />
                  ) : (
                    <TextForm
                      channel={channel}
                      value={value}
                      onChange={setValue}
                      busy={busy}
                      gmail={gmail}
                      github={github}
                      onCancel={() => setOpen(null)}
                      onSubmit={() =>
                        submit(
                          channel === 'GMAIL'
                            ? {
                                sourceChannel: 'GMAIL',
                                displayName: value.trim(),
                                counterpartyEmail: value.trim(),
                              }
                            : {
                                sourceChannel: 'GITHUB',
                                displayName: value.trim(),
                                repoFullName: value.trim(),
                              },
                        )
                      }
                    />
                  )}

                  {error !== null && <p className="mt-2 text-xs text-danger">{error}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 이메일과 저장소는 한 칸만 받는다. 이름은 입력값을 그대로 쓴다. */
function TextForm({
  channel,
  value,
  onChange,
  busy,
  gmail,
  github,
  onCancel,
  onSubmit,
}: {
  channel: 'GMAIL' | 'GITHUB';
  value: string;
  onChange: (next: string) => void;
  busy: boolean;
  gmail: string | null;
  github: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const isEmail = channel === 'GMAIL';
  const account = isEmail ? gmail : github;
  const trimmed = value.trim();
  // 저장소는 owner/repo 형식이어야 서버가 받는다. 보내기 전에 여기서 막는다.
  const ready = isEmail ? trimmed.includes('@') : trimmed.split('/').length === 2;

  if (account === null) {
    return (
      <p className="text-xs text-ink-faint">
        {isEmail
          ? 'Gmail이 아직 연결되지 않았습니다. Gmail을 연결한 뒤 주소를 등록할 수 있습니다.'
          : 'GitHub이 아직 연결되지 않았습니다. GitHub을 연결한 뒤 저장소를 등록할 수 있습니다.'}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) onSubmit();
      }}
      className="flex flex-col gap-2"
    >
      <input
        aria-label={isEmail ? '고객 이메일 주소' : '저장소 이름'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isEmail ? 'client@example.com' : 'owner/repo'}
        className={INPUT_CLASS}
      />
      <p className="text-xs text-ink-faint">
        {isEmail
          ? `${account} 계정으로 이 주소와 주고받은 메일을 읽습니다.`
          : `${account} 계정으로 저장소를 읽습니다.`}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" type="submit" disabled={!ready || busy}>
          {busy ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" />
              등록하는 중…
            </>
          ) : (
            '등록'
          )}
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={onCancel} disabled={busy}>
          취소
        </Button>
      </div>
    </form>
  );
}
