# Agreed 프론트엔드 구조

## 저장소 경계

이 저장소는 Next.js 프론트엔드만 담당합니다.

```text
브라우저 (agreed_dev)
  └─ HTTPS + HttpOnly session cookie
       └─ FastAPI (agreed_be)
            ├─ MongoDB
            ├─ DeepSeek
            ├─ Gmail API
            └─ Slack API
```

Next.js API route, MongoDB 접근, AI 호출, OAuth code 교환은 이 저장소에 두지
않습니다. Google·Slack 연결은 Agreed 이메일·비밀번호 로그인과 별개이며,
브라우저는 provider access/refresh token을 받지 않습니다.

## 폴더 책임

| 위치 | 책임 |
|---|---|
| `app/` | 페이지, 레이아웃, 전역 스타일 |
| `components/` | 화면 컴포넌트 |
| `hooks/` | 선택 탭 같은 화면 편의 상태 |
| `types/` | FastAPI 응답 타입 |
| `lib/api-client.ts` | FastAPI 주소, 공통 응답 검증, `credentials: include` |

서버 데이터의 원천은 MongoDB입니다. localStorage는 접힌 패널이나 선택한 탭처럼
유출돼도 무해한 UI 설정에만 사용합니다.

## 데이터 흐름

1. 사용자가 Agreed에 회원가입하거나 로그인합니다.
2. 프론트가 FastAPI의 `/api/email/connect` 또는 `/api/slack/connect`로 이동합니다.
3. FastAPI가 OAuth callback을 받고 provider token을 암호화해 사용자 계정에 귀속합니다.
4. 프론트는 FastAPI의 Gmail·Slack 조회 API만 호출합니다.
5. 이후 FastAPI가 원문을 정규화·저장하고 AI 분석 결과와 근거를 만듭니다.
6. 프론트는 원문, 요약, 3단계 판정, 근거, 체크리스트, 답장 초안을 표시합니다.

프로젝트·수집 메시지·AI 분석 모델은 기능 확정서에 맞춰 백엔드에서 추가합니다.

## 환경과 배포

프론트에 필요한 환경변수는 `NEXT_PUBLIC_API_BASE_URL` 하나입니다. 비밀키는
백엔드에만 둡니다. 운영에서는 프론트와 FastAPI 모두 HTTPS여야 하며, 서로 다른
사이트에 배포하면 백엔드 세션 쿠키를 `SameSite=None; Secure`로 설정해야 합니다.

배포 대상은 AWS이며 구체적인 서비스와 CI/CD는 별도 배포안에서 고정합니다.
