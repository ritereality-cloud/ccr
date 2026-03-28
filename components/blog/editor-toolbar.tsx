"use client"

import type React from "react"
import { useState, useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  Link2,
  Link2Off,
  TableIcon,
  Code,
  Code2,
  Minus,
  Eraser,
  Palette,
  ChevronDown,
  Trash2,
  Upload,
  SeparatorHorizontal,
} from "lucide-react"

// ─── Reusable toolbar primitives ────────────────────────────────────────────

interface ToggleButtonProps {
  tooltip: string
  pressed: boolean
  onToggle: () => void
  disabled?: boolean
  children: React.ReactNode
}

function ToggleButton({ tooltip, pressed, onToggle, disabled, children }: ToggleButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onToggle}
          disabled={disabled}
          aria-label={tooltip}
          type="button"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

interface ActionButtonProps {
  tooltip: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function ActionButton({ tooltip, onClick, disabled, children }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          type="button"
          className="h-8 w-8 px-0"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="h-6 mx-0.5" />
}

// ─── Link Popover ────────────────────────────────────────────────────────────

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const hasLink = editor.isActive("link")

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setUrl(editor.getAttributes("link").href || "")
    setOpen(isOpen)
  }

  const handleInsert = useCallback(() => {
    if (!url.trim()) return
    const href = url.startsWith("http") ? url : `https://${url}`
    editor.chain().focus().setLink({ href, target: "_blank" }).run()
    setOpen(false)
    setUrl("")
  }, [editor, url])

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    setOpen(false)
  }, [editor])

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={hasLink} aria-label="Insert link" type="button">
              <Link2 size={15} />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Link</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72" align="start" sideOffset={6}>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Insert Link</p>
          <div className="space-y-1.5">
            <Label htmlFor="rte-link-url" className="text-xs">
              URL
            </Label>
            <Input
              id="rte-link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleInsert()
                }
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInsert} disabled={!url.trim()} className="flex-1">
              {hasLink ? "Update Link" : "Insert Link"}
            </Button>
            {hasLink && (
              <Button size="sm" variant="outline" onClick={handleRemove} aria-label="Remove link">
                <LinkOff size={14} />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Image Popover ───────────────────────────────────────────────────────────

function ImagePopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleInsertUrl = useCallback(() => {
    if (!url.trim()) return
    editor.chain().focus().setImage({ src: url.trim(), alt }).run()
    setOpen(false)
    setUrl("")
    setAlt("")
  }, [editor, url, alt])

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "blog")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
          setOpen(false)
        }
      } catch (err) {
        console.error("Image upload failed:", err)
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    [editor],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Insert image"
              type="button"
              className="h-8 w-8 px-0"
            >
              <ImageIcon size={15} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Image</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="start" sideOffset={6}>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Insert Image</p>

          {/* URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">Image URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleInsertUrl()
                  }
                }}
                className="h-8 text-sm flex-1"
              />
              <Button size="sm" onClick={handleInsertUrl} disabled={!url.trim()}>
                Insert
              </Button>
            </div>
          </div>

          {/* Alt text */}
          <div className="space-y-1.5">
            <Label className="text-xs">Alt Text</Label>
            <Input
              placeholder="Describe the image..."
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <Separator className="flex-1" />
            <span className="px-2 text-xs text-muted-foreground">or upload</span>
            <Separator className="flex-1" />
          </div>

          {/* Upload */}
          <label className="flex items-center justify-center gap-2 px-3 py-3 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {uploading ? "Uploading…" : "Click to upload image"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Table Dropdown ──────────────────────────────────────────────────────────

function TableMenu({ editor }: { editor: Editor }) {
  const inTable = editor.isActive("table")

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Toggle size="sm" pressed={inTable} aria-label="Table options" type="button" className="gap-0.5">
              <TableIcon size={15} />
              <ChevronDown size={10} />
            </Toggle>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Table</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon size={14} className="mr-2" />
          Insert Table
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowBefore().run()}
          disabled={!inTable}
        >
          Add Row Above
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!inTable}
        >
          Add Row Below
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!inTable}
        >
          Delete Row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          disabled={!inTable}
        >
          Add Column Before
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!inTable}
        >
          Add Column After
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!inTable}
        >
          Delete Column
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!inTable}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 size={14} className="mr-2" />
          Delete Table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Color Picker ────────────────────────────────────────────────────────────

function ColorPickerButton({ editor }: { editor: Editor }) {
  const currentColor = (editor.getAttributes("textStyle").color as string) || "#000000"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label
          className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted cursor-pointer transition-colors"
          aria-label="Text color"
        >
          <Palette size={15} />
          <span
            className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full"
            style={{ backgroundColor: currentColor }}
          />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="sr-only"
          />
        </label>
      </TooltipTrigger>
      <TooltipContent side="bottom">Text Color</TooltipContent>
    </Tooltip>
  )
}

// ─── Main Toolbar ────────────────────────────────────────────────────────────

export function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-card shadow-sm">
      {/* History */}
      <ActionButton
        tooltip="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo size={15} />
      </ActionButton>
      <ActionButton
        tooltip="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo size={15} />
      </ActionButton>

      <ToolbarSeparator />

      {/* Inline Marks */}
      <ToggleButton
        tooltip="Bold (Ctrl+B)"
        pressed={editor.isActive("bold")}
        onToggle={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Italic (Ctrl+I)"
        pressed={editor.isActive("italic")}
        onToggle={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Underline (Ctrl+U)"
        pressed={editor.isActive("underline")}
        onToggle={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Strikethrough"
        pressed={editor.isActive("strike")}
        onToggle={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Inline Code (Ctrl+E)"
        pressed={editor.isActive("code")}
        onToggle={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={15} />
      </ToggleButton>
      <ColorPickerButton editor={editor} />

      <ToolbarSeparator />

      {/* Headings */}
      <ToggleButton
        tooltip="Heading 1"
        pressed={editor.isActive("heading", { level: 1 })}
        onToggle={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Heading 2"
        pressed={editor.isActive("heading", { level: 2 })}
        onToggle={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Heading 3"
        pressed={editor.isActive("heading", { level: 3 })}
        onToggle={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Heading 4"
        pressed={editor.isActive("heading", { level: 4 })}
        onToggle={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        <Heading4 size={15} />
      </ToggleButton>

      <ToolbarSeparator />

      {/* Blocks */}
      <ToggleButton
        tooltip="Bullet List"
        pressed={editor.isActive("bulletList")}
        onToggle={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Ordered List"
        pressed={editor.isActive("orderedList")}
        onToggle={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Blockquote"
        pressed={editor.isActive("blockquote")}
        onToggle={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Code Block"
        pressed={editor.isActive("codeBlock")}
        onToggle={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 size={15} />
      </ToggleButton>

      <ToolbarSeparator />

      {/* Alignment */}
      <ToggleButton
        tooltip="Align Left"
        pressed={editor.isActive({ textAlign: "left" })}
        onToggle={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Align Center"
        pressed={editor.isActive({ textAlign: "center" })}
        onToggle={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Align Right"
        pressed={editor.isActive({ textAlign: "right" })}
        onToggle={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={15} />
      </ToggleButton>
      <ToggleButton
        tooltip="Justify"
        pressed={editor.isActive({ textAlign: "justify" })}
        onToggle={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify size={15} />
      </ToggleButton>

      <ToolbarSeparator />

      {/* Horizontal Rule / Divider */}
      <ActionButton
        tooltip="Insert Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <SeparatorHorizontal size={15} />
      </ActionButton>

      <ToolbarSeparator />

      {/* Media & Embeds */}
      <LinkPopover editor={editor} />
      <ImagePopover editor={editor} />
      <TableMenu editor={editor} />

      <ToolbarSeparator />

      {/* Clear Formatting */}
      <ActionButton
        tooltip="Clear Formatting"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        <Eraser size={15} />
      </ActionButton>
    </div>
  )
}
