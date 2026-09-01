// 로그인·가입 화면은 미인증 상태이므로 닉네임·로그아웃이 있는 공통 헤더를 두지 않는다 (CLAUDE.md 7장).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
