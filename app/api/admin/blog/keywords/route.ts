import { MongoClient, ObjectId } from "mongodb"
import { requireAdmin } from "@/lib/auth"

const mongoUrl = process.env.MONGODB_URI || ""

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

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
      const collection = db.collection("blog_keywords")

      const keywords = await collection.find({}).sort({ name: 1 }).toArray()

      return new Response(
        JSON.stringify({
          keywords: keywords.map((keyword) => ({
            ...keyword,
            _id: keyword._id.toString(),
          })),
        }),
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
        JSON.stringify({ error: "Keyword is required" }),
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
      const collection = db.collection("blog_keywords")

      const slug = slugify(name.trim())

      // Check if keyword already exists
      const existingKeyword = await collection.findOne({
        $or: [
          { name: { $regex: `^${name.trim()}$`, $options: "i" } },
          { slug: slug },
        ],
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

      const result = await collection.insertOne({
        name: name.trim(),
        slug: slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: "Keyword created successfully",
          keyword: {
            _id: result.insertedId.toString(),
            name: name.trim(),
            slug: slug,
          },
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
    console.error("[v0] Error creating blog keyword:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create keyword"
    const statusCode = errorMessage === "Unauthorized" ? 401 : 500

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()

    if (!mongoUrl) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return new Response(JSON.stringify({ error: "Keyword ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const client = new MongoClient(mongoUrl)

    try {
      await client.connect()
      const db = client.db("countryroof")
      const collection = db.collection("blog_keywords")

      const result = await collection.deleteOne({ _id: new ObjectId(id) })

      if (result.deletedCount === 0) {
        return new Response(JSON.stringify({ error: "Keyword not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Keyword deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error("[v0] Error deleting blog keyword:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete keyword"
    const statusCode = errorMessage === "Unauthorized" ? 401 : 500

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    })
  }
}
