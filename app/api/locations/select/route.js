import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { project_id, location_count, scene_count } = await request.json();

    if (!project_id || !location_count || !scene_count) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, location_count, scene_count" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch all available locations
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      return NextResponse.json(
        { error: "No locations found in library. Run /api/locations/seed first." },
        { status: 404 }
      );
    }

    const allLocations = locationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Selecting ${location_count} locations from ${allLocations.length} available`);

    // Select diverse locations - prioritize variety in types
    const selectedLocations = selectDiverseLocations(allLocations, location_count);

    // Create location mapping: divide scenes evenly across locations
    const locationMapping = {};
    const scenesPerLocation = Math.ceil(scene_count / location_count);

    for (let sceneIndex = 0; sceneIndex < scene_count; sceneIndex++) {
      const locationIndex = Math.floor(sceneIndex / scenesPerLocation);
      const location = selectedLocations[Math.min(locationIndex, selectedLocations.length - 1)];
      locationMapping[sceneIndex + 1] = location.id; // scene_id is 1-indexed
    }

    console.log("Location mapping:", locationMapping);

    // Update project with location mapping
    const projectRef = db.collection("projects").doc(project_id);
    await projectRef.update({
      location_mapping: locationMapping,
      locations_selected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Increment usage_count for selected locations
    const batch = db.batch();
    for (const location of selectedLocations) {
      const locationRef = db.collection("locations").doc(location.id);
      batch.update(locationRef, {
        usage_count: (location.usage_count || 0) + 1,
      });
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      selected_locations: selectedLocations,
      location_mapping: locationMapping,
    });
  } catch (error) {
    console.error("Error selecting locations:", error);
    return NextResponse.json(
      { error: "Failed to select locations", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Select diverse locations prioritizing variety in types
 */
function selectDiverseLocations(allLocations, count) {
  // Group locations by type
  const locationsByType = {};
  for (const location of allLocations) {
    if (!locationsByType[location.type]) {
      locationsByType[location.type] = [];
    }
    locationsByType[location.type].push(location);
  }

  const types = Object.keys(locationsByType);
  const selected = [];

  // First pass: Pick one from each type (round-robin)
  let typeIndex = 0;
  while (selected.length < count && selected.length < allLocations.length) {
    const currentType = types[typeIndex % types.length];
    const availableInType = locationsByType[currentType].filter(
      (loc) => !selected.find((s) => s.id === loc.id)
    );

    if (availableInType.length > 0) {
      // Pick random from this type
      const randomIndex = Math.floor(Math.random() * availableInType.length);
      selected.push(availableInType[randomIndex]);
    }

    typeIndex++;

    // Safety: if we've cycled through all types and can't find more, break
    if (typeIndex > types.length * count) break;
  }

  // If we still need more, pick randomly from remaining
  while (selected.length < count && selected.length < allLocations.length) {
    const remaining = allLocations.filter(
      (loc) => !selected.find((s) => s.id === loc.id)
    );
    if (remaining.length === 0) break;

    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
  }

  console.log(
    `Selected ${selected.length} diverse locations:`,
    selected.map((l) => `${l.name} (${l.type})`).join(", ")
  );

  return selected;
}
