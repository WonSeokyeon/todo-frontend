"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
import { validateEmail } from "@/lib/validation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showConflictNotice = searchParams.get("error") === "email_conflict";
  const canSubmit = validateEmail(email) && password.length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await login({ email, password });
      router.push("/todos");
    } catch (err) {
      // apiClient는 항상 ApiClientError만 던진다.
      setFormError(
        err instanceof ApiClientError
          ? toDisplayMessage(err.error)
          : "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">로그인</h1>
        <p className="text-sm text-muted-foreground">Todo List에 오신 것을 환영합니다</p>
      </div>

      {showConflictNotice && (
        <p role="alert" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          이미 이메일로 가입된 계정입니다. 이메일로 로그인해 주세요.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* 미가입 이메일과 비밀번호 오류를 같은 문구로 표시해 계정 존재 여부를 노출하지 않는다 (AUTH-03·백엔드 UNAUTHORIZED 매핑) */}
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">이메일</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">비밀번호</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={!canSubmit} className="mt-2 w-full">
          {submitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <Button variant="outline" asChild className="w-full">
        <a href={`${API_BASE}/oauth2/authorization/google`}>구글로 로그인</a>
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

// useSearchParams(?error=email_conflict)를 쓰므로 Suspense 경계가 없으면 npm run build가 실패한다 (CLAUDE.md 9장).
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
