// 백엔드 `com.example.todoapp.dto`의 record와 1:1로 맞춘다 (CLAUDE.md 10장).

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface TodoResponse {
  id: number;
  title: string;
  content: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null; // yyyy-MM-dd
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
}

export interface TodoCreateRequest {
  title: string;
  content: string;
  priority: Priority;
  dueDate: string | null;
}

/** completed는 포함하지 않는다 — toggle 엔드포인트로만 바꾼다 (CLAUDE.md 5장). */
export interface TodoUpdateRequest {
  title: string;
  content: string;
  priority: Priority;
  dueDate: string | null;
}

export interface TodoListParams {
  page: number;
  size: number;
  completed?: boolean;
  keyword?: string;
}
