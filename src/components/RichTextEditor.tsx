"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";

export type RichTextEditorHandle = {
  insertPlaceholder: (value: string) => void;
};

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, placeholder }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ],
      content: value || `<p></p>`,
      editorProps: {
        attributes: {
          class: "tiptap-page min-h-[1123px] w-full text-zinc-900 focus:outline-none",
          style: "padding: 91px 61px 76px 61px; font-family: 'Times New Roman', Times, serif;",
          "data-placeholder": placeholder ?? "",
        },
      },
      onUpdate({ editor }) {
        onChange(editor.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      insertPlaceholder(value: string) {
        editor?.chain().focus().insertContent(`{{${value}}}`).run();
      },
    }));

    if (!editor) return null;

    const isHeading = (level: number) => editor.isActive("heading", { level });
    const headingValue = isHeading(1) ? "h1" : isHeading(2) ? "h2" : isHeading(3) ? "h3" : "p";

    return (
      <div className="flex flex-col rounded-xl border border-zinc-200 shadow-sm bg-white">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[57px] z-10 rounded-t-xl">

          <div className="relative">
            <select
              value={headingValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "p") editor.chain().focus().setParagraph().run();
                else editor.chain().focus().setHeading({ level: Number(v.replace("h", "")) as 1 | 2 | 3 }).run();
              }}
              className="appearance-none bg-white border border-zinc-200 text-xs text-zinc-700 rounded-md px-2.5 py-1.5 pr-6 focus:outline-none hover:border-zinc-300 cursor-pointer font-medium"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
            <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <Divider />

          <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 11.8c.9-.6 1.5-1.6 1.5-2.8C17.1 6.4 15.2 5 13 5H7v14h6.4c2.3 0 4.1-1.8 4.1-4.1 0-1.6-.9-3-2.9-3.1zM10 7.5h2.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H10V7.5zm3 9H10v-3h3c.8 0 1.5.7 1.5 1.5S13.8 16.5 13 16.5z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 .49 3.9 1.28.77.65 1.46 1.73 1.46 3.24h-3.01c0-.31-.05-.59-.15-.85-.29-.86-1.2-1.28-2.25-1.28-1.86 0-2.34.9-2.34 1.6 0 .47.2.82.45 1.08H6.85v-.99zM21 12v-2H3v2h9.62c1.15.45 1.96.9 1.96 1.97 0 1-.81 1.67-2.28 1.67-1.54 0-2.93-.68-2.93-2.51H6.4c0 3.26 2.35 4.87 5.2 4.87 2.75 0 5.3-1.61 5.3-4.58 0-.35-.04-.68-.11-.99H21z"/></svg>
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-8v2h14V3H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
          </ToolbarBtn>

          <Divider />

          <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
          </ToolbarBtn>
        </div>

        {/* Editor — A4 document on gray desktop */}
        <div className="bg-[#c8c8c8] py-10 px-8 rounded-b-xl">
          <div
            className="mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            style={{ maxWidth: 794 }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);

export default RichTextEditor;

function ToolbarBtn({ children, active, onClick, title }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
        active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-zinc-200 mx-0.5" />;
}
