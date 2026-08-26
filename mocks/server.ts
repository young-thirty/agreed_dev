// 브라우저 안에서 도는 시연용 백엔드.
//
// agreed_be가 없어도 화면을 끝까지 돌려 보기 위한 것이다. lib/api-client의 요청을
// 여기서 받아 같은 규약({ ok, data } / { ok, error })으로 돌려준다.
// 실제 서버가 붙으면 NEXT_PUBLIC_DEMO를 끄면 되고, 이 폴더는 통째로 지울 수 있다.

import { incomingScenarios } from '@/mocks/incoming';
import { materials as seedMaterials, projects as seedProjects, sourceLinks as seedLinks } from '@/mocks/projects';
import { demoTickets, type DemoTicket } from '@/mocks/tickets';
import { minutesAgo } from '@/mocks/time';
import { fillDraft } from '@/lib/format';
import type {
  ApiResult,
  InboundDecision,
  Project,
  ProjectMaterial,
  SourceLink,
  TicketStatus,
} from '@/types';

const STORAGE_KEY = 'agreed:demo-state:v1';

interface Integration {
  connected: boolean;
  account: string | null;
}

interface DemoState {
  projects: Project[];
  sourceLinks: SourceLink[];
  materials: ProjectMaterial[];
  tickets: DemoTicket[];
  /** 티켓별 사람의 판단. 서버 DB 대신이다. */
  decisions: Record<string, InboundDecision>;
  /** 분석이 끝난 시각(ms). 티켓을 처음 연 순간부터 잰다. */
  analyzingUntil: Record<string, number>;
  /** 솔루션을 이미 만든 티켓. */
  solved: string[];
  integrations: { gmail: Integration; slack: Integration; github: Integration };
  /** 아직 도착하지 않은 새 메시지가 몇 개 남았는지. */
  incomingCursor: number;
  /** 진행 중인 분석 실행. 채널 가져오기가 이걸로 티켓을 기다린다. */
  runs: Record<string, number>;
}

function seed(): DemoState {
  return {
    projects: structuredClone(seedProjects),
    sourceLinks: structuredClone(seedLinks),
    materials: structuredClone(seedMaterials),
    tickets: structuredClone(demoTickets),
    decisions: {},
    analyzingUntil: {},
    solved: [],
    integrations: {
      gmail: { connected: true, account: 'soomin.dev@gmail.com' },
      slack: { connected: true, account: '수민 워크스페이스' },
      github: { connected: true, account: 'soomin' },
    },
    incomingCursor: 0,
    runs: {},
  };
}

let state: DemoState | null = null;

function store(): DemoState {
  if (state !== null) return state;
  const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    try {
      state = JSON.parse(raw) as DemoState;
      return state;
    } catch {
      // 저장값이 깨졌으면 처음부터 다시 시작한다
    }
  }
  state = seed();
  return state;
}

function save(): void {
  if (typeof window === 'undefined' || state === null) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** 시연을 다시 찍기 위해 처음 상태로 되돌린다. */
export function resetDemo(): void {
  state = seed();
  save();
}

/** 남은 새 메시지가 있는지. 시연 패널이 버튼을 열어 둘지 정하는 데 쓴다. */
export function incomingLeft(): number {
  return incomingScenarios.length - store().incomingCursor;
}

// ─────────────────────────────────────────────────────────────
// 응답을 만드는 도우미
// ─────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 사람이 "지금 서버가 일하고 있구나"라고 느낄 만큼만 끈다. */
function delayOf(path: string): number {
  if (path.includes('/solution')) return 2400;
  if (path.includes('/reply-draft')) return 1900;
  if (path.includes('/checklist')) return 1300;
  if (path.includes('/git/ask')) return 1700;
  if (path.includes('/sync')) return 900;
  return 260 + Math.random() * 240;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string): ApiResult<T> {
  return { ok: false, error };
}

function ticketOf(ticketId: string): DemoTicket | undefined {
  return store().tickets.find((t) => t.item.ticket.ticketId === ticketId);
}

function decisionOf(ticketId: string): InboundDecision {
  const s = store();
  return (
    s.decisions[ticketId] ?? {
      handling: null,
      ticketId: null,
      values: {},
      replyText: null,
      sentAt: null,
    }
  );
}

/**
 * 화면에 내보낼 티켓 한 줄.
 *
 * 분석이 아직 도는 티켓은 분석 결과를 감추고, 솔루션을 만들기 전 티켓은
 * 작업 가능 여부와 개발 현황을 비운다. 실제 서버가 단계별로 채워 주는 것과 같은 모양이다.
 */
function present(demo: DemoTicket) {
  const s = store();
  const item = structuredClone(demo.item);
  const id = item.ticket.ticketId;

  if (item.pending === null) return item;

  if (item.workStage === 'to_analyze') {
    // 티켓을 열어야 분석이 시작되고, 그 시간이 지나야 사람이 답할 차례가 된다.
    const until = s.analyzingUntil[id];
    if (until === undefined || Date.now() < until) return item;
    item.workStage = 'to_reply';
  }

  if (demo.solutionPending === true && !s.solved.includes(id)) {
    item.pending.analysis = {
      ...item.pending.analysis,
      feasibility: null,
      devContext: null,
      evidence: [],
    };
  }

  const decision = s.decisions[id];
  if (decision !== undefined && decision.sentAt !== null) {
    item.workStage = 'waiting';
  }
  return item;
}

/** 분석 대기 티켓을 처음 열면 그때부터 시간을 잰다. */
function startAnalyzing(demo: DemoTicket): void {
  const s = store();
  const id = demo.item.ticket.ticketId;
  if (demo.item.workStage !== 'to_analyze') return;
  if (s.analyzingUntil[id] !== undefined) return;
  s.analyzingUntil[id] = Date.now() + (demo.analyzingMs ?? 4000);
  save();
}

// ─────────────────────────────────────────────────────────────
// 답변 초안
// ─────────────────────────────────────────────────────────────

/** 화면의 말투 값(ReplyTone)을 목 데이터의 초안 키로 옮긴다. */
const TONE_KEY = {
  professional: 'base',
  friendly: 'friendly',
  concise: 'short',
  firm: 'firm',
} as const;

/** 사람이 고른 성격에 맞춰 마지막 문단을 바꾼다. */
function closingOf(items: string[]): string | null {
  if (items.some((item) => item.includes('되묻는'))) {
    return '위 내용만 확인해 주시면 바로 이어서 진행하겠습니다.';
  }
  if (items.some((item) => item.includes('요청하는'))) {
    return '위 자료를 보내주시면 곧바로 착수하겠습니다.';
  }
  if (items.some((item) => item.includes('거절'))) {
    return '이번 요청은 현재 계약 범위와 일정 안에서는 진행이 어렵겠습니다. 다음 단계에서 다시 논의할 수 있으면 좋겠습니다.';
  }
  return null;
}

function buildDraft(
  ticketId: string,
  selectedItems: string[],
  tone: keyof typeof TONE_KEY,
): string | null {
  const demo = ticketOf(ticketId);
  if (demo === undefined || demo.item.pending === null) return null;

  const { analysis } = demo.item.pending;
  const base = analysis.drafts[TONE_KEY[tone]];
  if (base === '') return null;

  const filled = fillDraft(base, analysis.decisionFields, decisionOf(ticketId).values);

  // 성격 문장과 값 문장은 초안 본문에 이미 반영됐다. 확인 항목만 따로 붙인다.
  const checks = selectedItems.filter(
    (item) => demo.checklist.includes(item),
  );

  const parts = [filled];
  if (checks.length > 0) {
    parts.push(
      ['[확인 부탁드릴 사항]', ...checks.map((item, i) => `${i + 1}. ${item}`)].join('\n'),
    );
  }
  const closing = closingOf(selectedItems);
  if (closing !== null) parts.push(closing);

  return parts.join('\n\n');
}

// ─────────────────────────────────────────────────────────────
// 새 메시지 도착
// ─────────────────────────────────────────────────────────────

/**
 * 다음 고객 메시지를 도착시킨다. 새 티켓이 만들어지고 잠깐 분석 중으로 있다가
 * 결과가 붙는다. 더 도착할 메시지가 없으면 null이다.
 */
export function deliverNextIncoming(): { ticketId: string; title: string; from: string } | null {
  const s = store();
  const scenario = incomingScenarios[s.incomingCursor];
  if (scenario === undefined) return null;
  s.incomingCursor += 1;

  const at = minutesAgo(0);
  const demo: DemoTicket = {
    item: {
      ticket: { ...structuredClone(scenario.ticket), status: 'Active', createdAt: at, updatedAt: at },
      pending: {
        ...structuredClone(scenario.inbound),
        ticketId: scenario.ticket.ticketId,
        createdAt: at,
        analysis: structuredClone(scenario.analysis),
      },
      lastActivityAt: at,
      workStage: 'to_analyze',
    },
    history: [],
    checklist: scenario.analysis.feasibility?.requiredHumanInput ?? [],
    analyzingMs: 5000,
    solutionPending: true,
  };

  s.tickets = [demo, ...s.tickets];
  const project = s.projects.find((p) => p.projectId === scenario.projectId);
  if (project !== undefined) {
    project.unansweredRequestCount += 1;
    project.updatedAt = at;
  }
  startAnalyzing(demo);
  save();

  return {
    ticketId: scenario.ticket.ticketId,
    title: scenario.ticket.title,
    from: scenario.inbound.fromName,
  };
}

// ─────────────────────────────────────────────────────────────
// 라우팅
// ─────────────────────────────────────────────────────────────

interface Req {
  method: string;
  path: string;
  query: URLSearchParams;
  body: Record<string, unknown>;
}

type Handler = (req: Req, params: string[]) => ApiResult<unknown>;

const ROUTES: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/projects$/, () => ok(store().projects)],

  [
    'POST',
    /^\/api\/projects$/,
    (req) => {
      const name = String(req.body.name ?? '').trim();
      if (name === '') return fail('프로젝트 이름을 입력해 주세요.');
      const at = minutesAgo(0);
      const project: Project = {
        projectId: `p-${Date.now().toString(36)}`,
        name,
        clientName: String(req.body.clientName ?? '').trim(),
        clientEmail: String(req.body.clientEmail ?? '').trim() || null,
        description: String(req.body.description ?? '').trim(),
        startDate: (req.body.startDate as string) || null,
        endDate: (req.body.endDate as string) || null,
        contractPrice:
          req.body.contractPrice === undefined || req.body.contractPrice === ''
            ? null
            : Number(req.body.contractPrice),
        unansweredRequestCount: 0,
        createdAt: at,
        updatedAt: at,
        status: 'DRAFT',
      };
      store().projects = [project, ...store().projects];
      save();
      return ok(project);
    },
  ],

  [
    'GET',
    /^\/api\/tickets$/,
    (req) => {
      const projectId = req.query.get('projectId');
      const items = store()
        .tickets.filter((t) => projectId === null || t.item.ticket.projectId === projectId)
        .map(present);
      return ok(items);
    },
  ],

  // 요구사항으로 올라온 티켓만 목록에 선다. 여기서는 전부 올려 준다.
  [
    'GET',
    /^\/api\/projects\/([^/]+)\/requirements$/,
    (_req, [projectId]) =>
      ok(
        store()
          .tickets.filter((t) => t.item.ticket.projectId === projectId)
          .map((t) => ({ sourceRequestId: t.item.ticket.ticketId })),
      ),
  ],

  [
    'GET',
    /^\/api\/tickets\/([^/]+)$/,
    (_req, [ticketId]) => {
      const demo = ticketOf(ticketId);
      if (demo === undefined) return fail('티켓을 찾을 수 없습니다.');
      startAnalyzing(demo);
      const project = store().projects.find((p) => p.projectId === demo.item.ticket.projectId);
      if (project === undefined) return fail('프로젝트를 찾을 수 없습니다.');
      return ok({
        ...present(demo),
        project,
        decision: decisionOf(ticketId),
        history: demo.history,
        materials: store().materials.filter((m) => m.projectId === project.projectId),
      });
    },
  ],

  [
    'POST',
    /^\/api\/requests\/([^/]+)\/decision$/,
    (req, [ticketId]) => {
      // 칸을 하나 고칠 때마다 저장이 날아온다. 통째로 갈아치우면 거의 동시에 도착한
      // 다른 칸의 값이 지워지므로, 받은 값만 덮어쓴다.
      const previous = decisionOf(ticketId);
      const next: InboundDecision = {
        ...previous,
        handling: (req.body.handling as InboundDecision['handling']) ?? null,
        ticketId,
        values: { ...previous.values, ...((req.body.values as Record<string, string>) ?? {}) },
      };
      store().decisions[ticketId] = next;
      save();
      return ok(next);
    },
  ],

  [
    'POST',
    /^\/api\/requests\/([^/]+)\/mark-sent$/,
    (req, [ticketId]) => {
      const demo = ticketOf(ticketId);
      if (demo === undefined || demo.item.pending === null) return fail('티켓을 찾을 수 없습니다.');

      const at = minutesAgo(0);
      const replyText = String(req.body.replyText ?? '');
      const next: InboundDecision = {
        ...decisionOf(ticketId),
        handling: 'link',
        ticketId,
        replyText,
        sentAt: at,
      };
      store().decisions[ticketId] = next;

      // 보낸 답변은 지난 대화에 쌓이고, 티켓은 회신 대기로 넘어간다.
      demo.history = [
        ...demo.history,
        { kind: 'in', at: demo.item.pending.createdAt, inbound: demo.item.pending },
        {
          kind: 'out',
          at,
          outbound: {
            outboundId: `out-${Date.now().toString(36)}`,
            channel: demo.item.pending.channel,
            projectId: demo.item.ticket.projectId,
            ticketId,
            toEmail: demo.item.pending.fromEmail,
            body: replyText,
            createdAt: at,
          },
        },
      ];
      demo.item.workStage = 'waiting';
      demo.item.lastActivityAt = at;
      demo.item.ticket.updatedAt = at;
      if (demo.item.ticket.summary === '') {
        demo.item.ticket.summary = '답변을 보내고 고객 회신을 기다리는 중입니다.';
      }

      const project = store().projects.find((p) => p.projectId === demo.item.ticket.projectId);
      if (project !== undefined && project.unansweredRequestCount > 0) {
        project.unansweredRequestCount -= 1;
        project.updatedAt = at;
      }
      save();
      return ok(next);
    },
  ],

  [
    'PATCH',
    /^\/api\/requests\/([^/]+)\/ticket-status$/,
    (req, [ticketId]) => {
      const demo = ticketOf(ticketId);
      if (demo === undefined) return fail('티켓을 찾을 수 없습니다.');
      const param = String(req.body.ticketStatus ?? '');
      const status: TicketStatus =
        param === 'done' ? 'Done' : param === 'rejected' ? 'Reject' : 'Active';
      demo.item.ticket.status = status;
      demo.item.ticket.updatedAt = minutesAgo(0);
      save();
      return ok({ ticketStatus: param });
    },
  ],

  [
    'POST',
    /^\/api\/requests\/([^/]+)\/solution$/,
    (_req, [ticketId]) => {
      const demo = ticketOf(ticketId);
      if (demo === undefined) return fail('티켓을 찾을 수 없습니다.');
      const s = store();
      if (!s.solved.includes(ticketId)) s.solved.push(ticketId);
      save();
      return ok({ created: true });
    },
  ],

  [
    'POST',
    /^\/api\/requests\/([^/]+)\/reply-draft$/,
    (req, [ticketId]) => {
      const items = (req.body.selectedItems as string[] | undefined) ?? [];
      const tone = (req.body.tone as keyof typeof TONE_KEY) ?? 'professional';
      const body = buildDraft(ticketId, items, tone);
      if (body === null) return fail('이 티켓의 답변 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return ok({ body });
    },
  ],

  [
    'POST',
    /^\/api\/requests\/([^/]+)\/checklist$/,
    (_req, [ticketId]) => ok({ items: ticketOf(ticketId)?.checklist ?? [] }),
  ],

  [
    'GET',
    /^\/api\/projects\/([^/]+)\/materials$/,
    (_req, [projectId]) => ok(store().materials.filter((m) => m.projectId === projectId)),
  ],

  [
    'GET',
    /^\/api\/projects\/([^/]+)\/source-links$/,
    (_req, [projectId]) => ok(store().sourceLinks.filter((l) => l.projectId === projectId)),
  ],

  [
    'POST',
    /^\/api\/projects\/([^/]+)\/source-links$/,
    (req, [projectId]) => {
      const s = store();
      const locatorKey = String(req.body.locatorKey ?? '');
      const duplicate = s.sourceLinks.some(
        (l) => l.projectId === projectId && l.locatorKey === locatorKey,
      );
      if (duplicate) return fail('이미 등록된 연결입니다.');

      const at = minutesAgo(0);
      const link: SourceLink = {
        sourceLinkId: `sl-${Date.now().toString(36)}`,
        projectId,
        sourceChannel: req.body.sourceChannel as SourceLink['sourceChannel'],
        displayName: String(req.body.displayName ?? ''),
        connectionId: null,
        counterpartyEmail: (req.body.counterpartyEmail as string) ?? null,
        threadId: null,
        teamId: (req.body.teamId as string) ?? null,
        channelId: (req.body.channelId as string) ?? null,
        repoFullName: (req.body.repoFullName as string) ?? null,
        locatorKey,
        createdAt: at,
        updatedAt: at,
      };
      s.sourceLinks = [...s.sourceLinks, link];
      save();
      return ok(link);
    },
  ],

  [
    'POST',
    /^\/api\/projects\/([^/]+)\/source-links\/([^/]+)\/sync$/,
    () => {
      const delivered = deliverNextIncoming();
      if (delivered === null) return ok({ newMessageCount: 0, analysisRunIds: [] });
      const runId = `run-${Date.now().toString(36)}`;
      store().runs[runId] = Date.now() + 5000;
      save();
      return ok({ newMessageCount: 1, analysisRunIds: [runId] });
    },
  ],

  [
    'GET',
    /^\/api\/analysis-runs\/([^/]+)$/,
    (_req, [runId]) => {
      const done = (store().runs[runId] ?? 0) < Date.now();
      return ok({ status: done ? 'COMPLETED' : 'PROCESSING' });
    },
  ],

  [
    'POST',
    /^\/api\/slack\/workspaces$/,
    () =>
      store().integrations.slack.connected
        ? ok([
            { teamId: 'T0SOOMIN', teamName: '수민 워크스페이스' },
            { teamId: 'T0DALLEM', teamName: '달램' },
          ])
        : fail('슬랙이 연결되지 않았습니다. 설정에서 먼저 연결해 주세요.'),
  ],

  [
    'POST',
    /^\/api\/slack\/channels$/,
    (req) =>
      ok(
        req.body.teamId === 'T0DALLEM'
          ? [
              { id: 'C0DEV', name: 'dallem-개발', isPrivate: false, isMember: true },
              { id: 'C0OPS', name: 'dallem-운영', isPrivate: false, isMember: false },
              { id: 'C0BIZ', name: 'dallem-사업', isPrivate: true, isMember: false },
            ]
          : [
              { id: 'C1BRICK', name: 'brick-운영', isPrivate: false, isMember: true },
              { id: 'C1NOTREE', name: 'notree-리뉴얼', isPrivate: false, isMember: false },
              { id: 'C1GENERAL', name: 'general', isPrivate: false, isMember: true },
            ],
      ),
  ],

  ['POST', /^\/api\/slack\/join$/, () => ok({ joined: true })],

  [
    'GET',
    /^\/api\/email\/status$/,
    () => {
      const gmail = store().integrations.gmail;
      return ok({ connected: gmail.connected, email: gmail.account });
    },
  ],

  // 설정 화면이 세 연동을 한 번에 읽고 쓴다.
  ['GET', /^\/api\/integrations$/, () => ok(store().integrations)],

  [
    'POST',
    /^\/api\/integrations\/([^/]+)\/(connect|disconnect)$/,
    (_req, [provider, action]) => {
      const s = store();
      const key = provider as keyof DemoState['integrations'];
      if (s.integrations[key] === undefined) return fail('지원하지 않는 연동입니다.');
      const accounts = {
        gmail: 'soomin.dev@gmail.com',
        slack: '수민 워크스페이스',
        github: 'soomin',
      } as const;
      s.integrations[key] =
        action === 'connect'
          ? { connected: true, account: accounts[key] }
          : { connected: false, account: null };
      save();
      return ok(s.integrations[key]);
    },
  ],

  [
    'POST',
    /^\/api\/projects\/([^/]+)\/git\/ask$/,
    (_req, [projectId]) => {
      const link = store().sourceLinks.find(
        (l) => l.projectId === projectId && l.sourceChannel === 'GITHUB',
      );
      if (link === undefined) {
        return fail('이 프로젝트에 연결된 저장소가 없습니다. 채널 연결에서 저장소를 등록해 주세요.');
      }
      return ok({
        answer:
          '요청하신 범위에서 이미 구현된 부분과 남은 부분을 정리했습니다.\n\n' +
          '· 구현됨 — 기본 흐름과 외부 연동은 최근 배포까지 반영되어 있습니다.\n' +
          '· 진행 중 — 관련 PR이 리뷰 단계에 있고, 같은 파일을 건드립니다.\n' +
          '· 남음 — 이번 요청이 새로 요구하는 계산·판정 로직입니다.',
        repoFullName: link.repoFullName ?? '',
      });
    },
  ],

  // 인증. 시연에서는 형식만 맞으면 들여보낸다.
  [
    'POST',
    /^\/api\/auth\/(signup|login)$/,
    (req) => {
      const email = String(req.body.email ?? '');
      if (!email.includes('@')) return fail('메일 주소를 다시 확인해 주세요.');
      if (String(req.body.password ?? '').length < 4) {
        return fail('비밀번호를 4자 이상 입력해 주세요.');
      }
      return ok({
        user: {
          userId: 'u-demo',
          name: String(req.body.name ?? '박수민'),
          email,
          phoneNumber: (req.body.phoneNumber as string) ?? null,
          createdAt: minutesAgo(0),
        },
      });
    },
  ],

  ['POST', /^\/api\/auth\/logout$/, () => ok({})],

  [
    'GET',
    /^\/api\/auth\/me$/,
    () =>
      ok({
        user: {
          userId: 'u-demo',
          name: '박수민',
          email: 'soomin.dev@gmail.com',
          phoneNumber: null,
          createdAt: minutesAgo(0),
        },
      }),
  ],
];

/** api-client가 부르는 입구. 경로를 보고 위 표에서 하나를 고른다. */
export async function demoRequest<T>(
  method: string,
  rawPath: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const [path, search = ''] = rawPath.split('?');
  await wait(delayOf(path));

  for (const [routeMethod, pattern, handler] of ROUTES) {
    if (routeMethod !== method) continue;
    const matched = pattern.exec(path);
    if (matched === null) continue;
    const req: Req = {
      method,
      path,
      query: new URLSearchParams(search),
      body: (body ?? {}) as Record<string, unknown>,
    };
    return handler(req, matched.slice(1).map(decodeURIComponent)) as ApiResult<T>;
  }

  return fail(`시연 모드에서 아직 준비되지 않은 요청입니다. (${method} ${path})`);
}

/**
 * 자료 원본. public/demo 아래 둔 문서를 문서 종류에 맞춰 돌려준다.
 * 원본이 없는 자료는 화면이 이미 걸러 내지만, 여기서도 한 번 더 막는다.
 */
export async function demoBlob(path: string): Promise<ApiResult<Blob>> {
  const matched = /^\/api\/projects\/[^/]+\/materials\/([^/]+)\/file$/.exec(path.split('?')[0]);
  const material =
    matched === null ? undefined : store().materials.find((m) => m.materialId === matched[1]);

  if (material === undefined || !material.hasFile) {
    return fail('원본을 받아오지 못했습니다. 채널 연결 상태를 확인해 주세요.');
  }

  const res = await fetch(`/demo/${material.documentType ?? 'OTHER'}.docx`);
  if (!res.ok) return fail('파일을 가져오지 못했습니다.');
  return ok(await res.blob());
}

/**
 * 시연 모드에서 apiUrl()이 돌려줄 주소.
 * 자료 다운로드만 실제 파일로 잇고, 나머지 경로는 그대로 둔다.
 */
export function demoMaterialUrl(path: string): string {
  const matched = /^\/api\/projects\/[^/]+\/materials\/([^/]+)\/file$/.exec(path.split('?')[0]);
  if (matched === null) return path;
  const material = store().materials.find((m) => m.materialId === matched[1]);
  return `/demo/${material?.documentType ?? 'OTHER'}.docx`;
}
