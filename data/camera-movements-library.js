// Curated library of camera movements for image-to-video generation

export const CAMERA_MOVEMENTS_LIBRARY = [
  {
    id: "static_locked",
    name: "Static (Locked Off)",
    description:
      "No camera motion. Locked frame with only natural micro-movement in the scene.",
    tags: ["static", "locked", "minimal"],
  },
  {
    id: "slow_push_in",
    name: "Slow Push-In",
    description:
      "Very subtle dolly/push-in toward the subject for emotional emphasis.",
    tags: ["push-in", "dolly", "subtle", "cinematic"],
  },
  {
    id: "slow_pull_out",
    name: "Slow Pull-Out",
    description:
      "Very subtle pull-back to reveal a bit more space and breathe.",
    tags: ["pull-out", "dolly", "subtle"],
  },
  {
    id: "slow_pan_left",
    name: "Slow Pan Left",
    description:
      "Gentle pan left, minimal and smooth, keeping the subject centered.",
    tags: ["pan", "left", "slow"],
  },
  {
    id: "slow_pan_right",
    name: "Slow Pan Right",
    description:
      "Gentle pan right, minimal and smooth, keeping the subject centered.",
    tags: ["pan", "right", "slow"],
  },
  {
    id: "gentle_handheld",
    name: "Gentle Handheld",
    description: "Slight handheld drift/sway—very controlled, not shaky.",
    tags: ["handheld", "drift", "subtle"],
  },
  {
    id: "micro_parallax",
    name: "Micro Parallax",
    description:
      "Tiny parallax shift (foreground/background separation) without changing the scene.",
    tags: ["parallax", "depth", "subtle"],
  },
  {
    id: "rack_focus_subtle",
    name: "Subtle Focus Shift",
    description:
      "Small depth-of-field / focus breathing shift for cinematic texture.",
    tags: ["focus", "depth", "cinematic"],
  },
];
