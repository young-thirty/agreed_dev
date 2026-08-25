/** FastAPI Gmail·Slack 공개 응답 타입. provider 원본 응답과 토큰은 포함하지 않는다. */

export type EmailAddress = { name: string; address: string };

export type RawEmail = {
  id: string;
  threadId: string;
  sentAt: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  body: string;
};

export type SenderGroup = {
  address: string;
  name: string;
  count: number;
  latestAt: string;
  emails: RawEmail[];
};

export type CompanyGroup = {
  domain: string;
  count: number;
  latestAt: string;
  senders: SenderGroup[];
};

export type EmailConnectionStatus = {
  connected: boolean;
  email: string | null;
};

export type SlackWorkspace = { teamId: string; teamName: string };

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
};

export type SlackFile = {
  fileId: string;
  name: string;
  isImage: boolean;
};

export type SlackMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  sentAt: string;
  replyCount: number;
  files: SlackFile[];
};
