"use client"

import type { Editor } from "@tiptap/core"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Code,
  ChevronDown,
  Highlighter,
  Type,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Minus,
  Maximize2,
  Minimize2,
  ImageIcon,
  RectangleHorizontal
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface FloatingToolbarProps {
  editor: Editor
  position: { top: number; left: number }
  blockType: string
}

export function FloatingToolbar({ editor, position, blockType }: FloatingToolbarProps) {
  const [showTransformMenu, setShowTransformMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowTransformMenu(false)
        setShowSizeMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const transformOptions = [
    { type: "paragraph", label: "Paragraph", icon: Type },
    { type: "heading1", label: "Heading 1", icon: Heading1 },
    { type: "heading2", label: "Heading 2", icon: Heading2 },
    { type: "heading3", label: "Heading 3", icon: Heading3 },
    { type: "heading4", label: "Heading 4", icon: Heading4 },
    { type: "heading5", label: "Heading 5", icon: Heading5 },
    { type: "heading6", label: "Heading 6", icon: Heading6 },
    { type: "divider", label: "Divider", icon: Minus, divider: true },
    { type: "bulletList", label: "Bullet List", icon: List },
    { type: "orderedList", label: "Numbered List", icon: ListOrdered },
    { type: "blockquote", label: "Quote", icon: Quote },
    { type: "codeBlock", label: "Code", icon: Code },
    { type: "horizontalRule", label: "Horizontal Line", icon: RectangleHorizontal }
  ]

  const imageSizeOptions = [
    { size: "small", label: "Small (25%)", width: "25%" },
    { size: "medium", label: "Medium (50%)", width: "50%" },
    { size: "large", label: "Large (75%)", width: "75%" },
    { size: "full", label: "Full Width (100%)", width: "100%" },
    { size: "original", label: "Original Size", width: "auto" }
  ]

  const handleTransform = (type: string) => {
    switch (type) {
      case "paragraph":
        editor.chain().focus().setParagraph().run()
        break
      case "heading1":
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case "heading2":
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case "heading3":
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
      case "heading4":
        editor.chain().focus().toggleHeading({ level: 4 }).run()
        break
      case "heading5":
        editor.chain().focus().toggleHeading({ level: 5 }).run()
        break
      case "heading6":
        editor.chain().focus().toggleHeading({ level: 6 }).run()
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
    }
    setShowTransformMenu(false)
  }

  const handleImageSize = (width: string) => {
    // Update image size by modifying its style
    const { state } = editor
    const { from } = state.selection
    
    editor.chain().focus().updateAttributes("image", { 
      style: width === "auto" ? "" : `width: ${width}; max-width: 100%;`
    }).run()
    
    setShowSizeMenu(false)
  }

  const getCurrentBlockLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1"
    if (editor.isActive("heading", { level: 2 })) return "Heading 2"
    if (editor.isActive("heading", { level: 3 })) return "Heading 3"
    if (editor.isActive("heading", { level: 4 })) return "Heading 4"
    if (editor.isActive("heading", { level: 5 })) return "Heading 5"
    if (editor.isActive("heading", { level: 6 })) return "Heading 6"
    if (editor.isActive("bulletList")) return "Bullet List"
    if (editor.isActive("orderedList")) return "Numbered List"
    if (editor.isActive("blockquote")) return "Quote"
    if (editor.isActive("codeBlock")) return "Code"
    if (editor.isActive("horizontalRule")) return "Divider"
    return "Paragraph"
  }

  // Text block toolbar
  if (["paragraph", "heading", "text"].includes(blockType) || blockType.startsWith("heading")) {
    return (
      <div 
        ref={toolbarRef}
        className="absolute z-50 bg-card border border-border rounded-lg shadow-xl flex items-center"
        style={{ 
          top: position.top - 50,
          left: position.left,
          transform: "translateY(-100%)"
        }}
      >
        {/* Block Type Selector */}
        <div className="relative border-r border-border">
          <button
            type="button"
            onClick={() => setShowTransformMenu(!showTransformMenu)}
            className="flex items-center gap-1 px-3 py-2 hover:bg-muted text-sm font-medium"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">{getCurrentBlockLabel()}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showTransformMenu && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl py-1 w-52 z-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                Transform to
              </div>
              {transformOptions.map((option, index) => (
                <div key={option.type}>
                  {option.divider && index > 0 && (
                    <div className="my-1 border-t border-border" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleTransform(option.type)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm text-left",
                      getCurrentBlockLabel() === option.label && "bg-muted"
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formatting Options */}
        <div className="flex items-center px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("bold") && "bg-primary/10 text-primary"
            )}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("italic") && "bg-primary/10 text-primary"
            )}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("underline") && "bg-primary/10 text-primary"
            )}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("strike") && "bg-primary/10 text-primary"
            )}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter link URL:")
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("link") && "bg-primary/10 text-primary"
            )}
            title="Add Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive("highlight") && "bg-primary/10 text-primary"
            )}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive({ textAlign: "left" }) && "bg-primary/10 text-primary"
            )}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive({ textAlign: "center" }) && "bg-primary/10 text-primary"
            )}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              "p-2 rounded hover:bg-muted",
              editor.isActive({ textAlign: "right" }) && "bg-primary/10 text-primary"
            )}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Quick Heading Buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "p-2 rounded hover:bg-muted text-xs font-bold",
              editor.isActive("heading", { level: 3 }) && "bg-primary/10 text-primary"
            )}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(
              "p-2 rounded hover:bg-muted text-xs font-bold",
              editor.isActive("heading", { level: 4 }) && "bg-primary/10 text-primary"
            )}
            title="Heading 4"
          >
            <Heading4 className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Insert Divider */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-muted"
            title="Insert Divider"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Block Actions */}
        <div className="flex items-center border-l border-border px-1">
          <button
            type="button"
            onClick={() => {
              // Move block up - would need more complex logic
            }}
            className="p-2 rounded hover:bg-muted"
            title="Move Up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              // Move block down - would need more complex logic
            }}
            className="p-2 rounded hover:bg-muted"
            title="Move Down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              // Copy block
              const selection = editor.state.selection
              const text = editor.state.doc.textBetween(selection.from, selection.to)
              navigator.clipboard.writeText(text)
            }}
            className="p-2 rounded hover:bg-muted"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteSelection().run()
            }}
            className="p-2 rounded hover:bg-muted text-destructive"
            title="Delete Block"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Image block toolbar
  if (blockType === "image") {
    return (
      <div 
        ref={toolbarRef}
        className="absolute z-50 bg-card border border-border rounded-lg shadow-xl flex items-center p-1"
        style={{ 
          top: position.top - 50,
          left: position.left,
          transform: "translateY(-100%)"
        }}
      >
        {/* Image Size Selector */}
        <div className="relative border-r border-border pr-1 mr-1">
          <button
            type="button"
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted text-sm font-medium rounded"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Size</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl py-1 w-48 z-50">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                Image Size
              </div>
              {imageSizeOptions.map((option) => (
                <button
                  key={option.size}
                  type="button"
                  onClick={() => handleImageSize(option.width)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm text-left"
                >
                  {option.size === "small" && <Minimize2 className="h-4 w-4" />}
                  {option.size === "medium" && <ImageIcon className="h-4 w-4" />}
                  {option.size === "large" && <Maximize2 className="h-4 w-4" />}
                  {option.size === "full" && <RectangleHorizontal className="h-4 w-4" />}
                  {option.size === "original" && <ImageIcon className="h-4 w-4" />}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="p-2 rounded hover:bg-muted"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="p-2 rounded hover:bg-muted"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="p-2 rounded hover:bg-muted"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Replace Image */}
        <button
          type="button"
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/*"
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
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
                } catch (err) {
                  console.error("Failed to upload image:", err)
                }
              }
            }
            input.click()
          }}
          className="p-2 rounded hover:bg-muted text-sm flex items-center gap-1"
          title="Replace Image"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Replace</span>
        </button>

        {/* Add Caption - placeholder */}
        <button
          type="button"
          onClick={() => {
            const caption = window.prompt("Enter image caption:")
            if (caption) {
              editor.chain().focus().updateAttributes("image", { alt: caption, title: caption }).run()
            }
          }}
          className="p-2 rounded hover:bg-muted text-sm"
          title="Add Caption"
        >
          <Type className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="p-2 rounded hover:bg-muted text-destructive"
          title="Delete Image"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return null
}
