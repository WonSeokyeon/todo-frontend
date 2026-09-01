"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
import { validateEmail, validateNickname, validatePassword } from "@/lib/validation";

function passwordErrorMessage(value: string): string | null {
  if (value.length === 0) return null;
  const result = validatePassword(value);
  if (result.valid) return null;
  if (result.reason === "too-short") return "비밀번호는 6자 이상이어야 합니다.";
  // 한글 1자는 UTF-8로 3바이트다. 서버 400에만 의존하지 않고 제출 전에 안내한다 (AUTH-02).
  return "비밀번호가 너무 깁니다. UTF-8 기준 72바이트 이하여야 합니다 (한글 1자 = 3바이트로 계산됩니다).";
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailServerError, setEmailServerError] = useState<string | null>(null);

  const emailError =
    emailServerError ??
    (email.length > 0 && !validateEmail(email) ? "올바른 이메일 형식이 아닙니다." : null);
  const passwordError = passwordErrorMessage(password);
  const nicknameError =
    nickname.length > 0 && !validateNickname(nickname)
      ? "닉네임은 1자 이상 50자 이하여야 합니다."
      : null;

  const canSubmit =
    validateEmail(email) &&
    validatePassword(password).valid &&
    validateNickname(nickname) &&
    !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFormError(null);
    setEmailServerError(null);
    try {
      await signup({ email, password, nickname });
      router.push("/todos");
    } catch (err) {
      if (err instanceof ApiClientError && err.error.code === "EMAIL_DUPLICATED") {
        setEmailServerError(toDisplayMessage(err.error));
      } else if (err instanceof ApiClientError) {
        setFormError(toDisplayMessage(err.error));
      } else {
        setFormError("일시적인 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">회원가입</h1>
        <p className="text-sm text-muted-foreground">이메일로 계정을 만드세요</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-email">이메일</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailServerError(null);
            }}
            aria-invalid={!!emailError}
            required
          />
          {emailError && (
            <p role="alert" className="text-xs text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-password">비밀번호</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!passwordError}
            required
          />
          <p className="text-xs text-muted-foreground">
            6자 이상, UTF-8 72바이트 이하 (한글 1자 = 3바이트로 계산됩니다)
          </p>
          {passwordError && (
            <p role="alert" className="text-xs text-destructive">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-nickname">닉네임</Label>
          <Input
            id="signup-nickname"
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            aria-invalid={!!nicknameError}
            required
          />
          {nicknameError && (
            <p role="alert" className="text-xs text-destructive">
              {nicknameError}
            </p>
          )}
        </div>

        <Button type="submit" disabled={!canSubmit} className="mt-2 w-full">
          {submitting ? "가입 중..." : "회원가입"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
