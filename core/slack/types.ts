// Slack API 응답과 무관한 공통 형태다. 화면과 다른 계층은 이 형태만 알면 된다.

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
  /** 봇이 이미 이 채널의 멤버인가. 비공개 채널은 이게 true여야 메시지를 읽을 수 있다. */
  isMember: boolean;
};

export type SlackMessage = {
  id: string; // Slack의 ts. 메시지 고유 식별자로도 쓴다
  userId: string;
  userName: string;
  text: string;
  sentAt: string; // ISO
};
