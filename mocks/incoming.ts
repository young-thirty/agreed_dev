// 시연 중에 새로 도착하는 고객 메시지.
//
// 채널에서 '가져오기'를 누르거나 시연 패널에서 메시지를 부르면 하나씩 꺼내 쓴다.
// 도착하면 새 티켓이 만들어지고, 잠깐 '분석 필요'로 있다가 분석 결과가 붙는다.

import type { Analysis, Inbound, Ticket } from '@/types';

export interface IncomingScenario {
  projectId: string;
  ticket: Omit<Ticket, 'createdAt' | 'updatedAt' | 'status'>;
  inbound: Omit<Inbound, 'createdAt' | 'ticketId' | 'analysis'>;
  /** 분석이 끝난 뒤 붙을 결과. 도착 직후에는 아직 없다. */
  analysis: Analysis;
}

const scheduleBody = `안녕하세요, 박서연입니다.

내부 사정으로 오픈 행사를 일주일 앞당기게 됐습니다.
9월 23일에 오픈할 수 있을까요? 예약이랑 결제만 되면 되고,
관리자 통계는 나중에 봐도 괜찮습니다.

무리한 부탁인 건 알지만 가능한지만 알려주세요.

감사합니다.`;

const couponBody = `쿠폰 두 장 같이 쓰게 해달라는 요청이 계속 들어옵니다.
배송비 쿠폰이랑 금액 할인 쿠폰은 같이 쓸 수 있게 해주면 좋겠어요.
이건 원래 되는 거 아니었나요?`;

export const incomingScenarios: IncomingScenario[] = [
  {
    projectId: 'p-dallem',
    ticket: {
      ticketId: 't-launch',
      ticketCode: 'TCK-10',
      projectId: 'p-dallem',
      title: '오픈 일정 일주일 단축 요청',
      summary: '오픈을 9월 23일로 앞당길 수 있는지 물었습니다. 범위를 줄여야 가능합니다.',
      category: '일정 문의',
      requirement: '',
      lastCustomerMessage: scheduleBody,
    },
    inbound: {
      inboundId: 'in-launch',
      channel: 'email',
      projectId: 'p-dallem',
      fromName: '박서연',
      fromEmail: 'seoyeon@dallem.co.kr',
      subject: '[달램] 오픈 일정 조정 가능할까요',
      preview: '오픈 행사를 일주일 앞당기게 됐습니다. 9월 23일 가능할까요?',
      body: scheduleBody,
      attachments: [],
      initialStage: 'to_analyze',
      category: '일정 문의',
    },
    analysis: {
      headline: '지금 범위 그대로는 어렵습니다. 무엇을 뺄지 정하셔야 합니다.',
      adviceReason:
        '남은 작업은 정산 배치 검수와 관리자 통계입니다. 고객이 "통계는 나중에 봐도 된다"고 먼저 적어 주었으니, 통계를 오픈 후로 미루면 9월 23일이 가능한 범위가 됩니다.',
      intents: [
        { kind: '일정 문의', text: '오픈일을 9월 30일에서 23일로 단축' },
        { kind: '범위 조정', text: '관리자 통계는 오픈 이후로 미뤄도 된다는 제안' },
      ],
      fields: [
        { label: '요청 성격', value: '일정 단축 요청 1건 (범위 조정 여지 있음)' },
        { label: '계약 범위', value: '범위 안 — 다만 납기가 계약서 제3조와 달라집니다', tone: 'caution' },
        { label: '남은 작업', items: ['정산 배치 검수', '관리자 통계 화면', '예약 취소 정책(TCK-01, 미확정)'] },
        {
          label: '단축 가능 여부',
          value: '관리자 통계를 오픈 후로 미루면 7일 확보 — 23일 오픈이 가능합니다',
        },
        {
          label: '위험',
          value: 'TCK-01 취소 정책을 함께 넣으면 어느 쪽도 지킬 수 없습니다',
          tone: 'caution',
        },
      ],
      missingInfo: [
        '오픈 행사 당일에 관리자 통계 없이 운영이 가능한지 확인이 필요합니다.',
        'TCK-01 취소 정책을 오픈 전에 넣을지 아직 정해지지 않았습니다.',
      ],
      devContext: {
        subject: '9월 오픈 잔여 작업',
        items: [
          { state: 'done', text: '예약 · 결제 플로우' },
          { state: 'done', text: '고객 알림 (문자)' },
          { state: 'progress', text: '정산 배치 검수' },
          { state: 'todo', text: '관리자 통계 화면' },
          { state: 'todo', text: '예약 취소 정책 변경 (TCK-01)' },
        ],
        relatedWork: [{ title: '#142 정산 배치 리팩터링', note: '리뷰 중 · 오픈 전 필수' }],
        impactAreas: ['batch/settlement.py', 'admin/stats/'],
        repoFullName: 'soomin/dallem-reserve',
        checked: true,
      },
      feasibility: {
        verdict: 'feasible_with_scope_change',
        reason:
          '관리자 통계를 오픈 후로 미루면 9월 23일 오픈이 가능합니다. 다만 계약서상 납기가 9월 30일이므로, 앞당긴 일정과 미룬 범위를 메일로 남겨 두어야 나중에 말이 달라지지 않습니다.',
        requiredHumanInput: [
          '관리자 통계를 오픈 후로 미루는 데 동의를 받을지',
          'TCK-01 취소 정책을 오픈 범위에서 뺄지',
          '단축에 따른 비용 조정이 필요한지',
        ],
      },
      evidence: [
        {
          source: 'document',
          label: '계약서',
          title: '달램_개발용역계약서.docx · 제3조 납기',
          quote: '납품일은 2026년 9월 30일로 한다. 일정 변경은 상호 합의한 경우에 한한다.',
        },
        {
          source: 'ticket',
          label: '관련 티켓',
          title: 'TCK-01 예약 취소 정책 변경 요청',
          quote: '아직 반영 여부가 정해지지 않았습니다. 이 건과 함께 넣으면 일정이 무너집니다.',
        },
        {
          source: 'github',
          label: 'GitHub',
          title: 'soomin/dallem-reserve · PR #142',
          quote: '정산 배치 리팩터링 리뷰 중. 오픈 전에 반드시 끝나야 하는 작업입니다.',
        },
        {
          source: 'message',
          label: '이번 메시지',
          title: '박서연 · 오픈 일정 조정',
          quote: '예약이랑 결제만 되면 되고, 관리자 통계는 나중에 봐도 괜찮습니다.',
        },
      ],
      relatedTicketId: 't-cancel',
      ticketProposal: null,
      decisionFields: [{ id: 'dueDate', label: '확정 오픈일', type: 'date' }],
      drafts: {
        base: '박서연 대표님, 안녕하세요.\n\n오픈 일정 건 확인했습니다.\n\n결론부터 말씀드리면, 관리자 통계 화면을 오픈 이후로 미루는 조건이면 {{dueDate}} 오픈이 가능합니다. 대표님께서 "통계는 나중에 봐도 괜찮다"고 해주신 부분이 그대로 답이 되었습니다.\n\n다만 한 가지만 함께 정해 주셔야 합니다. 앞서 문의 주신 예약 취소 정책 변경(단계별 수수료·노쇼 차감)까지 오픈 전에 넣으면 어느 쪽도 지킬 수 없습니다. 취소 정책은 오픈 후 2차로 반영하는 것으로 진행하겠습니다.\n\n정리하면 이렇습니다.\n- 오픈일: {{dueDate}}\n- 오픈 범위: 예약 · 결제 · 고객 알림 · 정산\n- 오픈 후 반영: 관리자 통계, 예약 취소 정책 변경\n\n이대로 괜찮으시면 회신 주세요. 계약서상 납기가 9월 30일이라, 확인 회신을 근거로 남겨 두겠습니다.\n\n감사합니다.',
        friendly: '박서연 대표님, 안녕하세요!\n\n오픈 앞당기는 건 확인했습니다. 결론부터 말씀드리면 가능합니다.\n\n대표님께서 통계는 나중에 봐도 된다고 해주셔서요, 관리자 통계를 오픈 이후로 미루면 {{dueDate}} 오픈 맞출 수 있습니다.\n\n대신 하나만 같이 정해요. 지난번에 말씀 주신 취소 정책 변경까지 오픈 전에 넣으면 둘 다 위험해집니다. 취소 정책은 오픈하고 나서 2차로 넣는 걸로 할게요.\n\n정리하면,\n- 오픈일: {{dueDate}}\n- 오픈에 포함: 예약 · 결제 · 알림 · 정산\n- 오픈 후: 관리자 통계, 취소 정책 변경\n\n이렇게 괜찮으시면 회신 한 번만 부탁드립니다. 계약서 납기가 9월 30일이라 기록으로 남겨두려고요!\n\n감사합니다.',
        short: '박서연 대표님, 안녕하세요.\n\n{{dueDate}} 오픈 가능합니다. 단, 조건이 있습니다.\n\n- 오픈 범위: 예약 · 결제 · 알림 · 정산\n- 오픈 후 반영: 관리자 통계, 예약 취소 정책 변경(TCK-01)\n\n취소 정책까지 오픈 전에 넣으면 일정을 지킬 수 없습니다.\n\n계약 납기(9월 30일)와 다르므로 확인 회신 부탁드립니다.\n\n감사합니다.',
        firm: '박서연 대표님, 안녕하세요.\n\n오픈 일정 단축 요청 검토했습니다.\n\n계약서 제3조상 납품일은 9월 30일이며, 일정 변경은 상호 합의가 필요합니다. 현재 범위를 그대로 두고 일주일을 단축하는 것은 불가능합니다.\n\n아래 조건이면 {{dueDate}} 오픈이 가능합니다.\n1. 관리자 통계 화면을 오픈 후로 이관\n2. 예약 취소 정책 변경(TCK-01)을 오픈 범위에서 제외\n\n두 조건에 동의해 주시면 그 회신을 합의 근거로 삼아 일정을 확정하겠습니다. 조건 없이 일정만 단축하는 형태로는 진행할 수 없습니다.\n\n감사합니다.',
      },
    },
  },
  {
    projectId: 'p-brick',
    ticket: {
      ticketId: 't-coupon',
      ticketCode: 'TCK-11',
      projectId: 'p-brick',
      title: '쿠폰 중복 사용 요청',
      summary: '배송비 쿠폰과 금액 할인 쿠폰의 중복 사용을 요청받았습니다. 범위 밖입니다.',
      category: '기능 요청',
      requirement: '',
      lastCustomerMessage: couponBody,
    },
    inbound: {
      inboundId: 'in-coupon',
      channel: 'slack',
      projectId: 'p-brick',
      fromName: '김도현',
      fromEmail: 'dohyun@brickcommerce.io',
      subject: '#brick-운영',
      preview: '쿠폰 두 장 같이 쓰게 해달라는 요청이 계속 들어옵니다',
      body: couponBody,
      attachments: [],
      initialStage: 'to_analyze',
      category: '기능 요청',
    },
    analysis: {
      headline: '"원래 되는 것"이 아닙니다. 범위 밖이라는 점을 먼저 짚어야 합니다.',
      adviceReason:
        '제안서 4.3에 쿠폰은 "주문당 1매 적용"으로 적혀 있고, 요구사항 확인 때도 중복 사용은 논의되지 않았습니다. 중복을 허용하면 할인 계산과 부분 취소 환불액 계산이 함께 바뀝니다.',
      intents: [{ kind: '기능 요청', text: '배송비 쿠폰과 금액 할인 쿠폰의 중복 적용' }],
      fields: [
        { label: '요청 성격', value: '기능 추가 1건' },
        { label: '계약 범위', value: '범위 밖 — 제안서 4.3은 주문당 1매로 명시', tone: 'caution' },
        { label: '인식 차이', value: '고객은 원래 되는 기능으로 알고 있습니다. 먼저 바로잡아야 합니다', tone: 'caution' },
        { label: '영향 범위', items: ['할인 계산', '부분 취소 환불액', '정산 리포트', '쿠폰 관리 화면'] },
        { label: '예상 공수', value: '개발 3일 + 검수 1일 (AI 추정치)', tone: 'caution' },
      ],
      missingInfo: [
        '중복 허용 조합을 어디까지 열지 정해지지 않았습니다(배송비+금액만인지, 금액+금액도인지).',
        '중복 적용 시 할인 상한을 둘지 정해지지 않았습니다.',
      ],
      devContext: {
        subject: '쿠폰 · 할인',
        items: [
          { state: 'done', text: '쿠폰 발급 · 사용 (주문당 1매)' },
          { state: 'done', text: '할인 계산 · 주문 금액 반영' },
          { state: 'todo', text: '쿠폰 중복 적용 규칙' },
          { state: 'todo', text: '중복 적용 시 부분 취소 환불액 재계산' },
        ],
        relatedWork: [],
        impactAreas: ['orders/discount.py', 'orders/refund.py', 'admin/coupons/'],
        repoFullName: 'soomin/brick-admin',
        checked: true,
      },
      feasibility: {
        verdict: 'feasible_with_scope_change',
        reason:
          '기술적으로 막히지는 않습니다. 다만 부분 취소 시 어느 쿠폰을 얼마나 되돌릴지 규칙이 없으면 환불 금액이 어긋납니다. 규칙을 먼저 정해야 합니다.',
        requiredHumanInput: ['추가 개발 비용', '반영 일정', '중복 허용 조합과 할인 상한'],
      },
      evidence: [
        {
          source: 'document',
          label: '제안서',
          title: '브릭커머스_관리자개편_제안서.docx · 4.3 쿠폰',
          quote: '쿠폰은 주문당 1매 적용을 원칙으로 한다.',
        },
        {
          source: 'message',
          label: '이번 메시지',
          title: '김도현 · #brick-운영',
          quote: '이건 원래 되는 거 아니었나요?',
        },
      ],
      relatedTicketId: null,
      ticketProposal: null,
      decisionFields: [
        { id: 'amount', label: '추가 비용', type: 'money', placeholder: '예: 900000' },
        { id: 'dueDate', label: '반영 일정', type: 'date' },
      ],
      drafts: {
        base: '김도현 님, 안녕하세요.\n\n쿠폰 중복 사용 건 확인했습니다.\n\n먼저 한 가지 정리해 드리면, 쿠폰 중복 적용은 원래 포함된 기능이 아닙니다. 제안서 4.3에 "쿠폰은 주문당 1매 적용을 원칙으로 한다"고 되어 있고, 요구사항 확인 때도 중복 사용은 논의되지 않았습니다.\n\n추가로 만들 수는 있습니다. 다만 할인 계산뿐 아니라 부분 취소 시 환불 금액 계산까지 함께 바뀌어서, 개발 3일 + 검수 1일이 필요합니다. 추가 비용 {{amount}}, 반영 일정 {{dueDate}}로 제안드립니다.\n\n진행하신다면 두 가지를 먼저 정해 주세요.\n1. 중복 허용 조합 — 배송비+금액만인지, 금액+금액도 허용인지\n2. 중복 적용 시 할인 상한을 둘지\n\n확인 부탁드립니다.\n감사합니다.',
        friendly: '도현 님, 안녕하세요!\n\n쿠폰 중복 건 확인했습니다.\n\n먼저 하나만 짚고 갈게요. 쿠폰 중복 적용은 원래 들어가 있던 기능이 아닙니다. 제안서 4.3에 "주문당 1매"로 적어두었고, 요구사항 정리할 때도 중복 얘기는 없었어요.\n\n물론 추가로 만들 수 있습니다! 다만 할인 계산이랑 부분 취소 환불 계산까지 같이 바뀌어서 개발 3일 + 검수 1일 정도 봅니다. 비용은 {{amount}}, 일정은 {{dueDate}}로 생각하고 있어요.\n\n진행하시려면 두 가지만 먼저 정해 주세요.\n- 어떤 조합까지 허용할지 (배송비+금액만? 금액+금액도?)\n- 할인 상한을 둘지\n\n확인 주시면 바로 잡아볼게요!',
        short: '김도현 님, 안녕하세요.\n\n쿠폰 중복 적용은 계약 범위 밖입니다. 제안서 4.3에 주문당 1매로 명시되어 있습니다.\n\n추가 작업은 가능합니다.\n- 공수: 개발 3일 + 검수 1일 (부분 취소 환불 계산 포함)\n- 추가 비용: {{amount}}\n- 반영 일정: {{dueDate}}\n\n진행 시 중복 허용 조합과 할인 상한을 먼저 정해 주세요.\n\n감사합니다.',
        firm: '김도현 님, 안녕하세요.\n\n쿠폰 중복 사용은 계약에 포함된 기능이 아닙니다. 제안서 4.3에 "쿠폰은 주문당 1매 적용을 원칙으로 한다"고 명시되어 있으며, 요구사항 확인 단계에서도 중복 사용은 논의되지 않았습니다.\n\n추가 개발로는 진행 가능합니다.\n- 추가 비용: {{amount}}\n- 반영 일정: {{dueDate}}\n- 공수: 개발 3일 + 검수 1일\n\n다만 중복 허용 조합과 할인 상한을 확정하지 않으면 부분 취소 시 환불 금액이 어긋납니다. 이 두 가지를 서면으로 정해 주신 뒤 착수하겠습니다.\n\n감사합니다.',
      },
    },
  },
];
