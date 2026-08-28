import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig: NextConfig = {
  // 부모 폴더(todo-project)에 있던 npm 파일 때문에 Next가 워크스페이스 루트를 잘못 추론했던
  // 문제의 재발을 막는다. 원인 파일은 삭제됐지만 설정은 유지한다.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
