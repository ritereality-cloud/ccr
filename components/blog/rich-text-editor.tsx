"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { EditorToolbar } from "./editor-toolbar"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    // Prevents SSR hydration mismatch in Next.js
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        // codeBlock and horizontalRule are included in StarterKit by default
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rte-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "rte-link",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your blog content here…",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Underline,
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],

    content,

    editorProps: {
      attributes: {
        class: "rte-content",
        spellcheck: "true",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Compute word & character counts from plain text
  const text = editor?.getText() ?? ""
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = text.length

  if (!editor) return null

  return (
    <div className="border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring/30 transition-shadow relative flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      {/* Toolbar - fixed at top */}
      <div className="flex-shrink-0">
        <EditorToolbar editor={editor} />
      </div>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      {/* Status bar - fixed at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1 border-t border-border bg-muted/20 text-xs text-muted-foreground select-none">
        <span>Rich Text Editor</span>
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          <span className="text-border">·</span>
          <span>{charCount} {charCount === 1 ? "character" : "characters"}</span>
        </div>
      </div>
    </div>
  )
}
