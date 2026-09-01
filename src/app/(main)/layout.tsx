"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/common/Header";
import { ListSkeleton } from "@/components/common/Skeleton";
import { useAuth } from "@/hooks/useAuth";

/**
 * 라우트 보호는 여기(클라이언트 레이아웃)에서만 처리한다. middleware.ts는 만들지 않는다
 * — Access Token이 localStorage에 있어 middleware(서버 실행)가 읽을 수 없다 (CLAUDE.md 9장).
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // 인증 판정이 끝나기 전과 미인증 상태에서는 보호된 화면을 한 프레임도 그리지 않는다.
  // status가 토큰 존재 여부가 아니라 exp 디코드 결과이므로, 만료된 토큰은 여기서 이미 걸러진다 (AUTH-07).
  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
