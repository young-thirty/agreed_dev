import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 시연 직전에 빌드가 막히는 상황을 막는다. 타입과 린트 오류는 에디터에서 확인한다.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 상위 폴더에 다른 lock 파일이 있으면 Next가 그쪽을 프로젝트 루트로 잡는다.
  // 이 폴더를 루트로 고정한다.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
