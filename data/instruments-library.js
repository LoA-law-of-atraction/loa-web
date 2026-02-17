// Brand instrument palette for music prompt generation
// Piano = emotional lead. Pads = world/atmosphere.
// Used by seed and admin instruments; Step 5 no longer shows palette UI.

export const INSTRUMENTS_LIBRARY = [
  // Primary – piano as emotional lead
  {
    id: "soft_felt_piano_lead",
    name: "Soft felt piano (emotional lead)",
    role: "primary",
    description: "Carries chord progression, creates harmonic movement. Expressive but restrained. Slow chord changes, minor key, occasional suspended or unresolved tones. Harmonic storytelling, not melodic performance. No arpeggios, no fast phrasing, no romantic ballad.",
    use_for: "Emotional narrator of the piece",
    behavior: "slow chord changes, harmonic movement, restrained expressiveness",
    order: 1,
  },
  // Secondary – pads create the world
  {
    id: "analog_synth_pad",
    name: "Analog synth pad",
    role: "secondary",
    description: "Creates depth, atmosphere, retro-futuristic space. Sustains, moves slowly, stays behind the piano, never dominates.",
    use_for: "World/atmosphere behind the piano",
    behavior: "sustain, slow movement, support emotional weight",
    order: 2,
  },
  // Optional – low drone
  {
    id: "low_harmonic_pad_drone",
    name: "Low harmonic pad / drone",
    role: "conditional",
    description: "Very low volume, no pulse. Supports depth. Use sparingly.",
    use_for: "Extra depth when needed",
    behavior: "very low volume, no pulse",
    rules: "Optional, 10–20% max",
    order: 3,
  },
  // Forbidden
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
