// API Cost Calculator
// Prices loaded from environment variables

export const API_COSTS = {
  // Claude AI - Sonnet 4 pricing per million tokens
  CLAUDE_INPUT_PER_MILLION: parseFloat(process.env.NEXT_PUBLIC_CLAUDE_INPUT_PER_MILLION || "0.00"),
  CLAUDE_OUTPUT_PER_MILLION: parseFloat(process.env.NEXT_PUBLIC_CLAUDE_OUTPUT_PER_MILLION || "0.00"),

  // ElevenLabs - subscription plan configuration
  ELEVENLABS_PLAN_COST: parseFloat(process.env.ELEVENLABS_PLAN_COST || "0.00"),
  ELEVENLABS_PLAN_CREDITS: parseFloat(process.env.ELEVENLABS_PLAN_CREDITS || "0"),
  ELEVENLABS_OVERAGE_PER_1000_CHARS: parseFloat(process.env.ELEVENLABS_OVERAGE_PER_1000_CHARS || "0.00"),

  // Shotstack - per render minute
  SHOTSTACK_PER_MINUTE: parseFloat(process.env.SHOTSTACK_PER_MINUTE || "0.00"),
};

export function calculateClaudeCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * API_COSTS.CLAUDE_INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * API_COSTS.CLAUDE_OUTPUT_PER_MILLION;
  return inputCost + outputCost;
}

export function getElevenLabsCostPerChar() {
  // Calculate exact cost per character based on plan
  // monthly_cost / included_credits = cost per character
  if (API_COSTS.ELEVENLABS_PLAN_CREDITS > 0) {
    return API_COSTS.ELEVENLABS_PLAN_COST / API_COSTS.ELEVENLABS_PLAN_CREDITS;
  }
  // Fallback to overage rate
  return API_COSTS.ELEVENLABS_OVERAGE_PER_1000_CHARS / 1000;
}

export function calculateElevenLabsCost(characterCount) {
  // Calculate total cost based on character count
  // Uses exact cost per character from plan
  const costPerChar = getElevenLabsCostPerChar();
  return characterCount * costPerChar;
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
