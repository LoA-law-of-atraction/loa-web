"use client";

import { useState, useRef, useEffect } from "react";

export default function ImageUploader({
  onImageUploaded,
  currentImage = null,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [altText, setAltText] = useState("");
  const fileInputRef = useRef(null);

  // Handle both string URLs and object format for backward compatibility
  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === "string") return img;
    return img.url || null;
  };
  const getImageAlt = (img) => {
    if (!img) return "";
    if (typeof img === "string") return "";
    return img.alt || "";
  };

  // Use local preview if set, otherwise use currentImage prop
  const preview =
    localPreview !== null ? localPreview : getImageUrl(currentImage);

  // Initialize altText from currentImage on mount
  useEffect(() => {
    setAltText(getImageAlt(currentImage));
  }, []);

  const fetchGalleryImages = async () => {
    setLoadingGallery(true);
    try {
      const response = await fetch("/api/blog/images");
      const data = await response.json();
      if (response.ok) {
        setGalleryImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleOpenGallery = () => {
    setShowGallery(true);
    fetchGalleryImages();
  };

  const handleSelectFromGallery = (image) => {
    setLocalPreview(image.url);
    setAltText(image.name);
    onImageUploaded({
      url: image.url,
      alt: image.name,
      path: image.path,
    });
    setShowGallery(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("image", file);
      formData.append("alt", altText || file.name);

      const response = await fetch("/api/blog/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Call parent callback with image data
      onImageUploaded({
        url: data.url,
        alt: altText || data.alt,
        width: data.width,
        height: data.height,
      });

      setUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
      setLocalPreview(null);
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setAltText("");
    onImageUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Choose from library
              </h2>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {loadingGallery ? (
                <p className="text-center text-gray-500 py-8">Loading...</p>
              ) : galleryImages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No images uploaded yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((image) => (
                    <button
                      key={image.path}
                      onClick={() => handleSelectFromGallery(image)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-900 transition-all"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Featured Image
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt={altText || "Preview"}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleOpenGallery}
              className="bg-white/90 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-white transition-all"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-white transition-all"
            >
              Upload
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <p className="text-gray-500 text-sm">
              {uploading ? "Uploading..." : "Upload new"}
            </p>
          </div>
          <div
            onClick={handleOpenGallery}
            className="flex-1 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <p className="text-gray-500 text-sm">Choose from library</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Alt Text
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => {
              setAltText(e.target.value);
              if (preview && onImageUploaded) {
                onImageUploaded({
                  ...currentImage,
                  alt: e.target.value,
                });
              }
            }}
            placeholder="Describe the image..."
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
