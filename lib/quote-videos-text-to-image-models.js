/**
 * Text-to-image model options for quote-videos (Step 2).
 * Reads from env: NEXT_PUBLIC_QUOTE_VIDEOS_TEXT_TO_IMAGE_MODEL_OPTIONS (comma-separated "id|Label|bodyType"),
 *                NEXT_PUBLIC_QUOTE_VIDEOS_IMAGE_MODEL_DEFAULT.
 * Uses direct process.env refs so Next.js inlines them on the client.
 */

const BODY_TYPES = new Set(["flux", "grok", "nano_banana"]);

function parseModelOptions(raw) {
  const list = [];
  (raw || "").split(",").forEach((s) => {
    const t = s.trim();
    if (!t) return;
    const parts = t.split("|").map((p) => p.trim());
    const id = parts[0] || "";
    const label = parts[1] || id;
    const bodyType = parts[2] && BODY_TYPES.has(parts[2]) ? parts[2] : "flux";
    if (id) list.push({ id, label, bodyType });
  });
  return list;
}

export function getQuoteVideosTextToImageModels() {
  return parseModelOptions(
    typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_QUOTE_VIDEOS_TEXT_TO_IMAGE_MODEL_OPTIONS
      : undefined
  );
}

export function getQuoteVideosImageModelDefault() {
  const models = getQuoteVideosTextToImageModels();
  const envDefault =
    typeof process !== "undefined" && process.env
      ? (process.env.NEXT_PUBLIC_QUOTE_VIDEOS_IMAGE_MODEL_DEFAULT || "").trim()
      : "";
  const allowed = new Set(models.map((m) => m.id));
  return envDefault && allowed.has(envDefault) ? envDefault : (models[0]?.id || "");
}

/** Body type for Fal request shape (flux | grok | nano_banana). Used by API only. */
export function getBodyTypeForModel(modelId) {
  const models = getQuoteVideosTextToImageModels();
  const found = models.find((m) => m.id === modelId);
  return found?.bodyType || "flux";
}

/** Parsed options from env (for UI dropdown). Static refs so Next.js inlines at build. */
export const QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS = parseModelOptions(
  typeof process !== "undefined" && process.env
    ? process.env.NEXT_PUBLIC_QUOTE_VIDEOS_TEXT_TO_IMAGE_MODEL_OPTIONS
    : ""
);

/** Default model id from env. */
export const DEFAULT_QUOTE_VIDEOS_IMAGE_MODEL = (() => {
  const models = QUOTE_VIDEOS_TEXT_TO_IMAGE_MODELS;
  const envDefault =
    typeof process !== "undefined" && process.env
      ? (process.env.NEXT_PUBLIC_QUOTE_VIDEOS_IMAGE_MODEL_DEFAULT || "").trim()
      : "";
  const allowed = new Set(models.map((m) => m.id));
  return envDefault && allowed.has(envDefault) ? envDefault : (models[0]?.id || "");
})();
