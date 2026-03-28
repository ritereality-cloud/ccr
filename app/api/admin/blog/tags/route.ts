import { MongoClient } from "mongodb"
import { requireAdmin } from "@/lib/auth"

const mongoUrl = process.env.MONGODB_URI || ""

export async function GET() {
  try {
    await requireAdmin()

    if (!mongoUrl) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const client = new MongoClient(mongoUrl)

    try {
      await client.connect()
      const db = client.db("countryroof")
      
      // Get unique tags from all blog posts
      const postsCollection = db.collection("blog_posts")
      const posts = await postsCollection.find({}, { projection: { tags: 1 } }).toArray()
      
      // Extract unique tags
      const tagSet = new Set<string>()
      posts.forEach((post) => {
        if (Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && typeof tag === "string") {
              tagSet.add(tag.trim())
            }
          })
        }
      })
      
      // Also check a dedicated tags collection if it exists
      const tagsCollection = db.collection("blog_tags")
      const savedTags = await tagsCollection.find({}).toArray()
      savedTags.forEach((tag) => {
        if (tag.name) {
          tagSet.add(tag.name)
        }
      })
      
      const tags = Array.from(tagSet).sort()

      return new Response(
        JSON.stringify({ tags }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    } finally {
      await client.close()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unauthorized"
    const statusCode = errorMessage === "Unauthorized" ? 401 : 500

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    if (!mongoUrl) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Tag name is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const client = new MongoClient(mongoUrl)

    try {
      await client.connect()
      const db = client.db("countryroof")
      const collection = db.collection("blog_tags")

      // Check if tag already exists
      const existingTag = await collection.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      })

      if (existingTag) {
        return new Response(
          JSON.stringify({ error: "Tag already exists" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      await collection.insertOne({
        name: name.trim(),
        createdAt: new Date(),
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: "Tag created successfully",
          tag: name.trim(),
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      )
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("[v0] Error creating blog tag:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create tag"
    const statusCode = errorMessage === "Unauthorized" ? 401 : 500

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}
