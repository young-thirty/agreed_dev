// 프로젝트 고객 한 명과 주고받은 메일을 가져온다.
//
// 화면 두 곳(고객 이메일 탭, 요구사항 추출)이 같은 메일을 쓰므로 한 번 받은 결과를
// 나눠 쓴다. 탭을 오갈 때마다 Gmail을 다시 부르지 않기 위해서다.

import { get, post } from '@/lib/api-client';
import type { CompanyGroup, EmailConnectionStatus, RawEmail } from '@/types/integrations';

const MAX_MESSAGES = 100;

/**
 * 고객 주소별 캐시. 새로고침하면 사라진다.
 * 고객 메일 본문을 디스크에 남기지 않으려고 메모리에만 둔다.
 */
const cache = new Map<string, RawEmail[]>();

export type ClientEmailsResult =
  | { ok: true; emails: RawEmail[]; cached: boolean }
  | { ok: false; error: string; reconnect: boolean };

/** 회사/발신인 트리에서 이 주소 하나와 주고받은 메일만 뽑는다. */
function emailsOf(groups: CompanyGroup[], address: string): RawEmail[] {
  const target = address.toLowerCase();
  return (
    groups
      .flatMap((company) => company.senders)
      .find((sender) => sender.address.toLowerCase() === target)?.emails ?? []
  );
}

/**
 * 정말로 연결이 끊긴 것인지 서버에 물어본다.
 * 일시적인 실패까지 재연동으로 몰아가면 사용자가 쓸데없이 OAuth를 다시 타게 된다.
 */
async function isDisconnected(): Promise<boolean> {
  const status = await get<EmailConnectionStatus>('/api/email/status');
  return status.ok && !status.data.connected;
}

export async function loadClientEmails(
  clientEmail: string,
  options: { refresh?: boolean } = {},
): Promise<ClientEmailsResult> {
  const cached = cache.get(clientEmail);
  if (cached !== undefined && options.refresh !== true) {
    return { ok: true, emails: cached, cached: true };
  }

  const res = await post<CompanyGroup[]>('/api/email/messages', {
    maxMessages: MAX_MESSAGES,
    counterpartyEmail: clientEmail,
  });
  if (!res.ok) {
    return { ok: false, error: res.error, reconnect: await isDisconnected() };
  }

  const emails = emailsOf(res.data, clientEmail);
  cache.set(clientEmail, emails);
  return { ok: true, emails, cached: false };
}
