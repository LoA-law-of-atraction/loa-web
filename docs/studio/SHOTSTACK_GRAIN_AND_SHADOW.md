# Shotstack: Grain and Shadow (API + Studio SDK)

Reference for how grain and text shadow are applied in the Edit API and in our preview (Studio SDK + DOM overlay).

## Official docs

- **Edit API (render)**: [Shotstack API Reference](https://shotstack.io/docs/api/) — timeline, clips, assets.
- **Studio SDK (preview)**: [shotstack-studio-sdk](https://github.com/shotstack/shotstack-studio-sdk) — same Edit JSON schema; canvas renders tracks.

---

## 1. Text shadow (quote/subtitle)

### Edit API (rich-text asset)

Use **RichTextAsset** with optional `shadow` and `stroke`:

```json
{
  "type": "rich-text",
  "text": "Your quote",
  "font": { "family": "Work Sans", "size": 72, "color": "#FFFFFF" },
  "align": { "horizontal": "center", "vertical": "middle" },
  "shadow": {
    "offsetX": 2,
    "offsetY": 2,
    "blur": 8,
    "color": "#000000",
    "opacity": 0.7
  },
  "stroke": {
    "width": 2,
    "color": "#000000",
    "opacity": 1
  }
}
```

- **Shadow**: Only add when shadow is enabled and strength > 0. `blur` and `opacity` can be derived from a 0–100 “strength” (e.g. opacity ≈ 0.4 + strength/100 * 0.55, blur ≈ 2 + strength/100 * 12).
- **Stroke**: Optional outline; independent of shadow.
- **Clip position**: Use clip-level `position`: `"center"` | `"top"` | `"bottom"` etc. so the text appears where the user chose in the timeline editor.

### Our implementation

- **Assemble** (`app/api/quote-videos/assemble/route.js`): Builds `quoteAsset` with `shadow` (only if `subtitleShadow && shadowStrength > 0`) and `stroke` from `timeline_settings`. Clip position should come from `timeline_settings.subtitlePosition` (see below).
- **Preview** (`components/admin/TimelineEditor.js`): Quote is a **DOM overlay** on top of the Studio canvas (SDK does not render our quote track). We use CSS `textShadow` and optional stroke `filter` only when position is **bottom** or **top** (no shadow for center) so the preview matches the “no shadow on center” behavior.

---

## 2. Grain overlay

### Edit API (video/image clip)

Grain is a **separate track** with a single clip:

- **Asset**: `type: "video"` (e.g. `.mp4`/`.mov`) or `type: "image"` (e.g. `.png`), `src`: public URL.
- **Clip**: `fit: "cover"`, `position: "center"`, `opacity`: 0–1 (e.g. 0.2). Use **clip-level** `opacity`, not asset-level.
- **Layering**: Tracks are ordered first = top. So: track 0 = quote text, track 1 = grain, track 2 = video(s), then audio.

```json
{
  "clips": [{
    "asset": { "type": "video", "src": "https://..../grain.mov" },
    "start": 0,
    "length": 30,
    "fit": "cover",
    "position": "center",
    "opacity": 0.2
  }]
}
```

### Studio SDK (preview)

The Studio SDK loads the same Edit JSON. PixiJS (used by the SDK) may fail to load some grain assets (e.g. `.mov`), which can break `loadEdit`. So we:

- **Do not** add the grain clip to the edit passed to the Studio SDK.
- **Do** show grain in the preview via a **DOM overlay** (video or image) on top of the canvas, with the same opacity and URL.

### Our implementation

- **Assemble**: We push a grain track (video or image by URL extension) with clip `opacity` capped at 0.6. URL must be public HTTPS (e.g. Firebase Storage).
- **Preview**: We render grain only in the DOM overlay when `grainOverlayUrl` is set; opacity is capped at 0.6.

---

## 3. Track order (summary)

| Index | Content        | Notes                    |
|-------|----------------|--------------------------|
| 0     | Quote (rich-text) | Top layer; clip `position` from settings |
| 1     | Grain (video/image) | Optional; clip `opacity` 0–0.6         |
| 2     | Video clip(s)  | Main footage             |
| 3     | Music (audio)  | Optional                 |

---

## 4. Checklist

- [x] Quote shadow: only add `shadow` when enabled and strength > 0 (API).
- [x] Quote stroke: optional; independent of shadow (API).
- [x] Grain: separate track, clip-level `opacity`, correct asset type (video/image) by URL (API).
- [x] Preview: quote as DOM overlay; shadow only for bottom/top; grain as DOM overlay when SDK would fail on grain asset.
- [x] Quote clip `position`: pass `timeline_settings.subtitlePosition` into assemble so render matches editor (center/top/bottom).
