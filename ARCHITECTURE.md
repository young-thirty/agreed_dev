# Agreed 프론트엔드 구조

```text
브라우저 (agreed_dev)
  └─ FastAPI 공개 API + HttpOnly session cookie
       └─ agreed_be
            ├─ MongoDB
            ├─ DeepSeek
            ├─ Gmail API
            └─ Slack API
```

이 저장소는 페이지·컴포넌트·UI 상태·FastAPI 공개 응답 타입만 담당합니다.
Next.js API route, provider token, OAuth code 교환, AI 호출은 두지 않습니다.

`lib/api-client.ts`가 `NEXT_PUBLIC_API_BASE_URL`과
`credentials: 'include'`를 일괄 적용합니다. localStorage는 선택 탭처럼 무해한
화면 편의값에만 사용하며 서버 데이터의 원천은 백엔드 MongoDB입니다.

Gmail·Slack 화면은 provider를 직접 호출하지 않습니다. OAuth 시작은 FastAPI로
브라우저 이동하고, 메일·워크스페이스·채널·메시지·스레드·파일도 FastAPI 공개
endpoint만 사용합니다. 상세 연결값은 `EMAIL_INTEGRATION.md`와
`SLACK_INTEGRATION.md`를 봅니다.
