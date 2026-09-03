/**
 * 허용 태그(sanitize.ts)에 맞춘 최소 타이포그래피 스타일. 편집 중(TodoEditor)과
 * 읽기 전용 화면(/todos/[id]) 양쪽에서 같은 결과물이 같은 모양으로 보이도록 공유한다.
 *
 * tiptapExtensions.ts가 아니라 별도 파일에 둔다 — 거기 두면 이 상수를 쓰려고 import할 때
 * StarterKit(ProseMirror 포함, 200kB+)까지 같은 모듈로 묶여 읽기 전용 화면 번들에 그대로
 * 딸려 들어간다(실측: /todos/[id] 첫 로드 JS가 200kB→280kB로 뛰는 것으로 확인).
 */
export const RICH_TEXT_CONTENT_CLASS =
  "[&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4";
