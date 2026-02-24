import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getResolvedMusicModel } from "@/data/music-models";

const COLLECTION = "quote_projects";
const MUSIC_BASE_COLLECTION = "music_base_prompts";

const FALLBACK_PROMPT =
  "Gentle instrumental background for short quote video. Soft pads, no drums, no vocals. Loopable.";

/** Fetch base prompt from Firebase (any id including "default"). Returns null if not found. */
async function getBasePromptFromFirebase(db, baseId) {
  if (!baseId) return null;
  try {
    const doc = await db.collection(MUSIC_BASE_COLLECTION).doc(baseId).get();
    if (doc.exists && doc.data()?.prompt) return doc.data().prompt.trim();
  } catch (e) {
    console.warn("getBasePromptFromFirebase", baseId, e?.message);
  }
  return null;
}

function getQuoteVideosMusicDefault(baseId = null, baseTextFromFirebase = null) {
  if (baseTextFromFirebase) return baseTextFromFirebase;
  return FALLBACK_PROMPT;
}

/** When prompt is empty: use base only (no quote/theme variation). */
function getBasePromptOnly(baseId = null, baseTextFromFirebase = null) {
  return getQuoteVideosMusicDefault(baseId, baseTextFromFirebase);
}

function buildRequestBody({ model, prompt, negative_prompt, composition_plan, music_length_ms, force_instrumental, output_format, respect_sections_durations, baseId, baseTextFromFirebase }) {
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
      prompt: (prompt && String(prompt).trim()) || getQuoteVideosMusicDefault(baseId, baseTextFromFirebase),
      seconds_total: secondsTotal,
      num_inference_steps: 8,
      guidance_scale: 1,
    };
  }

  if (model.id === "beatoven") {
    const durationSec = Math.min(150, Math.max(5, durationSeconds));
    const body = {
      prompt: (prompt && String(prompt).trim()) || getQuoteVideosMusicDefault(baseId, baseTextFromFirebase),
      duration: durationSec,
      refinement: 100,
      creativity: 16,
    };
    if (negative_prompt && typeof negative_prompt === "string" && negative_prompt.trim()) {
      body.negative_prompt = negative_prompt.trim();
    }
    return body;
  }

  return { prompt: (prompt && String(prompt).trim()) || getQuoteVideosMusicDefault(baseId, baseTextFromFirebase) };
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

/** POST - Generate background music for a quote project (no session_id). */
export async function POST(request) {
  try {
    const {
      project_id,
      model_id = "stable-audio-25",
      prompt,
      negative_prompt = null,
      composition_plan = null,
      music_length_ms: bodyMusicLengthMs = null,
      force_instrumental = true,
      output_format = "mp3_44100_128",
      respect_sections_durations = false,
      base_id: baseId = null,
    } = await request.json();

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data();
    let music_length_ms = bodyMusicLengthMs;
    if (music_length_ms == null || music_length_ms < 3000) {
      const scenesSnap = await projectRef.collection("scenes").get();
      if (!scenesSnap.empty) {
        const totalSeconds = scenesSnap.docs.reduce((sum, d) => {
          const dur = Math.max(1, Math.min(15, Math.round(Number(d.data().duration) || 8)));
          return sum + dur;
        }, 0);
        music_length_ms = Math.max(3000, Math.min(600000, totalSeconds * 1000));
      } else {
        const durSec = Math.max(5, Math.min(60, Number(projectData.duration_seconds) || 15));
        music_length_ms = durSec * 1000;
      }
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
    // When no prompt provided, we use base + quote/theme for variation. Base can come from Firebase.
    const baseTextFromFirebase = await getBasePromptFromFirebase(db, baseId);

    let finalPrompt = hasPrompt ? String(prompt).trim() : null;
    if (finalPrompt && model.supportsNegativePrompt === "append" && negative_prompt?.trim()) {
      finalPrompt = finalPrompt + "\n\nAvoid: " + negative_prompt.trim();
    }
    if (!finalPrompt && hasPlan && !model.supportsCompositionPlan) {
      const styles = composition_plan?.positive_global_styles;
      finalPrompt = Array.isArray(styles) && styles.length
        ? styles.join(", ")
        : getBasePromptOnly(baseId, baseTextFromFirebase);
    }
    if (!finalPrompt) {
      finalPrompt = getBasePromptOnly(baseId, baseTextFromFirebase);
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
      baseId,
      baseTextFromFirebase,
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

    const audioDataResponse = await fetch(audioUrl);
    if (!audioDataResponse.ok) {
      throw new Error("Failed to download generated music");
    }
    const audioBuffer = await audioDataResponse.arrayBuffer();
    const contentType = audioDataResponse.headers.get("content-type") || "audio/mpeg";
    const ext = contentType.includes("wav") ? "wav" : "mp3";
    const mimeType = contentType.includes("wav") ? "audio/wav" : "audio/mpeg";

    const bucket = getAdminStorage().bucket();
    const storageBasePath = `quote-videos/${project_id}/music`;
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
        },
      },
    });

    const musicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(musicFileName)}?alt=media&token=${downloadToken}`;

    const descriptionForStorage = hasPlan
      ? JSON.stringify(composition_plan)
      : String(prompt || "").trim();

    const promptForDisplay = hasPrompt
      ? String(prompt || "").trim()
      : (baseId && baseId !== "default" ? `Base only (${baseId})` : "Base only");

    const generationMetadata = {
      music_url: musicUrl,
      storage_path: musicFileName,
      prompt: promptForDisplay || null,
      base_id: baseId || null,
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
      session_id: null,
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

    const existingCosts = projectData.costs || {};
    const newMusicCost = (existingCosts.step4?.music || 0) + cost;
    const newStep4Total = (existingCosts.step4?.total || 0) + cost;
    const newTotal = (existingCosts.total || 0) + cost;

    await projectRef.update({
      background_music_id: musicRef.id,
      music_url: musicUrl,
      background_music_prompt: descriptionForStorage,
      music_prompt: prompt?.trim() || null,
      music_negative_prompt: negative_prompt?.trim() || null,
      costs: {
        ...existingCosts,
        step4: {
          ...existingCosts.step4,
          music: newMusicCost,
          total: newStep4Total,
        },
        total: newTotal,
      },
      updated_at: new Date().toISOString(),
    });

    // Append to the base prompt's sample_music array when music was generated with a base_id
    if (baseId && baseId !== "default") {
      try {
        const baseRef = db.collection(MUSIC_BASE_COLLECTION).doc(baseId);
        const baseDoc = await baseRef.get();
        const d = baseDoc.exists ? baseDoc.data() : {};
        let existing = Array.isArray(d.sample_music)
          ? d.sample_music.filter((s) => s && typeof s.url === "string")
          : d.sample_music_url
            ? [{ url: d.sample_music_url, id: d.sample_music_id || "" }]
            : [];
        const sample_music = [{ url: musicUrl, id: musicRef.id }, ...existing].slice(0, 10);
        await baseRef.set(
          { sample_music, updated_at: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {
        console.warn("Failed to update music base prompt sample", baseId, e?.message);
      }
    }

    return NextResponse.json({
      success: true,
      music_url: musicUrl,
      music_id: musicRef.id,
      cost,
    });
  } catch (error) {
    console.error("Quote generate-background-music error:", error);
    return NextResponse.json(
      { error: "Failed to generate background music", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
