import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getMusicModelById, getResolvedMusicModel } from "@/data/music-models";

function buildRequestBody({ model, prompt, negative_prompt, composition_plan, music_length_ms, force_instrumental, output_format, respect_sections_durations }) {
  const hasPlan =
    model.supportsCompositionPlan &&
    composition_plan &&
    typeof composition_plan === "object" &&
    Array.isArray(composition_plan.positive_global_styles) &&
    Array.isArray(composition_plan.negative_global_styles) &&
    Array.isArray(composition_plan.sections);

  const hasPrompt = prompt?.trim();
  const durationSeconds = music_length_ms ? Math.round(music_length_ms / 1000) : 60;

  if (model.id === "elevenlabs") {
    const body = {};
    if (hasPlan) {
      body.composition_plan = composition_plan;
      if (music_length_ms != null && music_length_ms >= 3000 && music_length_ms <= 600000) {
        body.music_length_ms = Math.round(music_length_ms);
      }
      if (respect_sections_durations !== undefined) {
        body.respect_sections_durations = Boolean(respect_sections_durations);
      }
    } else if (hasPrompt) {
      body.prompt = String(prompt).trim();
      body.force_instrumental = Boolean(force_instrumental);
      if (music_length_ms != null && music_length_ms >= 3000 && music_length_ms <= 600000) {
        body.music_length_ms = Math.round(music_length_ms);
      }
    }
    if (model.output_format) body.output_format = output_format || model.output_format;
    return body;
  }

  if (model.id === "stable-audio-25") {
    const secondsTotal = Math.min(190, Math.max(5, durationSeconds));
    return {
      prompt: (prompt && String(prompt).trim()) || "Ambient instrumental music",
      seconds_total: secondsTotal,
      num_inference_steps: 8,
      guidance_scale: 1,
    };
  }

  if (model.id === "beatoven") {
    const durationSec = Math.min(150, Math.max(5, durationSeconds));
    const body = {
      prompt: (prompt && String(prompt).trim()) || "Ambient instrumental music",
      duration: durationSec,
      refinement: 100,
      creativity: 16,
    };
    if (negative_prompt && typeof negative_prompt === "string" && negative_prompt.trim()) {
      body.negative_prompt = negative_prompt.trim();
    }
    return body;
  }

  return { prompt: (prompt && String(prompt).trim()) || "Ambient instrumental music" };
}

function extractAudioUrl(falResult, model) {
  const audio = falResult?.audio;
  if (!audio) return null;
  return typeof audio === "string" ? audio : audio?.url || null;
}

function computeCost(model, durationMs) {
  if (model.pricingUnit === "min") {
    const durationMinutes = Math.max(0.05, (durationMs || 60000) / 60000);
    return durationMinutes * (model.fallbackCostPerUnit ?? 0);
  }
  return model.fallbackCostPerUnit ?? 0;
}

export async function POST(request) {
  try {
    const {
      project_id,
      session_id,
      model_id = "stable-audio-25",
      prompt,
      negative_prompt = null,
      composition_plan = null,
      music_length_ms = null,
      force_instrumental = true,
      output_format = "mp3_44100_128",
      respect_sections_durations = false,
    } = await request.json();

    if (!project_id || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, session_id" },
        { status: 400 },
      );
    }

    const model = getResolvedMusicModel(model_id);
    const hasPlan =
      model.supportsCompositionPlan &&
      composition_plan &&
      typeof composition_plan === "object" &&
      Array.isArray(composition_plan.positive_global_styles) &&
      Array.isArray(composition_plan.negative_global_styles) &&
      Array.isArray(composition_plan.sections);

    const hasPrompt = prompt?.trim();

    if (!hasPlan && !hasPrompt) {
      return NextResponse.json(
        { error: "Provide either prompt or composition_plan (ElevenLabs only)" },
        { status: 400 },
      );
    }

    // Build prompt with negative_prompt for models that append it
    let finalPrompt = hasPrompt ? String(prompt).trim() : null;
    if (finalPrompt && model.supportsNegativePrompt === "append" && negative_prompt?.trim()) {
      finalPrompt = finalPrompt + "\n\nAvoid: " + negative_prompt.trim();
    }
    // Derive prompt from composition_plan for models that don't support it
    if (!finalPrompt && hasPlan && !model.supportsCompositionPlan) {
      const styles = composition_plan?.positive_global_styles;
      finalPrompt = Array.isArray(styles) && styles.length
        ? styles.join(", ")
        : "Ambient instrumental music, slow pads, no drums, no vocals";
    }
    if (!finalPrompt) {
      finalPrompt = "Ambient instrumental music, slow pads, no drums, no vocals";
    }

    const body = buildRequestBody({
      model,
      prompt: finalPrompt,
      negative_prompt: model.supportsNegativePrompt === "native" ? (negative_prompt || "") : null,
      composition_plan: hasPlan ? composition_plan : null,
      music_length_ms,
      force_instrumental,
      output_format,
      respect_sections_durations,
    });

    const endpoint = model.endpoint;
    const falResponse = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      throw new Error(`Fal ${model.name} error: ${errorText}`);
    }

    const falResult = await falResponse.json();
    const audioUrl = extractAudioUrl(falResult, model);
    if (!audioUrl) {
      throw new Error("No audio URL in Fal response");
    }

    const durationMs =
      music_length_ms ||
      (hasPlan && Array.isArray(composition_plan?.sections)
        ? composition_plan.sections.reduce((sum, s) => sum + (s.duration_ms || 0), 0) || 60000
        : 60000);

    const cost = computeCost(model, durationMs);

    // Download and re-upload to Firebase Storage for persistence
    const audioDataResponse = await fetch(audioUrl);
    if (!audioDataResponse.ok) {
      throw new Error("Failed to download generated music");
    }
    const audioBuffer = await audioDataResponse.arrayBuffer();
    const contentType = audioDataResponse.headers.get("content-type") || "audio/mpeg";
    const ext = contentType.includes("wav") ? "wav" : "mp3";
    const mimeType = contentType.includes("wav") ? "audio/wav" : "audio/mpeg";

    const db = getAdminDb();
    const bucket = getAdminStorage().bucket();
    const storageBasePath = `projects/${project_id}/sessions/${session_id}`;
    const downloadToken = uuidv4();
    const shortToken = downloadToken.slice(0, 8);
    const filename = `background_music_${shortToken}.${ext}`;
    const musicFileName = `${storageBasePath}/${filename}`;
    const musicFile = bucket.file(musicFileName);

    await musicFile.save(Buffer.from(audioBuffer), {
      metadata: {
        contentType: mimeType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          project_id,
          session_id,
        },
      },
    });

    const musicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(musicFileName)}?alt=media&token=${downloadToken}`;

    const descriptionForStorage = hasPlan
      ? JSON.stringify(composition_plan)
      : String(prompt || "").trim();

    const generationMetadata = {
      music_url: musicUrl,
      storage_path: musicFileName,
      prompt: hasPrompt ? String(prompt || "").trim() : null,
      negative_prompt:
        negative_prompt && typeof negative_prompt === "string"
          ? String(negative_prompt).trim() || null
          : null,
      composition_plan: hasPlan ? composition_plan : null,
      music_length_ms: durationMs,
      duration_ms: durationMs,
      model_endpoint: endpoint,
      model_id: model.id,
      cost,
      force_instrumental: Boolean(force_instrumental),
      output_format: model.output_format || output_format,
      respect_sections_durations: hasPlan ? Boolean(respect_sections_durations) : null,
      project_id,
      session_id,
      fal_request_body: body,
      fal_response: { audio_url: audioUrl },
      storage: {
        bucket: bucket.name,
        path: musicFileName,
        content_type: mimeType,
      },
      timestamp: new Date().toISOString(),
    };

    const musicRef = await db.collection("music").add(generationMetadata);

    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    if (projectDoc.exists) {
      const existingCosts = projectDoc.data()?.costs || {};
      const newElevenlabsMusicCost = (existingCosts.elevenlabs_music || 0) + cost;
      const newStep5MusicCost = (existingCosts.step5?.elevenlabs_music || 0) + cost;
      const newStep5Total = (existingCosts.step5?.total || 0) + cost;
      const newTotal = (existingCosts.total || 0) + cost;

      await projectRef.update({
        background_music_id: musicRef.id,
        background_music_url: musicUrl,
        background_music_prompt: descriptionForStorage,
        costs: {
          ...existingCosts,
          elevenlabs_music: newElevenlabsMusicCost,
          step5: {
            ...existingCosts.step5,
            elevenlabs_music: newStep5MusicCost,
            total: newStep5Total,
          },
          total: newTotal,
        },
        updated_at: new Date().toISOString(),
      });
    }

    await db.collection("video_sessions").doc(session_id).set(
      {
        background_music_url: musicUrl,
        background_music_prompt: descriptionForStorage,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      music_url: musicUrl,
      cost,
    });
  } catch (error) {
    console.error("Generate background music error:", error);
    return NextResponse.json(
      { error: "Failed to generate background music", message: error.message },
      { status: 500 },
    );
  }
}
