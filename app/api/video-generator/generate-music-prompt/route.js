import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt, loadPrompt } from "@/utils/promptService";
import { getAdminDb } from "@/utils/firebaseAdmin";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function loadInstrumentRulesFormat() {
  try {
    const raw = loadPrompt("instrument-rules-format");
    const labels = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        labels[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
      }
    }
    return {
      primary_label: labels.primary_label ?? "PRIMARY (always allowed, 80–90%)",
      secondary_label: labels.secondary_label ?? "SECONDARY (optional)",
      conditional_label:
        labels.conditional_label ?? "CONDITIONAL (10–20% max, use sparingly)",
      forbidden_label: labels.forbidden_label ?? "DO NOT USE",
      fallback_empty:
        labels.fallback_empty ??
        "None configured. Use warm ambient pads, no drums, no vocals, no rhythm.",
      closing:
        labels.closing ??
        "AVOID anything that suggests motion, performance, drama, or urgency.",
    };
  } catch (err) {
    console.warn("Could not load instrument-rules-format, using defaults:", err);
    return {
      primary_label: "PRIMARY (always allowed, 80–90%)",
      secondary_label: "SECONDARY (optional)",
      conditional_label: "CONDITIONAL (10–20% max, use sparingly)",
      forbidden_label: "DO NOT USE",
      fallback_empty:
        "None configured. Use warm ambient pads, no drums, no vocals, no rhythm.",
      closing:
        "AVOID anything that suggests motion, performance, drama, or urgency.",
    };
  }
}

function buildInstrumentRules(instruments) {
  const fmt = loadInstrumentRulesFormat();

  if (!instruments?.length) {
    return fmt.fallback_empty;
  }

  const primary = instruments.filter((i) => i.role === "primary");
  const secondary = instruments.filter((i) => i.role === "secondary");
  const conditional = instruments.filter((i) => i.role === "conditional");
  const forbidden = instruments.filter((i) => i.role === "forbidden");

  const lines = [];

  if (primary.length > 0) {
    lines.push(fmt.primary_label + ":");
    primary.forEach((i) => {
      const desc = i.description || i.behavior || "";
      lines.push(`- ${i.name}${desc ? `: ${desc}` : ""}`);
    });
  }

  if (secondary.length > 0) {
    lines.push("");
    lines.push(fmt.secondary_label + ":");
    secondary.forEach((i) => {
      const desc = i.description || i.behavior || "";
      lines.push(`- ${i.name}${desc ? `: ${desc}` : ""}`);
    });
  }

  if (conditional.length > 0) {
    lines.push("");
    lines.push(fmt.conditional_label + ":");
    conditional.forEach((i) => {
      const desc = i.description || i.behavior || "";
      const rules = i.rules ? ` ${i.rules}` : "";
      lines.push(`- ${i.name}${desc ? `: ${desc}` : ""}${rules}`);
    });
  }

  if (forbidden.length > 0) {
    lines.push("");
    lines.push(fmt.forbidden_label + ":");
    forbidden.forEach((i) => {
      lines.push(`- ${i.name}`);
    });
  }

  lines.push("");
  lines.push(fmt.closing);

  return lines.join("\n");
}

export async function POST(request) {
  try {
    const {
      theme_description,
      topic,
      script,
      scene_locations,
      instrument_ids,
      use_instrument_palette = true,
    } = await request.json();

    if (!theme_description?.trim()) {
      return NextResponse.json(
        { error: "theme_description is required" },
        { status: 400 },
      );
    }

    // Fetch instruments and build rules (skip if use_instrument_palette is false)
    let instruments = [];
    if (use_instrument_palette !== false) {
      try {
        const db = getAdminDb();
        const snapshot = await db.collection("instruments").get();
        instruments = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        if (Array.isArray(instrument_ids) && instrument_ids.length > 0) {
          const idSet = new Set(instrument_ids);
          instruments = instruments.filter((i) => idSet.has(i.id));
        }
      } catch (err) {
        console.warn("Could not load instruments, using fallback:", err);
      }
    }

    const instrument_rules = buildInstrumentRules(instruments);

    const scene_locations_text =
      scene_locations && typeof scene_locations === "string"
        ? scene_locations.trim()
        : Array.isArray(scene_locations) && scene_locations.length > 0
          ? scene_locations
              .map((s) =>
                s.location_name
                  ? `Scene ${s.scene_id}: ${s.location_name}`
                  : `Scene ${s.scene_id}: (no location)`,
              )
              .join("\n")
          : "None specified";

    const prompt = getPrompt("music-prompt-from-theme", {
      theme_description: String(theme_description || "").trim(),
      topic: String(topic || "").trim(),
      script: String(script || "").trim(),
      scene_locations: scene_locations_text,
      instrument_rules,
    });

    const message = await anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content?.[0]?.text || "").trim();

    return NextResponse.json({
      success: true,
      prompt: text,
    });
  } catch (error) {
    console.error("Generate music prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate music prompt", message: error.message },
      { status: 500 },
    );
  }
}
