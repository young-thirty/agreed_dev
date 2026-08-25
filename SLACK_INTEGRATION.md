# Slack 프론트 연동

Slack OAuth, bot token 보관, Web API와 파일 프록시는 FastAPI 저장소
`young-thirty/agreed_be`로 이관됐다. 이 저장소에는 provider secret이나 Next.js
Slack API route를 두지 않는다.

## 프론트가 사용하는 값

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- 연결: 브라우저를 `GET {API_BASE}/api/slack/connect`로 이동
- 워크스페이스: `POST /api/slack/workspaces`
- 채널: `POST /api/slack/channels`
- 참여: `POST /api/slack/join`
- 메시지: `POST /api/slack/messages`
- 스레드: `POST /api/slack/thread`
- 파일: `GET /api/slack/file?teamId=...&fileId=...`
- 모든 JSON 호출: `credentials: 'include'`
- OAuth 결과: `/?slack=connected|failed|denied|login_required`

Slack App callback:

```text
http://localhost:8000/api/slack/callback
```

기존 `localhost:3000/api/slack/callback`은 사용하지 않는다. 응답의 파일은
`{ fileId, name, isImage }`이며 프론트는 FastAPI 파일 endpoint를 조합한다.
자동 폴링은 하지 않고 화면 진입·선택·새로고침 때 조회한다.
