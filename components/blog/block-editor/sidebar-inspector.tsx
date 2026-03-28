"use client"

import type { Editor } from "@tiptap/core"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  X,
  Settings2,
  Type,
  Palette,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Link,
  CornerUpRight,
  Info,
  Layers
} from "lucide-react"

interface SidebarInspectorProps {
  editor: Editor
  activeBlock: {
    type: string
    attrs: Record<string, any>
    pos: { top: number; left: number }
  } | null
  onClose: () => void
}

// Collapsible Section Component
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Color Picker Component
function ColorPicker({ 
  label, 
  value, 
  onChange 
}: { 
  label: string
  value: string
  onChange: (color: string) => void
}) {
  const presetColors = [
    "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6",
    "#EC4899", "#06B6D4", "#14B8A6", "#84CC16", "#F59E0B", "#6366F1"
  ]

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
        />
      </div>
      <div className="grid grid-cols-6 gap-1">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "w-6 h-6 rounded border border-border hover:scale-110 transition-transform",
              value === color && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

// Font Size Selector
function FontSizeSelector({ 
  value, 
  onChange 
}: { 
  value: string
  onChange: (size: string) => void
}) {
  const sizes = [
    { label: "Small", value: "14px" },
    { label: "Normal", value: "16px" },
    { label: "Medium", value: "18px" },
    { label: "Large", value: "20px" },
    { label: "X-Large", value: "24px" },
    { label: "XX-Large", value: "32px" },
    { label: "Huge", value: "48px" }
  ]

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Font Size</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
      >
        {sizes.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label} ({size.value})
          </option>
        ))}
      </select>
    </div>
  )
}

export function SidebarInspector({ editor, activeBlock, onClose }: SidebarInspectorProps) {
  const [activeTab, setActiveTab] = useState<"block" | "document">("block")

  const getBlockName = () => {
    if (!activeBlock) return "Document"
    
    switch (activeBlock.type) {
      case "heading": return "Heading"
      case "paragraph": return "Paragraph"
      case "bulletList": return "List"
      case "orderedList": return "Numbered List"
      case "blockquote": return "Quote"
      case "codeBlock": return "Code"
      case "image": return "Image"
      case "table": return "Table"
      case "horizontalRule": return "Separator"
      default: return activeBlock.type.charAt(0).toUpperCase() + activeBlock.type.slice(1)
    }
  }

  // Render block-specific settings
  const renderBlockSettings = () => {
    if (!activeBlock) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a block to see its settings</p>
        </div>
      )
    }

    // Heading / Paragraph settings
    if (["heading", "paragraph", "text"].includes(activeBlock.type)) {
      return (
        <>
          <CollapsibleSection title="Typography" icon={Type} defaultOpen>
            <FontSizeSelector
              value="16px"
              onChange={(size) => {
                // Apply font size - would need TextStyle extension
              }}
            />

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Text Alignment</label>
              <div className="flex gap-1">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                  { value: "justify", icon: AlignJustify }
                ].map((align) => (
                  <button
                    key={align.value}
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign(align.value).run()}
                    className={cn(
                      "flex-1 p-2 rounded border border-border hover:bg-muted",
                      editor.isActive({ textAlign: align.value }) && "bg-primary/10 border-primary"
                    )}
                  >
                    <align.icon className="h-4 w-4 mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Line Height</label>
              <select className="w-full px-3 py-2 text-sm border border-border rounded bg-background">
                <option value="1">1</option>
                <option value="1.25">1.25</option>
                <option value="1.5" selected>1.5</option>
                <option value="1.75">1.75</option>
                <option value="2">2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Letter Spacing</label>
              <input
                type="range"
                min="-2"
                max="10"
                defaultValue="0"
                className="w-full"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Color" icon={Palette} defaultOpen={false}>
            <ColorPicker
              label="Text Color"
              value=""
              onChange={(color) => editor.chain().focus().setColor(color).run()}
            />
            <ColorPicker
              label="Background Color"
              value=""
              onChange={(color) => editor.chain().focus().setHighlight({ color }).run()}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Advanced" icon={Settings2} defaultOpen={false}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">HTML Anchor</label>
              <input
                type="text"
                placeholder="my-heading"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Add an anchor to link directly to this block
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Additional CSS Class</label>
              <input
                type="text"
                placeholder="my-class"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
              />
            </div>
          </CollapsibleSection>
        </>
      )
    }

    // Image settings
    if (activeBlock.type === "image") {
      return (
        <>
          <CollapsibleSection title="Image Settings" icon={Image} defaultOpen>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Alt Text</label>
              <input
                type="text"
                placeholder="Describe the image"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Describe the purpose of the image for screen readers
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Width</label>
                <input
                  type="text"
                  placeholder="Auto"
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Height</label>
                <input
                  type="text"
                  placeholder="Auto"
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="lock-ratio" defaultChecked />
              <label htmlFor="lock-ratio" className="text-sm">Lock aspect ratio</label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Link" icon={Link} defaultOpen={false}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Link URL</label>
              <input
                type="url"
                placeholder="https://"
                className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="new-tab" />
              <label htmlFor="new-tab" className="text-sm">Open in new tab</label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Styles" icon={Palette} defaultOpen={false}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                defaultValue="0"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Border</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  className="w-20 px-3 py-2 text-sm border border-border rounded bg-background"
                />
                <span className="text-sm text-muted-foreground self-center">px</span>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )
    }

    // Table settings
    if (activeBlock.type === "table") {
      return (
        <>
          <CollapsibleSection title="Table Settings" icon={Settings2} defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-muted"
              >
                Add Column
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-muted"
              >
                Add Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-muted text-destructive"
              >
                Delete Column
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-muted text-destructive"
              >
                Delete Row
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="header-row" defaultChecked />
              <label htmlFor="header-row" className="text-sm">Header row</label>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="fixed-width" />
              <label htmlFor="fixed-width" className="text-sm">Fixed width columns</label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Styles" icon={Palette} defaultOpen={false}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Border Style</label>
              <select className="w-full px-3 py-2 text-sm border border-border rounded bg-background">
                <option value="default">Default</option>
                <option value="stripes">Stripes</option>
                <option value="none">No borders</option>
              </select>
            </div>
          </CollapsibleSection>
        </>
      )
    }

    // Default settings for other blocks
    return (
      <CollapsibleSection title="Block Settings" icon={Settings2} defaultOpen>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Block Type</label>
          <p className="text-sm font-medium">{getBlockName()}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Additional CSS Class</label>
          <input
            type="text"
            placeholder="custom-class"
            className="w-full px-3 py-2 text-sm border border-border rounded bg-background"
          />
        </div>
      </CollapsibleSection>
    )
  }

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-medium text-sm">Settings</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("block")}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "block"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Block
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("document")}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "document"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Document
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "block" ? (
          <>
            {/* Block Info */}
            {activeBlock && (
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <Type className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getBlockName()}</p>
                    <p className="text-xs text-muted-foreground">Selected block</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderBlockSettings()}
          </>
        ) : (
          <>
            {/* Document Settings */}
            <CollapsibleSection title="Status & Visibility" icon={Info} defaultOpen>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Visibility</span>
                  <span className="text-sm text-muted-foreground">Public</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Publish</span>
                  <span className="text-sm text-muted-foreground">Immediately</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Template</span>
                  <span className="text-sm text-muted-foreground">Single Post</span>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Summary" icon={Layers} defaultOpen>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Words</span>
                  <span>{editor.storage.characterCount?.words?.() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Characters</span>
                  <span>{editor.storage.characterCount?.characters?.() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Blocks</span>
                  <span>{editor.state.doc.childCount}</span>
                </div>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  )
}
