# Agreed 프론트엔드

Gmail·Slack 대화와 계약 변경 내용을 보여주는 Next.js 화면입니다. 로그인, MongoDB,
AI, Gmail·Slack OAuth/API는 별도 FastAPI 저장소 `young-thirty/agreed_be`가
담당합니다.

## 로컬 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`.env.local`에는 공개 가능한 백엔드 주소만 둡니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- 프론트: http://localhost:3000
- FastAPI: http://localhost:8000
- API 문서: http://localhost:8000/docs

Gmail·Slack 연결 버튼은 FastAPI OAuth 시작 주소로 이동합니다. provider secret과
token은 프론트에 두지 않으며, 서버 데이터는 localStorage에 저장하지 않습니다.

## 검증

```bash
pnpm typecheck
pnpm build
```

작업 전에 [CLAUDE.md](./CLAUDE.md)와 [CLAUDE_FE.md](./CLAUDE_FE.md)를 읽으세요.
