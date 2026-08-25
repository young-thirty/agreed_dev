import { ok } from '@/lib/api-response';
import { getWorkspaces } from '../store';

// 연결된 워크스페이스 목록. botToken은 절대 클라이언트로 내보내지 않는다.
export async function POST() {
  const workspaces = await getWorkspaces();
  return ok(workspaces.map((w) => ({ teamId: w.teamId, teamName: w.teamName })));
}
