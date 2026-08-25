# Agreed 프론트엔드

계약 이후 Gmail·Slack 대화에서 새 요구사항을 보여주고, 계약 근거와 변경 초안을
사람이 검토하도록 돕는 Next.js 화면입니다. API, 로그인 세션, MongoDB, AI,
Gmail·Slack OAuth는 별도 FastAPI 저장소(`young-thirty/agreed_be`)가 담당합니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에는 공개 가능한 백엔드 주소만 둡니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- 프론트: http://localhost:3000
- FastAPI 문서: http://localhost:8000/docs
- FastAPI 상태 확인: http://localhost:8000/api/health

서버 데이터와 로그인·Google·Slack 토큰은 localStorage에 저장하지 않습니다.
프론트 API 호출은 `lib/api-client.ts`를 사용하며 HttpOnly 세션 쿠키를 함께
전송합니다.

## 검증

```bash
npm run typecheck
npm run build
```

배포는 AWS 기준으로 CI/CD 구성이 확정되면 반영합니다. 작업 전
[CLAUDE.md](./CLAUDE.md)와 [CLAUDE_FE.md](./CLAUDE_FE.md)를 읽으세요.
