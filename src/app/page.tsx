"use client";

// 토큰 유무에 따른 리다이렉트는 useAuth가 만들어지는 Phase 7에서 연결한다.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
      <h1 className="text-lg font-semibold">Todo List</h1>
      <p className="text-sm text-muted-foreground">스캐폴딩 단계입니다.</p>
    </div>
  );
}
