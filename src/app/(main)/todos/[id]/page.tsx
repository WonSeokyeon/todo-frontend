"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormSkeleton } from "@/components/common/Skeleton";
import { TodoForm, type TodoFormValues } from "@/components/todo/TodoForm";
import { useDeleteTodo, useTodo, useUpdateTodo } from "@/hooks/useTodos";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = use(params);
  const todoId = Number(id);
  const router = useRouter();

  const query = useTodo(todoId);
  const updateMutation = useUpdateTodo(todoId);
  const deleteMutation = useDeleteTodo();

  function handleSubmit(values: TodoFormValues) {
    updateMutation.mutate(values, {
      // 저장 성공이 확정된 뒤에만 이동한다(handleDelete와 동일한 이유).
      onSuccess: () => router.push("/todos"),
    });
  }

  function handleDelete() {
    deleteMutation.mutate(todoId, {
      // 삭제 성공이 확정된 뒤에만 이동한다 (TODO-12).
      onSuccess: () => router.push("/todos"),
    });
  }

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

  // data가 한 번이라도 로드됐다면(예: 저장 실패 중 백그라운드 refetch가 실패한 경우) 폼을 계속 보여준다.
  // isError만 보고 화면을 통째로 바꾸면, 이미 입력 중이던 내용이 사용자 눈에 사라진 것처럼 보인다 (TODO-13).
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

  const submitError =
    updateMutation.error instanceof ApiClientError
      ? toDisplayMessage(updateMutation.error.error)
      : updateMutation.isError
        ? "일시적인 오류가 발생했습니다. 다시 시도해 주세요."
        : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">할 일 수정</h1>
      <TodoForm
        // 저장 성공 시 handleSubmit이 목록으로 이동시키므로 이 폼은 사라진다. key는
        // 저장 실패로 화면에 남아 있는 동안 서버 데이터가 바뀌는 경우를 위한 안전장치다.
        key={query.data.updatedAt}
        initialValues={{
          title: query.data.title,
          content: query.data.content ?? "",
          priority: query.data.priority,
          dueDate: query.data.dueDate,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/todos")}
        onDelete={handleDelete}
        isSubmitting={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
