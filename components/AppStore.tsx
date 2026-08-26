'use client';

// 화면이 공유하는 상태.
//
// 프로젝트와 티켓은 백엔드가 원천이다(GET /api/projects, GET /api/tickets).
// 목록에 세울 티켓은 요구사항이 정한다(GET /api/projects/{id}/requirements).
// 사람이 내린 판단도 이제 서버에 남는다. 브라우저에는 아무것도 저장하지 않는다.
//
// AI는 분석과 초안까지만 한다. 티켓 반영·분리, 상태 변경, 발송 표시는
// 사람이 누를 때만 일어나고, 그때마다 서버에 기록된다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  listProjects,
  listRequirements,
  listWorkItems,
  setTicketStatus as setTicketStatusApi,
} from '@/lib/api';
import type { Project, TicketStatus, WorkItem } from '@/types';

interface AppStore {
  projects: Project[];
  /** 티켓과 거기 달린 미답변 메시지. 목록 화면이 이걸 그린다. */
  workItems: WorkItem[];
  /** 첫 조회가 끝났는지. 끝나기 전에는 '없다'고 말하지 않는다. */
  loaded: boolean;
  error: string | null;
  reload: () => Promise<void>;

  projectOf: (projectId: string) => Project | null;
  /** 서버에 반영하고 목록을 갱신한다. 실패하면 사유를 돌려준다. */
  changeTicketStatus: (ticketId: string, status: TicketStatus) => Promise<string | null>;
}

const Ctx = createContext<AppStore | null>(null);

/**
 * 요구사항으로 올라온 티켓만 남긴다.
 *
 * GET /api/tickets는 분석이 만든 요청을 거르지 않고 전부 준다. 인사말이나 잡담에서
 * 만들어진 것까지 섞여 있어 그대로 그리면 목록이 일감이 아닌 줄로 덮인다.
 * 사람이 판단할 일감인지는 서버가 요구사항으로 올렸는지로 정해진다.
 *
 * 요구사항을 읽지 못한 프로젝트의 티켓은 그대로 둔다. 잠깐 못 읽었다고 목록이
 * 통째로 비면 무엇이 잘못됐는지 알 길이 없다.
 */
async function onlyRequirementTickets(
  items: WorkItem[],
  projects: Project[],
): Promise<WorkItem[]> {
  if (projects.length === 0) return items;

  const results = await Promise.all(projects.map((p) => listRequirements(p.projectId)));
  const allowed = new Set<string>();
  const unread = new Set<string>();
  results.forEach((res, index) => {
    if (!res.ok) {
      unread.add(projects[index].projectId);
      return;
    }
    for (const item of res.data) {
      if (item.sourceRequestId) allowed.add(item.sourceRequestId);
    }
  });

  return items.filter(
    (item) => allowed.has(item.ticket.ticketId) || unread.has(item.ticket.projectId),
  );
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [projectRes, ticketRes] = await Promise.all([listProjects(), listWorkItems()]);
    setLoaded(true);

    if (!ticketRes.ok) {
      setError(ticketRes.error);
      return;
    }
    setError(null);
    const projectList = projectRes.ok ? projectRes.data : [];
    if (projectRes.ok) setProjects(projectList);
    setWorkItems(await onlyRequirementTickets(ticketRes.data, projectList));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const projectOf = useCallback(
    (projectId: string) => projects.find((p) => p.projectId === projectId) ?? null,
    [projects],
  );

  const changeTicketStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
    const res = await setTicketStatusApi(ticketId, status);
    if (!res.ok) return res.error;
    setWorkItems((prev) =>
      prev.map((item) =>
        item.ticket.ticketId === ticketId
          ? { ...item, ticket: { ...item.ticket, status } }
          : item,
      ),
    );
    return null;
  }, []);

  const value = useMemo(
    () => ({ projects, workItems, loaded, error, reload, projectOf, changeTicketStatus }),
    [projects, workItems, loaded, error, reload, projectOf, changeTicketStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (ctx === null) throw new Error('AppStoreProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
