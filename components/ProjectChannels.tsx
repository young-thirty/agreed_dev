'use client';

// 이 프로젝트가 어느 채널을 보고 있는지, 그리고 아직 안 붙은 채널을 붙이는 곳.
//
// 이메일·슬랙 채널·저장소는 Project의 컬럼이 아니라 연결 목록의 행이다.
// 그래서 이메일을 여러 개 등록하는 것도 여기서 행을 늘리는 일로 끝난다.

import { useEffect, useState } from 'react';
import { GitBranch, Mail, MessageSquare, Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/Button';
import { ChannelSync } from '@/components/ChannelSync';
import { ChannelTextForm } from '@/components/ChannelTextForm';
import { SlackChannelPicker } from '@/components/SlackChannelPicker';
import { createSourceLink, getGmailStatus, type SourceLinkInput } from '@/lib/api';
import type { SourceChannel, SourceLink } from '@/types';

const CHANNEL: Record<SourceChannel, { label: string; icon: LucideIcon; addLabel: string }> = {
  GMAIL: { label: '이메일', icon: Mail, addLabel: '이메일 주소 추가' },
  SLACK: { label: '슬랙 채널', icon: MessageSquare, addLabel: '슬랙 채널 연결' },
  GITHUB: { label: '저장소', icon: GitBranch, addLabel: '저장소 연결' },
};

const ORDER: SourceChannel[] = ['GMAIL', 'SLACK', 'GITHUB'];


/** 아직 한 줄도 없는 채널. 프로젝트 설정이 덜 끝났다는 뜻이다. */
export function missingChannels(links: SourceLink[]): SourceChannel[] {
  return ORDER.filter((channel) => !links.some((link) => link.sourceChannel === channel));
}

export function ProjectChannels({
  projectId,
  links,
  onAdded,
  onSynced,
}: {
  projectId: string;
  links: SourceLink[];
  /** 등록에 성공하면 새 연결을 올려보낸다. 목록은 화면이 들고 있다. */
  onAdded: (link: SourceLink) => void;
  /** 분석이 끝나 티켓이 생겼을 수 있을 때. */
  onSynced: () => void;
}) {
  const [open, setOpen] = useState<SourceChannel | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 메일은 계정을 먼저 연결해야 읽는다. 저장소는 서버 토큰으로 읽으므로 연결이 필요 없다.
  const [gmail, setGmail] = useState<string | null>(null);

  useEffect(() => {
    getGmailStatus().then((res) => {
      if (res.ok && res.data.connected) setGmail(res.data.email);
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
    setJustAdded(res.data.sourceLinkId);
    setOpen(null);
    setValue('');
  }

  return (
    <section>
      <p className="text-xs text-ink-faint">
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
                    <li
                      key={link.sourceLinkId}
                      className="flex flex-wrap items-center gap-2 text-sm text-ink-muted"
                    >
                      {link.displayName}
                      {/* 저장소는 대화를 가져오지 않는다. 물어볼 때만 읽는다. */}
                      {channel !== 'GITHUB' && (
                        <ChannelSync
                          projectId={projectId}
                          link={link}
                          autoStart={link.sourceLinkId === justAdded}
                          onDone={onSynced}
                        />
                      )}
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
                    <ChannelTextForm
                      channel={channel}
                      value={value}
                      onChange={setValue}
                      busy={busy}
                      gmail={gmail}
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
