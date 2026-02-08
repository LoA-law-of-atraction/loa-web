// Selectable music generation models for Step 5
// Endpoints and costs come from env (see .env.example). Fallbacks used if not set.

const MODEL_DEFAULTS = [
  {
    id: "elevenlabs",
    name: "ElevenLabs Music",
    defaultEndpoint: "fal-ai/elevenlabs/music",
    supportsCompositionPlan: true,
    supportsNegativePrompt: "append",
    durationParam: "music_length_ms",
    output_format: "mp3_44100_128",
    pricingUnit: "min",
    defaultCostPerUnit: 0.8,
    envEndpoint: "FAL_MUSIC_MODEL_ELEVENLABS",
    envCost: "FAL_MUSIC_COST_ELEVENLABS_PER_MIN",
  },
  {
    id: "stable-audio-25",
    name: "Stable Audio 2.5",
    defaultEndpoint: "fal-ai/stable-audio-25/text-to-audio",
    supportsCompositionPlan: false,
    supportsNegativePrompt: "append",
    durationParam: "seconds_total",
    output_format: null,
    pricingUnit: "output",
    defaultCostPerUnit: 0.2,
    envEndpoint: "FAL_MUSIC_MODEL_STABLE_AUDIO_25",
    envCost: "FAL_MUSIC_COST_STABLE_AUDIO_25",
  },
  {
    id: "beatoven",
    name: "Beatoven",
    defaultEndpoint: "beatoven/music-generation",
    supportsCompositionPlan: false,
    supportsNegativePrompt: "native",
    durationParam: "duration",
    output_format: null,
    pricingUnit: "output",
    defaultCostPerUnit: 0.1,
    envEndpoint: "FAL_MUSIC_MODEL_BEATOVEN",
    envCost: "FAL_MUSIC_COST_BEATOVEN",
  },
];

// For client: simple list with defaults (env not available)
export const MUSIC_MODELS = MODEL_DEFAULTS.map((m) => ({
  ...m,
  endpoint: m.defaultEndpoint,
  fallbackCostPerUnit: m.defaultCostPerUnit,
}));

export function getMusicModelById(id) {
  return MUSIC_MODELS.find((m) => m.id === id) || MUSIC_MODELS[0];
}

export function getMusicModelByEndpoint(endpoint) {
  return MUSIC_MODELS.find((m) => m.endpoint === endpoint) || MUSIC_MODELS[0];
}

/** Server-only: resolve endpoint and cost from env. Use in API routes. */
export function getResolvedMusicModel(id) {
  const def = MODEL_DEFAULTS.find((m) => m.id === id) || MODEL_DEFAULTS[0];
  const endpoint =
    (typeof process !== "undefined" && process.env?.[def.envEndpoint]) || def.defaultEndpoint;
  let fallbackCostPerUnit = def.defaultCostPerUnit;
  if (typeof process !== "undefined") {
    const rawCost = process.env?.[def.envCost];
    if (rawCost != null && rawCost !== "") {
      fallbackCostPerUnit = parseFloat(rawCost);
    } else if (def.id === "elevenlabs") {
      const legacy = process.env?.FAL_ELEVENLABS_MUSIC_COST_PER_MINUTE;
      if (legacy != null && legacy !== "") {
        fallbackCostPerUnit = parseFloat(legacy);
      }
    }
  }
  return {
    ...def,
    endpoint,
    fallbackCostPerUnit,
  };
}
