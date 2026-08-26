// 시연용 티켓과 거기 붙은 고객 메시지·AI 분석.
//
// 한 줄이 곧 한 장면이다. 분석 대기 · 답변 필요 · 회신 대기 · 완료 · 거절을
// 골고루 두어, 목록 필터와 상세 흐름을 전부 보여줄 수 있게 했다.

import { daysAgo, hoursAgo, minutesAgo } from '@/mocks/time';
import type { Analysis, HistoryEntry, Inbound, Ticket, WorkItem } from '@/types';

export interface DemoTicket {
  item: WorkItem;
  history: HistoryEntry[];
  /** 답변 전에 확인할 항목. POST /api/requests/{id}/checklist가 줄 값이다. */
  checklist: string[];
  /**
   * 열었을 때 서버 분석이 도는 티켓. 이 시간이 지나면 분석이 끝난 것으로 본다.
   * 실제 백엔드에서는 대화를 수집할 때 이미 돌고 있다.
   */
  analyzingMs?: number;
  /** 솔루션(작업 가능 여부)이 아직 없는 티켓. 열면 그 자리에서 만든다. */
  solutionPending?: boolean;
}

/** 분석 한 벌. 안 쓰는 칸을 매번 null로 적지 않기 위한 도우미다. */
function analysis(partial: Partial<Analysis> & Pick<Analysis, 'headline' | 'drafts'>): Analysis {
  return {
    adviceReason: '',
    intents: [],
    fields: [],
    missingInfo: [],
    devContext: null,
    feasibility: null,
    evidence: [],
    relatedTicketId: null,
    ticketProposal: null,
    decisionFields: [],
    ...partial,
  };
}

function inbound(
  partial: Pick<Inbound, 'inboundId' | 'projectId' | 'ticketId' | 'fromName' | 'fromEmail' | 'subject' | 'preview' | 'body' | 'createdAt' | 'initialStage' | 'category' | 'analysis'> &
    Partial<Inbound>,
): Inbound {
  return { channel: 'email', attachments: [], ...partial };
}

function ticket(
  partial: Pick<Ticket, 'ticketId' | 'ticketCode' | 'projectId' | 'title' | 'summary' | 'category' | 'requirement' | 'lastCustomerMessage' | 'createdAt' | 'updatedAt'> &
    Partial<Ticket>,
): Ticket {
  return { status: 'Active', ...partial };
}

// ─────────────────────────────────────────────────────────────
// 달램 예약 웹앱
// ─────────────────────────────────────────────────────────────

const cancelBody = `안녕하세요, 달램 박서연입니다.

오픈 준비하면서 취소 규정을 다시 보고 있는데요, 지금은 "24시간 전까지 무료 취소"만 있어서
실제로 운영해 보니 문제가 좀 있습니다.

1) 취소 시점에 따라 수수료를 단계별로 받았으면 합니다.
   - 24시간 이전: 무료
   - 24시간 ~ 6시간 전: 결제 금액의 30%
   - 6시간 이내: 결제 금액의 50%

2) 노쇼가 생각보다 많습니다. 예약 시간이 지나도 체크인을 안 하면
   예치금에서 자동으로 차감되게 할 수 있을까요?

9월 오픈 전에 반영이 될지, 된다면 비용이 얼마나 추가되는지 알려주시면
내부 보고 올리겠습니다. 첨부로 다른 서비스 화면이랑 간단한 시뮬레이션 붙였습니다.

감사합니다.

> 2026-06-12 박서연 <seoyeon@dallem.co.kr> 작성:
> 요구사항 정의서 v2 보내드립니다. 3.2 취소 정책 부분은 일단 기존 안대로 두었습니다.

--
박서연 | (주)달램 대표
seoyeon@dallem.co.kr`;

const cancelAnalysis = analysis({
  headline: '계약 범위 밖의 기능 추가입니다. 비용과 일정을 정하셔야 합니다.',
  adviceReason:
    '제안서 3.2의 취소 정책은 "예약 24시간 전까지 무료 취소" 한 줄뿐입니다. 이번 요청은 취소 시점별 수수료 단계와 노쇼 자동 차감까지 포함해, 예약뿐 아니라 결제 취소·정산 로직을 함께 손봐야 합니다.',
  intents: [
    { kind: '기능 요청', text: '취소 시점에 따라 수수료를 단계별로 부과' },
    { kind: '기능 요청', text: '노쇼 발생 시 예치금에서 자동 차감' },
    { kind: '일정 문의', text: '9월 오픈 전 반영 가능 여부와 추가 비용' },
  ],
  fields: [
    { label: '요청 성격', value: '기능 추가 2건 + 일정·비용 문의 1건' },
    {
      label: '계약 범위',
      value: '범위 밖 — 제안서 3.2는 단일 취소 규정만 포함합니다',
      tone: 'caution',
    },
    {
      label: '영향 범위',
      items: ['예약 취소 API', '결제 부분 환불', '정산 배치', '예약 알림 문구', '관리자 취소 내역'],
    },
    {
      label: '예상 공수',
      value: '개발 4~5일 + 검수 1일 (AI 추정치입니다. 확정은 직접 하세요)',
      tone: 'caution',
    },
    {
      label: '납기 영향',
      value: '9월 30일 오픈까지 여유 3일. 이 요청을 받으면 여유가 사라집니다.',
      tone: 'caution',
    },
    { label: '이전 대화', value: '6월 12일 요구사항 정의서 v2에서 취소 정책은 보류로 남았습니다' },
  ],
  missingInfo: [
    '단계별 수수료 비율을 고객이 확정해야 합니다. 메일의 30% · 50%가 최종안인지 확인이 필요합니다.',
    '노쇼 판정 기준(예약 시각 후 몇 분까지 미체크인)이 어디에도 정해져 있지 않습니다.',
    '이미 결제된 기존 예약에 새 규정을 소급할지 정해지지 않았습니다.',
  ],
  devContext: {
    subject: '예약 취소 · 환불',
    items: [
      { state: 'done', text: '예약 취소 API (전액 환불만 지원)' },
      { state: 'done', text: 'PG 결제 취소 연동' },
      { state: 'progress', text: '정산 배치 (v1 검수 중)' },
      { state: 'todo', text: '부분 환불 · 수수료 계산' },
      { state: 'todo', text: '노쇼 판정 · 예치금 차감' },
    ],
    relatedWork: [
      { title: '#142 정산 배치 리팩터링', note: '리뷰 중 · 이 요청과 같은 파일을 건드립니다' },
      { title: '#138 결제 취소 예외 처리', note: '3일 전 병합됨' },
    ],
    impactAreas: [
      'api/reservations/cancel.py',
      'services/payment/refund.py',
      'batch/settlement.py',
      'templates/notify/cancel.html',
    ],
    repoFullName: 'soomin/dallem-reserve',
    checked: true,
  },
  feasibility: {
    verdict: 'feasible_with_scope_change',
    reason:
      'PG가 부분 환불을 지원하므로 기술적으로 막히는 부분은 없습니다. 다만 정산 배치(#142)가 아직 검수 중이라 같은 파일을 동시에 고치게 되고, 9월 오픈 범위 안에 그대로 넣으면 검수 기간이 남지 않습니다.',
    requiredHumanInput: [
      '추가 개발 비용',
      '반영 일정 — 오픈 전인지, 오픈 후 2차인지',
      '오픈 범위에서 대신 뺄 기능이 있는지',
    ],
  },
  evidence: [
    {
      source: 'document',
      label: '제안서',
      title: '달램_예약웹앱_제안서.docx · 3.2 예약 취소',
      quote: '예약 24시간 전까지 무료 취소 가능. 이후 취소는 운영 정책에 따른다.',
    },
    {
      source: 'document',
      label: '계약서',
      title: '달램_개발용역계약서.docx · 제5조 과업 변경',
      quote: '과업 범위를 변경할 경우 변경 내용과 대가를 서면으로 합의한 후 착수한다.',
    },
    {
      source: 'ticket',
      label: '관련 티켓',
      title: 'TCK-03 예약 시간 단위 30분 → 15분',
      quote: '같은 예약 도메인 변경이고, 답변에서 "오픈 후 2차 반영" 기준을 이미 한 번 안내했습니다.',
    },
    {
      source: 'github',
      label: 'GitHub',
      title: 'soomin/dallem-reserve · PR #142',
      quote: '정산 배치 리팩터링 진행 중. batch/settlement.py를 통째로 고치는 중입니다.',
    },
    {
      source: 'message',
      label: '지난 대화',
      title: '6월 12일 · 요구사항 정의서 v2',
      quote: '3.2 취소 정책 부분은 일단 기존 안대로 두었습니다.',
    },
  ],
  relatedTicketId: 't-slot',
  decisionFields: [
    { id: 'amount', label: '추가 비용', type: 'money', placeholder: '예: 1200000' },
    { id: 'dueDate', label: '반영 일정', type: 'date' },
  ],
  drafts: {
    base: `박서연 대표님, 안녕하세요.

취소 규정 건 확인했습니다.

말씀하신 두 가지 모두 기술적으로는 가능합니다. 다만 계약 시 합의한 제안서 3.2에는 "24시간 전까지 무료 취소" 한 줄만 포함되어 있어, 이번 요청은 과업 범위 변경에 해당합니다. 결제 부분 환불과 정산 배치까지 함께 손봐야 해서 개발 4~5일, 검수 1일 정도가 추가로 필요합니다.

추가 비용은 {{amount}}, 반영 일정은 {{dueDate}}로 제안드립니다.

한 가지 확인 부탁드릴 것이 있습니다. 9월 30일 오픈까지 여유가 3일이라, 이 건을 오픈 범위에 넣으면 검수 기간이 사실상 없어집니다. 오픈 후 2차로 반영하거나, 오픈 범위에서 다른 기능을 하나 조정하는 방법 중에 선택해 주시면 그에 맞춰 일정을 다시 잡겠습니다.

확인 부탁드립니다.
감사합니다.`,
    friendly: `박서연 대표님, 안녕하세요!

취소 규정 건 잘 봤습니다. 운영해 보시면서 불편하셨던 부분이 잘 느껴졌어요.

말씀 주신 단계별 수수료와 노쇼 자동 차감, 둘 다 만들 수 있습니다. 다만 계약할 때 정리한 제안서에는 "24시간 전까지 무료 취소"만 들어가 있어서, 이번 건은 범위를 조금 넓히는 쪽이 됩니다. 결제 환불이랑 정산 쪽까지 같이 손봐야 하거든요.

추가 비용은 {{amount}}, 반영 일정은 {{dueDate}}로 생각하고 있습니다.

하나만 같이 정해주시면 좋겠는데요, 9월 30일 오픈까지 여유가 3일뿐이라 이 건을 그대로 넣으면 검수할 시간이 없어집니다. 오픈 이후에 2차로 넣는 방법도 있고, 오픈 범위에서 다른 걸 하나 조정하는 방법도 있습니다. 편하신 쪽으로 알려주시면 맞춰서 일정 다시 정리해 드릴게요.

감사합니다!`,
    short: `박서연 대표님, 안녕하세요.

단계별 수수료와 노쇼 자동 차감 모두 가능합니다.

다만 제안서 3.2에는 "24시간 전 무료 취소"만 있어 과업 범위 변경에 해당합니다.
- 추가 비용: {{amount}}
- 반영 일정: {{dueDate}}
- 추가 공수: 개발 4~5일 + 검수 1일

9월 30일 오픈까지 여유가 3일이라, 오픈 범위에 넣을지 오픈 후 2차로 뺄지 정해 주시면 일정을 확정하겠습니다.

감사합니다.`,
    firm: `박서연 대표님, 안녕하세요.

요청하신 내용 검토했습니다.

먼저 짚어드릴 부분이 있습니다. 제안서 3.2에 합의된 취소 정책은 "예약 24시간 전까지 무료 취소" 한 줄이며, 계약서 제5조에 따라 과업 범위 변경은 내용과 대가를 서면으로 합의한 뒤 착수하도록 되어 있습니다. 이번 요청은 명확히 범위 밖입니다.

진행 조건은 다음과 같습니다.
- 추가 비용: {{amount}}
- 반영 일정: {{dueDate}}

또한 9월 30일 오픈까지 남은 여유는 3일입니다. 이 건을 오픈 범위에 포함하면 검수 기간을 확보할 수 없어, 오픈 후 2차 반영을 원칙으로 제안드립니다. 오픈 전 반영이 필요하시다면 현재 오픈 범위에서 제외할 기능을 함께 정해 주셔야 합니다.

위 조건에 합의해 주시면 착수하겠습니다.
감사합니다.`,
  },
});

const slotBody = `안녕하세요, 박서연입니다.

예약 시간 단위를 30분에서 15분으로 바꿀 수 있을까요?
스튜디오 쪽에서 짧게 쓰는 손님이 많아서요.

감사합니다.`;

const slotAnalysis = analysis({
  headline: '오픈 후 2차 반영으로 안내했습니다. 고객 회신을 기다리는 중입니다.',
  adviceReason:
    '예약 슬롯 계산과 캘린더 UI를 함께 고쳐야 해서 2~3일이 필요합니다. 오픈 일정이 촉박해 2차 반영을 제안했습니다.',
  fields: [
    { label: '요청 성격', value: '기능 변경 1건' },
    { label: '계약 범위', value: '범위 밖 — 요구사항 정의서에 30분 단위로 명시', tone: 'caution' },
    { label: '예상 공수', value: '개발 2~3일 (AI 추정치)', tone: 'caution' },
  ],
  feasibility: {
    verdict: 'feasible',
    reason: '슬롯 단위는 설정값으로 빠져 있어 계산 로직만 바꾸면 됩니다. 캘린더 UI 조정이 함께 필요합니다.',
    requiredHumanInput: ['2차 반영 시점'],
  },
  evidence: [
    {
      source: 'document',
      label: '요구사항 정의서',
      title: '달램_요구사항정의서_v2.docx · 2.1 예약 슬롯',
      quote: '예약 가능 시간은 30분 단위로 표시한다.',
    },
  ],
  decisionFields: [{ id: 'dueDate', label: '2차 반영 일정', type: 'date' }],
  drafts: {
    base: '박서연 대표님, 안녕하세요.\n\n예약 시간 단위 변경 건 확인했습니다. 기술적으로는 어렵지 않으나 요구사항 정의서에 30분 단위로 명시되어 있어 범위 변경에 해당하고, 캘린더 화면까지 함께 조정하면 2~3일이 필요합니다.\n\n9월 오픈 일정을 지키기 위해 이 건은 오픈 후 2차로 반영할 것을 제안드립니다.\n\n감사합니다.',
    friendly: '박서연 대표님, 안녕하세요!\n\n15분 단위 건 확인했습니다. 만드는 것 자체는 어렵지 않아요. 다만 캘린더 화면도 같이 손봐야 해서 2~3일 정도 걸립니다.\n\n9월 오픈 일정이 빠듯해서, 이건 오픈하고 나서 2차로 넣는 게 안전할 것 같습니다. 어떠실까요?\n\n감사합니다!',
    short: '박서연 대표님, 안녕하세요.\n\n15분 단위 변경 가능합니다. 개발 2~3일 필요하며, 요구사항 정의서상 30분 단위로 명시되어 범위 변경에 해당합니다.\n\n9월 오픈 일정상 오픈 후 2차 반영을 제안드립니다.\n\n감사합니다.',
    firm: '박서연 대표님, 안녕하세요.\n\n요구사항 정의서 2.1에 예약 슬롯은 30분 단위로 합의되어 있습니다. 변경 자체는 가능하나 범위 밖이며 개발 2~3일이 필요합니다.\n\n9월 오픈 범위에는 포함하지 않고 오픈 후 2차로 반영하겠습니다.\n\n감사합니다.',
  },
});

const alimtalkAnalysis = analysis({
  headline: '계약 범위 안입니다. 남은 것은 발송 프로필 심사뿐입니다.',
  adviceReason:
    '요구사항 정의서 5.1에 "예약 알림은 알림톡을 우선 사용하고 실패 시 문자로 대체한다"고 적혀 있습니다. 코드는 이미 붙어 있고, 카카오 발송 프로필 심사가 끝나지 않아 문자로만 나가는 중입니다.',
  intents: [
    { kind: '일정 문의', text: '알림톡 연동이 언제 붙는지' },
    { kind: '비용 문의', text: '문자 발송 비용이 계속 나가는 상황' },
  ],
  fields: [
    { label: '요청 성격', value: '일정 문의 1건' },
    { label: '계약 범위', value: '범위 안 — 요구사항 정의서 5.1에 포함' },
    { label: '현재 상태', value: '연동 코드는 완료. 카카오 발송 프로필 심사 대기 중입니다' },
    { label: '남은 일', items: ['발송 프로필 심사 통과', '템플릿 3종 승인', '운영 전환 배포'] },
    {
      label: '남은 기간',
      value: '심사가 보통 3~5영업일. 통과하면 배포는 반나절입니다',
      tone: 'caution',
    },
  ],
  missingInfo: [
    '카카오 채널 관리자 권한이 달램 쪽에 있어, 심사 상태를 저희가 직접 확인할 수 없습니다.',
  ],
  devContext: {
    subject: '고객 알림 발송',
    items: [
      { state: 'done', text: '문자(SMS) 발송' },
      { state: 'done', text: '알림톡 발송 연동 코드' },
      { state: 'progress', text: '알림톡 템플릿 3종 등록' },
      { state: 'todo', text: '운영 전환 (심사 통과 후)' },
    ],
    relatedWork: [{ title: '#131 알림톡 발송 어댑터', note: '8일 전 병합됨' }],
    impactAreas: ['services/notify/kakao.py', 'services/notify/router.py'],
    repoFullName: 'soomin/dallem-reserve',
    checked: true,
  },
  feasibility: {
    verdict: 'blocked',
    reason:
      '저희 쪽 작업은 끝났습니다. 카카오 발송 프로필 심사가 통과해야 전환할 수 있고, 그 심사는 달램 쪽 채널 관리자 계정에서 진행됩니다. 저희가 앞당길 수 있는 구간이 아닙니다.',
    requiredHumanInput: ['달램 쪽에 심사 상태 확인을 요청할지', '심사 지연 시 문자 유지 기간을 언제까지로 볼지'],
  },
  evidence: [
    {
      source: 'document',
      label: '요구사항 정의서',
      title: '달램_요구사항정의서_v2.docx · 5.1 알림',
      quote: '예약 알림은 알림톡을 우선 사용하고, 발송 실패 시 문자로 대체한다.',
    },
    {
      source: 'github',
      label: 'GitHub',
      title: 'soomin/dallem-reserve · PR #131',
      quote: '알림톡 발송 어댑터 병합 완료. 운영 전환 플래그만 남아 있습니다.',
    },
  ],
  drafts: {
    base: '민준 님, 안녕하세요.\n\n알림톡 연동은 저희 쪽 작업이 이미 끝나 있습니다. 발송 코드와 템플릿 등록까지 되어 있고, 카카오 발송 프로필 심사만 통과하면 바로 전환됩니다.\n\n심사는 달램 쪽 카카오 채널 관리자 계정에서 진행되어 저희가 상태를 확인할 수 없습니다. 채널 관리자에서 심사 상태를 한 번 확인해 주시면, 통과 확인되는 대로 반나절 안에 운영 전환 배포하겠습니다.\n\n그때까지는 문자로 계속 나갑니다.\n\n감사합니다.',
    friendly: '민준 님, 안녕하세요!\n\n알림톡은 저희 쪽에서는 이미 다 붙여놨습니다 🙂 발송 코드도, 템플릿도 등록돼 있어요.\n\n지금 막혀 있는 건 카카오 발송 프로필 심사인데, 이게 달램 쪽 채널 관리자 계정에서 진행되는 거라 저희가 상태를 못 봅니다. 한 번만 확인해 주실 수 있을까요? 통과된 걸 확인하면 그날 안에 전환 배포하겠습니다.\n\n그전까지는 아쉽지만 문자로 계속 나갑니다. 비용 나가는 부분은 저도 신경 쓰고 있겠습니다!',
    short: '민준 님, 안녕하세요.\n\n알림톡 연동 코드·템플릿은 완료 상태입니다. 카카오 발송 프로필 심사만 남았습니다.\n\n심사는 달램 쪽 채널 관리자 계정에서 진행됩니다. 상태 확인 부탁드리며, 통과 확인되면 반나절 내 운영 전환하겠습니다.\n\n그때까지는 문자로 발송됩니다.',
    firm: '민준 님, 안녕하세요.\n\n알림톡은 요구사항 정의서 5.1에 따라 이미 구현·병합 완료된 상태입니다(PR #131). 지금 발송이 문자로 나가는 이유는 카카오 발송 프로필 심사가 끝나지 않았기 때문입니다.\n\n해당 심사는 달램 측 카카오 채널 관리자 계정에서만 진행할 수 있어 저희가 개입할 수 없습니다. 심사 진행 상태를 확인해 주시기 바랍니다.\n\n통과 확인 즉시 운영 전환 배포하겠습니다. 그전까지의 문자 발송 비용은 심사 일정에 따른 것으로, 개발 일정과는 무관합니다.\n\n감사합니다.',
  },
});

// ─────────────────────────────────────────────────────────────
// 브릭커머스 관리자 개편
// ─────────────────────────────────────────────────────────────

const excelBody = `안녕하세요, 브릭커머스 김도현입니다.

상품 일괄 등록 엑셀 양식에서 "옵션값" 칼럼을 두 개로 나눠주실 수 있을까요?
지금은 "색상/사이즈"처럼 슬래시로 붙여 넣고 있는데, MD들이 자꾸 실수합니다.

수정본 양식 첨부합니다. 급한 건 아니고 다음 배포 때 같이 들어가면 좋겠습니다.

감사합니다.`;

const excelAnalysis = analysis({
  headline: '계약 범위 안입니다. 그대로 진행하셔도 됩니다.',
  adviceReason:
    '제안서 4.1 "상품 일괄 등록"에 포함된 양식 조정입니다. 별도 비용 협의 없이 다음 배포에 넣을 수 있습니다.',
  fields: [
    { label: '요청 성격', value: '기능 변경 1건' },
    { label: '계약 범위', value: '범위 안 — 제안서 4.1 상품 일괄 등록에 포함' },
    { label: '영향 범위', items: ['엑셀 파서', '업로드 검증', '샘플 양식 파일'] },
    { label: '예상 공수', value: '반나절 (AI 추정치)', tone: 'caution' },
    { label: '고객 긴급도', value: '낮음 — "급한 건 아니고 다음 배포 때"라고 적었습니다' },
  ],
  devContext: {
    subject: '상품 일괄 등록',
    items: [
      { state: 'done', text: '엑셀 업로드 · 파싱' },
      { state: 'done', text: '업로드 검증 · 오류 리포트' },
      { state: 'progress', text: '대량 업로드 성능 개선' },
      { state: 'todo', text: '옵션값 칼럼 분리' },
    ],
    relatedWork: [{ title: '#87 업로드 검증 메시지 정리', note: '작업 중 · 같은 파일' }],
    impactAreas: ['admin/products/bulk_upload.py', 'static/templates/product_bulk.xlsx'],
    repoFullName: 'soomin/brick-admin',
    checked: true,
  },
  feasibility: {
    verdict: 'feasible',
    reason:
      '파서에서 칼럼 매핑만 바꾸면 됩니다. 다만 이미 옛 양식으로 만들어 둔 파일이 돌아다니므로, 옛 양식도 당분간 같이 받도록 해 두는 편이 안전합니다.',
    requiredHumanInput: ['옛 양식을 언제까지 함께 받을지'],
  },
  evidence: [
    {
      source: 'document',
      label: '제안서',
      title: '브릭커머스_관리자개편_제안서.docx · 4.1 상품 일괄 등록',
      quote: '엑셀 양식을 통한 상품 일괄 등록 기능을 제공하며, 양식은 운영 과정에서 조정할 수 있다.',
    },
    {
      source: 'github',
      label: 'GitHub',
      title: 'soomin/brick-admin · PR #87',
      quote: '업로드 검증 메시지 정리 작업 중. bulk_upload.py를 같이 건드립니다.',
    },
    {
      source: 'message',
      label: '이번 메시지',
      title: '첨부 · 상품일괄등록_양식_수정본.docx',
      quote: '고객이 원하는 최종 칼럼 구성이 첨부에 그대로 들어 있습니다.',
    },
  ],
  drafts: {
    base: '김도현 님, 안녕하세요.\n\n옵션값 칼럼 분리 건 확인했습니다. 제안서 4.1에 포함된 범위라 별도 비용 없이 진행하겠습니다.\n\n첨부해 주신 수정본 양식대로 색상·사이즈를 각각의 칼럼으로 나누겠습니다. 다만 기존 양식으로 만들어 둔 파일이 이미 돌아다닐 수 있어, 당분간은 옛 양식도 함께 인식하도록 해 두려고 합니다. 언제까지 함께 받으면 될지만 알려주세요.\n\n다음 배포에 포함하겠습니다.\n감사합니다.',
    friendly: '도현 님, 안녕하세요!\n\n옵션값 칼럼 나누는 것, 바로 해드릴게요. 계약 범위 안이라 추가 비용은 없습니다.\n\n보내주신 수정본 그대로 색상이랑 사이즈를 따로 받게 바꾸겠습니다. 참, MD분들이 기존 양식으로 만들어 둔 파일이 있을 수 있어서 옛 양식도 당분간 같이 받도록 해둘게요. 언제까지 열어둘지만 말씀해 주세요.\n\n다음 배포에 넣겠습니다!',
    short: '김도현 님, 안녕하세요.\n\n옵션값 칼럼 분리 진행하겠습니다. 계약 범위 안이라 추가 비용 없습니다.\n\n첨부 양식대로 반영하고, 옛 양식도 당분간 함께 인식하도록 하겠습니다. 병행 기간만 알려주세요.\n\n다음 배포 포함 예정입니다.',
    firm: '김도현 님, 안녕하세요.\n\n옵션값 칼럼 분리는 제안서 4.1 범위 안이므로 추가 비용 없이 다음 배포에 반영하겠습니다.\n\n다만 양식 변경은 기존 파일을 쓰는 MD 업무에 영향이 갑니다. 옛 양식 병행 인식 기간을 정해 주시고, 사내 공지는 브릭커머스 쪽에서 진행해 주시기 바랍니다.\n\n감사합니다.',
  },
});

const slowBody = `대시보드가 너무 느립니다. 확인 부탁드려요.`;

const slowAnalysis = analysis({
  headline: '정보가 부족해 원인을 특정할 수 없습니다. 고객에게 되물어야 합니다.',
  adviceReason:
    '"느리다"는 말만으로는 어느 화면인지, 언제부터인지, 누구에게 생기는지 알 수 없습니다. 지금 저장소를 뒤져도 짚을 곳이 너무 많습니다.',
  fields: [
    { label: '요청 성격', value: '버그 신고 1건' },
    { label: '계약 범위', value: '범위 안 — 하자 보수 대상일 가능성이 높습니다' },
    { label: '재현 가능 여부', value: '확인 불가 — 재현 조건이 없습니다', tone: 'caution' },
  ],
  missingInfo: [
    '어느 대시보드인지 — 매출 대시보드와 주문 대시보드 중 어느 쪽인지 적혀 있지 않습니다.',
    '언제부터인지 — 최근 배포(3일 전) 이후인지 그 전부터인지 알 수 없습니다.',
    '얼마나 느린지 — 체감인지 실제로 몇 초 걸리는지 확인이 필요합니다.',
    '특정 계정·기간에서만 생기는지 — 조회 기간을 길게 잡으면 느려지는 문제일 수 있습니다.',
  ],
  feasibility: {
    verdict: 'needs_clarification',
    reason:
      '재현 조건을 받기 전에는 원인을 특정할 수 없습니다. 다만 3일 전 배포에 주문 집계 쿼리 변경이 있어, 그 시점 전후를 먼저 확인해 볼 여지는 있습니다.',
    requiredHumanInput: ['고객에게 되물을지, 먼저 로그를 확인할지'],
  },
  evidence: [
    {
      source: 'github',
      label: 'GitHub',
      title: 'soomin/brick-admin · 3일 전 배포',
      quote: '주문 집계 쿼리를 뷰에서 직접 조회하도록 변경. 기간 조건이 길면 느려질 수 있습니다.',
    },
    {
      source: 'ticket',
      label: '관련 티켓',
      title: 'TCK-05 상품 일괄 등록 엑셀 양식 변경',
      quote: '같은 고객의 다른 요청입니다. 함께 답장하면 메일을 한 번만 보내도 됩니다.',
    },
  ],
  drafts: {
    base: '김도현 님, 안녕하세요.\n\n대시보드 속도 건 확인하겠습니다. 다만 원인을 정확히 잡으려면 몇 가지만 알려주시면 좋겠습니다.\n\n1. 매출 대시보드와 주문 대시보드 중 어느 쪽인가요?\n2. 언제부터 느려졌나요? 3일 전 배포 이후인지 그 전부터인지가 중요합니다.\n3. 조회하실 때 기간을 어떻게 잡으셨나요?\n\n3일 전 배포에 주문 집계 쿼리 변경이 있어, 그쪽일 가능성을 먼저 보고 있습니다. 위 내용 주시면 바로 확인해 보겠습니다.\n\n감사합니다.',
    friendly: '도현 님, 안녕하세요!\n\n대시보드 느린 것 확인해 보겠습니다. 몇 가지만 여쭤볼게요.\n\n- 매출 쪽인가요, 주문 쪽인가요?\n- 언제부터 그러셨을까요? 3일 전 배포가 하나 있었어서요.\n- 조회 기간을 길게 잡으셨는지도 궁금합니다.\n\n마침 그 배포에 주문 집계 쿼리 변경이 있어서 그쪽부터 보고 있습니다. 알려주시면 바로 확인해 볼게요!',
    short: '김도현 님, 안녕하세요.\n\n확인을 위해 세 가지만 알려주세요.\n1. 매출/주문 중 어느 대시보드인지\n2. 언제부터인지 (3일 전 배포 전후)\n3. 조회 기간\n\n3일 전 배포의 주문 집계 쿼리 변경을 먼저 의심하고 있습니다.\n\n감사합니다.',
    firm: '김도현 님, 안녕하세요.\n\n"느리다"만으로는 재현이 불가능해 확인에 착수할 수 없습니다. 아래 세 가지를 알려주셔야 원인 확인이 가능합니다.\n\n1. 대상 화면 (매출 / 주문)\n2. 증상 발생 시점 (3일 전 배포 전후)\n3. 조회 기간과 체감 소요 시간\n\n회신 주시는 대로 확인하겠습니다.\n\n감사합니다.',
  },
});

// ─────────────────────────────────────────────────────────────
// 노트리 랜딩 리뉴얼 (계약 전)
// ─────────────────────────────────────────────────────────────

const quoteBody = `안녕하세요, 노트리 이하늘입니다.

지인 소개로 연락드립니다. 브랜드 랜딩 페이지를 새로 만들고 싶은데요,
- 페이지는 한 장짜리 스크롤 페이지
- 문의 폼 하나
- 관리자에서 문구랑 이미지를 직접 바꿀 수 있으면 좋겠습니다

디자인 시안은 아직 없고, 저희 쪽에서 준비해야 하는지도 잘 모르겠습니다.
대략 견적과 기간이 어떻게 될까요?

감사합니다.`;

const quoteAnalysis = analysis({
  headline: '계약 전 문의입니다. 범위를 좁힌 뒤 견적을 내셔야 합니다.',
  adviceReason:
    '요청이 한 장짜리 랜딩으로 보이지만 "관리자에서 문구·이미지 수정"이 들어가면 사실상 CMS가 필요합니다. 이 한 줄이 견적을 두 배로 벌립니다.',
  intents: [
    { kind: '계약 문의', text: '랜딩 페이지 제작 견적과 기간' },
    { kind: '기능 요청', text: '관리자에서 문구·이미지 직접 수정' },
  ],
  fields: [
    { label: '요청 성격', value: '신규 문의 (계약 전)' },
    { label: '계약 범위', value: '해당 없음 — 아직 계약이 없습니다' },
    {
      label: '숨은 범위',
      value: '"관리자에서 직접 수정"은 CMS 요구입니다. 단순 랜딩과 공수가 크게 다릅니다.',
      tone: 'caution',
    },
    {
      label: '예상 공수',
      items: [
        '정적 랜딩 + 문의 폼만: 5~7일',
        '문구·이미지 편집 관리자까지: 12~15일',
      ],
    },
    { label: '디자인', value: '시안이 없습니다. 누가 준비할지에 따라 견적이 달라집니다.', tone: 'caution' },
  ],
  missingInfo: [
    '디자인 시안을 고객이 준비하는지, 제작에 포함하는지 정해지지 않았습니다.',
    '"관리자에서 수정"의 범위 — 문구만인지 섹션 추가·삭제까지인지 확인이 필요합니다.',
    '오픈 목표일이 없습니다.',
  ],
  feasibility: {
    verdict: 'needs_clarification',
    reason:
      '기술적으로 어려운 요구는 없습니다. 다만 관리자 편집 범위와 디자인 담당이 정해지지 않아, 지금 상태로 금액을 적으면 나중에 범위가 늘어납니다.',
    requiredHumanInput: ['견적 금액', '착수 가능 시점', '디자인 포함 여부'],
  },
  evidence: [
    {
      source: 'message',
      label: '이번 메시지',
      title: '노트리 이하늘 · 첫 문의',
      quote: '관리자에서 문구랑 이미지를 직접 바꿀 수 있으면 좋겠습니다',
    },
    {
      source: 'ticket',
      label: '과거 사례',
      title: 'TCK-08 정산 리포트 월별 필터 (핀업)',
      quote: '비슷하게 "직접 바꿀 수 있게"로 시작해 관리자 범위가 늘어났던 건입니다.',
    },
  ],
  decisionFields: [
    { id: 'amount', label: '견적 금액', type: 'money', placeholder: '예: 4500000' },
    { id: 'dueDate', label: '착수 가능일', type: 'date' },
    { id: 'period', label: '예상 기간', type: 'text', placeholder: '예: 3주' },
  ],
  drafts: {
    base: '이하늘 님, 안녕하세요. 연락 주셔서 감사합니다.\n\n보내주신 내용으로 대략 정리해 보았습니다.\n\n먼저 확인하고 싶은 것이 하나 있습니다. "관리자에서 문구와 이미지를 직접 수정"은 사실상 간단한 CMS를 함께 만드는 일이라, 정적 랜딩 페이지만 만드는 것과 공수 차이가 큽니다. 문구 교체 정도면 가볍게 붙일 수 있지만, 섹션을 추가·삭제하는 수준이면 별도 화면이 필요합니다.\n\n디자인 시안도 노트리 쪽에서 준비하시는지, 제작에 포함할지에 따라 견적이 달라집니다.\n\n현재 기준으로는 {{amount}} · 예상 기간 {{period}}, 착수는 {{dueDate}}부터 가능합니다. 위 두 가지를 정해 주시면 정확한 견적서로 다시 보내드리겠습니다.\n\n감사합니다.',
    friendly: '하늘 님, 안녕하세요! 연락 주셔서 감사합니다.\n\n보내주신 내용 잘 봤습니다. 만들어 드릴 수 있어요.\n\n다만 하나만 같이 정하면 좋겠습니다. "관리자에서 문구랑 이미지를 직접 바꾸는 것"이 생각보다 큰 기능이라서요. 문구만 바꾸는 정도면 가볍게 넣을 수 있는데, 섹션을 추가하거나 지우는 것까지면 관리자 화면을 따로 만들어야 합니다. 이 차이로 기간이 두 배 가까이 벌어집니다.\n\n디자인 시안도 노트리 쪽에서 주시는지, 저희가 같이 하는지에 따라 달라집니다.\n\n지금 기준으로는 {{amount}} 정도에 {{period}}쯤 보고 있고, {{dueDate}}부터 시작할 수 있습니다. 두 가지만 정해 주시면 정식 견적서로 정리해 드릴게요!\n\n감사합니다.',
    short: '이하늘 님, 안녕하세요.\n\n두 가지만 정해 주시면 견적을 확정할 수 있습니다.\n1. 관리자 수정 범위 — 문구 교체만인지, 섹션 추가·삭제까지인지\n2. 디자인 시안 — 노트리 준비인지 제작 포함인지\n\n현재 기준: {{amount}} · {{period}} · 착수 {{dueDate}}\n\n정해 주시면 정식 견적서로 보내드리겠습니다.\n감사합니다.',
    firm: '이하늘 님, 안녕하세요.\n\n문의 감사합니다. 견적을 내기 전에 범위를 확정해야 합니다.\n\n"관리자에서 문구·이미지 직접 수정"은 별도의 편집 화면이 필요한 요구로, 정적 랜딩 제작과는 공수가 두 배 이상 차이 납니다. 이 범위를 정하지 않은 채로는 금액을 확정해 드리기 어렵습니다.\n\n또한 디자인 시안 준비 주체도 함께 정해 주셔야 합니다.\n\n현재 기준 {{amount}} · {{period}} · 착수 {{dueDate}}로 안내드리며, 범위 확정 후 정식 견적서를 보내드리겠습니다.\n\n감사합니다.',
  },
});

// ─────────────────────────────────────────────────────────────
// 목록에 서는 티켓들
// ─────────────────────────────────────────────────────────────

export const demoTickets: DemoTicket[] = [
  {
    // 이 프로토타입이 보여주려는 장면. 계약 범위 밖 요청을 근거와 함께 짚어 준다.
    item: {
      ticket: ticket({
        ticketId: 't-cancel',
        ticketCode: 'TCK-01',
        projectId: 'p-dallem',
        title: '예약 취소 정책 변경 요청',
        summary:
          '취소 시점별 수수료와 노쇼 자동 차감을 요청받았습니다. 계약 범위 밖이라 비용·일정을 정해 답해야 합니다.',
        category: '기능 요청',
        requirement: '',
        lastCustomerMessage: cancelBody,
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(3),
      }),
      pending: inbound({
        inboundId: 'in-cancel',
        projectId: 'p-dallem',
        ticketId: 't-cancel',
        fromName: '박서연',
        fromEmail: 'seoyeon@dallem.co.kr',
        subject: '[달램] 예약 취소 규정 관련 문의드립니다',
        preview: '취소 시점에 따라 수수료를 단계별로 받았으면 합니다',
        body: cancelBody,
        attachments: ['취소정책_예시_스크린샷.png', '취소수수료_시뮬레이션.docx'],
        createdAt: hoursAgo(3),
        initialStage: 'to_reply',
        category: '기능 요청',
        analysis: cancelAnalysis,
      }),
      lastActivityAt: hoursAgo(3),
      workStage: 'to_reply',
    },
    history: [
      {
        kind: 'in',
        at: daysAgo(74),
        inbound: inbound({
          inboundId: 'in-cancel-h1',
          projectId: 'p-dallem',
          ticketId: 't-cancel',
          fromName: '박서연',
          fromEmail: 'seoyeon@dallem.co.kr',
          subject: '요구사항 정리해서 보냅니다',
          preview: '3.2 취소 정책 부분은 일단 기존 안대로 두었습니다',
          body: '안녕하세요, 박서연입니다.\n\n요구사항 정의서 v2 보내드립니다.\n3.2 취소 정책 부분은 일단 기존 안대로 두었습니다. 운영해 보고 다시 이야기하시죠.\n\n감사합니다.',
          createdAt: daysAgo(74),
          initialStage: 'to_reply',
          category: '기능 요청',
          analysis: analysis({ headline: '', drafts: { base: '', friendly: '', short: '', firm: '' } }),
        }),
      },
      {
        kind: 'out',
        at: daysAgo(74),
        outbound: {
          outboundId: 'out-cancel-h1',
          channel: 'email',
          projectId: 'p-dallem',
          ticketId: 't-cancel',
          toEmail: 'seoyeon@dallem.co.kr',
          body: '박서연 대표님, 안녕하세요.\n\n요구사항 정의서 v2 잘 받았습니다. 3.2 취소 정책은 현재 안(24시간 전 무료 취소) 기준으로 개발하겠습니다.\n\n운영하시면서 바꾸고 싶은 부분이 생기면 말씀 주세요. 범위 변경이 필요한지 먼저 확인해서 안내드리겠습니다.\n\n감사합니다.',
          createdAt: daysAgo(74),
        },
      },
    ],
    checklist: [
      '단계별 수수료 비율(24시간 전 0% / 6시간 전 30% / 이내 50%)이 최종안인지 확인한다',
      '노쇼 판정 기준을 예약 시각 기준 몇 분으로 할지 정한다',
      '이미 결제된 기존 예약에 새 규정을 소급할지 정한다',
      '9월 30일 오픈 범위에 넣을지, 오픈 후 2차로 뺄지 정한다',
      '오픈 전 반영이라면 대신 뺄 기능을 함께 정한다',
      '추가 비용과 반영 일정을 서면(메일)으로 남긴다',
    ],
  },
  {
    // 아직 분석 전. 열면 서버가 분석하고, 이어서 솔루션을 만드는 장면이 나온다.
    item: {
      ticket: ticket({
        ticketId: 't-alimtalk',
        ticketCode: 'TCK-02',
        projectId: 'p-dallem',
        title: '카카오 알림톡 연동 일정 문의',
        summary: '',
        category: '일정 문의',
        requirement: '',
        lastCustomerMessage:
          '알림톡 연동은 언제쯤 붙나요? 문자로만 나가니까 비용이 계속 나가서요',
        createdAt: minutesAgo(12),
        updatedAt: minutesAgo(12),
      }),
      pending: inbound({
        inboundId: 'in-alimtalk',
        channel: 'slack',
        projectId: 'p-dallem',
        ticketId: 't-alimtalk',
        fromName: '이민준',
        fromEmail: 'minjun@dallem.co.kr',
        subject: '#dallem-개발',
        preview: '알림톡 연동은 언제쯤 붙나요?',
        body: '알림톡 연동은 언제쯤 붙나요? 문자로만 나가니까 비용이 계속 나가서요 😅\n혹시 이번 스프린트에 들어가 있으면 알려주세요.',
        createdAt: minutesAgo(12),
        initialStage: 'to_analyze',
        category: '일정 문의',
        analysis: alimtalkAnalysis,
      }),
      lastActivityAt: minutesAgo(12),
      workStage: 'to_analyze',
    },
    analyzingMs: 4500,
    solutionPending: true,
    history: [],
    checklist: [
      '알림톡 발송 프로필 심사가 끝났는지 확인한다',
      '문자 대비 절감액을 고객에게 숫자로 알려줄지 정한다',
      '이번 스프린트에 넣을지 다음으로 미룰지 정한다',
    ],
  },
  {
    // 답변을 보내고 회신을 기다리는 티켓.
    item: {
      ticket: ticket({
        ticketId: 't-slot',
        ticketCode: 'TCK-03',
        projectId: 'p-dallem',
        title: '예약 시간 단위 30분 → 15분',
        summary: '오픈 후 2차 반영으로 안내했고, 고객 회신을 기다리는 중입니다.',
        category: '기능 요청',
        requirement: '예약 슬롯 단위를 15분으로 바꾼다 (오픈 후 2차 반영)',
        lastCustomerMessage: slotBody,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(2),
      }),
      pending: null,
      lastActivityAt: daysAgo(2),
      workStage: 'waiting',
    },
    history: [
      {
        kind: 'in',
        at: daysAgo(6),
        inbound: inbound({
          inboundId: 'in-slot',
          projectId: 'p-dallem',
          ticketId: 't-slot',
          fromName: '박서연',
          fromEmail: 'seoyeon@dallem.co.kr',
          subject: '[달램] 예약 시간 단위 문의',
          preview: '예약 시간 단위를 30분에서 15분으로 바꿀 수 있을까요?',
          body: slotBody,
          createdAt: daysAgo(6),
          initialStage: 'to_reply',
          category: '기능 요청',
          analysis: slotAnalysis,
        }),
      },
      {
        kind: 'out',
        at: daysAgo(2),
        outbound: {
          outboundId: 'out-slot',
          channel: 'email',
          projectId: 'p-dallem',
          ticketId: 't-slot',
          toEmail: 'seoyeon@dallem.co.kr',
          body: slotAnalysis.drafts.base,
          createdAt: daysAgo(2),
        },
      },
    ],
    checklist: ['2차 반영 일정을 언제로 잡을지 정한다'],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-payfail',
        ticketCode: 'TCK-04',
        projectId: 'p-dallem',
        title: '결제 실패 시 안내 문구 수정',
        summary: '문구를 고쳐 배포했고 고객이 확인했습니다.',
        category: '버그',
        requirement: '결제 실패 안내에 실패 사유와 재시도 방법을 함께 보여준다',
        lastCustomerMessage: '문구 수정 확인했습니다. 감사합니다!',
        status: 'Done',
        createdAt: daysAgo(16),
        updatedAt: daysAgo(11),
      }),
      pending: null,
      lastActivityAt: daysAgo(11),
      workStage: 'idle',
    },
    history: [
      {
        kind: 'in',
        at: daysAgo(16),
        inbound: inbound({
          inboundId: 'in-payfail',
          projectId: 'p-dallem',
          ticketId: 't-payfail',
          fromName: '박서연',
          fromEmail: 'seoyeon@dallem.co.kr',
          subject: '[달램] 결제 실패 안내가 불친절합니다',
          preview: '결제가 실패했습니다만 뜨고 끝이라 문의가 계속 옵니다',
          body: '결제가 실패하면 "결제가 실패했습니다"만 뜨고 끝이라 고객 문의가 계속 옵니다.\n왜 실패했는지, 어떻게 다시 하면 되는지 같이 보여줄 수 있을까요?',
          createdAt: daysAgo(16),
          initialStage: 'to_reply',
          category: '버그',
          analysis: analysis({ headline: '', drafts: { base: '', friendly: '', short: '', firm: '' } }),
        }),
      },
      {
        kind: 'out',
        at: daysAgo(12),
        outbound: {
          outboundId: 'out-payfail',
          channel: 'email',
          projectId: 'p-dallem',
          ticketId: 't-payfail',
          toEmail: 'seoyeon@dallem.co.kr',
          body: '박서연 대표님, 안녕하세요.\n\n결제 실패 안내 문구를 수정해 배포했습니다. 이제 실패 사유(한도 초과·카드 오류 등)와 재시도 방법이 함께 표시됩니다.\n\n계약 범위 안의 하자 보수로 처리했으며 추가 비용은 없습니다.\n\n감사합니다.',
          createdAt: daysAgo(12),
        },
      },
    ],
    checklist: [],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-2fa',
        ticketCode: 'TCK-09',
        projectId: 'p-dallem',
        title: '관리자 계정 2단계 인증 요구',
        summary: '범위 밖이고 오픈 일정에 넣을 수 없어 이번 계약에서는 받지 않기로 했습니다.',
        category: '계약 문의',
        requirement: '',
        lastCustomerMessage: '보안 심사 때문에 관리자 로그인에 2차 인증이 필요하다고 합니다',
        status: 'Reject',
        createdAt: daysAgo(23),
        updatedAt: daysAgo(19),
      }),
      pending: null,
      lastActivityAt: daysAgo(19),
      workStage: 'idle',
    },
    history: [],
    checklist: [],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-excel',
        ticketCode: 'TCK-05',
        projectId: 'p-brick',
        title: '상품 일괄 등록 엑셀 양식 변경',
        summary: '옵션값 칼럼을 둘로 나눠 달라는 요청입니다. 계약 범위 안입니다.',
        category: '기능 요청',
        requirement: '',
        lastCustomerMessage: excelBody,
        createdAt: hoursAgo(9),
        updatedAt: hoursAgo(9),
      }),
      pending: inbound({
        inboundId: 'in-excel',
        projectId: 'p-brick',
        ticketId: 't-excel',
        fromName: '김도현',
        fromEmail: 'dohyun@brickcommerce.io',
        subject: '엑셀 양식 하나만 바꿔주실 수 있나요',
        preview: '"옵션값" 칼럼을 두 개로 나눠주실 수 있을까요?',
        body: excelBody,
        attachments: ['상품일괄등록_양식_수정본.docx'],
        createdAt: hoursAgo(9),
        initialStage: 'to_reply',
        category: '기능 요청',
        analysis: excelAnalysis,
      }),
      lastActivityAt: hoursAgo(9),
      workStage: 'to_reply',
    },
    solutionPending: true,
    history: [],
    checklist: [
      '옛 양식을 언제까지 함께 인식할지 정한다',
      '샘플 양식 파일을 새로 올려 배포에 포함한다',
      '#87 업로드 검증 작업과 충돌하지 않게 순서를 정한다',
      'MD 대상 사내 공지는 고객 쪽에서 하도록 안내한다',
    ],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-slow',
        ticketCode: 'TCK-06',
        projectId: 'p-brick',
        title: '대시보드가 느리다는 신고',
        summary: '재현 조건이 없어 원인을 특정할 수 없습니다. 되물어야 합니다.',
        category: '버그',
        requirement: '',
        lastCustomerMessage: slowBody,
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(30),
      }),
      pending: inbound({
        inboundId: 'in-slow',
        channel: 'slack',
        projectId: 'p-brick',
        ticketId: 't-slow',
        fromName: '김도현',
        fromEmail: 'dohyun@brickcommerce.io',
        subject: '#brick-운영',
        preview: '대시보드가 너무 느립니다',
        body: slowBody,
        createdAt: hoursAgo(30),
        initialStage: 'to_reply',
        category: '버그',
        analysis: slowAnalysis,
      }),
      lastActivityAt: hoursAgo(30),
      workStage: 'to_reply',
    },
    history: [],
    checklist: [
      '어느 대시보드인지 되묻는다 (매출 / 주문)',
      '3일 전 배포 전후로 증상이 갈리는지 확인한다',
      '조회 기간과 체감 소요 시간을 받는다',
      '먼저 서버 로그에서 느린 쿼리를 확인할지 정한다',
    ],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-quote',
        ticketCode: 'TCK-07',
        projectId: 'p-notree',
        title: '랜딩 페이지 제작 견적 문의',
        summary: '계약 전 첫 문의입니다. 관리자 편집 범위에 따라 견적이 크게 달라집니다.',
        category: '계약 문의',
        requirement: '',
        lastCustomerMessage: quoteBody,
        createdAt: hoursAgo(20),
        updatedAt: hoursAgo(20),
      }),
      pending: inbound({
        inboundId: 'in-quote',
        projectId: 'p-notree',
        ticketId: 't-quote',
        fromName: '이하늘',
        fromEmail: 'haneul@notree.kr',
        subject: '랜딩 페이지 제작 문의드립니다',
        preview: '브랜드 랜딩 페이지를 새로 만들고 싶은데 견적과 기간이 궁금합니다',
        body: quoteBody,
        createdAt: hoursAgo(20),
        initialStage: 'to_reply',
        category: '계약 문의',
        analysis: quoteAnalysis,
      }),
      lastActivityAt: hoursAgo(20),
      workStage: 'to_reply',
    },
    history: [],
    checklist: [
      '관리자 편집 범위를 문구 교체까지로 좁힐지 정한다',
      '디자인 시안을 고객이 준비하는지 확인한다',
      '오픈 목표일을 받는다',
      '범위가 늘어날 때의 추가 비용 기준을 먼저 적어 둔다',
    ],
  },
  {
    item: {
      ticket: ticket({
        ticketId: 't-report',
        ticketCode: 'TCK-08',
        projectId: 'p-finup',
        title: '정산 리포트 월별 필터 추가',
        summary: '반영 후 인수인계까지 끝났습니다.',
        category: '기능 요청',
        requirement: '정산 리포트에 월별 조회 필터를 추가한다',
        lastCustomerMessage: '잘 쓰고 있습니다. 감사합니다.',
        status: 'Done',
        createdAt: daysAgo(52),
        updatedAt: daysAgo(40),
      }),
      pending: null,
      lastActivityAt: daysAgo(40),
      workStage: 'idle',
    },
    history: [],
    checklist: [],
  },
];
