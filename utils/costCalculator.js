// API Cost Calculator
// Prices as of 2024 - update these based on actual pricing

export const API_COSTS = {
  // Claude AI - Sonnet 4 pricing per million tokens
  CLAUDE_INPUT_PER_MILLION: 3.00,
  CLAUDE_OUTPUT_PER_MILLION: 15.00,

  // ElevenLabs - per 1000 characters
  ELEVENLABS_PER_1000_CHARS: 0.30, // Varies by plan, using average

  // FAL AI - Flux Schnell (image generation)
  FAL_FLUX_SCHNELL_PER_IMAGE: 0.003,

  // FAL AI - Veo3.1 Fast (image-to-video)
  FAL_VEO_PER_VIDEO: 0.05, // Approximate

  // Shotstack - per render minute
  SHOTSTACK_PER_MINUTE: 0.05, // Varies by plan
};

export function calculateClaudeCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * API_COSTS.CLAUDE_INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * API_COSTS.CLAUDE_OUTPUT_PER_MILLION;
  return inputCost + outputCost;
}

export function calculateElevenLabsCost(characterCount) {
  return (characterCount / 1000) * API_COSTS.ELEVENLABS_PER_1000_CHARS;
}

export function calculateFalImageCost(imageCount) {
  return imageCount * API_COSTS.FAL_FLUX_SCHNELL_PER_IMAGE;
}

export function calculateFalVideoCost(videoCount) {
  return videoCount * API_COSTS.FAL_VEO_PER_VIDEO;
}

export function calculateShotstackCost(durationSeconds) {
  const minutes = durationSeconds / 60;
  return minutes * API_COSTS.SHOTSTACK_PER_MINUTE;
}

export function formatCost(cost) {
  return `$${cost.toFixed(4)}`;
}

export function calculateTotalProjectCost(costs = {}) {
  return (
    (costs.claude || 0) +
    (costs.elevenlabs || 0) +
    (costs.fal_images || 0) +
    (costs.fal_videos || 0) +
    (costs.shotstack || 0)
  );
}
