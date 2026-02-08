// Brand instrument palette for music prompt generation
// Defines allowed instruments and rules for ElevenLabs Music output

export const INSTRUMENTS_LIBRARY = [
  // Primary – always allowed, signature sound
  {
    id: "warm_analog_synth_pad",
    name: "Warm analog synth pad",
    role: "primary",
    description: "Sustained chords, very slow movement, no rhythm, no lead. The voice of the future self.",
    use_for: "80–90% of videos, all timelines, all characters",
    behavior: "sustained chords, very slow movement, no rhythm, no lead",
    order: 1,
  },
  // Secondary – optional
  {
    id: "low_harmonic_pad_drone",
    name: "Low harmonic pad / drone",
    role: "secondary",
    description: "Very low volume, no pulse, supports the main pad. Emotional stability.",
    use_for: "Heavier days, reassurance, grounding moments",
    behavior: "very low volume, no pulse, supports the main pad",
    order: 2,
  },
  // Conditional – accent only, 10–20% max
  {
    id: "soft_felt_piano_distant",
    name: "Soft felt piano (distant)",
    role: "conditional",
    description: "No melody, no rhythm, very sparse notes, heavily softened. Memory, reflection, brief emotional color. Never piano alone.",
    use_for: "10–20% max. Accent only for memory/reflection moments",
    behavior: "no melody, no rhythm, very sparse notes, heavily softened",
    rules: "Never piano alone",
    order: 3,
  },
  // Forbidden – breaks the brand
  { id: "drums_percussion", name: "Drums / percussion", role: "forbidden", order: 10 },
  { id: "arpeggiators", name: "Arpeggiators", role: "forbidden", order: 11 },
  { id: "lead_synths", name: "Lead synths", role: "forbidden", order: 12 },
  { id: "strings", name: "Strings", role: "forbidden", order: 13 },
  { id: "guitar", name: "Guitar", role: "forbidden", order: 14 },
  { id: "brass", name: "Brass", role: "forbidden", order: 15 },
  { id: "plucks", name: "Plucks", role: "forbidden", order: 16 },
  { id: "bells", name: "Bells", role: "forbidden", order: 17 },
  { id: "choirs_vocals", name: "Choirs / vocals", role: "forbidden", order: 18 },
  {
    id: "sound_effects_ambience",
    name: "Sound effects / noise / ambience",
    role: "forbidden",
    order: 19,
  },
];
