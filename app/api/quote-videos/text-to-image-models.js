/**
 * Text-to-image model options for quote-videos (Step 2).
 * Used by generate-image, generate-branded-from-reference, and generate-video.
 * All model ids and body types come from env (no hardcoded models).
 */

import {
  getQuoteVideosTextToImageModels,
  getQuoteVideosImageModelDefault,
  getBodyTypeForModel,
} from "@/lib/quote-videos-text-to-image-models";

export const TEXT_TO_IMAGE_MODELS = getQuoteVideosTextToImageModels();

export function getAllowedModels() {
  return TEXT_TO_IMAGE_MODELS.map((m) => m.id);
}

export function getDefaultModel() {
  return getQuoteVideosImageModelDefault();
}

export function resolveImageModel(projectModel, bodyModel) {
  const allowed = new Set(getAllowedModels());
  const fromBody = typeof bodyModel === "string" ? bodyModel.trim() : "";
  const fromProject = typeof projectModel === "string" ? projectModel.trim() : "";
  if (fromBody && allowed.has(fromBody)) return fromBody;
  if (fromProject && allowed.has(fromProject)) return fromProject;
  return getDefaultModel();
}

/**
 * Build Fal API request body for text-to-image. Body shape from env bodyType (flux | grok | nano_banana).
 */
export function buildTextToImageBody(prompt, numImages = 1, modelId = getDefaultModel()) {
  const n = Math.max(1, Math.min(6, parseInt(numImages, 10) || 1));
  const bodyType = getBodyTypeForModel(modelId);
  if (bodyType === "grok") {
    return { prompt, num_images: n, aspect_ratio: "9:16" };
  }
  if (bodyType === "nano_banana") {
    return { prompt, num_images: n, aspect_ratio: "9:16", resolution: "1K" };
  }
  return {
    prompt,
    image_size: "portrait_9_16",
    num_images: n,
    enable_safety_checker: false,
  };
}

/**
 * Extract image URL from Fal response. Handles images[0].url or image.url.
 */
export function getImageUrlFromResult(result) {
  if (result?.images?.[0]?.url) return result.images[0].url;
  if (result?.image?.url) return result.image.url;
  return null;
}

/**
 * Extract array of image URLs from Fal response (for multi-image endpoints).
 */
export function getImageUrlsFromResult(result) {
  if (Array.isArray(result?.images) && result.images.length > 0) {
    return result.images.map((img) => img?.url).filter(Boolean);
  }
  const single = getImageUrlFromResult(result);
  return single ? [single] : [];
}
