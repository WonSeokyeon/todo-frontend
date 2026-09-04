// 본문 HTML과 첨부 조회 URL을 잇는 헬퍼 (CLAUDE.md 6장).
//
// 저장되는 HTML에는 src가 없고 data-attachment-id만 있다. 화면에 그리려면 조회 URL을
// 주입해야 하는데, 순서가 중요하다 — 반드시 sanitizeHtml() 이후에 주입한다.
// 반대로 하면 방금 넣은 src를 DOMPurify가 지운다.

const ATTACHMENT_ID_ATTR = "data-attachment-id";

/**
 * 본문에서 첨부 ID를 수집한다. 조회 URL 일괄 요청에 쓴다.
 * 정화 전후 어느 쪽에 써도 되지만, 실제 사용은 서버가 준 HTML(=이미 정화된 것) 기준이다.
 */
export function collectAttachmentIds(html: string | null | undefined): number[] {
  // document를 쓰므로 클라이언트 전용이다. 프리렌더 중 호출되어도 터지지 않게 막는다.
  if (!html || typeof document === "undefined") return [];

  const template = document.createElement("template");
  template.innerHTML = html;

  const ids = new Set<number>();
  template.content.querySelectorAll(`img[${ATTACHMENT_ID_ATTR}]`).forEach((el) => {
    const raw = el.getAttribute(ATTACHMENT_ID_ATTR);
    const id = Number(raw);
    // 숫자가 아니거나 빈 값은 첨부로 취급하지 않는다.
    if (raw !== null && raw.trim() !== "" && Number.isInteger(id) && id > 0) {
      ids.add(id);
    }
  });
  return [...ids];
}

/**
 * 정화가 끝난 HTML의 img에 조회 URL을 주입한다.
 *
 * 반드시 sanitizeHtml() 이후에 호출한다. 문자열을 이어붙이지 않고 setAttribute로 넣으며,
 * URL 스킴도 확인한다 — 값이 우리 API에서 왔더라도 렌더 직전 방어를 유지한다.
 *
 * @param sanitizedHtml sanitizeHtml()을 거친 HTML
 * @param urlMap 첨부 ID → 조회 URL
 */
export function injectAttachmentSrc(sanitizedHtml: string, urlMap: Map<number, string>): string {
  if (!sanitizedHtml || typeof document === "undefined") return sanitizedHtml;

  const template = document.createElement("template");
  template.innerHTML = sanitizedHtml;

  template.content.querySelectorAll(`img[${ATTACHMENT_ID_ATTR}]`).forEach((el) => {
    const id = Number(el.getAttribute(ATTACHMENT_ID_ATTR));
    const url = urlMap.get(id);
    if (url && /^https?:\/\//i.test(url)) {
      el.setAttribute("src", url);
    }
  });

  return template.innerHTML;
}

/** 조회 URL 목록을 주입에 쓰기 좋은 Map으로 바꾼다. */
export function toUrlMap(items: { id: number; viewUrl: string }[]): Map<number, string> {
  return new Map(items.map((item) => [item.id, item.viewUrl]));
}
