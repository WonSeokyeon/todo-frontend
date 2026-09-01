"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
      <span className="text-base font-semibold">Todo List</span>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {/* 이메일은 렌더하지 않는다. user.email이 응답에 들어있어도 화면에는 닉네임만 노출한다 (AUTH-08) */}
        {user && <span>{user.nickname}</span>}
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  );
}
