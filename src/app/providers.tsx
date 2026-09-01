"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { createQueryClient } from "@/lib/queryClient";
// 부수효과로 popstate/beforeunload 리스너를 등록한다. TodoForm이 마운트될 때 처음
// import되면 Next.js App Router의 popstate 핸들러보다 늦게 등록돼 가로채이므로,
// 앱 최상위에서 항상 렌더되는 이 파일이 가장 먼저 로드하도록 한다 (useLeaveGuard.ts 참조).
import "@/hooks/useLeaveGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
