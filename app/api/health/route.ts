import { ok } from '@/lib/api-response';

// 배포가 살아 있는지 확인하는 용도다. 도메인 로직을 여기에 넣지 않는다.

export function GET() {
  return ok({ status: 'up' });
}

export function POST() {
  return ok({ status: 'up' });
}
