// 시연용 프로젝트·채널 연결·자료.
//
// 백엔드(agreed_be)가 붙기 전까지 화면을 끝까지 돌려 보기 위한 목이다.
// 타입은 types/index.ts를 그대로 쓴다. 서버가 붙으면 이 파일만 지우면 된다.

import { dateOnly, daysAgo, hoursAgo } from '@/mocks/time';
import type { Project, ProjectMaterial, SourceLink } from '@/types';

export const projects: Project[] = [
  {
    projectId: 'p-dallem',
    name: '달램 예약 웹앱',
    clientName: '(주)달램',
    clientEmail: 'seoyeon@dallem.co.kr',
    description:
      '공간 대여 예약과 결제를 한 곳에서 처리하는 웹앱. 예약·결제·정산까지 포함하고 9월 말 오픈을 목표로 한다.',
    startDate: dateOnly(-86),
    endDate: dateOnly(35),
    contractPrice: 12_000_000,
    unansweredRequestCount: 2,
    createdAt: daysAgo(88),
    updatedAt: hoursAgo(3),
    status: 'ACTIVE',
  },
  {
    projectId: 'p-brick',
    name: '브릭커머스 관리자 개편',
    clientName: '브릭커머스',
    clientEmail: 'dohyun@brickcommerce.io',
    description:
      '상품·주문·정산 관리자 화면을 다시 만든다. 기존 관리자에서 데이터 이관까지 포함한다.',
    startDate: dateOnly(-42),
    endDate: dateOnly(66),
    contractPrice: 8_500_000,
    unansweredRequestCount: 2,
    createdAt: daysAgo(45),
    updatedAt: hoursAgo(9),
    status: 'ACTIVE',
  },
  {
    projectId: 'p-notree',
    name: '노트리 랜딩 리뉴얼',
    clientName: '노트리',
    clientEmail: 'haneul@notree.kr',
    description: '브랜드 랜딩 페이지 리뉴얼 문의. 아직 계약 전이라 범위와 금액이 정해지지 않았다.',
    startDate: null,
    endDate: null,
    contractPrice: null,
    unansweredRequestCount: 1,
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(20),
    status: 'DRAFT',
  },
  {
    projectId: 'p-finup',
    name: '핀업 정산 자동화',
    clientName: '핀업',
    clientEmail: 'jiwoo@finup.team',
    description: '월별 정산 리포트를 자동으로 만들고 메일로 보내는 배치. 인수인계까지 끝났다.',
    startDate: dateOnly(-190),
    endDate: dateOnly(-38),
    contractPrice: 5_000_000,
    unansweredRequestCount: 0,
    createdAt: daysAgo(196),
    updatedAt: daysAgo(38),
    status: 'COMPLETED',
  },
];

/** 채널 연결 한 줄을 만드는 짧은 도우미. 비어 있는 칸을 매번 적지 않기 위한 것이다. */
function link(
  partial: Pick<SourceLink, 'sourceLinkId' | 'projectId' | 'sourceChannel' | 'displayName' | 'locatorKey'> &
    Partial<SourceLink>,
): SourceLink {
  return {
    connectionId: null,
    counterpartyEmail: null,
    threadId: null,
    teamId: null,
    channelId: null,
    repoFullName: null,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
    ...partial,
  };
}

export const sourceLinks: SourceLink[] = [
  link({
    sourceLinkId: 'sl-1',
    projectId: 'p-dallem',
    sourceChannel: 'GMAIL',
    displayName: 'seoyeon@dallem.co.kr',
    counterpartyEmail: 'seoyeon@dallem.co.kr',
    locatorKey: 'seoyeon@dallem.co.kr',
  }),
  link({
    sourceLinkId: 'sl-2',
    projectId: 'p-dallem',
    sourceChannel: 'GMAIL',
    displayName: 'minjun@dallem.co.kr',
    counterpartyEmail: 'minjun@dallem.co.kr',
    locatorKey: 'minjun@dallem.co.kr',
  }),
  link({
    sourceLinkId: 'sl-3',
    projectId: 'p-dallem',
    sourceChannel: 'SLACK',
    displayName: '#dallem-개발',
    teamId: 'T0DALLEM',
    channelId: 'C0DEV',
    locatorKey: 'T0DALLEM:C0DEV',
  }),
  link({
    sourceLinkId: 'sl-4',
    projectId: 'p-dallem',
    sourceChannel: 'GITHUB',
    displayName: 'soomin/dallem-reserve',
    repoFullName: 'soomin/dallem-reserve',
    locatorKey: 'soomin/dallem-reserve',
  }),
  link({
    sourceLinkId: 'sl-5',
    projectId: 'p-brick',
    sourceChannel: 'GMAIL',
    displayName: 'dohyun@brickcommerce.io',
    counterpartyEmail: 'dohyun@brickcommerce.io',
    locatorKey: 'dohyun@brickcommerce.io',
  }),
  link({
    sourceLinkId: 'sl-6',
    projectId: 'p-brick',
    sourceChannel: 'GITHUB',
    displayName: 'soomin/brick-admin',
    repoFullName: 'soomin/brick-admin',
    locatorKey: 'soomin/brick-admin',
  }),
  // 노트리는 메일만 붙어 있다. 프로젝트 화면에 '설정 필요'가 뜨는 상태다.
  link({
    sourceLinkId: 'sl-7',
    projectId: 'p-notree',
    sourceChannel: 'GMAIL',
    displayName: 'haneul@notree.kr',
    counterpartyEmail: 'haneul@notree.kr',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    locatorKey: 'haneul@notree.kr',
  }),
];

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** 자료 한 줄. 채널·분류가 끝난 상태를 기본으로 둔다. */
function material(
  partial: Pick<ProjectMaterial, 'materialId' | 'projectId' | 'fileName' | 'communicatedAt'> &
    Partial<ProjectMaterial>,
): ProjectMaterial {
  return {
    ticketId: null,
    direction: 'RECEIVED',
    classificationStatus: 'COMPLETED',
    documentType: 'OTHER',
    sourceChannel: 'GMAIL',
    mimeType: DOCX,
    sizeBytes: 184_320,
    conversationTitle: null,
    senderDisplay: null,
    hasFile: true,
    ...partial,
  };
}

export const materials: ProjectMaterial[] = [
  material({
    materialId: 'm-1',
    projectId: 'p-dallem',
    fileName: '달램_예약웹앱_제안서.docx',
    communicatedAt: daysAgo(90),
    documentType: 'PROPOSAL',
    sizeBytes: 246_100,
    conversationTitle: '달램 예약 웹앱 제안 드립니다',
    senderDisplay: '박서연',
  }),
  material({
    materialId: 'm-2',
    projectId: 'p-dallem',
    fileName: '달램_개발용역계약서.docx',
    communicatedAt: daysAgo(86),
    documentType: 'CONTRACT',
    sizeBytes: 158_720,
    conversationTitle: '계약서 송부드립니다',
    senderDisplay: '박서연',
  }),
  material({
    materialId: 'm-3',
    projectId: 'p-dallem',
    fileName: '달램_요구사항정의서_v2.docx',
    communicatedAt: daysAgo(74),
    documentType: 'REQUIREMENTS',
    sizeBytes: 312_400,
    conversationTitle: '요구사항 정리해서 보냅니다',
    senderDisplay: '박서연',
  }),
  material({
    materialId: 'm-4',
    projectId: 'p-dallem',
    fileName: '킥오프_회의록_0612.docx',
    communicatedAt: daysAgo(75),
    documentType: 'MEETING_NOTES',
    sizeBytes: 92_160,
    sourceChannel: 'SLACK',
    conversationTitle: '#dallem-개발',
    senderDisplay: '이민준',
  }),
  material({
    materialId: 'm-5',
    projectId: 'p-dallem',
    ticketId: 't-cancel',
    fileName: '취소정책_예시_스크린샷.png',
    communicatedAt: hoursAgo(3),
    documentType: 'OTHER',
    mimeType: 'image/png',
    sizeBytes: 428_900,
    conversationTitle: '[달램] 예약 취소 규정 관련 문의드립니다',
    senderDisplay: '박서연',
    // 원본을 못 받아온 자리. 화면이 왜 못 여는지 말해 주는지 보여준다.
    hasFile: false,
  }),
  material({
    materialId: 'm-6',
    projectId: 'p-dallem',
    ticketId: 't-cancel',
    fileName: '취소수수료_시뮬레이션.docx',
    communicatedAt: hoursAgo(3),
    documentType: 'REQUIREMENTS',
    sizeBytes: 71_680,
    conversationTitle: '[달램] 예약 취소 규정 관련 문의드립니다',
    senderDisplay: '박서연',
  }),
  material({
    materialId: 'm-7',
    projectId: 'p-brick',
    fileName: '브릭커머스_관리자개편_제안서.docx',
    communicatedAt: daysAgo(46),
    documentType: 'PROPOSAL',
    sizeBytes: 201_800,
    conversationTitle: '관리자 개편 건 제안서',
    senderDisplay: '김도현',
  }),
  material({
    materialId: 'm-8',
    projectId: 'p-brick',
    ticketId: 't-excel',
    fileName: '상품일괄등록_양식_수정본.docx',
    communicatedAt: hoursAgo(9),
    documentType: 'REQUIREMENTS',
    sizeBytes: 64_512,
    conversationTitle: '엑셀 양식 하나만 바꿔주실 수 있나요',
    senderDisplay: '김도현',
  }),
  // 아직 분류가 끝나지 않은 자료. 분류 중에는 문서 종류가 비어 있다.
  material({
    materialId: 'm-9',
    projectId: 'p-brick',
    fileName: '이관대상_데이터_현황.docx',
    communicatedAt: daysAgo(30),
    documentType: null,
    classificationStatus: 'PROCESSING',
    sizeBytes: 512_000,
    conversationTitle: '데이터 이관 관련',
    senderDisplay: '김도현',
  }),
];
