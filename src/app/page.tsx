"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

// 인증 상태에 따라 /todos 또는 /login으로 보낸다. 판정 중에는 아무것도 그리지 않는다.
export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/todos");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return null;
}
