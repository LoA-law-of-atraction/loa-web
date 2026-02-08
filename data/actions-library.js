// Curated library of character actions/poses for "SOFT DYSTOPIA" video generation
// Each action captures character poses and expressions ONLY - no location/environment details
// Locations are handled separately - focus here is on what the CHARACTER is doing

export const ACTIONS_LIBRARY = [
  {
    id: "contemplating_01",
    name: "Contemplating",
    description: "Character in quiet contemplation, lost in thought. Thoughtful pose with warm light on face creating intimate, introspective mood.",
    pose_variations: [
      "sitting with chin resting on hand, gazing thoughtfully into middle distance, warm amber glow on face",
      "leaning posture with arms crossed, looking down contemplatively, soft orange light illuminating face from above",
      "seated with elbows on knees and hands clasped, staring into distance, warm light casting gentle shadows on face",
      "standing with hand on chin in thinking pose, face bathed in warm tungsten light, thoughtful expression"
    ],
    expression: "thoughtful and introspective, carrying quiet hope, gentle melancholy mixed with resilience",
    tags: ["introspective", "quiet", "thoughtful", "contemplative", "warm_light"]
  },
  {
    id: "listening_01",
    name: "Listening",
    description: "Character absorbed in sound, wearing headphones or tilting head to listen carefully. Eyes closed or gently focused, face relaxed in peaceful concentration.",
    pose_variations: [
      "sitting with head tilted slightly, eyes closed, wearing vintage headphones, face lit by warm amber light",
      "leaning back with head resting, wearing headphones, absorbed in sound, warm orange light on face",
      "standing still with head tilted, hand near one ear listening intently, face lit by warm soft light",
      "seated with hand adjusting headphones, eyes closed in concentration, warm tungsten light on face"
    ],
    expression: "peaceful absorption, finding solace in sound, quiet contentment",
    tags: ["listening", "peaceful", "absorbed", "focused", "headphones"]
  },
  {
    id: "gazing_01",
    name: "Gazing Out",
    description: "Character looking outward with distant, observant expression. Standing or seated posture suggesting patient observation and quiet reflection.",
    pose_variations: [
      "standing with one hand raised touching something in front, gazing outward, warm light on face from behind",
      "seated with chin in hand, looking forward with distant gaze, warm amber light illuminating face",
      "leaning forward on something, hands together, looking outward with observant expression, warm light from behind",
      "standing with hands in pockets, looking forward with steady gaze, bathed in warm interior light"
    ],
    expression: "wistful longing mixed with quiet hope, observant yet contemplative",
    tags: ["watching", "observing", "distant", "thoughtful", "gazing"]
  },
  {
    id: "waiting_01",
    name: "Waiting",
    description: "Character in patient waiting pose. Seated or standing with calm, expectant body language. Hands folded or arms crossed in relaxed anticipation.",
    pose_variations: [
      "seated with hands folded in lap, patient posture, warm overhead light creating amber pool on face",
      "standing with arms crossed, leaning slightly, face illuminated in soft orange glow, calm expression",
      "sitting with hands wrapped around something warm, waiting quietly, warm light on face",
      "leaning on something with patient pose, face bathed in tungsten glow, looking ahead calmly"
    ],
    expression: "patient resilience, calm acceptance, quietly expectant with subdued hope",
    tags: ["waiting", "patient", "calm", "still", "expectant"]
  },
  {
    id: "interacting_01",
    name: "Interacting with Tech",
    description: "Character engaging with technology - holding phone, touching screen/buttons, typing. Hands actively interacting with device, face showing focused engagement.",
    pose_variations: [
      "holding phone receiver to ear, speaking quietly, face lit by warm light, one hand holding device",
      "hand extended touching buttons or screen, face lit by warm amber glow from device, focused expression",
      "standing with both hands on device or screen, face bathed in warm orange glow, examining intently",
      "seated with both hands positioned for typing or interaction, warm desk lamp illuminating face from side"
    ],
    expression: "focused engagement tinged with nostalgia, concentrated attention",
    tags: ["interacting", "focused", "engaged", "hands", "device"]
  },
  {
    id: "cooking_01",
    name: "Cooking",
    description: "Character preparing food with careful, deliberate movements. Hands actively chopping, stirring, or plating. Focused domestic activity with warm, intimate lighting on face.",
    pose_variations: [
      "standing with hands positioned for chopping motion, face illuminated in amber glow from above, focused downward",
      "stirring motion with one hand, warm orange light on face from above, thoughtful expression",
      "hands positioned carefully for plating or arranging, warm task light creating intimate amber illumination on face, delicate focused movements",
      "leaning forward slightly, one hand holding utensil to taste, contemplative expression, face bathed in tungsten glow"
    ],
    expression: "focused care mixed with quiet contentment, finding warmth in simple acts",
    tags: ["cooking", "domestic", "focused", "hands", "caring"]
  },
  {
    id: "journaling_01",
    name: "Journaling",
    description: "Character writing in journal or on paper. Bent over writing surface with pen in hand, face showing concentration. Quiet, introspective pose focused on the act of writing.",
    pose_variations: [
      "seated and bent over writing surface, pen in hand actively writing, face illuminated in warm amber glow from above",
      "sitting with writing surface on lap, pausing to think before writing, hand holding pen, warm side lighting on face",
      "leaning over surface with focused writing posture, pen in hand, warm tungsten light pooling on face",
      "seated with pen hovering thoughtfully over page, contemplative pause in writing, warm light creating intimate atmosphere on face"
    ],
    expression: "introspective vulnerability mixed with quiet determination, thoughtful concentration",
    tags: ["writing", "introspective", "focused", "hands", "contemplative"]
  },
  {
    id: "reading_01",
    name: "Reading",
    description: "Character absorbed in reading physical book or document. Holding book/paper with focused attention, face showing absorbed concentration in the act of reading.",
    pose_variations: [
      "seated with book held up in reading position, absorbed in pages, face bathed in warm amber light from side",
      "leaning posture while reading held document or newspaper, face illuminated in tungsten glow, focused on text",
      "sitting with book open in hands, finger tracing lines of text, warm overhead light on face, lost in reading",
      "standing while reading held document or letter, face thoughtfully lit from warm light source, examining text carefully"
    ],
    expression: "absorbed curiosity mixed with quiet reverence, focused concentration",
    tags: ["reading", "quiet", "absorbed", "focused", "contemplative"]
  },
  {
    id: "arms_crossed_01",
    name: "Arms Crossed",
    description: "Character standing or leaning with arms crossed over chest. Defensive or contemplative body language, creating closed but thoughtful posture.",
    pose_variations: [
      "standing upright with arms crossed, looking slightly to the side, warm light on face creating depth",
      "leaning with arms crossed, one shoulder lower than the other, thoughtful gaze, side-lit by warm light",
      "standing with arms crossed high on chest, looking forward directly, face evenly lit by warm ambient light",
      "arms crossed with hands gripping elbows, more closed posture, looking down slightly, warm top lighting on face"
    ],
    expression: "guarded yet thoughtful, protective stance with underlying vulnerability",
    tags: ["standing", "arms_crossed", "defensive", "contemplative", "closed"]
  },
  {
    id: "hands_in_pockets_01",
    name: "Hands in Pockets",
    description: "Character standing with hands in pockets. Casual, relaxed or contemplative stance. Weight may shift to one leg for natural asymmetry.",
    pose_variations: [
      "standing with both hands in pockets, weight on one leg, looking forward, warm light creating side shadow on face",
      "standing with hands deep in pockets, shoulders slightly hunched, looking down, warm overhead light on face",
      "casual stance with hands in pockets, one shoulder slightly back, looking to the side, face lit by warm ambient light",
      "standing straight with hands in pockets, confident posture, looking ahead, even warm lighting on face"
    ],
    expression: "casual confidence or quiet contemplation, relaxed demeanor",
    tags: ["standing", "casual", "relaxed", "hands", "contemplative"]
  },
  {
    id: "sitting_hunched_01",
    name: "Sitting Hunched",
    description: "Character sitting with hunched forward posture. Elbows on knees, shoulders curved forward, creating introspective or weary body language.",
    pose_variations: [
      "sitting with elbows on knees, head down, hands clasped between knees, warm light from above casting shadows",
      "seated hunched forward, face in hands, elbows on knees, warm side light illuminating face through fingers",
      "sitting with forearms on knees, looking down, shoulders curved forward, warm light creating dramatic shadows",
      "hunched seated pose with hands gripping knees, looking at the ground, warm overhead light on back of head and shoulders"
    ],
    expression: "weariness mixed with resilience, contemplative exhaustion, quiet strength",
    tags: ["sitting", "hunched", "tired", "contemplative", "vulnerable"]
  },
  {
    id: "looking_over_shoulder_01",
    name: "Looking Over Shoulder",
    description: "Character turning to look back over their shoulder. Dynamic pose suggesting awareness or curiosity about something behind them.",
    pose_variations: [
      "standing and turned to look over right shoulder, face partially lit by warm light from behind",
      "seated with torso twisted to look back over left shoulder, warm side light catching face profile",
      "mid-turn with head looking back over shoulder, hand rising to touch face or hair, warm light on turned face",
      "leaning with one hand on support, looking back over shoulder with curious expression, warm backlight creating rim light"
    ],
    expression: "curious awareness, gentle alertness, thoughtful acknowledgment",
    tags: ["turning", "looking_back", "dynamic", "aware", "curious"]
  }
];
