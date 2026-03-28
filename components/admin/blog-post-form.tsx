"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RichTextEditor from "@/components/blog/rich-text-editor"
import TableOfContents from "@/components/blog/table-of-contents"
import { X, Plus, Check } from "lucide-react"

interface BlogCategory {
  _id: string
  name: string
  slug: string
}

interface BlogPostFormProps {
  initialData?: {
    _id?: string
    title?: string
    excerpt?: string
    content?: string
    category?: string | string[]
    author?: string
    readTime?: string
    cover_image?: string
    banner_image?: string
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    og_title?: string
    og_description?: string
    og_image?: string
    tags?: string[] | string
    is_published?: boolean
  }
}

export default function BlogPostForm({ initialData }: BlogPostFormProps) {
  const router = useRouter()
  const isEditing = !!initialData?._id
  const [activeTab, setActiveTab] = useState("basic")
  
  // Parse initial categories - support both string and array formats
  const getInitialCategories = () => {
    if (!initialData?.category) return []
    if (Array.isArray(initialData.category)) return initialData.category
    return [initialData.category]
  }
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    categories: getInitialCategories(),
    author: initialData?.author || "",
    readTime: initialData?.readTime || "5",
    cover_image: initialData?.cover_image || "",
    banner_image: initialData?.banner_image || "",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    meta_keywords: initialData?.meta_keywords || "",
    og_title: initialData?.og_title || "",
    og_description: initialData?.og_description || "",
    og_image: initialData?.og_image || "",
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(", ") : initialData?.tags || "",
    is_published: initialData?.is_published || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  // Category management state
  const [availableCategories, setAvailableCategories] = useState<BlogCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/blog/categories")
        if (response.ok) {
          const data = await response.json()
          setAvailableCategories(data.categories || [])
        }
      } catch (err) {
        console.error("[v0] Error fetching categories:", err)
      } finally {
        setLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading((prev) => ({ ...prev, [fieldName]: true }))
    setError("")

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("folder", "blog")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, [fieldName]: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }))
      e.target.value = ""
    }
  }

  // Category management functions
  const toggleCategory = (categoryName: string) => {
    setFormData((prev) => {
      const currentCategories = prev.categories
      if (currentCategories.includes(categoryName)) {
        return { ...prev, categories: currentCategories.filter((c) => c !== categoryName) }
      }
      return { ...prev, categories: [...currentCategories, categoryName] }
    })
  }

  const removeCategory = (categoryName: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== categoryName),
    }))
  }

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return
    
    setAddingCategory(true)
    setError("")
    
    try {
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add category")
      }
      
      const data = await response.json()
      
      // Add to available categories and select it
      setAvailableCategories((prev) => [...prev, data.category])
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, data.category.name],
      }))
      setNewCategoryName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category")
    } finally {
      setAddingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, publishStatus: boolean = true) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const url = isEditing ? `/api/admin/blog/posts/${initialData._id}` : "/api/admin/blog/posts"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        ...formData,
        // Send categories as array for multiple selection support
        category: formData.categories,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        is_published: publishStatus,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} blog post`)
      }
      
      await response.json()

      setSuccess(true)
      setFormData((prev) => ({ ...prev, is_published: publishStatus }))
      
      // Use router.refresh() before navigation to ensure the list is updated
      setTimeout(() => {
        router.refresh()
        router.push("/admin/blog")
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-30 bg-background py-2 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-border">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Blog Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter blog title..."
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="author" className="text-sm font-medium">
                    Author *
                  </label>
                  <Input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="Your name"
                    value={formData.author}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categories</label>
                  <div className="relative">
                    {/* Selected categories */}
                    <div
                      className="min-h-[42px] w-full px-3 py-2 border border-border rounded-md bg-background cursor-pointer flex flex-wrap gap-1.5 items-center"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      {formData.categories.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Select categories...</span>
                      ) : (
                        formData.categories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
                          >
                            {cat}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCategory(cat)
                              }}
                              className="hover:text-primary/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Dropdown */}
                    {showCategoryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-64 overflow-auto">
                        {/* Add new category input */}
                        <div className="p-2 border-b border-border">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add new category..."
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addNewCategory()
                                }
                              }}
                              className="h-8 text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                addNewCategory()
                              }}
                              disabled={!newCategoryName.trim() || addingCategory}
                              className="h-8 px-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Category list */}
                        {loadingCategories ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            Loading categories...
                          </div>
                        ) : availableCategories.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            No categories yet. Add one above.
                          </div>
                        ) : (
                          <div className="py-1">
                            {availableCategories.map((cat) => (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCategory(cat.name)
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                              >
                                <span>{cat.name}</span>
                                {formData.categories.includes(cat.name) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Close button */}
                        <div className="p-2 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowCategoryDropdown(false)
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select multiple categories or add new ones. New categories will be saved for future use.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="excerpt" className="text-sm font-medium">
                  Excerpt *
                </label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  placeholder="Brief summary of the blog post..."
                  value={formData.excerpt}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="banner_image" className="text-sm font-medium">
                    Banner Image
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors">
                      <input
                        id="banner_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "banner_image")}
                        disabled={uploading.banner_image}
                        className="hidden"
                      />
                      {uploading.banner_image ? "Uploading..." : "Choose File"}
                    </label>
                    {formData.banner_image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData((prev) => ({ ...prev, banner_image: "" }))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {formData.banner_image && (
                    <img
                      src={formData.banner_image}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cover_image" className="text-sm font-medium">
                    Cover Image (Thumbnail)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors">
                      <input
                        id="cover_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "cover_image")}
                        disabled={uploading.cover_image}
                        className="hidden"
                      />
                      {uploading.cover_image ? "Uploading..." : "Choose File"}
                    </label>
                    {formData.cover_image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData((prev) => ({ ...prev, cover_image: "" }))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Blog Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content *</label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                      placeholder="Write your blog content with rich formatting, images, and more..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="readTime" className="text-sm font-medium">
                        Read Time (minutes)
                      </label>
                      <Input
                        id="readTime"
                        name="readTime"
                        type="number"
                        value={formData.readTime}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="tags" className="text-sm font-medium">
                        Tags (comma-separated)
                      </label>
                      <Input
                        id="tags"
                        name="tags"
                        type="text"
                        placeholder="tag1, tag2, tag3"
                        value={formData.tags}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-16">
                <TableOfContents content={formData.content} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="meta_title" className="text-sm font-medium">
                  Meta Title
                </label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  type="text"
                  placeholder="SEO title (50-60 characters)"
                  value={formData.meta_title}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">{formData.meta_title.length}/60 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="meta_description" className="text-sm font-medium">
                  Meta Description
                </label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  placeholder="SEO description (150-160 characters)"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{formData.meta_description.length}/160 characters</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="meta_keywords" className="text-sm font-medium">
                  Meta Keywords (comma-separated)
                </label>
                <Input
                  id="meta_keywords"
                  name="meta_keywords"
                  type="text"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="og_title" className="text-sm font-medium">
                  OG Title (Social Media)
                </label>
                <Input
                  id="og_title"
                  name="og_title"
                  type="text"
                  placeholder="Title for social sharing"
                  value={formData.og_title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="og_description" className="text-sm font-medium">
                  OG Description
                </label>
                <Textarea
                  id="og_description"
                  name="og_description"
                  placeholder="Description for social sharing"
                  value={formData.og_description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
          Blog post {isEditing ? "updated" : "created"} successfully!
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (isEditing ? "Updating..." : "Publishing...") : isEditing ? "Update Blog" : "Publish Blog"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, false)}
        >
          {loading ? "Saving..." : "Save as Draft"}
        </Button>
      </div>
    </form>
  )
}
