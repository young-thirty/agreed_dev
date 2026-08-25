// Slack API 응답과 무관한 공통 형태다. 화면과 다른 계층은 이 형태만 알면 된다.

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
  /** 봇이 이미 이 채널의 멤버인가. 비공개 채널은 이게 true여야 메시지를 읽을 수 있다. */
  isMember: boolean;
};

export type SlackFile = {
  id: string;
  name: string;
  isImage: boolean;
  /** 우리 서버의 프록시 주소다. 원본 Slack URL은 봇 토큰으로만 열리므로 화면에 직접 노출하지 않는다. */
  url: string;
};

export type SlackMessage = {
  id: string; // Slack의 ts. 메시지 고유 식별자로도 쓴다
  userId: string;
  userName: string;
  text: string;
  sentAt: string; // ISO
  /** 0보다 크면 스레드가 있다는 뜻이다. 답글 자체는 이 메시지에 들어있지 않다. */
  replyCount: number;
  files: SlackFile[];
};
