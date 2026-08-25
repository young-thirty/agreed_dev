'use client';

// 앱 전역 상태 저장소. 화면이 여러 개라 page.tsx 하나가 상태를 들 수 없어,
// 전역 상태 라이브러리 대신 React Context로 최소한만 공유한다. 저장은 localStorage.
//
// 요청·문서·타임라인은 데모용 읽기 데이터라 mocks에서 직접 읽는다.
// 여기서는 사용자가 실제로 바꾸는 것(프로필·연동·프로젝트)만 들고 있는다.

import { createContext, useContext, type ReactNode } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { DEFAULT_INTEGRATIONS, PROJECTS } from '@/mocks';
import type { Integration, Project, ProjectStatus, User } from '@/types';

interface AppStore {
  user: User | null;
  setUser: (user: User) => void;

  // gmail·slack은 이제 FastAPI 세션·OAuth로 실제 연결 여부를 판단한다(EmailIntegrationPanel,
  // SlackIntegrationPanel). 여기 integrations는 file·text처럼 항상 켜져 있는 소스만 남았다.
  integrations: Integration[];

  projects: Project[];
  addProject: (project: Project) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = usePersistedState<User | null>('user', null);
  const [integrations] = usePersistedState<Integration[]>('integrations', DEFAULT_INTEGRATIONS);
  const [projects, setProjects] = usePersistedState<Project[]>('projects', PROJECTS);

  const addProject = (project: Project) => setProjects((prev) => [project, ...prev]);

  const setProjectStatus = (id: string, status: ProjectStatus) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

  return (
    <Ctx.Provider
      value={{
        user,
        setUser,
        integrations,
        projects,
        addProject,
        setProjectStatus,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppStore는 AppStoreProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
