# Agreed

계약 이후 고객 대화에서 새 요구사항을 찾아, 지금 합의된 계약 상태를 최신으로 유지합니다.

## 시작

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 채우기
npm run dev
```

http://localhost:3000

## 배포

Vercel에 레포를 연결하면 끝입니다. 환경변수 `ANTHROPIC_API_KEY`만 등록하세요.
**개발 시작 직후 빈 상태로 한 번 배포해 두세요.** 마지막에 하면 반드시 터집니다.

배포 확인: `/api/health`

## 팀 규약

작업 전에 [CLAUDE.md](./CLAUDE.md)를 읽으세요.
