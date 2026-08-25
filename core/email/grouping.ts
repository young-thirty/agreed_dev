import type { EmailAddress, RawEmail } from './types';

/** 발신인 한 명. 회사 그룹 안에 들어간다. */
export type SenderGroup = {
  address: string;
  name: string;
  count: number;
  latestAt: string;
  emails: RawEmail[];
};

/** 회사 하나. 도메인으로 묶는다. */
export type CompanyGroup = {
  domain: string;
  count: number;
  latestAt: string;
  senders: SenderGroup[];
};

function domainOf(address: string): string {
  return address.slice(address.lastIndexOf('@') + 1).toLowerCase();
}

/**
 * 이 메일의 상대가 누구인지 정한다.
 *
 * 받은 메일이면 보낸 사람이, 내가 보낸 메일이면 받는 사람이 상대다.
 * 내 주소가 여러 개일 수 있으므로 목록으로 받는다.
 * 나에게만 보낸 메일처럼 상대가 없으면 null을 돌려주고, 호출부가 건너뛴다.
 */
export function counterparty(email: RawEmail, myAddresses: string[]): EmailAddress | null {
  const mine = new Set(myAddresses.map((a) => a.toLowerCase()));
  if (!mine.has(email.from.address.toLowerCase())) return email.from;
  return email.to.find((t) => !mine.has(t.address.toLowerCase())) ?? null;
}

/**
 * 회사(도메인) → 발신인 주소 두 단계로 묶는다.
 * 두 단계 모두 최근 메일이 있는 쪽이 위로 온다. 시연에서 방금 온 메일이 맨 위에 보여야 하기 때문이다.
 */
export function groupByCompany(emails: RawEmail[], myAddresses: string[]): CompanyGroup[] {
  const bySender = new Map<string, SenderGroup>();

  for (const email of emails) {
    const who = counterparty(email, myAddresses);
    if (who === null) continue;

    const key = who.address.toLowerCase();
    const found = bySender.get(key);
    if (found) {
      found.emails.push(email);
    } else {
      bySender.set(key, { address: key, name: who.name || key, count: 0, latestAt: '', emails: [email] });
    }
  }

  const byDomain = new Map<string, CompanyGroup>();
  for (const sender of bySender.values()) {
    // sentAt이 ISO 문자열이라 사전순 비교가 곧 시간순 비교다
    sender.emails.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    sender.count = sender.emails.length;
    sender.latestAt = sender.emails[0].sentAt;

    const domain = domainOf(sender.address);
    const company = byDomain.get(domain) ?? { domain, count: 0, latestAt: '', senders: [] };
    company.senders.push(sender);
    byDomain.set(domain, company);
  }

  const companies = [...byDomain.values()];
  for (const company of companies) {
    company.senders.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
    company.count = company.senders.reduce((sum, s) => sum + s.count, 0);
    company.latestAt = company.senders[0].latestAt;
  }
  companies.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  return companies;
}
