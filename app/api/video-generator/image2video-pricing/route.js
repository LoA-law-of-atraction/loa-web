import { NextResponse } from "next/server";

// Cache FAL pricing to avoid rate limits (429)
const CACHE_MS = 60 * 60 * 1000; // 1 hour
let cached = null;
let cachedAt = 0;

function getImageToVideoModelEndpoint() {
  return process.env.FAL_IMAGE_TO_VIDEO_MODEL || process.env.FAL_VEO_MODEL;
}

function extractUnit(price) {
  return (
    price?.unit ||
    price?.unit_name ||
    price?.usage_unit ||
    price?.billing_unit ||
    price?.per ||
    null
  );
}

export async function GET() {
  try {
    const modelEndpoint = getImageToVideoModelEndpoint();
    if (!modelEndpoint) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing image-to-video model endpoint. Set FAL_IMAGE_TO_VIDEO_MODEL (preferred) or FAL_VEO_MODEL (legacy).",
        },
        { status: 500 },
      );
    }

    const now = Date.now();
    if (cached && now - cachedAt < CACHE_MS) {
      return NextResponse.json(cached);
    }

    const pricingResponse = await fetch(
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${modelEndpoint}`,
      {
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
        },
      },
    );

    if (!pricingResponse.ok) {
      const errorText = await pricingResponse.text();
      if (pricingResponse.status === 429 && cached) {
        return NextResponse.json(cached);
      }
      return NextResponse.json(
        {
          success: false,
          error: `FAL Pricing API failed (${pricingResponse.status}): ${errorText}`,
        },
        { status: pricingResponse.status },
      );
    }

    const pricingData = await pricingResponse.json();
    const price = pricingData.prices?.find(
      (p) => p.endpoint_id === modelEndpoint,
    );

    if (!price) {
      return NextResponse.json(
        {
          success: false,
          error: "Image-to-video pricing not found in FAL API response",
        },
        { status: 404 },
      );
    }

    const cost = price.unit_price;
    if (!cost || cost <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid image-to-video unit price: ${cost}`,
        },
        { status: 500 },
      );
    }

    const result = {
      success: true,
      cost,
      unit: extractUnit(price),
      endpoint_id: modelEndpoint,
      model: "image-to-video",
      source: "fal_api",
    };
    cached = result;
    cachedAt = Date.now();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load image-to-video pricing",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
