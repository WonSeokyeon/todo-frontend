"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormSkeleton } from "@/components/common/Skeleton";
import { TodoForm, type TodoFormValues } from "@/components/todo/TodoForm";
import { useRenderedContent } from "@/hooks/useAttachments";
import { useDeleteTodo, useTodo, useUpdateTodo } from "@/hooks/useTodos";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";

interface TodoEditPageProps {
  params: Promise<{ id: string }>;
}

export default function TodoEditPage({ params }: TodoEditPageProps) {
  const { id } = use(params);
  const todoId = Number(id);
  const router = useRouter();

  const query = useTodo(todoId);
  const updateMutation = useUpdateTodo(todoId);
  const deleteMutation = useDeleteTodo();
  // 에디터에 넣을 본문. 첨부가 있으면 조회 URL이 주입된 HTML이다.
  const rendered = useRenderedContent(query.data?.content);

  function handleSubmit(values: TodoFormValues) {
    updateMutation.mutate(values, {
      // 저장 성공이 확정된 뒤에만 이동한다. 목록이 아니라 방금 고친 내용을 바로 보여주는
      // 확인 화면(/todos/[id])으로 보낸다(handleDelete는 볼 항목이 사라지므로 목록으로 간다).
      onSuccess: () => router.push(`/todos/${todoId}`),
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
  // 첨부 URL 주입이 끝나기 전에 폼을 마운트하면 안 된다. TodoForm은 마운트 직후의
  // 에디터 HTML을 dirty 판정 baseline으로 잡는데, 주입이 그 뒤에 일어나면 사용자가
  // 아무것도 고치지 않아도 dirty가 되어 이탈 확인창이 뜬다 (CLAUDE.md 9장).
  if (!query.data || !rendered.isReady) {
    if (query.isPending || (query.data && !rendered.isReady)) {
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
        // 저장 성공 시 handleSubmit이 이 화면을 떠나게 하므로 폼은 사라진다. key는
        // 저장 실패로 화면에 남아 있는 동안 서버 데이터가 바뀌는 경우를 위한 안전장치다.
        key={query.data.updatedAt}
        initialValues={{
          title: query.data.title,
          // 서버 원본이 아니라 첨부 URL이 주입된 HTML을 넘긴다. 그래야 에디터에
          // 이미지가 보이고, dirty baseline도 화면에 보이는 것과 같은 값으로 잡힌다.
          content: rendered.html,
          priority: query.data.priority,
          dueDate: query.data.dueDate,
        }}
        onSubmit={handleSubmit}
        // 취소하면 목록이 아니라 원래 보고 있던 확인 화면으로 되돌아간다.
        onCancel={() => router.push(`/todos/${todoId}`)}
        onDelete={handleDelete}
        isSubmitting={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
