// 입력 채널별 아이콘과 라벨. 요청 피드·연동 화면에서 공용으로 쓴다.

import { FileText, Mail, MessageSquare, Type, type LucideIcon } from 'lucide-react';
import type { Channel } from '@/types';

export const CHANNEL_META: Record<Channel, { label: string; icon: LucideIcon }> = {
  gmail: { label: 'Gmail', icon: Mail },
  slack: { label: 'Slack', icon: MessageSquare },
  file: { label: '파일 업로드', icon: FileText },
  text: { label: '직접 입력', icon: Type },
};
