import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getPostById,
  updatePost,
  deletePost,
} from '@/utils/blogService';

// Verify admin authentication
function verifyAuth(request) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('admin_session');
  return authCookie && authCookie.value && authCookie.value.length === 64;
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Verify authentication
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Check if post exists
    const existingPost = await getPostById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update post
    const updatedPost = await updatePost(id, {
      ...body,
      lastEditedBy: 'admin',
    });

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if post exists
    const existingPost = await getPostById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    await deletePost(id);

    return NextResponse.json(
      { success: true, message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
