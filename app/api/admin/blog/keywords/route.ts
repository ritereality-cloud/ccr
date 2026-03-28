import { connectToDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const { db } = await connectToDatabase()
    
    // Get unique keywords from all blog posts
    const postsCollection = db.collection("blog_posts")
    const posts = await postsCollection.find({}, { projection: { meta_keywords: 1 } }).toArray()
    
    // Extract unique keywords
    const keywordSet = new Set<string>()
    posts.forEach((post) => {
      if (post.meta_keywords && typeof post.meta_keywords === "string") {
        const keywords = post.meta_keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        keywords.forEach((keyword: string) => keywordSet.add(keyword))
      }
    })
    
    // Also check a dedicated keywords collection if it exists
    const keywordsCollection = db.collection("blog_keywords")
    const savedKeywords = await keywordsCollection.find({}).toArray()
    savedKeywords.forEach((keyword) => {
      if (keyword.name) {
        keywordSet.add(keyword.name)
      }
    })
    
    const keywords = Array.from(keywordSet).sort()

    return new Response(
      JSON.stringify({ keywords }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
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

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("blog_keywords")

    // Check if keyword already exists
    const existingKeyword = await collection.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    })

    if (existingKeyword) {
      return new Response(
        JSON.stringify({ error: "Keyword already exists" }),
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
        message: "Keyword created successfully",
        keyword: name.trim(),
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[v0] Error creating blog keyword:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create keyword"
    const statusCode = errorMessage === "Unauthorized" ? 401 : 500

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}
