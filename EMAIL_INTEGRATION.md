# 이메일(Gmail) 연동 구현 기록

> [이슈 #5](https://github.com/young-thirty/agreed_dev/issues/5) · `feat/#5` 브랜치에서 구현했다.
> 처음엔 `dev`에서 바로 프로토타입만 검증하고 되돌렸는데(읽기 전용), 실제 반영 및 발송 기능
> 추가 요청을 받아 이슈를 만들고 브랜치를 따서 다시 구현했다.
>
> 검증 목적 두 가지. **① 회사 → 발신인 순으로 묶인 Gmail 메일 내역을 화면에서 실시간(폴링)으로
> 볼 수 있는가. ② Agreed 화면에서 실제로 Gmail 메일을 발송할 수 있는가.**
> 둘 다 "된다"이며, OAuth 연결부터 화면 표시·발송 라우트 등록까지 로컬에서 확인했다.
> (발송 버튼을 눌러 실제 메일을 보내는 것은 수신자가 필요한 부수효과라 사용자가 직접 하기로 했다.)

---

## 1. 왜 이렇게 설계했는가

### 1.1 절대 규칙과의 충돌

[CLAUDE.md](CLAUDE.md)의 절대 규칙 세 개와 정면으로 부딪힌다.

| 규약 | 충돌 | 절충 |
|---|---|---|
| "인증·로그인이 없다" | Gmail은 OAuth2가 필수 | 서버는 사용자를 식별하지 않는다. 토큰을 브라우저 쿠키에만 둔다 |
| "DB를 쓰지 않는다" | refresh token을 저장할 곳이 필요 | 쿠키에 저장. localStorage는 XSS에 취약해서 배제 |
| [ARCHITECTURE.md](ARCHITECTURE.md) §5 "4단계에서 입력 경로를 확장한다" | 이메일 연동은 4단계 항목 | 지금은 1단계지만, `infra/` 어댑터 하나 추가하는 형태로 넣으면 이 4단계 전제와 어긋나지 않는다 |

핵심 판단: **토큰을 서버 상태로 만들지 않고 각자의 브라우저 쿠키에 둔다.** 그러면 "사용자 테이블"이 없어도 사람별로 분리되고, DB 없이도 성립한다. `Utterance`, `Contract` 같은 도메인 상태가 이미 localStorage(브라우저)에 있는 것과 같은 방향이다.

### 1.2 토큰 저장 위치: httpOnly 쿠키

localStorage에 넣으면 브라우저 스크립트가 읽을 수 있어서, XSS 한 번에 메일함 전체가 열린다. **httpOnly 쿠키**는 JS에서 접근 불가능하고 서버만 읽는다. `SameSite=lax`, `secure`(프로덕션만)를 같이 건다.

### 1.3 Gmail SDK 대신 REST 직접 호출

`googleapis` npm 패키지는 수십 MB다. 실제로 쓰는 엔드포인트는 5개뿐이다.

- `oauth2.googleapis.com/token` (코드 교환, 토큰 갱신)
- `gmail.../users/me/profile` (내 주소 확인용)
- `gmail.../users/me/messages` (목록)
- `gmail.../users/me/messages/{id}` (본문)
- `gmail.../users/me/messages/send` (발송)

전부 `fetch` + `AbortSignal.timeout(8000)`로 처리했다. [CLAUDE_BE.md](CLAUDE_BE.md) §5의 "타임아웃 없는 호출을 만들지 않는다" 원칙을 그대로 따른 것이다. 새 의존성이 필요 없다는 것도 장점이다.

### 1.4 "실시간" = 20초 폴링, Pub/Sub 아님

Gmail의 정석 실시간 연동은 `users.watch` + Cloud Pub/Sub 푸시다. 이 구조에서는 쓸 수 없다.

- 사용자 식별자가 없어서 푸시가 와도 **어느 브라우저로 보낼지 알 방법이 없다.**
- `watch` 구독은 7일마다 갱신해야 해서 상시 실행되는 cron이 하나 더 필요하다. "별도 서버를 만들지 않는다" 규칙과 부딪힌다.

대신 화면에서 20초마다 `/api/email/messages`를 다시 호출한다. 체감은 거의 동일하고, 서버 상태가 필요 없고, 실패하면 화면에 바로 보인다. 지금 구현은 매번 최근 N통을 통째로 다시 받는다 — `history.list` 기반 증분 동기화는 아직 없다 (5.3절 참고).

### 1.5 대상자 분리 기준: 회사 → 발신인

검토했던 대안과 선택 이유:

| 기준 | 문제 |
|---|---|
| 발신 주소만 | 담당자가 바뀌거나 팀장이 참조되면 같은 계약 대화가 여러 조각으로 쪼개짐 |
| 참여자 집합 | 한 명만 추가돼도 다른 그룹이 됨 |
| 계약 단위(참여자 등록) | 가장 정확하지만 사람이 미리 등록해야 함 — 나중 단계로 미룸 |
| **회사(도메인) → 발신인 (채택)** | 공용 메일 도메인(gmail.com 등) 고객이 여럿이면 한 덩어리로 묶이는 한계는 있음 |

지금은 "연동이 되는가"를 확인하는 단계라 도메인 기준으로 우선 구현했다. 계약 단위 라우팅은 계약 도메인 모델이 생긴 뒤에 얹는 게 맞다 (5.5절).

### 1.6 계층 배치

```
app/api/email/    진입점. 요청 파싱, 쿠키 읽기/쓰기, 응답 규약 변환만 한다
core/email/       순수 함수. 그룹핑 로직. 프레임워크 import 없음
infra/email/      Gmail REST 호출, OAuth 토큰 교환. 외부 의존은 전부 여기
```

`core/email/grouping.ts`는 `next`, `react`, `fetch`가 전혀 없는 순수 TypeScript다. [CLAUDE_BE.md](CLAUDE_BE.md) §1의 절대 규칙을 그대로 지켰고, 나중에 이메일 외의 입력 경로(메신저 등)가 추가돼도 그룹핑 로직은 그대로 재사용된다.

---

## 2. 데이터 흐름

```
[사용자] --GET /api/email/connect--> [Google 인증 화면]
                                            |
                                       (로그인 + 동의)
                                            v
[사용자] <--GET /api/email/callback?code=...-- [Google]
    |
    | 서버가 code를 토큰으로 교환 (infra/email/gmail.ts: exchangeCode)
    | 토큰을 httpOnly 쿠키에 저장
    v
/?gmail=connected 로 리다이렉트

[화면] --POST /api/email/messages--> [서버]
                                        | 쿠키에서 토큰 읽기
                                        | 만료됐으면 refreshAccessToken
                                        | fetchMyAddress + fetchRecent (Gmail REST)
                                        | groupByCompany (core/email)
                                        v
                                   { ok: true, data: CompanyGroup[] }
[화면] <-- 20초마다 반복 --

[화면] --POST /api/email/send { to, subject, body }--> [서버]
                                        | Zod로 입력 검증
                                        | getValidTokens (토큰 없으면 안내 문구 반환)
                                        | sendEmail (Gmail REST)
                                        v
                                   { ok: true, data: { sent: true } }
```

---

## 3. 파일 구성

실제 코드는 브랜치에 커밋돼 있으므로 여기서는 각 파일이 하는 일만 정리한다. 전체 내용은 링크를 따라가면 된다 (`feat/#5` 브랜치 기준).

| 파일 | 계층 | 역할 |
|---|---|---|
| [core/email/types.ts](core/email/types.ts) | core | `RawEmail` — 출처 무관 공통 이메일 형태 |
| [core/email/grouping.ts](core/email/grouping.ts) | core | `groupByCompany` — 회사(도메인) → 발신인 2단계 그룹핑. 순수 함수, 외부 호출 없음 |
| [infra/email/gmail.ts](infra/email/gmail.ts) | infra | OAuth 토큰 교환/갱신(`exchangeCode`, `refreshAccessToken`), 목록·조회(`fetchRecent`), 발송(`sendEmail`). `googleapis` SDK 없이 `fetch`만 사용 |
| [app/api/email/token.ts](app/api/email/token.ts) | app | `getValidTokens` — 쿠키에서 토큰을 읽고 만료 시 갱신 + 쿠키 재기록. `messages`·`send` 라우트가 공유 |
| [app/api/email/connect/route.ts](app/api/email/connect/route.ts) | app | GET, Google 인증 화면으로 리다이렉트. `{ ok, data }` 규약의 예외 (GET+리다이렉트) |
| [app/api/email/callback/route.ts](app/api/email/callback/route.ts) | app | Google이 돌려보내는 주소. 코드를 토큰으로 교환해 httpOnly 쿠키에 저장 |
| [app/api/email/messages/route.ts](app/api/email/messages/route.ts) | app | POST, 최근 메일을 받아 회사/발신인으로 그룹핑해 반환 |
| [app/api/email/send/route.ts](app/api/email/send/route.ts) | app | POST, `{ to, subject, body }`를 Zod로 검증 후 발송 |
| [components/EmailPanel.tsx](components/EmailPanel.tsx) | components | 연결 배너 + 회사/발신인/메일 트리 + 20초 폴링 |
| [components/EmailComposer.tsx](components/EmailComposer.tsx) | components | 테스트 발송 폼 (받는사람/제목/본문 → `/api/email/send`) |

`app/page.tsx`에는 `<EmailPanel />`, `<EmailComposer />`를 헤더 아래, 기존 "아직 화면이 없습니다" 자리 위에 추가했다.

`.env.example`에 추가한 항목:

```
# Gmail 연동. Google Cloud Console > 사용자 인증 정보 > OAuth 클라이언트 ID(웹 애플리케이션)에서 발급한다.
# GOOGLE_REDIRECT_URI는 콘솔의 '승인된 리디렉션 URI'와 글자 단위로 같아야 한다.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/email/callback
```

새 npm 의존성은 **하나도 추가하지 않았다.** 요청 검증에 쓴 Zod는 다른 팀원 작업으로 이미 설치돼 있었다.

---

## 4. Google Cloud Console 설정 절차

1. [console.cloud.google.com](https://console.cloud.google.com) → 새 프로젝트 생성
2. **API 및 서비스 → 라이브러리 → Gmail API 사용 설정** (빼먹으면 403)
3. **OAuth 동의 화면** → User Type: 외부(External) → 앱 이름/지원 이메일 입력 → 저장 → 게시 상태는 **테스트**로 유지 ("프로덕션으로 게시" 누르지 않는다 — 심사 걸림)
4. **범위 추가** → `gmail.readonly`, `gmail.send` 둘 다 체크 → 저장
5. **테스트 사용자** 섹션 → 시연에 쓸 Gmail 계정 추가 (여기 등록 안 된 계정은 로그인 자체가 막힌다)
6. **사용자 인증 정보 → OAuth 클라이언트 ID → 웹 애플리케이션**
   - 승인된 리디렉션 URI: `http://localhost:3000/api/email/callback`
7. 발급된 Client ID / Client Secret을 `.env.local`에 채운다

```bash
cp .env.example .env.local
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 채우기
```

---

## 5. 검증한 것 / 아직 안 한 것

### 5.1 로컬에서 확인된 것

- `.env.local` 인식, OAuth 리다이렉트, Google 동의 화면 진입(앱 이름 정상 표시)까지 브라우저로 직접 확인함
- `pnpm build` 통과 (라우트 4개 정상 등록: `/api/email/connect`, `/api/email/callback`, `/api/email/messages`, `/api/email/send`)
- `tsc --noEmit` 통과
- 미연결 상태 UI (안내 문구 + 연결 버튼) + 발송 폼 렌더링 정상 동작 스크린샷 확인

### 5.2 사용자가 직접 진행해야 하는 것

- 실제 계정으로 로그인 → 동의 → `/?gmail=connected` 복귀 → 회사/발신인 트리 표시까지의 전 구간 (계정 로그인이 필요해 에이전트가 대신 할 수 없다)
- **발송 버튼 클릭.** 실제 수신자에게 메일이 나가는 부수효과가 있는 동작이라, 코드는 완성해뒀지만 클릭은 사용자가 직접 하거나 채팅으로 수신자를 지정해야 진행한다
- Console에 `gmail.send` 스코프를 이미 연결된 뒤에 추가했다면, 새 스코프로 재동의받기 위해 Gmail을 한 번 다시 연결해야 한다 (`prompt: 'consent'`가 걸려 있어 재연결 시 자동으로 새 동의 화면이 뜬다)

### 5.3 증분 동기화 없음

지금은 폴링마다 최근 20통을 통째로 다시 받는다. `history.list` + 마지막 `historyId` 저장으로 바꿔야 진짜 증분이 된다. `historyId`를 서버에 못 두므로 쿠키나 응답에 실어 클라이언트가 들고 있다가 다음 요청에 같이 보내는 방식이 필요하다.

### 5.4 인용문 · 서명 제거 없음

`RawEmail.body`에 답장 스레드의 이전 본문이 그대로 딸려온다. `Utterance`로 변환하는 단계(`core/email/to-utterances.ts`, 아직 없음)에서 다음을 처리해야 한다.

- `>` 인용줄, `... wrote:` / `-----Original Message-----` 이후 제거
- 문단(`\n\s*\n`) 단위로 발화 분할
- 스레드 내 중복 문단 2차 제거 (휴리스틱이 새는 경우 대비)

이걸 안 하면 L2 근거 검증(`utterance.text.includes(sourceQuote)`)이 중복 사본에도 그대로 통과해서, 같은 요구사항이 여러 번 추출된다.

### 5.5 계약 단위 라우팅 없음

지금은 회사 도메인으로만 묶는다. 어느 계약에 속하는지는 아직 아무것도 안 정해준다. 계약 도메인 모델이 생기면 "회사 그룹 → 계약 매핑"을 사람이 한 번 확인하는 화면이 필요하다 (자동 라우팅은 오분류 시 요구사항이 엉뚱한 계약에 붙는 위험이 있어 배제).

### 5.6 공용 메일 도메인 처리 안 됨

`gmail.com`, `naver.com` 같은 공용 도메인을 쓰는 고객이 여럿이면 전부 한 회사 그룹으로 묶인다. 실제 시연 대상 계정 구성에 따라 문제가 될 수 있다.

---

## 6. 심사(Verification) 관련 결정 — 지금은 보류

| 스코프 | 분류 | 심사 요건 |
|---|---|---|
| `gmail.readonly` | restricted | 브랜드 검증 + **CASA 보안 심사**. Tier 2 기준 2~3주, $500~4,500, 매년 재인증 |
| `gmail.send` | sensitive | 더 가벼운 검증, 3~5영업일. CASA 대상 아님 |

- **지금은 둘 다 심사를 받지 않는다.** 테스트 모드 + 테스트 사용자 등록(최대 100명)으로 시연은 충분하고, 심사는 "고객사가 자기 계정으로 직접 가입"하는 단계에서 다시 논의한다.
- 테스트 모드의 refresh token은 **7일 뒤 만료**된다. 시연 3일 전쯤 재연결해서 카운터를 리셋해야 한다. **캘린더에 기록해둘 것.**
- 서버(`app/api/email/token.ts`)가 토큰으로 Gmail을 직접 호출하는 구조라 "서버를 통한 데이터 접근"에 해당하고, 나중에 `gmail.readonly` 심사를 받게 되면 CASA 대상이 확실하다. `gmail.send`만 쓰는 기능이라면 CASA 없이 더 가볍게 통과한다.

---

## 7. 현재 상태 · 다음 단계

- [이슈 #5](https://github.com/young-thirty/agreed_dev/issues/5) → `feat/#5` 브랜치에 커밋 완료. **아직 push는 안 함.**
- 다음 단계는 [CLAUDE.md](CLAUDE.md) §6 절차의 나머지: `git push -u origin feat/#5` → `dev`로 PR.
- 아직 정하지 않은 것 (푸시 전에 팀과 확인하면 좋음):
  - `.eml` 파일 업로드 등 다른 입력 경로를 위한 라이브러리 추가 여부 (`postal-mime` 등)
  - `types/index.ts`에 `Utterance.sentAt` 같은 필드를 추가할지 — 공유 타입 변경이라 팀 공지 필요. 마침 `Utterance.channel`이 이미 `'이메일' | '슬랙'`을 값으로 갖고 있어(다른 팀원 작업), 이메일을 실제 `Utterance`로 변환하는 다음 단계와 맞물린다
  - `core/email/grouping.ts`의 `CompanyGroup`/`SenderGroup`을 `types/index.ts`로 옮길지, `core/` 내부 타입으로 둘지
