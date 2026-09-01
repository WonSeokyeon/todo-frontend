"use client";

import { useRouter } from "next/navigation";

import { TodoForm, type TodoFormValues } from "@/components/todo/TodoForm";
import { useCreateTodo } from "@/hooks/useTodos";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";

export default function NewTodoPage() {
  const router = useRouter();
  const createMutation = useCreateTodo();

  function handleSubmit(values: TodoFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => router.push("/todos"),
    });
  }

  const submitError =
    createMutation.error instanceof ApiClientError
      ? toDisplayMessage(createMutation.error.error)
      : createMutation.isError
        ? "일시적인 오류가 발생했습니다. 다시 시도해 주세요."
        : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">할 일 추가</h1>
      <TodoForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/todos")}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
