import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { LOCATIONS_LIBRARY } from "@/data/locations-library";

export async function POST(request) {
  try {
    const db = getAdminDb();
    const locationsRef = db.collection("locations");

    console.log(`Seeding ${LOCATIONS_LIBRARY.length} locations...`);

    // Use batch write for efficiency
    const batch = db.batch();
    let count = 0;

    for (const location of LOCATIONS_LIBRARY) {
      const docRef = locationsRef.doc(location.id);

      // Check if location already exists
      const doc = await docRef.get();
      if (doc.exists) {
        console.log(`Location ${location.id} already exists, skipping...`);
        continue;
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
      const category = indoorTypes.includes(location.type) ? 'indoor' : 'outdoor';

      batch.set(docRef, {
        ...location,
        category,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      count++;
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully seeded ${count} new locations`);
    } else {
      console.log("No new locations to seed");
    }

    return NextResponse.json({
      success: true,
      seeded: count,
      skipped: LOCATIONS_LIBRARY.length - count,
      total: LOCATIONS_LIBRARY.length,
    });
  } catch (error) {
    console.error("Error seeding locations:", error);
    return NextResponse.json(
      { error: "Failed to seed locations", message: error.message },
      { status: 500 }
    );
  }
}
