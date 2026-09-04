"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  SquareCode,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadAttachment } from "@/hooks/useAttachments";
import { RICH_TEXT_CONTENT_CLASS } from "@/lib/richTextContentClass";
import { buildTiptapExtensions } from "@/lib/tiptapExtensions";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/validation";

/**
 * 삽입된 임시 이미지 노드를 blob URL로 찾아 콜백에 넘긴다.
 * 업로드가 끝나는 시점에는 사용자가 이미 커서를 옮겼을 수 있어, 위치가 아니라 src로 찾는다.
 */
function withImageNode(
  editor: Editor,
  blobUrl: string,
  handler: (pos: number, node: { nodeSize: number; attrs: Record<string, unknown> }) => void,
): void {
  let done = false;
  editor.state.doc.descendants((node, pos) => {
    if (done) return false;
    if (node.type.name === "image" && node.attrs.src === blobUrl) {
      done = true;
      handler(pos, node);
      return false;
    }
    return true;
  });
}

/**
 * 이미지를 즉시 미리보기로 넣고, 업로드가 끝나면 실제 URL과 첨부 ID로 교체한다.
 * 실패하면 넣었던 노드를 지우고 토스트로 알린다.
 */
async function insertImage(editor: Editor, file: File): Promise<void> {
  const message = validateImageFile(file);
  if (message) {
    toast.error(message);
    return;
  }

  // 업로드를 기다리지 않고 먼저 그린다. 사용자는 즉시 반응을 본다.
  const blobUrl = URL.createObjectURL(file);
  editor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run();

  try {
    const { attachmentId, viewUrl } = await uploadAttachment(file);
    // await 사이에 화면을 벗어났을 수 있다.
    if (editor.isDestroyed) return;

    withImageNode(editor, blobUrl, (pos, node) => {
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          src: viewUrl,
          attachmentId,
        }),
      );
    });
  } catch (error) {
    if (!editor.isDestroyed) {
      withImageNode(editor, blobUrl, (pos, node) => {
        editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
      });
    }
    toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** 파일 목록에서 이미지만 골라 순서대로 업로드한다. */
function uploadImageFiles(editor: Editor, files: FileList | File[]): boolean {
  const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (images.length === 0) return false;

  images.forEach((file) => void insertImage(editor, file));
  return true;
}

interface TodoEditorProps {
  content: string;
  onChange: (html: string) => void;
  /**
   * 에디터 생성 직후(=Tiptap이 content를 자기 스키마로 정규화한 결과)를 알려준다.
   * dirty 판정의 초기 스냅샷은 서버 원본이 아니라 이 값으로 잡아야 한다 — 그러지 않으면
   * 사용자가 아무것도 고치지 않아도 정규화 차이 때문에 dirty로 오판된다 (CLAUDE.md 8장).
   */
  onReady?: (html: string) => void;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "secondary" : "ghost"}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  function toggleLink() {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("링크 URL을 입력하세요");
    if (!url) return;
    // setLink는 마크 명령이라 선택된 텍스트가 없으면(커서만 있으면) 화면에 아무 변화도
    // 없이 "다음 입력에 적용될 마크"로만 저장된다 — 링크가 눈에 안 보여 안 되는 것처럼
    // 느껴지는 원인. 선택이 없을 때는 URL 자체를 링크 텍스트로 삽입한다.
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] })
        .run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
      <ToolbarButton
        label="굵게"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="기울임"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="제목 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="제목 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="불릿 목록"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="번호 목록"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="링크" active={editor.isActive("link")} onClick={toggleLink}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="인라인 코드"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="코드 블록"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="인용"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="이미지" active={false} onClick={onPickImage}>
        <ImageIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function TodoEditor({ content, onChange, onReady }: TodoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // handlePaste·handleDrop은 useEditor가 반환하기 전에 정의되므로 editor를 직접 참조할 수 없다.
  // 콜백이 실제로 호출되는 시점에는 이미 채워져 있다.
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: buildTiptapExtensions(),
    content: sanitizeHtml(content),
    // Next.js SSR과 함께 쓸 때 하이드레이션 시점 렌더링을 막아 불일치를 방지한다 (Tiptap 공식 권장).
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      // content state도 정규화된 값으로 맞춰야 최초 스냅샷(baseline)과 즉시 일치한다.
      // 그러지 않으면 서버 원본("")과 Tiptap 정규화 결과("<p></p>" 등)가 달라 dirty로 오판된다.
      const html = editor.getHTML();
      onChange(html);
      onReady?.(html);
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // @tailwindcss/typography 없이, 허용된 태그(sanitize.ts)에 맞춘 최소 스타일만 직접 지정한다.
        class: cn("min-h-40 px-3 py-2 text-sm focus:outline-none", RICH_TEXT_CONTENT_CLASS),
      },
      // 클립보드 이미지를 가로챈다. 그냥 두면 base64 data URI가 본문에 들어가
      // content 50,000자 제한을 넘기고, 정화가 src를 지워 이미지가 조용히 사라진다.
      handlePaste: (_view, event) => {
        const current = editorRef.current;
        const files = event.clipboardData?.files;
        if (!current || !files || files.length === 0) return false;
        // true를 반환하면 Tiptap 기본 붙여넣기가 실행되지 않는다.
        return uploadImageFiles(current, files);
      },
      handleDrop: (_view, event) => {
        const current = editorRef.current;
        const files = (event as DragEvent).dataTransfer?.files;
        if (!current || !files || files.length === 0) return false;
        return uploadImageFiles(current, files);
      },
    },
  });

  editorRef.current = editor;

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && editor) {
      uploadImageFiles(editor, files);
    }
    // 같은 파일을 연속으로 고를 수 있도록 값을 비운다.
    event.target.value = "";
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input")}>
      {editor && <Toolbar editor={editor} onPickImage={() => fileInputRef.current?.click()} />}
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
    </div>
  );
}
