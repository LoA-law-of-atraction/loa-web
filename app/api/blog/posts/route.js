import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBlogPosts, createPost } from "@/utils/blogService";
import { DEFAULT_AUTHOR } from "@/lib/constants/blogConfig";

// Verify admin authentication (cookie-based for admin panel)
async function verifyAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_session");
  return authCookie && authCookie.value && authCookie.value.length === 64;
}

// Verify API key authentication (for automation like Make.com)
function verifyApiKey(request) {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.BLOG_API_KEY;
  return apiKey && validApiKey && apiKey === validApiKey;
}

// Combined auth check - accepts either cookie OR API key
async function isAuthorized(request) {
  return verifyApiKey(request) || (await verifyAuth());
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "published";
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const postsPerPage = parseInt(searchParams.get("limit") || "9");

    const result = await getBlogPosts({
      status,
      category,
      page,
      postsPerPage,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Verify authentication (cookie OR API key)
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    // Set default values
    const postData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || body.content.substring(0, 160),
      featuredImage: body.featuredImage || null,
      categories: body.categories || [],
      tags: body.tags || [],
      author: body.author || DEFAULT_AUTHOR,
      status: body.status || "draft",
      metaTitle: body.metaTitle || body.title,
      metaDescription: body.metaDescription || body.excerpt,
      keywords: body.keywords || [],
      aiGenerated: body.aiGenerated || false,
      aiPrompt: body.aiPrompt || null,
      aiModel: body.aiModel || null,
      createdBy: "admin",
      lastEditedBy: "admin",
    };

    const newPost = await createPost(postData);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 },
    );
  }
}
