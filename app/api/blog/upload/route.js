import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadImage, getImageDimensions } from '@/utils/storageService';

// Verify admin authentication
function verifyAuth(request) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('admin_session');
  return authCookie && authCookie.value && authCookie.value.length === 64;
}

export async function POST(request) {
  try {
    // Verify authentication
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');
    const alt = formData.get('alt') || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to format suitable for Firebase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object
    const fileBlob = new Blob([buffer], { type: file.type });
    const fileObject = new File([fileBlob], file.name, { type: file.type });

    // Upload to Firebase Storage
    const result = await uploadImage(fileObject, 'blog');

    // Get image dimensions (for client-side use)
    let dimensions = { width: 1200, height: 630 };
    try {
      dimensions = await getImageDimensions(fileObject);
    } catch (error) {
      console.warn('Could not get image dimensions:', error);
    }

    return NextResponse.json(
      {
        url: result.url,
        path: result.path,
        alt: alt || file.name,
        width: dimensions.width,
        height: dimensions.height,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
