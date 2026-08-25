// 이메일의 출처와 무관한 공통 형태다. Gmail이든 파일이든 어댑터가 이 형태로 바꿔서 넘긴다.
// 그래야 도메인 로직이 출처를 모르고, 나중에 입력 경로가 늘어나도 이 아래는 바뀌지 않는다.

export type EmailAddress = { name: string; address: string };

export type RawEmail = {
  id: string;
  threadId: string;
  sentAt: string; // ISO
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  body: string;
};
