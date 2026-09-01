"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/common/Pagination";
import { TodoList } from "@/components/todo/TodoList";
import { useDeleteTodo, useToggleTodo, useTodos } from "@/hooks/useTodos";
import { ApiClientError } from "@/lib/apiClient";
import { toDisplayMessage } from "@/lib/errorMessages";

const PAGE_SIZE = 10;

type CompletedFilter = "all" | "incomplete" | "complete";

function completedFilterToParam(filter: CompletedFilter): boolean | undefined {
  if (filter === "incomplete") return false;
  if (filter === "complete") return true;
  return undefined;
}

function TodosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(0, Number(searchParams.get("page") ?? "0") || 0);
  const completedParam = searchParams.get("completed");
  const filter: CompletedFilter =
    completedParam === "true" ? "complete" : completedParam === "false" ? "incomplete" : "all";
  const keyword = searchParams.get("keyword") ?? "";

  // 검색 입력은 키 입력마다 URL을 바꾸지 않도록 로컬 상태로 받고, 잠시 멈추면 URL에 반영한다.
  const [keywordInput, setKeywordInput] = useState(keyword);
  useEffect(() => setKeywordInput(keyword), [keyword]);

  function updateQuery(next: { page?: number; filter?: CompletedFilter; keyword?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.page !== undefined) params.set("page", String(next.page));
    if (next.filter !== undefined) {
      const value = completedFilterToParam(next.filter);
      if (value === undefined) params.delete("completed");
      else params.set("completed", String(value));
      params.set("page", "0");
    }
    if (next.keyword !== undefined) {
      if (next.keyword) params.set("keyword", next.keyword);
      else params.delete("keyword");
      params.set("page", "0");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keywordInput !== keyword) updateQuery({ keyword: keywordInput });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  const query = useTodos({
    page,
    size: PAGE_SIZE,
    completed: completedFilterToParam(filter),
    keyword: keyword || undefined,
  });

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  function handleDelete(id: number) {
    const totalElements = query.data?.totalElements ?? 0;
    const isLastItemOnPage = (query.data?.content.length ?? 0) === 1;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        // 서버 삭제가 확정된 뒤에만 이동한다 — 실패 시 롤백이 지금 보고 있는 화면에 남아야 한다.
        if (page > 0 && isLastItemOnPage && totalElements > 0) {
          updateQuery({ page: page - 1 });
        }
      },
    });
  }

  const errorMessage =
    query.error instanceof ApiClientError ? toDisplayMessage(query.error.error) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">할 일 목록</h1>
        <Button asChild size="sm">
          <Link href="/todos/new">
            <Plus className="size-4" />할 일 추가
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="제목 검색"
          aria-label="할 일 검색"
          className="sm:max-w-xs"
        />
        <div className="flex gap-1">
          {(["all", "incomplete", "complete"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => updateQuery({ filter: f })}
              aria-pressed={filter === f}
            >
              {f === "all" ? "전체" : f === "incomplete" ? "미완료" : "완료"}
            </Button>
          ))}
        </div>
      </div>

      <TodoList
        todos={query.data?.content ?? []}
        isLoading={query.isPending}
        isError={query.isError}
        errorMessage={errorMessage}
        onRetry={() => query.refetch()}
        hasKeyword={keyword.length > 0}
        onCreate={() => router.push("/todos/new")}
        onToggle={(id, completed) => toggleMutation.mutate({ id, completed })}
        onDelete={handleDelete}
        deletingId={deleteMutation.isPending ? (deleteMutation.variables ?? null) : null}
      />

      {query.data && (
        <Pagination
          currentPage={page}
          totalPages={query.data.totalPages}
          onPageChange={(next) => updateQuery({ page: next })}
        />
      )}
    </div>
  );
}

// 검색어·필터·페이지를 URL 쿼리로 관리하므로 useSearchParams에 Suspense 경계가 필요하다 (CLAUDE.md 9장).
export default function TodosPage() {
  return (
    <Suspense fallback={null}>
      <TodosContent />
    </Suspense>
  );
}
