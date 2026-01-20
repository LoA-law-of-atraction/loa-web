import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBlogPosts, createPost } from "@/utils/blogService";
import { createPostAdmin } from "@/utils/blogServiceAdmin";
import { uploadImageFromUrl } from "@/utils/storageServiceAdmin";
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

// Check which auth method is used
async function getAuthMethod(request) {
  if (verifyApiKey(request)) return "api-key";
  if (await verifyAuth()) return "cookie";
  return null;
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
    // Check authentication method
    const authMethod = await getAuthMethod(request);
    if (!authMethod) {
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

    // Handle featured image - download from URL and upload to Firebase Storage
    let featuredImageUrl = null;
    let featuredImagePath = null;

    if (body.featuredImage) {
      // Check if it's an external URL (like Fal.ai) that needs to be stored
      const isExternalUrl =
        body.featuredImage.startsWith("http") &&
        !body.featuredImage.includes("storage.googleapis.com") &&
        !body.featuredImage.includes("firebasestorage.googleapis.com");

      if (isExternalUrl && authMethod === "api-key") {
        try {
          console.log(
            "[Image Upload] Downloading and storing image from:",
            body.featuredImage,
          );
          console.log(
            "[Image Upload] Storage bucket:",
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          );
          const uploadResult = await uploadImageFromUrl(
            body.featuredImage,
            "blog",
          );
          featuredImageUrl = uploadResult.url;
          featuredImagePath = uploadResult.path;
          console.log("[Image Upload] Success! Stored at:", featuredImageUrl);
        } catch (imageError) {
          console.error(
            "[Image Upload] FAILED to store image:",
            imageError.message,
          );
          console.error("[Image Upload] Full error:", imageError);
          featuredImageUrl = body.featuredImage;
        }
      } else {
        featuredImageUrl = body.featuredImage;
      }
    }

    // Set default values - format featuredImage as object for the blog display
    const featuredImageObject = featuredImageUrl
      ? {
          url: featuredImageUrl,
          alt: body.featuredImageAlt || body.title,
          width: body.featuredImageWidth || 1200,
          height: body.featuredImageHeight || 630,
        }
      : null;

    const postData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || body.content.substring(0, 160),
      featuredImage: featuredImageObject,
      featuredImagePath: featuredImagePath,
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
      createdBy: authMethod === "api-key" ? "automation" : "admin",
      lastEditedBy: authMethod === "api-key" ? "automation" : "admin",
    };

    // Use Admin SDK for API key auth (bypasses Firestore rules)
    // Use regular client SDK for cookie auth (works with existing auth)
    const newPost =
      authMethod === "api-key"
        ? await createPostAdmin(postData)
        : await createPost(postData);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 },
    );
  }
}
