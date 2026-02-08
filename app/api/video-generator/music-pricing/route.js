import { NextResponse } from "next/server";
import { getResolvedMusicModel } from "@/data/music-models";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("model_id") || "stable-audio-25";

  try {
    const model = getResolvedMusicModel(modelId);

    // Try Fal pricing API
    const pricingResponse = await fetch(
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(model.endpoint)}`,
      {
        headers: {
          Authorization: `Key ${process.env.FAL_API_KEY}`,
        },
      },
    );

    let cost = model.fallbackCostPerUnit;
    let unit = model.pricingUnit;

    if (pricingResponse.ok) {
      const pricingData = await pricingResponse.json();
      const price = pricingData.prices?.find(
        (p) => p.endpoint_id === model.endpoint,
      );
      if (price?.unit_price != null && price.unit_price > 0) {
        cost = price.unit_price;
        unit =
          price?.unit ||
          price?.unit_name ||
          price?.usage_unit ||
          price?.billing_unit ||
          price?.per ||
          model.pricingUnit;
      }
    }

    const displayUnit = unit?.toLowerCase?.().replace(/ute$/, "") || unit;

    return NextResponse.json({
      success: true,
      cost,
      unit: displayUnit,
      endpoint_id: model.endpoint,
      model_id: model.id,
      model_name: model.name,
      source: "fal_api",
    });
  } catch (error) {
    console.error("Music pricing error:", error);
    const model = getResolvedMusicModel(modelId);
    return NextResponse.json({
      success: true,
      cost: model.fallbackCostPerUnit,
      unit: model.pricingUnit,
      endpoint_id: model.endpoint,
      model_id: model.id,
      model_name: model.name,
      source: "env_fallback",
    });
  }
}
