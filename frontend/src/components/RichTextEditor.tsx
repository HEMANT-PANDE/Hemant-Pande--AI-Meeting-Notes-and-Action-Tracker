"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Heading2, List, ListOrdered, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

// Thin wrapper around Tiptap covering the spec's "basic formatting" list:
// headings, bold, italic, lists, links. Kept intentionally small — the spec
// explicitly warns against over-investing in a custom editor.
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  editable = true,
  minHeight = "8rem",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content",
        style: `min-height: ${minHeight}`,
        "aria-label": placeholder ?? "Rich text editor",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
          <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => {
              const url = window.prompt("Link URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-muted hover:bg-border/50 hover:text-foreground",
        active && "bg-primary/15 text-primary"
      )}
    >
      {children}
    </button>
  );
}
