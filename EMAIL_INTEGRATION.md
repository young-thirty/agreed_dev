# Gmail 프론트 연동

Gmail OAuth, 토큰 보관·갱신, Gmail REST 호출은 FastAPI 저장소
`young-thirty/agreed_be`로 이관됐다. 이 저장소에는 provider secret이나 Next.js
Gmail API route를 두지 않는다.

## 프론트가 사용하는 값

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- 연결: 브라우저를 `GET {API_BASE}/api/email/connect`로 이동
- 상태: `GET {API_BASE}/api/email/status`
- 메일: `POST {API_BASE}/api/email/messages` + `{ maxMessages: 20 }`
- 모든 JSON 호출: `credentials: 'include'`
- OAuth 결과: `/?gmail=connected|failed|denied|login_required`

Google Cloud Console callback:

```text
http://localhost:8000/api/email/callback
```

기존 `localhost:3000/api/email/callback`은 사용하지 않는다. Gmail 권한은 현재
읽기 전용이며 실제 발송 API는 없다. 답변 초안 기능은 이후 별도 기능으로 구현한다.
