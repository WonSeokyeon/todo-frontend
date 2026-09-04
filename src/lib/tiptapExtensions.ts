import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

/**
 * 첨부 ID를 data-attachment-id로 왕복시키는 커스텀 이미지 노드 (CLAUDE.md 8장).
 *
 * 저장되는 HTML에는 src가 없고 data-attachment-id만 남는다(서버 Jsoup이 src를 제거한다).
 * 에디터 안에서는 화면 표시를 위해 src를 함께 들고 있다가, 저장 왕복 후 서버가 준
 * HTML에 다시 조회 URL을 주입해 그린다.
 */
export const AttachmentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes) =>
          attributes.attachmentId ? { "data-attachment-id": attributes.attachmentId } : {},
      },
    };
  },
});

/**
 * StarterKit 기본값을 그대로 쓰지 않는다. 툴바에 없는 서식(H1·취소선·구분선·밑줄)을
 * 입력 규칙으로도 만들지 않아야 저장 후 소실되는 버그를 막을 수 있다 (CLAUDE.md 8장).
 * v3의 StarterKit은 Link·Underline을 이미 포함하므로 별도 패키지를 설치하지 않는다.
 */
export function buildTiptapExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      strike: false,
      horizontalRule: false,
      underline: false,
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        protocols: ["http", "https", "mailto"],
      },
    }),
    AttachmentImage.configure({
      inline: false,
      // 클립보드 이미지를 그대로 붙이면 data: URI가 본문에 들어가 content 50,000자 제한을
      // 한 장으로 넘긴다. 게다가 정화가 src를 지우므로 이미지가 조용히 사라진다.
      // 붙여넣기는 handlePaste가 가로채 업로드 경로로 보낸다 (CLAUDE.md 8장).
      allowBase64: false,
    }),
  ];
}
