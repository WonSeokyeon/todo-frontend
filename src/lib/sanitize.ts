import DOMPurify from "dompurify";

// Jsoup(백엔드)과 반드시 동일한 태그 집합을 유지한다 (CLAUDE.md 6장, 8장).
// 기본값보다 훨씬 넓으므로(table, u, h1 등) 명시적으로 좁힌다.
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
  "img",
];

// target·rel을 빼면 백엔드가 강제 주입한 rel="noopener noreferrer"가 렌더 단계에서 지워진다.
// img에는 src를 허용하지 않는다 — 만료되는 조회 URL이 본문에 남지 않게 하고,
// 임의 외부 URL 삽입도 원천 차단한다. 표시용 src는 정화가 끝난 뒤 주입한다
// (lib/attachmentHtml.ts의 injectAttachmentSrc, CLAUDE.md 6장).
const ALLOWED_ATTR = ["href", "target", "rel", "data-attachment-id", "alt"];

/**
 * 서버에서 받은 Todo 본문 HTML을 렌더링 직전에 반드시 거친다 (CLAUDE.md 6장).
 * 적용 지점 둘: 에디터 주입 직전(TodoEditor.tsx)과
 * 읽기 전용 확인 화면의 dangerouslySetInnerHTML(/todos/[id]/page.tsx).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // 명시한 data-attachment-id 하나만 통과시킨다. 기본값(true)이면 임의 data-* 가 다 통과한다.
    ALLOW_DATA_ATTR: false,
  });
}
