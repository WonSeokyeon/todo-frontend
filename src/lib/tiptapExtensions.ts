import StarterKit from "@tiptap/starter-kit";

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
  ];
}
