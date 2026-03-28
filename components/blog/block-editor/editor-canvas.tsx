"use client"

// WordPress-style Block Editor Canvas Component
import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Image } from "@tiptap/extension-image"
import { Link } from "@tiptap/extension-link"
import { TextAlign } from "@tiptap/extension-text-align"
import { Underline } from "@tiptap/extension-underline"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { useCallback, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { FloatingToolbar } from "./floating-toolbar"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Plus,
  Type,
  Palette,
  Pilcrow,
  SeparatorHorizontal
} from "lucide-react"

interface EditorCanvasProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  onBlockSelect?: (blockType: string | null) => void
}

export function EditorCanvas({
  content,
  onChange,
  placeholder = "Start writing or type '/' to insert a block...",
  className,
  onBlockSelect
}: EditorCanvasProps) {
  const [activeBlock, setActiveBlock] = useState<{
    type: string
    attrs: Record<string, any>
    pos: { top: number; left: number }
  } | null>(null)
  const [showSlashMenu, setShowSlashMenu] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: "wp-block wp-block-heading block-editor-rich-text__editable"
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: "wp-block wp-block-paragraph block-editor-rich-text__editable"
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: "wp-block wp-block-quote"
          }
        },
        bulletList: {
          HTMLAttributes: {
            class: "wp-block wp-block-list"
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: "wp-block wp-block-list"
          }
        },
        codeBlock: {
          HTMLAttributes: {
            class: "wp-block wp-block-code"
          }
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "wp-block wp-block-separator"
          }
        }
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading"
          }
          return placeholder
        },
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty"
      }),
      Image.configure({
        HTMLAttributes: {
          class: "wp-block wp-block-image"
        },
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "rte-link"
        }
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Underline,
      Table.configure({
        HTMLAttributes: {
          class: "wp-block wp-block-table"
        },
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader,
      Color,
      TextStyle
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      // Update active block info for sidebar inspector
      const { from } = editor.state.selection
      const node = editor.state.doc.nodeAt(from)
      const resolvedPos = editor.state.doc.resolve(from)

      if (node) {
        const domNode = editor.view.nodeDOM(from) as HTMLElement
        if (domNode) {
          const rect = domNode.getBoundingClientRect()
          setActiveBlock({
            type: node.type.name,
            attrs: node.attrs,
            pos: { top: rect.top, left: rect.left }
          })
          // Notify parent about block selection
          onBlockSelect?.(node.type.name)
        }
      } else {
        // Check parent node
        const parent = resolvedPos.parent
        if (parent) {
          setActiveBlock({
            type: parent.type.name,
            attrs: parent.attrs,
            pos: { top: 0, left: 0 }
          })
          // Notify parent about block selection
          onBlockSelect?.(parent.type.name)
        }
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          "editor-styles-wrapper block-editor-writing-flow",
          "focus:outline-none min-h-[400px] p-4"
        ),
        "data-is-drop-zone": "true"
      },
      handleKeyDown: (view, event) => {
        if (event.key === "/" && !editor?.isActive("codeBlock")) {
          setShowSlashMenu(true)
          return false
        }
        if (event.key === "Escape") {
          setShowSlashMenu(false)
          return true
        }
        return false
      }
    }
  })

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "blog")

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (error) {
      console.error("Image upload failed:", error)
    }
  }, [editor])

  // Handle drag and drop
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (files?.length) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          handleImageUpload(file)
        }
      }
    }

    const editorElement = document.querySelector(".editor-styles-wrapper")
    if (editorElement) {
      editorElement.addEventListener("drop", handleDrop as EventListener)
      editorElement.addEventListener("dragover", (e) => e.preventDefault())
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener("drop", handleDrop as EventListener)
      }
    }
  }, [handleImageUpload])

  const insertBlock = useCallback((type: string) => {
    if (!editor) return

    setShowSlashMenu(false)

    switch (type) {
      case "heading1":
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case "heading2":
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case "heading3":
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
      case "paragraph":
        editor.chain().focus().setParagraph().run()
        break
      case "bulletList":
        editor.chain().focus().toggleBulletList().run()
        break
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run()
        break
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run()
        break
      case "codeBlock":
        editor.chain().focus().toggleCodeBlock().run()
        break
      case "horizontalRule":
        editor.chain().focus().setHorizontalRule().run()
        break
      case "table":
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        break
      case "image":
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) handleImageUpload(file)
        }
        input.click()
        break
    }
  }, [editor, handleImageUpload])

  const blockTypes = [
    { type: "heading1", label: "Heading 1", icon: Heading1, description: "Large section heading" },
    { type: "heading2", label: "Heading 2", icon: Heading2, description: "Medium section heading" },
    { type: "heading3", label: "Heading 3", icon: Heading3, description: "Small section heading" },
    { type: "paragraph", label: "Paragraph", icon: Pilcrow, description: "Plain text block" },
    { type: "bulletList", label: "Bullet List", icon: List, description: "Unordered list" },
    { type: "orderedList", label: "Numbered List", icon: ListOrdered, description: "Ordered list" },
    { type: "blockquote", label: "Quote", icon: Quote, description: "Quotation block" },
    { type: "codeBlock", label: "Code", icon: Code, description: "Code snippet" },
    { type: "image", label: "Image", icon: ImageIcon, description: "Upload or embed image" },
    { type: "table", label: "Table", icon: TableIcon, description: "Insert table" },
    { type: "horizontalRule", label: "Divider", icon: Minus, description: "Horizontal line" }
  ]

  if (!editor) return null

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Top Toolbar - Sticky */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-2 py-1.5 flex items-center gap-1 flex-wrap shadow-sm">
        {/* History */}
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Block Type Selector */}
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <select
            value={
              editor.isActive("heading", { level: 1 }) ? "h1" :
                editor.isActive("heading", { level: 2 }) ? "h2" :
                  editor.isActive("heading", { level: 3 }) ? "h3" :
                    editor.isActive("heading", { level: 4 }) ? "h4" :
                      editor.isActive("heading", { level: 5 }) ? "h5" :
                        editor.isActive("heading", { level: 6 }) ? "h6" :
                          "p"
            }
            onChange={(e) => {
              const value = e.target.value
              if (value === "p") {
                editor.chain().focus().setParagraph().run()
              } else {
                const level = parseInt(value.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
            className="text-sm bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("bold") && "bg-muted text-primary"
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("italic") && "bg-muted text-primary"
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("underline") && "bg-muted text-primary"
            )}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("strike") && "bg-muted text-primary"
            )}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive({ textAlign: "left" }) && "bg-muted text-primary"
            )}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive({ textAlign: "center" }) && "bg-muted text-primary"
            )}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive({ textAlign: "right" }) && "bg-muted text-primary"
            )}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive({ textAlign: "justify" }) && "bg-muted text-primary"
            )}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Blocks */}
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("bulletList") && "bg-muted text-primary"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("orderedList") && "bg-muted text-primary"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("blockquote") && "bg-muted text-primary"
            )}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("codeBlock") && "bg-muted text-primary"
            )}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        {/* Insert */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter link URL:")
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              editor.isActive("link") && "bg-muted text-primary"
            )}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertBlock("image")}
            className="p-1.5 rounded hover:bg-muted"
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertBlock("table")}
            className="p-1.5 rounded hover:bg-muted"
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-muted"
            title="Insert Divider"
          >
            <SeparatorHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Heading Buttons */}
        <div className="flex items-center border-l border-border pl-2 ml-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted text-xs font-semibold",
              editor.isActive("heading", { level: 3 }) && "bg-muted text-primary"
            )}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted text-xs font-semibold",
              editor.isActive("heading", { level: 4 }) && "bg-muted text-primary"
            )}
            title="Heading 4"
          >
            <Heading4 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="is-root-container is-desktop-preview is-layout-flow wp-block-post-content block-editor-block-list__layout max-w-4xl mx-auto py-8 px-6">
          <EditorContent editor={editor} />

          {/* Slash Menu */}
          {showSlashMenu && (
            <div className="fixed z-50 bg-card border border-border rounded-lg shadow-xl p-2 w-72 max-h-80 overflow-y-auto">
              <div className="text-xs text-muted-foreground px-2 py-1 mb-1">Insert block</div>
              {blockTypes.map((block) => (
                <button
                  key={block.type}
                  type="button"
                  onClick={() => insertBlock(block.type)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <block.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{block.label}</div>
                    <div className="text-xs text-muted-foreground">{block.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
