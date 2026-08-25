// 화면 개발용 목 데이터를 둔다. 백엔드가 작성하고 프론트가 가져다 쓴다.
// types/index.ts의 타입을 그대로 쓰므로, API가 준비되면 호출로 바꿔도 컴파일 에러가 나지 않는다.

import type {
  ClientRequest,
  Integration,
  ProjectDocument,
  TimelineEvent,
} from '@/types';

// ─── 연동 소스 ────────────────────────────────────────────────
// Gmail·Slack은 실제 OAuth 없이 연결 상태만 바꾼다.
// 직접 입력(file·text)은 언제나 사용 가능하다.
export const DEFAULT_INTEGRATIONS: Integration[] = [
  { channel: 'gmail', label: 'Gmail', connected: false },
  { channel: 'slack', label: 'Slack', connected: false },
  { channel: 'file', label: '파일 업로드', connected: true },
  { channel: 'text', label: '직접 텍스트 입력', connected: true },
];

// ─── 프로젝트 ────────────────────────────────────────────────
// 프로젝트는 이제 백엔드가 원천이다(GET /api/projects). 목 프로젝트는 지웠다.
// 아래 문서·요청·타임라인은 화면을 구상할 때 쓰던 자료라 참고용으로 남긴다.

// ─── 프로젝트 컨텍스트 문서 ───────────────────────────────────
export const DOCUMENTS: ProjectDocument[] = [
  {
    id: 'acme-proposal',
    projectId: 'acme',
    fileName: 'website-renewal-proposal.pdf',
    kind: '제안서',
    uploadedAt: '2026-07-24',
    inContext: true,
  },
  {
    id: 'acme-requirements',
    projectId: 'acme',
    fileName: 'project-requirements.pdf',
    kind: '요구사항 문서',
    uploadedAt: '2026-07-25',
    inContext: true,
  },
  {
    id: 'acme-kickoff',
    projectId: 'acme',
    fileName: 'kickoff-meeting-notes.md',
    kind: '회의록',
    uploadedAt: '2026-07-28',
    inContext: true,
  },
  {
    id: 'acme-contract',
    projectId: 'acme',
    fileName: 'acme-contract-v1.pdf',
    kind: '계약서',
    uploadedAt: '2026-07-26',
    inContext: true,
  },
  {
    id: 'brand-brief',
    projectId: 'brand-landing',
    fileName: 'brand-landing-brief.pdf',
    kind: '프로젝트 개요서',
    uploadedAt: '2026-08-28',
    inContext: true,
  },
];

// ─── 클라이언트 요청 + 분석 ───────────────────────────────────
// req-acme-1이 데모의 중심이다. 나머지는 피드를 채워 대시보드 집계가 살아 있게 한다.
export const REQUESTS: ClientRequest[] = [
  {
    id: 'req-acme-1',
    projectId: 'acme',
    channel: 'gmail',
    from: 'jiwon@acme.studio',
    receivedAt: '2026-08-25T11:40:00',
    subject: '회원 관리 관련 추가 요청',
    body: `안녕하세요.
회원가입할 때 회사명도 같이 입력받을 수 있을까요?
그리고 가입한 사용자들을 관리자에서 엑셀로 내려받을 수 있으면 좋을 것 같습니다.
가능하면 이번 일정 안에 같이 반영해주세요.`,
    unread: true,
    analysis: {
      summary: [
        '회원가입 시 회사명 필드 추가',
        '관리자에서 회원 목록 Excel 다운로드',
        '기존 일정 내 반영 희망',
      ],
      verdict: 'scope_change',
      reasons: [
        '기존 제안서에는 회원가입 기능 자체가 명시되어 있지 않음',
        '관리자 페이지는 "기본 관리자 기능"으로 표현되어 있어 Excel Export 포함 여부가 불명확함',
        '납기 일정 변경 없이 추가 기능을 요청하고 있음',
      ],
      evidence: [
        {
          id: 'ev-1',
          sourceDocId: 'acme-proposal',
          sourceLabel: 'website-renewal-proposal.pdf',
          quote: 'Admin dashboard with basic content management functionality.',
        },
        {
          id: 'ev-2',
          sourceDocId: 'acme-kickoff',
          sourceLabel: 'kickoff-meeting-notes.md',
          quote: '회원 관리 기능은 이번 1차 개발 범위에서는 제외하기로 함.',
        },
      ],
      questions: [
        {
          id: 'q-1',
          text: '현재 프로젝트에는 회원가입 기능이 없는데, 신규 회원가입 기능 전체를 추가하려는 요청인가요?',
          defaultSelected: true,
        },
        {
          id: 'q-2',
          text: 'Excel 다운로드 대상 데이터에는 어떤 필드가 포함되어야 하나요? (예: 이름, 이메일, 회사명)',
          defaultSelected: true,
        },
        {
          id: 'q-3',
          text: '기존 납기 일정(9월 19일)은 그대로 유지해야 하나요?',
          defaultSelected: true,
        },
        {
          id: 'q-4',
          text: '이번 요청을 기존 계약 범위에 포함하는 것으로 기대하고 계신가요?',
          defaultSelected: false,
        },
      ],
    },
  },
  {
    id: 'req-acme-2',
    projectId: 'acme',
    channel: 'slack',
    from: '#acme-project · 지원님',
    receivedAt: '2026-08-24T16:12:00',
    subject: '모바일에서 메뉴가 겹쳐 보여요',
    body: '모바일로 들어가니까 상단 메뉴가 서로 겹쳐 보이네요. 확인 부탁드려요!',
    unread: true,
    analysis: {
      summary: ['모바일 화면에서 상단 메뉴 겹침 현상 신고'],
      verdict: 'needs_clarification',
      reasons: [
        '반응형 구현은 계약 범위에 포함되어 있으나, 재현되는 기기·브라우저 정보가 없음',
        '디자인 수정 요청인지 버그 수정 요청인지 구분이 필요함',
      ],
      evidence: [
        {
          id: 'ev-3',
          sourceDocId: 'acme-requirements',
          sourceLabel: 'project-requirements.pdf',
          quote: '모든 페이지는 모바일·태블릿·데스크톱 반응형으로 구현한다.',
        },
      ],
      questions: [
        {
          id: 'q-a2-1',
          text: '어떤 기기와 브라우저에서 발생하나요? (예: 아이폰 15, Safari)',
          defaultSelected: true,
        },
        {
          id: 'q-a2-2',
          text: '화면을 캡처해 공유해 주실 수 있을까요?',
          defaultSelected: true,
        },
      ],
    },
  },
  {
    id: 'req-acme-3',
    projectId: 'acme',
    channel: 'gmail',
    from: 'jiwon@acme.studio',
    receivedAt: '2026-08-23T09:30:00',
    subject: '결제 연동도 가능할까요?',
    body: '나중에 온라인 결제도 붙이고 싶은데, 이번에 같이 넣는 게 가능할지 궁금합니다.',
    unread: false,
    analysis: {
      summary: ['온라인 결제(PG) 연동을 이번 범위에 포함 가능한지 문의'],
      verdict: 'needs_clarification',
      reasons: [
        '결제 연동은 제안서·요구사항 어디에도 포함되어 있지 않음',
        '"이번에"의 범위가 현재 일정인지 별도 단계인지 불분명함',
      ],
      evidence: [
        {
          id: 'ev-4',
          sourceDocId: 'acme-proposal',
          sourceLabel: 'website-renewal-proposal.pdf',
          quote: '본 제안 범위는 회사 소개형 홈페이지 리뉴얼에 한정한다.',
        },
      ],
      questions: [
        {
          id: 'q-a3-1',
          text: '어떤 결제 수단과 PG사를 염두에 두고 계신가요?',
          defaultSelected: true,
        },
        {
          id: 'q-a3-2',
          text: '이번 일정 안에 포함해야 하나요, 아니면 다음 단계로 분리해도 될까요?',
          defaultSelected: true,
        },
      ],
    },
  },
  {
    id: 'req-acme-4',
    projectId: 'acme',
    channel: 'gmail',
    from: 'jiwon@acme.studio',
    receivedAt: '2026-08-22T14:05:00',
    subject: '메인 배너 문구 수정 요청',
    body: '메인 배너 카피를 "함께 성장하는 파트너"로 바꿔주세요.',
    unread: false,
    analysis: {
      summary: ['메인 배너 카피 문구 1건 수정'],
      verdict: 'in_scope',
      reasons: [
        '계약에 포함된 "디자인 수정 2회" 범위 안의 단순 문구 수정으로 판단됨',
        '남은 수정 횟수 안에서 처리 가능함',
      ],
      evidence: [
        {
          id: 'ev-5',
          sourceDocId: 'acme-contract',
          sourceLabel: 'acme-contract-v1.pdf',
          quote: '디자인 시안에 대한 수정은 총 2회까지 포함한다.',
        },
      ],
      questions: [],
    },
  },
];

// ─── 요구사항 변화 타임라인 ───────────────────────────────────
// 회원 관리 관련 요청이 최초 합의 이후 어떻게 확장돼 왔는지 보여준다.
export const TIMELINE: TimelineEvent[] = [
  {
    id: 't-1',
    projectId: 'acme',
    date: '2026-08-10',
    kind: 'agreement',
    title: '회원가입 기능은 이번 범위에서 제외하기로 합의',
    note: '킥오프 미팅에서 1차 개발 범위 확정.',
  },
  {
    id: 't-2',
    projectId: 'acme',
    date: '2026-08-18',
    kind: 'request',
    title: '회사명 입력 기능 요청',
  },
  {
    id: 't-3',
    projectId: 'acme',
    date: '2026-08-20',
    kind: 'request',
    title: '회원 목록 Excel 다운로드 요청',
  },
  {
    id: 't-4',
    projectId: 'acme',
    date: '2026-08-22',
    kind: 'change',
    title: '가입 승인 기능도 추가로 요청',
    note: '초기 합의(회원 관리 제외)와 방향이 달라진 지점.',
  },
];

// ─── 조회 헬퍼 ────────────────────────────────────────────────
export const documentsOf = (projectId: string): ProjectDocument[] =>
  DOCUMENTS.filter((d) => d.projectId === projectId);

export const requestsOf = (projectId: string): ClientRequest[] =>
  REQUESTS.filter((r) => r.projectId === projectId);

export const timelineOf = (projectId: string): TimelineEvent[] =>
  TIMELINE.filter((t) => t.projectId === projectId).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

/** 대시보드 카드에 쓰는 프로젝트별 요청 집계. */
export interface ProjectSummary {
  newRequests: number;
  needsClarification: number;
  scopeChanges: number;
  lastActivity: string | null; // ISO, 가장 최근 요청 시각
}

export function summaryOf(projectId: string): ProjectSummary {
  const reqs = requestsOf(projectId);
  const lastActivity =
    reqs.length === 0
      ? null
      : reqs.reduce((a, b) => (a.receivedAt > b.receivedAt ? a : b)).receivedAt;
  return {
    newRequests: reqs.filter((r) => r.unread).length,
    needsClarification: reqs.filter((r) => r.analysis.verdict === 'needs_clarification')
      .length,
    scopeChanges: reqs.filter((r) => r.analysis.verdict === 'scope_change').length,
    lastActivity,
  };
}
