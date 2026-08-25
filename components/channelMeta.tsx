// 고객 메시지가 들어온 채널의 아이콘과 이름.

import { Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import type { Channel } from '@/types';

export const CHANNEL_META: Record<Channel, { label: string; icon: LucideIcon }> = {
  email: { label: 'Email', icon: Mail },
  slack: { label: 'Slack', icon: MessageSquare },
};
