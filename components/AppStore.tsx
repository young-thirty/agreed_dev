'use client';

// 화면이 공유하는 상태. 프로젝트는 백엔드가 원천이고 여기서는 캐시만 한다.
// 사용자·연동 상태는 시연용이라 localStorage에 남는다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { get, patch, post } from '@/lib/api-client';
import { usePersistedState } from '@/hooks/usePersistedState';
import { DEFAULT_INTEGRATIONS } from '@/mocks';
import type { ApiResult, Integration, Project, ProjectStatus, User } from '@/types';

/** 프로젝트를 만들 때 화면이 채우는 값. 서버가 나머지를 붙여 돌려준다. */
export interface ProjectDraft {
  name: string;
  clientName: string;
  clientEmail: string | null;
  description: string;
  startDate: string | null;
  endDate: string | null;
  contractPrice: number | null;
}

interface AppStore {
  user: User | null;
  setUser: (user: User | null) => void;
  integrations: Integration[];

  projects: Project[];
  /** 첫 조회가 끝났는지. 끝나기 전에는 '프로젝트가 없다'고 말하지 않는다. */
  projectsLoaded: boolean;
  projectsError: string | null;
  reloadProjects: () => Promise<void>;
  createProject: (draft: ProjectDraft) => Promise<ApiResult<Project>>;
  updateProject: (projectId: string, draft: ProjectDraft) => Promise<ApiResult<Project>>;
  setProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = usePersistedState<User | null>('user', null);
  const [integrations] = usePersistedState<Integration[]>('integrations', DEFAULT_INTEGRATIONS);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const reloadProjects = useCallback(async () => {
    const res = await get<Project[]>('/api/projects');
    setProjectsLoaded(true);
    if (!res.ok) {
      setProjectsError(res.error);
      return;
    }
    setProjectsError(null);
    setProjects(res.data);
  }, []);

  useEffect(() => {
    reloadProjects();
  }, [reloadProjects]);

  const createProject = useCallback(async (draft: ProjectDraft) => {
    const res = await post<Project>('/api/projects', { ...draft, status: 'DRAFT' });
    if (res.ok) setProjects((prev) => [res.data, ...prev]);
    return res;
  }, []);

  const updateProject = useCallback(async (projectId: string, draft: ProjectDraft) => {
    const res = await patch<Project>(`/api/projects/${projectId}`, draft);
    if (res.ok) {
      setProjects((prev) => prev.map((p) => (p.projectId === projectId ? res.data : p)));
    }
    return res;
  }, []);

  const setProjectStatus = useCallback(async (projectId: string, status: ProjectStatus) => {
    const res = await patch<Project>(`/api/projects/${projectId}/status`, { status });
    if (res.ok) {
      setProjects((prev) => prev.map((p) => (p.projectId === projectId ? res.data : p)));
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        setUser,
        integrations,
        projects,
        projectsLoaded,
        projectsError,
        reloadProjects,
        createProject,
        updateProject,
        setProjectStatus,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (ctx === null) throw new Error('AppStoreProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
