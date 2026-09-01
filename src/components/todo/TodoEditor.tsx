"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  SquareCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildTiptapExtensions } from "@/lib/tiptapExtensions";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

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

function Toolbar({ editor }: { editor: Editor }) {
  function toggleLink() {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("링크 URL을 입력하세요");
    if (!url) return;
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
    </div>
  );
}

export function TodoEditor({ content, onChange, onReady }: TodoEditorProps) {
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
        class: cn(
          "min-h-40 px-3 py-2 text-sm focus:outline-none",
          "[&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5",
          "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        ),
      },
    },
  });

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input")}>
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
