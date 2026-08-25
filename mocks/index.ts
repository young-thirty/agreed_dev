// 화면 개발용 목 데이터.
// 백엔드·LLM·GitHub 연동 전이므로 분석 결과와 개발 현황은 전부 여기서 만든 값이다.
// types/index.ts의 타입을 그대로 쓰므로 서버가 붙으면 호출로 바꿔도 화면은 그대로다.

import type {
  Inbound,
  InboundDecision,
  Outbound,
  Project,
  ProjectDocument,
  RepoSnapshot,
  Ticket,
} from '@/types';

/** 데모 기준 시각. 상대 시간이 자연스럽게 보이도록 목 데이터가 이 근처에 모여 있다. */
export const NOW = new Date('2026-08-26T10:30:00').getTime();

// ─── 프로젝트 ────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    projectId: 'acme',
    name: 'A사 홈페이지 리뉴얼',
    clientName: 'A사',
    clientEmail: 'jiwon@acme.co.kr',
    status: 'ACTIVE',
    githubRepo: 'acme/website',
    lastMessage: '카카오 로그인도 추가해주세요.',
    lastMessageAt: '2026-08-26T09:12:00',
  },
  {
    projectId: 'delta',
    name: 'D사 예약 서비스 구축',
    clientName: 'D사',
    clientEmail: 'minho@d-booking.kr',
    status: 'ACTIVE',
    githubRepo: 'd-booking/server',
    lastMessage: '카카오 로그인도 추가해주세요. 이번 주에는 되는 거죠?',
    lastMessageAt: '2026-08-26T10:02:00',
  },
  {
    projectId: 'beta',
    name: 'B사 커머스 앱 개편',
    clientName: 'B사',
    clientEmail: 'seojun@bstore.kr',
    status: 'ACTIVE',
    githubRepo: 'bstore/shop-app',
    lastMessage: '로그인이 안 돼요.',
    lastMessageAt: '2026-08-26T08:05:00',
  },
  {
    projectId: 'gamma',
    name: 'C사 브랜드 사이트',
    clientName: 'C사',
    clientEmail: 'haneul@c-brand.kr',
    status: 'ACTIVE',
    githubRepo: null,
    lastMessage: '메인 화면 좀 더 고급스럽게 해주세요.',
    lastMessageAt: '2026-08-26T08:40:00',
  },
  {
    projectId: 'echo',
    name: 'E사 사내 관리도구 (문의)',
    clientName: 'E사',
    clientEmail: 'yujin@ecorp.kr',
    status: 'DRAFT',
    githubRepo: null,
    lastMessage: '견적 한 번 받아볼 수 있을까요?',
    lastMessageAt: '2026-08-22T11:20:00',
  },
];

// ─── 프로젝트 문서 ───────────────────────────────────────────
export const DOCUMENTS: ProjectDocument[] = [
  { id: 'acme-proposal', projectId: 'acme', fileName: 'A사_홈페이지_리뉴얼_제안서.pdf', kind: '제안서' },
  { id: 'acme-contract', projectId: 'acme', fileName: 'A사_개발용역_계약서.pdf', kind: '계약서' },
  { id: 'acme-kickoff', projectId: 'acme', fileName: '킥오프_회의록.md', kind: '회의록' },
  { id: 'delta-proposal', projectId: 'delta', fileName: 'D사_예약서비스_제안서.pdf', kind: '제안서' },
  { id: 'delta-contract', projectId: 'delta', fileName: 'D사_계약서_v2.pdf', kind: '계약서' },
  { id: 'beta-contract', projectId: 'beta', fileName: 'B사_앱개편_계약서.pdf', kind: '계약서' },
  { id: 'beta-scope', projectId: 'beta', fileName: '개편_범위_정의서.pdf', kind: '요구사항 문서' },
  { id: 'gamma-contract', projectId: 'gamma', fileName: 'C사_브랜드사이트_계약서.pdf', kind: '계약서' },
];

// ─── GitHub 개발 현황 ────────────────────────────────────────
// 대시보드처럼 다 보여주지 않는다. 프로젝트 컨텍스트 탭에서 기능 단위로만 접어 둔다.
export const REPO_SNAPSHOTS: RepoSnapshot[] = [
  {
    projectId: 'acme',
    repo: 'acme/website',
    features: [
      {
        name: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'todo', text: 'OAuth(소셜 로그인) 구조 없음' },
        ],
      },
      {
        name: '회원가입',
        items: [
          { state: 'done', text: '회원가입 화면 구현 완료' },
          { state: 'done', text: '회원가입 API 구현 완료' },
          { state: 'progress', text: '입력값 검증 작업 중' },
          { state: 'progress', text: '오류 처리 작업 중' },
          { state: 'todo', text: 'QA 미착수' },
        ],
      },
      {
        name: '콘텐츠 관리',
        items: [
          { state: 'done', text: '메인 배너 관리 화면 구현 완료' },
          { state: 'todo', text: '게시판 관리 미착수' },
        ],
      },
    ],
    openWork: [
      { title: 'PR #42 회원가입 입력값 검증', note: 'In Progress · 8월 28일 목표' },
      { title: 'PR #40 관리자 배너 교체', note: 'Review 대기' },
    ],
  },
  {
    projectId: 'delta',
    repo: 'd-booking/server',
    features: [
      {
        name: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'todo', text: 'OAuth(소셜 로그인) 구조 없음' },
        ],
      },
      {
        name: '예약',
        items: [
          { state: 'done', text: '예약 생성·취소 구현 완료' },
          { state: 'progress', text: '예약 알림 문자 연동 작업 중' },
        ],
      },
    ],
    openWork: [{ title: 'PR #31 예약 알림 문자 연동', note: 'In Progress · 8월 28일 목표' }],
  },
  {
    projectId: 'beta',
    repo: 'bstore/shop-app',
    features: [
      {
        name: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'progress', text: '세션 만료 정책 변경 배포됨 (8월 23일)' },
        ],
      },
      {
        name: '상품·장바구니',
        items: [
          { state: 'done', text: '상품 상세 화면 개편 완료' },
          { state: 'done', text: '장바구니 수량 오류 수정 완료' },
        ],
      },
    ],
    openWork: [{ title: 'PR #58 세션 만료 시간 조정', note: 'Merged · 8월 23일 배포' }],
  },
];

// ─── 티켓 ────────────────────────────────────────────────────
// 상태는 사람이 직접 바꾼다. AI는 티켓을 만들지도, 상태를 바꾸지도 않는다.
export const TICKETS: Ticket[] = [
  {
    ticketId: 'TCK-91',
    projectId: 'delta',
    title: '카카오 소셜 로그인 추가',
    summary:
      '고객이 카카오 로그인 추가를 요청해 만들어진 티켓이다. 계약 범위 밖으로 보여 추가 비용과 완료 예정일을 정한 뒤 안내해야 한다.',
    status: 'Active',
    category: '기능 요청',
    requirement: '(미확정) 카카오 OAuth 로그인 추가',
    lastCustomerMessage: '카카오 로그인도 추가해주세요. 이번 주에는 되는 거죠?',
    createdAt: '2026-08-26T10:02:00',
    updatedAt: '2026-08-26T10:02:00',
  },
  {
    ticketId: 'TCK-56',
    projectId: 'beta',
    title: '로그인 오류 신고',
    summary:
      '고객이 로그인이 되지 않는다고 신고해 만들어진 티켓이다. 기기·브라우저·오류 메시지 등 재현 정보를 받아야 원인을 확인할 수 있다.',
    status: 'Active',
    category: '버그',
    requirement: '(확인 중) 로그인 실패 원인 파악 및 수정',
    lastCustomerMessage: '로그인이 안 돼요.',
    createdAt: '2026-08-26T08:05:00',
    updatedAt: '2026-08-26T08:05:00',
  },
  {
    ticketId: 'TCK-12',
    projectId: 'acme',
    title: '로그인 기능',
    summary:
      '이메일 로그인과 JWT 인증까지 구현이 끝났다. 소셜 로그인은 제안 범위에 없었고, 8월 26일 고객이 카카오 로그인 추가를 요청해 처리 방향을 검토하는 중이다.',
    status: 'Active',
    category: '기능 요청',
    requirement: '이메일 기반 회원 로그인 제공 (JWT 인증)',
    lastCustomerMessage: '카카오 로그인도 추가해주세요.',
    createdAt: '2026-07-30T10:00:00',
    updatedAt: '2026-08-26T09:12:00',
  },
  {
    ticketId: 'TCK-31',
    projectId: 'acme',
    title: '회원가입 기능',
    summary:
      '회원가입 화면과 API 구현이 끝났고, 지금은 입력값 검증과 오류 처리를 작업하는 중이다. QA는 아직 시작하지 않았다.',
    status: 'Active',
    category: '기능 요청',
    requirement: '이메일 회원가입 · 이메일 인증 · 필수 약관 동의',
    lastCustomerMessage: '회원가입은 어디까지 됐나요?',
    createdAt: '2026-08-05T14:20:00',
    updatedAt: '2026-08-25T17:30:00',
  },
  {
    ticketId: 'TCK-08',
    projectId: 'acme',
    title: '메인 배너 문구 수정',
    summary: '메인 배너 카피를 고객이 보내준 문구로 교체하고 8월 25일 반영을 마쳤다.',
    status: 'Done',
    category: '디자인 수정',
    requirement: '메인 배너 카피를 "함께 성장하는 파트너"로 교체',
    lastCustomerMessage: '메인 배너 문구는 이렇게 부탁드려요.',
    createdAt: '2026-08-20T09:00:00',
    updatedAt: '2026-08-25T18:20:00',
  },
  {
    ticketId: 'TCK-88',
    projectId: 'delta',
    title: '로그인 기능',
    summary:
      '이메일 로그인과 JWT 인증 구현이 끝났다. 소셜 로그인은 계약 범위에 포함되어 있지 않다.',
    status: 'Active',
    category: '기능 요청',
    requirement: '이메일 기반 회원 로그인 제공 (JWT 인증)',
    lastCustomerMessage: '카카오 로그인도 추가해주세요.',
    createdAt: '2026-08-01T11:00:00',
    updatedAt: '2026-08-26T10:02:00',
  },
  {
    ticketId: 'TCK-90',
    projectId: 'delta',
    title: '예약 알림 문자 연동',
    summary: '예약 확정 시 문자 발송을 붙이는 작업이다. 현재 PR #31로 진행 중이며 8월 28일 완료 목표다.',
    status: 'Active',
    category: '기능 요청',
    requirement: '예약 확정·취소 시 고객에게 알림 문자 발송',
    lastCustomerMessage: null,
    createdAt: '2026-08-12T15:40:00',
    updatedAt: '2026-08-24T09:10:00',
  },
  {
    ticketId: 'TCK-49',
    projectId: 'beta',
    title: '세션 만료 정책 변경',
    summary:
      '로그인 세션 만료 시간을 24시간에서 2시간으로 줄이는 변경이다. 8월 23일 배포까지 끝났다.',
    status: 'Done',
    category: '기능 요청',
    requirement: '로그인 세션 만료 시간을 2시간으로 조정',
    lastCustomerMessage: null,
    createdAt: '2026-08-18T13:00:00',
    updatedAt: '2026-08-23T17:00:00',
  },
  {
    ticketId: 'TCK-55',
    projectId: 'beta',
    title: '상품 상세 디자인 3차 수정',
    summary:
      '계약에 포함된 시안 수정 2회는 이미 사용했다. 고객이 요청한 3차 수정을 어떻게 처리할지 아직 정해지지 않았다.',
    status: 'Active',
    category: '디자인 수정',
    requirement: '(미확정) 상품 상세 페이지 3차 시안 수정',
    lastCustomerMessage: '이 수정도 기존 견적에 포함된 거죠?',
    createdAt: '2026-08-25T14:10:00',
    updatedAt: '2026-08-25T14:10:00',
  },
  {
    ticketId: 'TCK-71',
    projectId: 'gamma',
    title: '메인 히어로 섹션 디자인',
    summary:
      '1차 시안을 8월 12일에 전달해 확인받았다. 8월 26일 추가 개선 요청이 들어왔으나 요구가 구체적이지 않아 확인이 필요하다.',
    status: 'Active',
    category: '디자인 수정',
    requirement: '메인 히어로 섹션 디자인 및 반응형 대응',
    lastCustomerMessage: '메인 화면 좀 더 고급스럽게 해주세요.',
    createdAt: '2026-08-08T10:30:00',
    updatedAt: '2026-08-26T08:40:00',
  },
];

// ─── 고객 메시지(Inbound)와 분석 ─────────────────────────────
export const INBOUNDS: Inbound[] = [
  // Case F — 복합 요청
  {
    inboundId: 'inb-f',
    channel: 'email',
    projectId: 'delta',
    ticketId: 'TCK-91',
    fromName: '최민호',
    fromEmail: 'minho@d-booking.kr',
    subject: '로그인 관련 문의드립니다',
    preview: '카카오 로그인도 추가해주세요. 이번 주에는 되는 거죠?',
    body: `안녕하세요.

카카오 로그인도 추가해주세요.
이번 주에는 되는 거죠? 기존 견적에 포함된 거죠?

확인 부탁드립니다.`,
    attachments: [],
    createdAt: '2026-08-26T10:02:00',
    initialStage: 'to_analyze',
    category: '기능 요청',
    analysis: {
      headline: '한 메시지에 3개의 요청이 섞여 있습니다. 비용과 일정에 대한 판단이 필요합니다.',
      intents: [
        { kind: '기능 요청', text: '카카오 로그인 추가' },
        { kind: '일정 문의', text: '이번 주 완료 가능 여부' },
        { kind: '계약 문의', text: '기존 견적 포함 여부' },
      ],
      fields: [
        { label: '범위', value: '기존 계약 범위 밖일 가능성이 높습니다', tone: 'caution' },
        {
          label: '개발',
          items: ['이메일 로그인은 구현 완료', 'OAuth 구조가 없어 추가 구현이 필요'],
        },
        {
          label: '일정',
          value: '진행 중인 예약 알림 작업과 영향 영역이 겹쳐 이번 주 완료는 어려워 보입니다',
          tone: 'caution',
        },
        { label: '사용자 판단 필요', items: ['추가 비용', '완료 예정일'], tone: 'caution' },
      ],
      missingInfo: [],
      devContext: {
        subject: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'todo', text: 'OAuth 미구현' },
        ],
        relatedWork: [{ title: 'PR #31 예약 알림 문자 연동', note: 'In Progress · 8월 28일 목표' }],
        impactAreas: ['AuthService', 'UserEntity', 'LoginPage', 'OAuthCallback'],
      },
      evidence: [
        {
          source: 'document',
          label: '제안서',
          title: 'D사_예약서비스_제안서.pdf',
          quote: '회원 인증은 이메일 기반 로그인으로 제공한다.',
        },
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-88 로그인 기능',
          quote: '이메일 로그인 · JWT 인증까지 구현 완료. 소셜 로그인은 범위 외.',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'd-booking/server · AuthService, UserEntity',
          quote: 'OAuth 콜백 라우트와 소셜 계정 연결 테이블이 존재하지 않음.',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'PR #31 예약 알림 문자 연동',
          quote: 'In Progress. UserEntity를 함께 수정 중이라 작업이 겹칩니다.',
        },
      ],
      relatedTicketId: 'TCK-88',
      ticketProposal: {
        title: '카카오 소셜 로그인 추가',
        category: '기능 요청',
        requirement: '카카오 OAuth 로그인 추가 및 기존 이메일 계정과 연결',
        summary:
          '고객이 카카오 로그인 추가를 요청했다. 계약 범위 밖으로 판단되어 추가 비용과 완료 예정일을 확정한 뒤 진행 여부를 안내한다.',
      },
      decisionFields: [
        { id: 'amount', label: '추가 비용', type: 'money', placeholder: '예: 300000' },
        { id: 'dueDate', label: '완료 예정일', type: 'date' },
      ],
      drafts: {
        base: `안녕하세요, 민호님.

카카오 로그인 추가는 가능합니다. 다만 세 가지를 나눠 말씀드리겠습니다.

1. 견적 포함 여부
최초 제안 범위에는 이메일 로그인만 포함되어 있어, 카카오 로그인은 추가 개발 항목으로 확인됩니다.

2. 일정
현재 예약 알림 문자 연동 작업과 수정 영역이 겹쳐 이번 주 완료는 어렵습니다. {{dueDate}}까지 완료 가능합니다.

3. 비용
추가 비용은 {{amount}}입니다.

이대로 진행할지 회신 주시면 바로 반영하겠습니다.`,
        friendly: `안녕하세요, 민호님! 문의 주셔서 감사합니다.

카카오 로그인은 충분히 추가할 수 있습니다. 다만 처음 제안드린 범위에는 이메일 로그인만 들어가 있어서, 카카오 로그인은 추가 작업으로 봐주시면 좋겠습니다.

지금 예약 알림 문자 작업과 손대는 부분이 겹쳐서 이번 주 안에는 어렵고, {{dueDate}}까지는 마무리해드릴 수 있습니다. 추가 비용은 {{amount}}입니다.

괜찮으시면 말씀해주세요. 바로 반영하겠습니다!`,
        short: `카카오 로그인 추가 가능합니다.

기존 견적에는 이메일 로그인만 포함되어 추가 항목으로 확인됩니다. 이번 주 완료는 어렵고 {{dueDate}}까지 가능하며, 추가 비용은 {{amount}}입니다.

진행 여부 회신 부탁드립니다.`,
        firm: `안녕하세요.

카카오 로그인은 기존 견적에 포함되어 있지 않습니다. 제안서와 계약서 모두 이메일 로그인만 범위로 명시하고 있습니다.

추가 작업으로 진행할 경우 비용은 {{amount}}, 완료 예정일은 {{dueDate}}입니다. 현재 진행 중인 작업과 영역이 겹치므로 이번 주 완료는 불가합니다.

진행 여부를 확정해 회신해 주시면 일정에 반영하겠습니다.`,
      },
    },
  },

  // Case A — 기능 추가
  {
    inboundId: 'inb-a',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-12',
    fromName: '김지원',
    fromEmail: 'jiwon@acme.co.kr',
    subject: '카카오 로그인도 추가해주세요',
    preview: '카카오 로그인도 추가해주세요.',
    body: `안녕하세요, 지원입니다.

지난번에 말씀드린 로그인 관련해서요.
요즘 다들 카카오로 로그인해서, 카카오 로그인도 같이 추가해주시면 좋겠습니다.

확인 부탁드려요.`,
    attachments: [],
    createdAt: '2026-08-26T09:12:00',
    initialStage: 'to_reply',
    category: '기능 요청',
    analysis: {
      headline: '제안 범위에 없던 기능 추가 요청입니다. 추가 작업으로 볼지 판단이 필요합니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '카카오 소셜 로그인 추가' },
        { label: '요청 유형', value: '기능 추가' },
        { label: '관련 기존 요구', value: '로그인 기능 (TCK-12)' },
        {
          label: '기존 합의',
          items: [
            '이메일 로그인은 제안서에 포함되어 있음',
            '카카오 로그인에 대한 명시적 합의는 찾지 못함',
          ],
        },
        {
          label: '확인 필요',
          value: '추가 작업으로 처리할지, 비용과 일정을 어떻게 안내할지 정해야 합니다',
          tone: 'caution',
        },
      ],
      missingInfo: [],
      devContext: {
        subject: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'todo', text: 'OAuth 미구현' },
        ],
        relatedWork: [{ title: 'PR #42 회원가입 입력값 검증', note: 'In Progress · 8월 28일 목표' }],
        impactAreas: ['AuthService', 'UserEntity', 'LoginPage', 'OAuthCallback'],
      },
      evidence: [
        {
          source: 'document',
          label: '제안서',
          title: 'A사_홈페이지_리뉴얼_제안서.pdf',
          quote: '이메일 기반 회원 로그인 기능을 제공한다.',
        },
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-12 로그인 기능',
          quote: '이메일 로그인 · JWT 인증까지 구현 완료.',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'acme/website · AuthService, UserEntity, LoginPage',
          quote: '소셜 로그인 관련 코드 없음. OAuth 콜백 라우트가 존재하지 않음.',
        },
      ],
      relatedTicketId: 'TCK-12',
      ticketProposal: {
        title: '카카오 소셜 로그인 추가',
        category: '기능 요청',
        requirement: '카카오 OAuth 로그인 추가 및 기존 이메일 계정과 연결',
        summary:
          '고객이 카카오 로그인 추가를 요청했다. 제안 범위 밖으로 확인되어 추가 비용과 완료 예정일을 정한 뒤 안내한다.',
      },
      decisionFields: [
        { id: 'amount', label: '추가 비용', type: 'money', placeholder: '예: 300000' },
        { id: 'dueDate', label: '완료 예정일', type: 'date' },
      ],
      drafts: {
        base: `안녕하세요, 지원님.

카카오 로그인 추가는 가능합니다.

다만 최초 제안 범위에는 이메일 로그인만 포함되어 있어, 카카오 로그인은 추가 개발 항목으로 확인됩니다. 현재 인증 구조상 OAuth 연동과 기존 회원 계정 연결 작업이 함께 필요합니다.

{{dueDate}}까지 완료 가능하며, 추가 비용은 {{amount}}입니다.

진행을 원하시면 회신 주세요. 확정되는 대로 일정에 반영하겠습니다.`,
        friendly: `안녕하세요, 지원님! 말씀 주셔서 감사합니다.

카카오 로그인은 추가해드릴 수 있습니다.

다만 처음 제안드린 범위에는 이메일 로그인만 들어가 있어서, 카카오 로그인은 추가 작업으로 봐주시면 좋겠습니다. 지금 구조에서는 OAuth 연동과 기존 회원 계정을 이어주는 작업이 함께 필요하거든요.

{{dueDate}}까지 마무리할 수 있고, 추가 비용은 {{amount}}입니다. 편하게 알려주세요!`,
        short: `카카오 로그인 추가 가능합니다.

기존 제안 범위에는 이메일 로그인만 포함되어 있어 추가 개발 항목으로 확인됩니다. {{dueDate}} 완료 가능하며 추가 비용은 {{amount}}입니다.

진행 여부 회신 부탁드립니다.`,
        firm: `안녕하세요.

카카오 로그인은 제안 범위에 포함되어 있지 않습니다. 제안서에 명시된 범위는 이메일 기반 로그인까지입니다.

추가 작업으로 진행할 경우 비용은 {{amount}}, 완료 예정일은 {{dueDate}}입니다.

진행 여부를 확정해 주시면 그때 일정에 반영하겠습니다.`,
      },
    },
  },

  // Case B — 모호한 요구
  {
    inboundId: 'inb-b',
    channel: 'email',
    projectId: 'gamma',
    ticketId: 'TCK-71',
    fromName: '이하늘',
    fromEmail: 'haneul@c-brand.kr',
    subject: '메인 화면 관련해서요',
    preview: '메인 화면 좀 더 고급스럽게 해주세요.',
    body: `메인 화면 좀 더 고급스럽게 해주세요.

지금도 나쁘지 않은데 뭔가 아쉬워서요.`,
    attachments: [],
    createdAt: '2026-08-26T08:40:00',
    initialStage: 'to_reply',
    category: '디자인 수정',
    analysis: {
      headline: '요구가 아직 구체적이지 않습니다. 무엇을 바꿔야 하는지 확인이 필요합니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '메인 화면 디자인 개선 (범위 불명확)' },
        { label: '요청 유형', value: '디자인 수정' },
        { label: '관련 기존 요구', value: '메인 히어로 섹션 디자인 (TCK-71)' },
        {
          label: '기존 합의',
          items: ['계약서상 시안 수정은 총 2회 포함', '현재 1회 사용 (8월 12일 1차 수정)'],
        },
        {
          label: '판단 보류',
          value: '"고급스럽게"가 어떤 변경인지 특정할 수 없어 범위와 비용은 판단하지 않았습니다',
          tone: 'caution',
        },
      ],
      missingInfo: [
        '바꾸고 싶은 요소 (색 · 여백 · 서체 · 사진 중 무엇인지)',
        '참고하고 싶은 사이트나 이미지',
        '메인 화면만인지, 하위 페이지까지인지',
      ],
      devContext: null,
      evidence: [
        {
          source: 'document',
          label: '계약서',
          title: 'C사_브랜드사이트_계약서.pdf',
          quote: '디자인 시안에 대한 수정은 총 2회까지 포함한다.',
        },
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-71 메인 히어로 섹션 디자인',
          quote: '1차 시안 전달 완료 (8월 12일). 수정 1회 사용.',
        },
        {
          source: 'message',
          label: '이전 고객 메시지',
          title: '2026-08-12 · 이하늘',
          quote: '1차 시안은 전체적으로 깔끔해서 좋아요.',
        },
      ],
      relatedTicketId: 'TCK-71',
      ticketProposal: {
        title: '메인 화면 디자인 개선 요청',
        category: '디자인 수정',
        requirement: '(확인 후 정의) 메인 화면 디자인 개선',
        summary:
          '고객이 메인 화면을 더 고급스럽게 해달라고 요청했다. 무엇을 바꿔야 하는지 확인한 뒤 범위를 정의한다.',
      },
      decisionFields: [],
      drafts: {
        base: `안녕하세요, 하늘님.

메인 화면 개선 말씀 확인했습니다.

방향을 정확히 맞추기 위해 몇 가지만 여쭙겠습니다.

- 지금 화면에서 특히 아쉬운 부분이 어디인가요? (색감, 여백, 서체, 사진 등)
- 참고하고 싶은 사이트나 이미지가 있을까요?
- 메인 화면만 보시는 건지, 하위 페이지까지 함께 보시는 건지 알려주세요.

알려주시면 수정 범위와 일정을 정리해 회신드리겠습니다.`,
        friendly: `안녕하세요, 하늘님!

메인 화면 더 다듬어 달라는 말씀 잘 봤습니다. 방향만 조금 더 알려주시면 훨씬 정확하게 맞춰드릴 수 있을 것 같아요.

- 지금 화면에서 어떤 부분이 제일 아쉬우셨을까요? (색감, 여백, 서체, 사진 등)
- 마음에 드는 사이트나 이미지가 있으면 편하게 보내주세요.
- 메인 화면만 보면 될지, 다른 페이지도 같이 볼지도 알려주시면 좋겠습니다.

받는 대로 정리해서 회신드릴게요!`,
        short: `메인 화면 개선 요청 확인했습니다.

방향을 맞추기 위해 세 가지만 알려주세요.
1. 아쉬운 부분 (색감 · 여백 · 서체 · 사진)
2. 참고 사이트나 이미지
3. 대상 범위 (메인 화면만 / 하위 페이지 포함)

확인 후 범위와 일정을 회신드리겠습니다.`,
        firm: `안녕하세요.

메인 화면 개선 요청은 현재 내용만으로는 작업 범위를 확정할 수 없습니다.

아래를 알려주셔야 일정과 비용을 안내드릴 수 있습니다.
- 변경이 필요한 요소 (색감 · 여백 · 서체 · 사진)
- 참고 사이트 또는 이미지
- 대상 범위 (메인 화면만 / 하위 페이지 포함)

참고로 계약상 시안 수정은 2회까지 포함되며, 현재 1회를 사용한 상태입니다.`,
      },
    },
  },

  // Case C — 버그, 정보 부족
  {
    inboundId: 'inb-c',
    channel: 'slack',
    projectId: 'beta',
    ticketId: 'TCK-56',
    fromName: '박서준',
    fromEmail: 'seojun@bstore.kr',
    subject: '#b사-앱개편',
    preview: '로그인이 안 돼요.',
    body: '로그인이 안 돼요.',
    attachments: [],
    createdAt: '2026-08-26T08:05:00',
    initialStage: 'to_reply',
    category: '버그',
    analysis: {
      headline: '로그인 오류가 접수됐습니다. 지금 정보만으로는 원인을 특정할 수 없습니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '로그인 오류 확인 요청' },
        { label: '요청 유형', value: '버그 신고' },
        {
          label: '확인된 사실',
          items: [
            '8월 23일 세션 만료 정책 변경이 배포됨 (관련 여부는 확인되지 않음)',
            '같은 시간대에 다른 계정의 로그인 성공 기록이 있음',
          ],
        },
        {
          label: '판단 보류',
          value: '재현 정보가 없어 원인을 추정하지 않았습니다',
          tone: 'caution',
        },
      ],
      missingInfo: ['사용 기기', '브라우저', '화면에 표시된 오류 메시지', '로그인 시도한 계정', '재현 단계'],
      devContext: {
        subject: '로그인',
        items: [
          { state: 'done', text: '이메일 로그인 구현 완료' },
          { state: 'done', text: 'JWT 인증 구현 완료' },
          { state: 'progress', text: '세션 만료 정책 변경 배포됨 (8월 23일)' },
        ],
        relatedWork: [{ title: 'PR #58 세션 만료 시간 조정', note: 'Merged · 8월 23일 배포' }],
        impactAreas: ['AuthService', 'SessionStore', 'LoginPage'],
      },
      evidence: [
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-49 세션 만료 정책 변경',
          quote: '로그인 세션 만료 시간을 2시간으로 조정. 8월 23일 배포 완료.',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'bstore/shop-app · PR #58',
          quote: 'SessionStore의 만료 처리 로직이 변경됨 (24h → 2h).',
        },
      ],
      relatedTicketId: 'TCK-49',
      ticketProposal: {
        title: '로그인 오류 신고',
        category: '버그',
        requirement: '(확인 중) 로그인 실패 원인 파악 및 수정',
        summary:
          '고객이 로그인이 되지 않는다고 신고했다. 기기·브라우저·오류 메시지 등 재현 정보를 받은 뒤 원인을 확인한다.',
      },
      decisionFields: [],
      drafts: {
        base: `안녕하세요, 서준님.

로그인 오류 확인하겠습니다.

빠르게 원인을 찾기 위해 아래 정보를 보내주실 수 있을까요?

- 사용하신 기기와 브라우저
- 로그인 시 화면에 표시되는 오류 메시지
- 로그인 시도하신 계정
- 어떤 순서로 하면 다시 발생하는지

받는 대로 바로 확인해 회신드리겠습니다.`,
        friendly: `안녕하세요, 서준님! 불편을 드려 죄송합니다.

바로 확인해보겠습니다. 다만 원인을 정확히 잡으려면 몇 가지가 필요해서요.

- 어떤 기기와 브라우저에서 시도하셨을까요?
- 화면에 뜨는 오류 메시지를 캡처해 주실 수 있을까요?
- 로그인 시도하신 계정도 알려주시면 좋겠습니다.

보내주시면 바로 확인해서 알려드릴게요!`,
        short: `로그인 오류 확인하겠습니다.

원인 파악을 위해 아래를 보내주세요.
- 기기 / 브라우저
- 오류 메시지 (캡처)
- 로그인 계정
- 재현 순서

받는 대로 확인해 회신드리겠습니다.`,
        firm: `안녕하세요.

로그인 오류는 현재 전달받은 내용만으로는 원인을 특정할 수 없습니다.

확인을 위해 아래 정보가 필요합니다.
- 사용 기기 및 브라우저
- 화면에 표시된 오류 메시지
- 로그인 시도한 계정
- 재현 단계

정보가 확인되는 대로 원인과 조치 일정을 회신드리겠습니다.`,
      },
    },
  },

  // Case D — 진행 상황 문의
  {
    inboundId: 'inb-d',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-31',
    fromName: '김지원',
    fromEmail: 'jiwon@acme.co.kr',
    subject: '회원가입은 어디까지 됐나요?',
    preview: '회원가입은 어디까지 됐나요?',
    body: `안녕하세요.

회원가입 기능은 지금 어디까지 진행됐을까요?
내부 보고가 있어서 대략적인 일정도 같이 알려주시면 좋겠습니다.`,
    attachments: [],
    createdAt: '2026-08-25T17:30:00',
    initialStage: 'to_reply',
    category: '일반 질문',
    analysis: {
      headline: '진행 상황 문의입니다. 지금 확인된 개발 현황으로 바로 답변할 수 있습니다.',
      intents: [],
      fields: [
        { label: '질문', value: '회원가입 기능 진행 상황' },
        { label: '요청 유형', value: '진행 상황 문의' },
        { label: '관련 기존 요구', value: '회원가입 기능 (TCK-31)' },
        { label: '답변 가능', value: '예. 범위·비용 변화는 없습니다' },
        {
          label: '확인 필요',
          value: '고객이 일정을 물었습니다. 완료 예정일은 사용자가 정해야 합니다',
          tone: 'caution',
        },
      ],
      missingInfo: [],
      devContext: {
        subject: '회원가입',
        items: [
          { state: 'done', text: '회원가입 화면 구현 완료' },
          { state: 'done', text: '회원가입 API 구현 완료' },
          { state: 'progress', text: '입력값 검증 작업 중' },
          { state: 'progress', text: '오류 처리 작업 중' },
          { state: 'todo', text: 'QA 미착수' },
        ],
        relatedWork: [{ title: 'PR #42 회원가입 입력값 검증', note: 'In Progress · 8월 28일 목표' }],
        impactAreas: ['SignupPage', 'UserEntity', 'AuthService'],
      },
      evidence: [
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-31 회원가입 기능',
          quote: '이메일 회원가입 · 이메일 인증 · 필수 약관 동의',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'acme/website · PR #42',
          quote: '회원가입 입력값 검증 작업 진행 중. 8월 28일 목표.',
        },
      ],
      relatedTicketId: 'TCK-31',
      ticketProposal: {
        title: '회원가입 진행 상황 문의',
        category: '일반 질문',
        requirement: '(해당 없음) 진행 상황 안내',
        summary: '고객이 회원가입 진행 상황과 일정을 물었다. 현재 개발 현황을 정리해 회신한다.',
      },
      decisionFields: [{ id: 'dueDate', label: '완료 예정일', type: 'date' }],
      drafts: {
        base: `안녕하세요, 지원님.

회원가입 기능 진행 상황 안내드립니다.

완료
- 회원가입 화면
- 회원가입 API

진행 중
- 입력값 검증
- 오류 처리

남은 작업
- QA

현재 속도라면 {{dueDate}}까지 마무리 가능합니다. 보고 자료에 필요한 내용이 더 있으면 말씀해 주세요.`,
        friendly: `안녕하세요, 지원님! 보고 준비하시는군요.

회원가입 쪽은 화면과 API가 모두 끝났고, 지금은 입력값 검증과 오류 처리를 다듬고 있습니다. 남은 건 QA 정도예요.

지금 속도면 {{dueDate}}까지는 마무리될 것 같습니다. 보고에 넣을 내용이 더 필요하시면 편하게 말씀해주세요!`,
        short: `회원가입 진행 상황입니다.

완료: 회원가입 화면, 회원가입 API
진행 중: 입력값 검증, 오류 처리
남은 작업: QA

{{dueDate}} 완료 예정입니다.`,
        firm: `안녕하세요.

회원가입 기능 진행 상황은 아래와 같습니다.

완료: 회원가입 화면, 회원가입 API
진행 중: 입력값 검증, 오류 처리
남은 작업: QA

완료 예정일은 {{dueDate}}입니다. 이 일정은 현재 범위 기준이며, 추가 요청이 들어오면 조정이 필요합니다.`,
      },
    },
  },

  // Case E — Scope 문의
  {
    inboundId: 'inb-e',
    channel: 'slack',
    projectId: 'beta',
    ticketId: 'TCK-55',
    fromName: '박서준',
    fromEmail: 'seojun@bstore.kr',
    subject: '#b사-앱개편',
    preview: '이 수정도 기존 견적에 포함된 거죠?',
    body: '상품 상세 시안 한 번만 더 손봐주세요. 이 수정도 기존 견적에 포함된 거죠?',
    attachments: [],
    createdAt: '2026-08-25T14:10:00',
    initialStage: 'to_analyze',
    category: '계약 문의',
    analysis: {
      headline: '계약 범위 문의입니다. 이번 요청은 포함 범위를 넘어설 가능성이 있습니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '상품 상세 시안 추가 수정과 견적 포함 여부 확인' },
        { label: '요청 유형', value: '계약 문의' },
        { label: '관련 기존 요구', value: '상품 상세 디자인 3차 수정 (TCK-55)' },
        {
          label: '기존 합의',
          items: [
            '계약서상 시안 수정은 총 2회 포함',
            '1차 8월 4일 · 2차 8월 19일로 2회 모두 사용됨',
          ],
        },
        {
          label: '확인 필요',
          value: '3회차부터의 처리 기준이 계약서에 없습니다. 무상·유상 여부를 정해야 합니다',
          tone: 'caution',
        },
      ],
      missingInfo: [],
      devContext: null,
      evidence: [
        {
          source: 'document',
          label: '계약서',
          title: 'B사_앱개편_계약서.pdf',
          quote: '디자인 시안에 대한 수정은 총 2회까지 계약 금액에 포함한다.',
        },
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-55 상품 상세 디자인 3차 수정',
          quote: '수정 2회 모두 사용됨. 3차 처리 방향 미확정으로 보류 중.',
        },
        {
          source: 'message',
          label: '이전 고객 메시지',
          title: '2026-08-19 · 박서준',
          quote: '2차 수정본 잘 받았습니다. 이 방향으로 진행해주세요.',
        },
      ],
      relatedTicketId: 'TCK-55',
      ticketProposal: {
        title: '상품 상세 3차 시안 수정 (범위 협의)',
        category: '계약 문의',
        requirement: '(미확정) 3회차 시안 수정 처리 기준 합의',
        summary:
          '계약에 포함된 시안 수정 2회를 모두 사용한 상태에서 추가 수정 요청이 들어왔다. 처리 기준을 정해 안내한다.',
      },
      decisionFields: [
        { id: 'amount', label: '추가 비용', type: 'money', placeholder: '예: 150000' },
        {
          id: 'basis',
          label: '적용 기준',
          type: 'text',
          placeholder: '예: 3회차부터 회당 15만원',
        },
      ],
      drafts: {
        base: `안녕하세요, 서준님.

문의 주신 수정 건은 기존 견적 범위를 넘습니다.

계약서에는 디자인 시안 수정이 총 2회 포함되어 있고, 1차(8월 4일)와 2차(8월 19일)로 이미 2회를 사용했습니다. 이번 요청은 3회차에 해당합니다.

적용 기준은 {{basis}}이며, 이번 수정 비용은 {{amount}}입니다.

진행 여부 알려주시면 바로 반영하겠습니다.`,
        friendly: `안녕하세요, 서준님!

확인해보니 이번 수정은 견적에 포함된 범위를 살짝 넘습니다.

계약서 기준으로 시안 수정이 2회까지 포함인데, 1차(8월 4일)와 2차(8월 19일)로 두 번 다 사용한 상태예요. 그래서 이번 건은 3회차가 됩니다.

기준은 {{basis}}이고, 이번 수정은 {{amount}}입니다. 진행할지 편하게 알려주세요!`,
        short: `이번 수정은 견적 범위 밖입니다.

계약상 시안 수정 2회는 1차(8월 4일)·2차(8월 19일)로 모두 사용됐습니다. 이번 건은 3회차입니다.

기준 {{basis}}, 비용 {{amount}}입니다. 진행 여부 회신 부탁드립니다.`,
        firm: `안녕하세요.

이번 수정 요청은 기존 견적에 포함되지 않습니다.

계약서상 디자인 시안 수정은 총 2회까지 계약 금액에 포함되며, 1차(8월 4일)와 2차(8월 19일)로 모두 사용되었습니다.

3회차부터는 {{basis}} 기준이 적용되며, 이번 수정 비용은 {{amount}}입니다. 확정 회신을 주시면 작업을 시작하겠습니다.`,
      },
    },
  },

  // 이미 답변을 보낸 메시지. 인박스의 '대기 중' 상태를 보여준다.
  {
    inboundId: 'inb-g',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-08',
    fromName: '김지원',
    fromEmail: 'jiwon@acme.co.kr',
    subject: '메인 배너 문구는 이렇게 부탁드려요',
    preview: '메인 배너 카피를 "함께 성장하는 파트너"로 바꿔주세요.',
    body: `메인 배너 카피를 "함께 성장하는 파트너"로 바꿔주세요.`,
    attachments: [],
    createdAt: '2026-08-25T15:40:00',
    initialStage: 'waiting',
    category: '디자인 수정',
    analysis: {
      headline: '계약에 포함된 범위 안의 단순 문구 수정입니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '메인 배너 카피 1건 교체' },
        { label: '요청 유형', value: '디자인 수정' },
        { label: '관련 기존 요구', value: '메인 배너 문구 수정 (TCK-08)' },
        { label: '기존 합의', value: '콘텐츠 문구 수정은 유지보수 범위에 포함' },
      ],
      missingInfo: [],
      devContext: null,
      evidence: [
        {
          source: 'document',
          label: '계약서',
          title: 'A사_개발용역_계약서.pdf',
          quote: '오픈 전 콘텐츠 문구 수정은 계약 범위에 포함한다.',
        },
      ],
      relatedTicketId: 'TCK-08',
      ticketProposal: null,
      decisionFields: [],
      drafts: {
        base: `안녕하세요, 지원님.

메인 배너 문구는 보내주신 대로 "함께 성장하는 파트너"로 교체했습니다. 확인 부탁드립니다.`,
        friendly: `안녕하세요, 지원님! 배너 문구 바로 교체해두었습니다. 확인해보시고 더 손볼 부분 있으면 알려주세요!`,
        short: `메인 배너 문구를 "함께 성장하는 파트너"로 교체했습니다. 확인 부탁드립니다.`,
        firm: `메인 배너 문구를 요청하신 대로 교체했습니다. 해당 수정은 계약 범위에 포함된 건으로 처리했습니다.`,
      },
    },
  },

  // TCK-12에 이미 붙어 있던 지난 메시지. 티켓 하나에 메시지가 쌓이는 걸 보여준다.
  {
    inboundId: 'inb-h',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-12',
    fromName: '김지원',
    fromEmail: 'jiwon@acme.co.kr',
    subject: '로그인 화면 확인했습니다',
    preview: '로그인 화면 확인했습니다. 비밀번호 찾기는 다음에 얘기해요.',
    body: `로그인 화면 확인했습니다. 잘 되네요.

비밀번호 찾기도 있으면 좋겠는데, 이건 급하지 않으니 다음에 얘기해요.`,
    attachments: [],
    createdAt: '2026-08-20T13:05:00',
    initialStage: 'waiting',
    category: '기능 요청',
    analysis: {
      headline: '구현 확인과 함께 향후 요청이 하나 언급됐습니다. 지금 처리할 것은 아닙니다.',
      intents: [],
      fields: [
        { label: '고객 요구', value: '로그인 화면 확인 완료 · 비밀번호 찾기는 추후 논의' },
        { label: '요청 유형', value: '확인 · 향후 요청 언급' },
        { label: '관련 기존 요구', value: '로그인 기능 (TCK-12)' },
        { label: '기록해 둘 것', value: '비밀번호 찾기는 범위에 없습니다. 나중에 요청이 오면 추가 항목입니다' },
      ],
      missingInfo: [],
      devContext: null,
      evidence: [
        {
          source: 'ticket',
          label: '관련 Ticket',
          title: 'TCK-12 로그인 기능',
          quote: '이메일 로그인 · JWT 인증까지 구현 완료.',
        },
      ],
      relatedTicketId: 'TCK-12',
      ticketProposal: null,
      decisionFields: [],
      drafts: {
        base: `확인 감사합니다. 비밀번호 찾기는 지금 범위에는 없어서, 필요해지시면 그때 일정과 함께 안내드리겠습니다.`,
        friendly: `확인해주셔서 감사합니다! 비밀번호 찾기는 지금 범위에는 없는데, 필요하실 때 말씀해주시면 일정 잡아서 알려드릴게요.`,
        short: `확인 감사합니다. 비밀번호 찾기는 범위 외이며, 필요 시 별도 안내드리겠습니다.`,
        firm: `확인 감사합니다. 비밀번호 찾기는 계약 범위에 포함되어 있지 않습니다. 진행이 필요하시면 별도 항목으로 안내드리겠습니다.`,
      },
    },
  },
];

// ─── 보낸 답변(Outbound) ─────────────────────────────────────
// 티켓의 지난 대화를 그리는 데 쓴다. 화면에서 보낸 답변은 사람의 판단 기록에서 온다.
export const OUTBOUNDS: Outbound[] = [
  {
    outboundId: 'out-1',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-12',
    toEmail: 'jiwon@acme.co.kr',
    body: '로그인 화면 배포했습니다. 확인 부탁드립니다.',
    createdAt: '2026-08-19T10:20:00',
  },
  {
    outboundId: 'out-2',
    channel: 'email',
    projectId: 'acme',
    ticketId: 'TCK-31',
    toEmail: 'jiwon@acme.co.kr',
    body: '회원가입 화면과 API 작업을 시작했습니다. 이번 주 안에 1차 확인 가능하도록 진행하겠습니다.',
    createdAt: '2026-08-18T09:40:00',
  },
  {
    outboundId: 'out-3',
    channel: 'slack',
    projectId: 'beta',
    ticketId: 'TCK-55',
    toEmail: 'seojun@bstore.kr',
    body: '상품 상세 2차 수정본 전달드립니다. 확인 후 회신 부탁드려요.',
    createdAt: '2026-08-19T11:15:00',
  },
  {
    outboundId: 'out-4',
    channel: 'email',
    projectId: 'delta',
    ticketId: 'TCK-88',
    toEmail: 'minho@d-booking.kr',
    body: '이메일 로그인과 인증 처리까지 구현 완료했습니다. 확인 부탁드립니다.',
    createdAt: '2026-08-22T16:30:00',
  },
];

/** 시연 시작 시점에 이미 처리가 끝나 있는 메시지. 인박스에 '대기 중'이 하나는 보이게 한다. */
export const SEED_DECISIONS: Record<string, InboundDecision> = {
  'inb-g': {
    handling: 'link',
    ticketId: 'TCK-08',
    values: {},
    replyText: null,
    sentAt: '2026-08-25T18:20:00',
  },
  'inb-h': {
    handling: 'link',
    ticketId: 'TCK-12',
    values: {},
    replyText: null,
    sentAt: '2026-08-20T17:10:00',
  },
};

// ─── 조회 헬퍼 ───────────────────────────────────────────────
export const documentsOf = (projectId: string): ProjectDocument[] =>
  DOCUMENTS.filter((d) => d.projectId === projectId);

export const repoSnapshotOf = (projectId: string): RepoSnapshot | null =>
  REPO_SNAPSHOTS.find((r) => r.projectId === projectId) ?? null;
