import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_MULTIPLE_ANGLES_MODEL =
  "fal-ai/flux-2-lora-gallery/multiple-angles";

function getMultipleAnglesModelEndpoint() {
  const fromEnv = process.env.FAL_MULTIPLE_ANGLES_MODEL;
  const trimmed = typeof fromEnv === "string" ? fromEnv.trim() : "";
  return trimmed || DEFAULT_MULTIPLE_ANGLES_MODEL;
}

export async function GET() {
  try {
    const modelEndpoint = getMultipleAnglesModelEndpoint();

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json(
        {
          success: false,
          endpoint_id: modelEndpoint,
          model: "multiple-angles",
          source: "missing_fal_api_key",
          error: "Missing FAL_API_KEY. Pricing unavailable.",
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const pricingResponse = await fetch(
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${modelEndpoint}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Key ${falKey}`,
        },
      },
    );

    if (!pricingResponse.ok) {
      const errorText = await pricingResponse.text();
      return NextResponse.json(
        {
          success: false,
          endpoint_id: modelEndpoint,
          model: "multiple-angles",
          source: "fal_api",
          http_status: pricingResponse.status,
          error: `FAL Pricing API failed (${pricingResponse.status}): ${errorText}`,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
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
          endpoint_id: modelEndpoint,
          model: "multiple-angles",
          source: "fal_api",
          error: "Multiple-angles pricing not found in FAL API response",
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const cost = price.unit_price;
    if (!cost || cost <= 0) {
      return NextResponse.json(
        {
          success: false,
          endpoint_id: modelEndpoint,
          model: "multiple-angles",
          source: "fal_api",
          error: `Invalid multiple-angles unit price: ${cost}`,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json(
      {
        success: true,
        cost,
        endpoint_id: modelEndpoint,
        model: "multiple-angles",
        source: "fal_api",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        endpoint_id: getMultipleAnglesModelEndpoint(),
        model: "multiple-angles",
        source: "exception",
        error: "Failed to load multiple-angles pricing",
        message: error?.message || "Unknown error",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
