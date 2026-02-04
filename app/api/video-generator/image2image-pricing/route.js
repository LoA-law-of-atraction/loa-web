import { NextResponse } from "next/server";

function getImageToImageModelEndpoint() {
  return process.env.FAL_IMAGE_TO_IMAGE_MODEL;
}

export async function GET() {
  try {
    const modelEndpoint = getImageToImageModelEndpoint();

    if (!modelEndpoint) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing image-to-image model endpoint. Set FAL_IMAGE_TO_IMAGE_MODEL.",
        },
        { status: 500 },
      );
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
          error: "Image-to-image pricing not found in FAL API response",
        },
        { status: 404 },
      );
    }

    const cost = price.unit_price;
    if (!cost || cost <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid image-to-image unit price: ${cost}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cost,
      endpoint_id: modelEndpoint,
      model: "image-to-image",
      source: "fal_api",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load image-to-image pricing",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
