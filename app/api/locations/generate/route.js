import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { count = 1, type = null, project_id = null, keywords = null } = await request.json();

    console.log(`Generating ${count} new location(s) with type: ${type || 'any'}${keywords ? `, keywords: ${keywords}` : ''}...`);

    // Map indoor/outdoor categories to specific types
    let typeConstraint = 'Use diverse location types';
    if (type === 'indoor') {
      typeConstraint = 'Generate INDOOR locations only. Choose RANDOMLY and VARY the types - prioritize RETRO-FUTURE WARM REFUGES with analog tech: retro_diner (CRT TV, vinyl booths), laundromat (vintage machines, CRT), ramen_bar (warm steam, analog menus), electronics_repair_shop (CRT monitors, old tech), convenience_store (analog register, retro displays), vintage_arcade (CRT cabinets), internet_cafe (90s CRT monitors), record_shop (vinyl, turntables), waiting_room (CRT TV, magazines), subway_car (analog displays). Also available: bar_interior, underground_club, warehouse, server_room. EMPHASIZE warm analog refuges with retro-tech.';
    } else if (type === 'outdoor') {
      typeConstraint = 'Generate OUTDOOR locations only. Choose RANDOMLY and VARY the types - include CONTEMPLATIVE QUIET SPACES: phone_booth (glass, rain, rotary phone), bus_stop (warm shelter light, cold rain), apartment_balcony (CRT monitor visible inside), dark_alley (CRT glows, retro neon), rooftop, elevated_walkway, street_corner, backstreet, fire_escape, train_platform, pedestrian_crossing. EMPHASIZE quiet lonely contemplative outdoor moments.';
    } else if (type) {
      typeConstraint = `TYPE CONSTRAINT: Generate locations of type "${type}"`;
    }

    // Add keywords constraint if provided
    let keywordsConstraint = '';
    if (keywords && keywords.trim()) {
      const keywordsList = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordsList.length > 0) {
        keywordsConstraint = `\n\nKEYWORDS CONSTRAINT: The location(s) MUST incorporate these elements/themes: ${keywordsList.join(', ')}. Make sure the description, visual characteristics, and atmosphere reflect these keywords.`;
      }
    }

    // Read prompt from file
    const promptPath = path.join(process.cwd(), 'prompts', 'location-generation.txt');
    let promptTemplate = fs.readFileSync(promptPath, 'utf-8');

    // Replace placeholders
    const prompt = promptTemplate
      .replace('{count}', count)
      .replace('{typeConstraint}', typeConstraint + keywordsConstraint);

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text.trim();

    // Calculate cost from token usage
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;

    // Claude Sonnet pricing (as of Jan 2025)
    const inputCostPerMillion = 3.00; // $3 per million input tokens
    const outputCostPerMillion = 15.00; // $15 per million output tokens

    const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion;
    const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
    const totalCost = inputCost + outputCost;

    console.log(`Location generation cost: $${totalCost.toFixed(4)} (${inputTokens} input + ${outputTokens} output tokens)`);

    // Extract JSON from response (in case Claude adds markdown)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Claude response");
    }

    const generatedLocations = JSON.parse(jsonMatch[0]);

    // Validate and save to Firestore
    const db = getAdminDb();
    const batch = db.batch();
    const savedLocations = [];

    for (const location of generatedLocations) {
      // Ensure unique ID
      const locationRef = db.collection("locations").doc(location.id);

      // Check if exists
      const existingDoc = await locationRef.get();
      if (existingDoc.exists) {
        // Append timestamp to make it unique
        location.id = `${location.id}_${Date.now()}`;
      }

      // Determine indoor/outdoor category based on type
      const indoorTypes = [
        // Retro-future warm refuges
        'retro_diner', 'laundromat', 'ramen_bar', 'electronics_repair_shop', 'convenience_store',
        'vintage_arcade', 'internet_cafe', 'record_shop', 'waiting_room', 'subway_car',
        // Classic indoor types
        'bar_interior', 'maintenance_corridor', 'subway_platform', 'parking_garage',
        'neon_tunnel', 'abandoned_building', 'abandoned_building_interior',
        'underground_club', 'industrial_warehouse', 'server_room', 'underground_market',
        'industrial_elevator', 'storage_facility', 'underground_passage',
        'underground_train_station', 'indoor_plaza'
      ];
      const locationCategory = type === 'indoor' ? 'indoor' :
                              type === 'outdoor' ? 'outdoor' :
                              indoorTypes.includes(location.type) ? 'indoor' : 'outdoor';

      const locationData = {
        ...location,
        category: locationCategory,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        generated_by_ai: true,
      };

      const newRef = db.collection("locations").doc(location.id);
      batch.set(newRef, locationData);
      savedLocations.push(locationData);
    }

    await batch.commit();

    console.log(`Successfully generated and saved ${savedLocations.length} location(s)`);

    // Update project costs if project_id is provided
    if (project_id) {
      try {
        const projectRef = db.collection("projects").doc(project_id);
        const projectDoc = await projectRef.get();

        if (projectDoc.exists) {
          const projectData = projectDoc.data();
          const existingCosts = projectData?.costs || {};

          const newClaudeCost = (existingCosts.claude || 0) + totalCost;
          const newStep1ClaudeCost = (existingCosts.step1?.claude || 0) + totalCost;
          const newStep1Total = (existingCosts.step1?.total || 0) + totalCost;
          const newTotal = (existingCosts.total || 0) + totalCost;

          await projectRef.update({
            costs: {
              ...existingCosts,
              claude: newClaudeCost,
              step1: {
                ...existingCosts.step1,
                claude: newStep1ClaudeCost,
                total: newStep1Total,
              },
              total: newTotal,
            },
            updated_at: new Date().toISOString(),
          });

          console.log(`Updated project ${project_id} costs: added $${totalCost.toFixed(4)} for location generation`);
        }
      } catch (costError) {
        console.error("Error updating project costs:", costError);
        // Don't fail the request if cost tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      locations: savedLocations,
      count: savedLocations.length,
      cost: totalCost,
    });
  } catch (error) {
    console.error("Error generating locations:", error);
    return NextResponse.json(
      { error: "Failed to generate locations", message: error.message },
      { status: 500 }
    );
  }
}
