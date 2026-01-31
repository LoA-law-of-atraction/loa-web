import { NextResponse } from "next/server";

export async function GET() {
  // Fetch pricing from FAL AI API
  const pricingResponse = await fetch(`https://api.fal.ai/v1/models/pricing?endpoint_id=${process.env.FAL_FLUX_PRO_MODEL}`, {
    headers: {
      Authorization: `Key ${process.env.FAL_API_KEY}`,
    },
  });

  if (!pricingResponse.ok) {
    const errorText = await pricingResponse.text();
    return NextResponse.json(
      {
        success: false,
        error: `FAL Pricing API failed (${pricingResponse.status}): ${errorText}`,
      },
      { status: pricingResponse.status }
    );
  }

  const pricingData = await pricingResponse.json();

  // Find Flux Pro pricing
  const fluxProPrice = pricingData.prices?.find(
    (p) => p.endpoint_id === process.env.FAL_FLUX_PRO_MODEL
  );

  if (!fluxProPrice) {
    return NextResponse.json(
      {
        success: false,
        error: "Flux Pro pricing not found in FAL API response",
      },
      { status: 404 }
    );
  }

  const cost = fluxProPrice.unit_price;

  if (!cost || cost <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid Flux Pro price: ${cost}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cost,
    model: "flux-pro",
    source: "fal_api",
  });
}
