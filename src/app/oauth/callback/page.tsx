"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ListSkeleton } from "@/components/common/Skeleton";
import { setAccessToken } from "@/lib/apiClient";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setAccessToken(token);
    // /todos로 이동하면서 URL 전체가 교체되므로 쿼리의 토큰도 히스토리에 남지 않는다 (PRD.md 5.4).
    router.replace("/todos");
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-sm">
      <ListSkeleton count={1} />
    </div>
  );
}

// useSearchParams(?token=)를 쓰므로 Suspense 경계가 없으면 npm run build가 실패한다 (CLAUDE.md 9장).
// 처리 중에는 스켈레톤만 보여주고, 인증 처리 중 화면이라 공통 헤더와 조작 가능한 요소를 두지 않는다.
export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
