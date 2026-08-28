import DOMPurify from "dompurify";

// Jsoup(백엔드)과 반드시 동일한 태그 집합을 유지한다 (CLAUDE.md 6장, 8장).
// 기본값보다 훨씬 넓으므로(img, table, u, h1 등) 명시적으로 좁힌다.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "blockquote",
];

// target·rel을 빼면 백엔드가 강제 주입한 rel="noopener noreferrer"가 렌더 단계에서 지워진다.
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * 서버에서 받은 Todo 본문 HTML을 Tiptap 에디터에 주입하기 직전에 반드시 거친다
 * (editor.commands.setContent(sanitizeHtml(todo.content)) — CLAUDE.md 6장).
 * 이 앱에는 dangerouslySetInnerHTML 호출 지점이 없으므로 적용 지점은 여기뿐이다.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
