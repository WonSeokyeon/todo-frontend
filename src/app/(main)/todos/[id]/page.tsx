"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormSkeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { useTodo } from "@/hooks/useTodos";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";
import { RICH_TEXT_CONTENT_CLASS } from "@/lib/richTextContentClass";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/todo";

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const PRIORITY_CLASS: Record<Priority, string> = {
  HIGH: "border-priority-high/30 bg-priority-high/10 text-priority-high",
  MEDIUM: "border-priority-medium/30 bg-priority-medium/10 text-priority-medium",
  LOW: "border-priority-low/30 bg-priority-low/10 text-priority-low",
};

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

// 목록에서 항목을 선택하면 이 확인(읽기 전용) 화면으로 온다. 수정은 별도
// /todos/[id]/edit로 분리했다 — 목록의 "수정" 버튼과 이 화면의 "수정" 버튼 둘 다 그리로 간다.
export default function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = use(params);
  const todoId = Number(id);
  const router = useRouter();

  const query = useTodo(todoId);

  const isNotFound =
    query.error instanceof ApiClientError && query.error.error.code === "TODO_NOT_FOUND";

  if (!Number.isFinite(todoId) || isNotFound) {
    return (
      <EmptyState
        title="할 일을 찾을 수 없습니다"
        actionLabel="목록으로 가기"
        onAction={() => router.push("/todos")}
      />
    );
  }

  if (!query.data) {
    if (query.isPending) {
      return <FormSkeleton />;
    }
    const message =
      query.error instanceof ApiClientError
        ? toDisplayMessage(query.error.error)
        : "일시적인 오류가 발생했습니다. 다시 시도해 주세요.";
    return <ErrorState message={message} onRetry={() => query.refetch()} />;
  }

  const todo = query.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h1
          className={cn(
            "text-lg font-semibold",
            // 완료 항목은 제목에 취소선 + 흐린 색상 (PRD.md 5.5, TodoItem과 동일)
            todo.completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </h1>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
            PRIORITY_CLASS[todo.priority],
          )}
        >
          {PRIORITY_LABEL[todo.priority]}
        </span>
      </div>

      {todo.dueDate && (
        <p className="text-xs text-muted-foreground">
          마감일 {format(new Date(todo.dueDate), "yyyy년 M월 d일", { locale: ko })}
        </p>
      )}

      <div
        className={cn(
          "min-h-40 rounded-lg border border-input px-3 py-2 text-sm",
          RICH_TEXT_CONTENT_CLASS,
        )}
        // 서버에서 받은 본문을 렌더링 직전에 DOMPurify로 한 번 더 정화한다 (CLAUDE.md 6장).
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(todo.content ?? "") }}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => router.push("/todos")}>
          목록으로
        </Button>
        <Button asChild>
          <Link href={`/todos/${todo.id}/edit`}>수정</Link>
        </Button>
      </div>
    </div>
  );
}
