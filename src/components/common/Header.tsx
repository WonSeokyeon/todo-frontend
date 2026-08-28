// 닉네임·로그아웃 자리는 비워둔다 — useAuth가 없는 시점이라 Phase 7에서 연결한다 (CLAUDE.md 7장).
export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
      <span className="text-base font-semibold">Todo List</span>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {/* Phase 7: 닉네임 표시 */}
        {/* Phase 7: 로그아웃 버튼 */}
      </div>
    </header>
  );
}
