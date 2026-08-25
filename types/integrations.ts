/** FastAPI Gmail·Slack 공개 응답 타입. provider 원본 응답과 토큰은 포함하지 않는다. */

export type EmailAddress = { name: string; address: string };

/**
 * 첨부 메타데이터. id와 attachmentId는 다른 값이다.
 * id는 메시지 안에서 이 파트의 위치를 가리켜 안 바뀐다 — 자료 아카이브가 같은
 * 첨부를 다시 만났는지 판단할 때 이 값을 쓴다. attachmentId는 일회성 토큰이라
 * 화면에서 저장해 뒀다가 나중에 쓰면 안 되고, 받은 그 자리에서만 다운로드에 쓴다.
 */
export type EmailAttachment = {
  id: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export type RawEmail = {
  id: string;
  threadId: string;
  sentAt: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
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
