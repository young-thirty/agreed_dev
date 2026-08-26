// 고객 메시지가 들어온 채널. 아이콘·이름과 브랜드 색을 한 곳에 둔다.

import { Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import type { Channel } from '@/types';

export const CHANNEL_META: Record<
  Channel,
  { label: string; icon: LucideIcon; chip: string }
> = {
  email: { label: 'Gmail', icon: Mail, chip: 'bg-gmail-soft text-gmail' },
  slack: { label: 'Slack', icon: MessageSquare, chip: 'bg-slack-soft text-slack' },
};

/**
 * 채널 칩. 회색 아이콘만으로는 Gmail인지 Slack인지 한눈에 갈라지지 않아
 * 브랜드 색 틴트를 얹고 이름을 같이 적는다.
 */
export function ChannelChip({ channel }: { channel: Channel }) {
  const { label, icon: Icon, chip } = CHANNEL_META[channel];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${chip}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
