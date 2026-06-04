"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";

// Custom FontSize extension
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: () => any }) =>
        chain().setMark("textStyle", { fontSize: size }).run(),
    } as any;
  },
});

// Custom LineHeight extension
const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading"],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: el => el.style.lineHeight || null,
          renderHTML: attrs => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: { commands: any }) =>
        commands.updateAttributes("paragraph", { lineHeight }),
    } as any;
  },
});

export type RichTextEditorHandle = {
  insertPlaceholder: (value: string) => void;
};

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"];
const FONT_FAMILIES = [
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];
const LINE_HEIGHTS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
];
const COLORS = [
  "#000000", "#1f2937", "#6B7280", "#ffffff",
  "#DC2626", "#D97706", "#16A34A", "#2563EB",
  "#7C3AED", "#DB2777", "#0891B2", "#065F46",
];

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, placeholder }, ref) {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        LineHeight,
      ],
      content: value || `<p></p>`,
      editorProps: {
        attributes: {
          class: "tiptap-page min-h-[1123px] w-full text-zinc-900 focus:outline-none",
          style: "padding: 91px 61px 76px 61px; font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.6;",
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
    }), [editor]);

    if (!editor) return null;

    const isHeading = (level: number) => editor.isActive("heading", { level });
    const headingValue = isHeading(1) ? "h1" : isHeading(2) ? "h2" : isHeading(3) ? "h3" : "p";
    const currentColor = (editor.getAttributes("textStyle").color as string) || "#000000";

    return (
      <div className="flex flex-col shadow-sm bg-white" style={{ borderRadius: 12, border: "1px solid #e4e4e7" }}>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10" style={{ borderRadius: "12px 12px 0 0" }}>

          {/* Heading */}
          <Select
            value={headingValue}
            onChange={(v) => {
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().setHeading({ level: Number(v.replace("h", "")) as 1 | 2 | 3 }).run();
            }}
            options={[
              { label: "Paragraph", value: "p" },
              { label: "Heading 1", value: "h1" },
              { label: "Heading 2", value: "h2" },
              { label: "Heading 3", value: "h3" },
            ]}
            width="w-[108px]"
          />

          <Divider />

          {/* Font family */}
          <Select
            value={editor.getAttributes("textStyle").fontFamily || "'Times New Roman', Times, serif"}
            onChange={(v) => editor.chain().focus().setFontFamily(v).run()}
            options={FONT_FAMILIES.map(f => ({ label: f.label, value: f.value }))}
            width="w-[130px]"
          />

          <Divider />

          {/* Font size */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                const cur = parseInt(editor.getAttributes("textStyle").fontSize || "16");
                const idx = FONT_SIZES.indexOf(String(cur));
                if (idx > 0) (editor.chain().focus() as any).setFontSize(`${FONT_SIZES[idx - 1]}px`).run();
              }}
              className="w-5 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded text-sm"
            >−</button>
            <span className="text-xs text-zinc-700 font-medium w-7 text-center tabular-nums">
              {parseInt(editor.getAttributes("textStyle").fontSize || "16")}
            </span>
            <button
              type="button"
              onClick={() => {
                const cur = parseInt(editor.getAttributes("textStyle").fontSize || "16");
                const idx = FONT_SIZES.indexOf(String(cur));
                if (idx < FONT_SIZES.length - 1) (editor.chain().focus() as any).setFontSize(`${FONT_SIZES[idx + 1]}px`).run();
              }}
              className="w-5 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded text-sm"
            >+</button>
          </div>

          <Divider />

          {/* Line height */}
          <Select
            value="1.5"
            onChange={(v) => (editor.chain().focus() as any).setLineHeight(v).run()}
            options={LINE_HEIGHTS.map(l => ({ label: `↕ ${l.label}`, value: l.value }))}
            width="w-[76px]"
          />

          <Divider />

          {/* Text color */}
          <div className="relative" ref={colorRef}>
            <button
              type="button"
              title="Teksto spalva"
              onClick={() => setShowColorPicker(p => !p)}
              className="w-7 h-7 flex flex-col items-center justify-center rounded-md hover:bg-zinc-100 transition-all gap-0.5"
            >
              <span className="text-xs font-bold text-zinc-700 leading-none">A</span>
              <span className="w-4 h-1 rounded-sm" style={{ backgroundColor: currentColor }} />
            </button>
            {showColorPicker && (
              <div className="absolute top-9 left-0 z-50 bg-white border border-zinc-200 rounded-lg shadow-xl p-2 w-[108px]">
                <div className="grid grid-cols-4 gap-5 mb-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                      className="w-6 h-6 rounded hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: c,
                        border: c === "#ffffff" ? "1px solid #d1d5db" : "1px solid transparent",
                        boxShadow: currentColor === c ? "0 0 0 2px #3b82f6" : undefined,
                      }}
                      title={c}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="w-full text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors py-0.5 border-t border-zinc-100 pt-1.5"
                >
                  Numatytoji spalva
                </button>
              </div>
            )}
          </div>

          <Divider />

          {/* Bold / Italic / Underline / Strike */}
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

          {/* Alignment */}
          <ToolbarBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Kairė">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centras">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Dešinė">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Lygiuoti">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zM3 3v2h18V3H3z"/></svg>
          </ToolbarBtn>

          <Divider />

          {/* Lists */}
          <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Sąrašas">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Sunumeruotas">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-8v2h14V3H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
          </ToolbarBtn>

          <Divider />

          {/* Undo / Redo */}
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Atšaukti">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Grąžinti">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
          </ToolbarBtn>
        </div>

        {/* Editor */}
        <div className="bg-[#c8c8c8] py-10 px-8" style={{ borderRadius: "0 0 12px 12px" }}>
          <div className="mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.35)]" style={{ maxWidth: 794 }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);

export default RichTextEditor;

function Select({ value, onChange, options, width }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  width: string;
}) {
  return (
    <div className={`relative ${width}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-zinc-200 text-xs text-zinc-700 rounded-md px-2.5 py-1.5 pr-5 focus:outline-none hover:border-zinc-300 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

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
