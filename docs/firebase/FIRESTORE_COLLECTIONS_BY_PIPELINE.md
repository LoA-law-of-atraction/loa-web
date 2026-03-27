# Firestore collections by pipeline

How collections map to **Character Shorts** vs **Quote Videos**, and how to manage them (backups, copy dev→prod, cleanup).

---

## Character Shorts only

| Collection | Purpose | Admin / Notes |
|------------|---------|----------------|
| `projects` | Character short projects (topic, script, timeline, music ref) | **Character Shorts → Projects** |
| `projects/{id}/scenes` | Per-project scene data (images, videos, locations, prompts) | Under each project |
| `video_sessions` | Render state for character shorts (session_id = project flow session) | Used by assemble + post-social; see “Shared” below |
| `characters` | Avatars (voice, images); optional `characters/{id}/projects` | **Character Shorts → Characters** |
| `voiceovers` | Generated voiceover files (linked to project/session) | Used by pipeline |
| `music` | Generated background music | **Character Shorts → Musics** |
| `locations` | Location library for scenes | **Character Shorts → Locations** |
| `actions` | Action library for video prompts | **Character Shorts → Actions** |
| `camera_movements` | Camera movement library | **Character Shorts → Camera Movements** |
| `character_motions` | Character motion library | **Character Shorts → Character Motions** |
| `topics` | Topic library for script generation | **Character Shorts → Topics** |
| `topic_categories` | Categories for topics | **Character Shorts → Categories** |
| `music_themes` | Music theme config (used by generate APIs) | No admin UI (API-only) |
| `instruments` | Instrument config (used by generate APIs) | No admin UI (API-only) |
| `settings` | App settings (e.g. default music theme) | API-only |

---

## Quote Videos only

| Collection | Purpose | Admin / Notes |
|------------|---------|----------------|
| `quote_projects` | Quote video projects (theme, quote_text, quote_list, youtube_*, background_image_url, animation_video_url, final_video_url, costs, current_step) | **Quote Videos → Projects**. Flow: Quote(1) → Image(2) → Generate video(3) → Render(4) → Post(5). `current_step` = 1–5, saved like character shorts. `background_image_url` = step 2 image; `animation_video_url` = step 3 video. |
| `quote_themes` | User-added theme suggestions (theme, created_at); doc id = slug of theme | Populated when user clicks Next on Quote step; used by theme autocomplete. |

Quote pipeline uses **the same** `video_sessions` with `session_id = quote_projects doc id` so post-social can read `final_video_url`. So `video_sessions` contains both character-short and quote sessions; distinguish by whether the doc id is a character `project` session or a `quote_projects` id if needed.

---

## Shared across pipelines

| Collection | Purpose | Notes |
|------------|---------|--------|
| `video_sessions` | Render status + `final_video_url` for both pipelines | Character: session_id from generator flow. Quote: session_id = quote_projects doc id. **Rendered Videos** page lists both. |
| `integrations` | OAuth tokens (e.g. `instagram`, `youtube`) | **Do not** copy between envs; prod should connect its own accounts. |

---

## Best practices for managing them

### 1. **By pipeline (recommended)**

- **Backups / export**: Export Character Shorts collections and Quote collections separately if you want pipeline-specific backups (e.g. only `projects`, `quote_projects`, `video_sessions` plus the character-short libraries).
- **Copy dev → prod**: Use the existing script and `COLLECTIONS` list; include:
  - Character Shorts: `projects`, `characters`, `voiceovers`, `music`, `locations`, `actions`, `camera_movements`, `character_motions`, `topics`, `topic_categories`, `music_themes`, `instruments`, `settings`
  - Quote: `quote_projects`
  - Shared: `video_sessions` (optional; often re-created by usage). **Exclude** `integrations` in prod.
- **Cleanup**: To free space, you can delete old docs in `music`, `voiceovers`, or old `projects` / `quote_projects`; keep `integrations` and `settings` unless you intend to reset them.

### 2. **Naming convention (already in place)**

- Quote-only data lives under **`quote_projects`** (and quote entries in `video_sessions`).
- Everything else in the table above is Character Shorts or shared. No need to rename existing collections.

### 3. **Admin UI**

- **Character Shorts**: Pipeline, Projects, Characters, Locations, Actions, Camera Movements, Character Motions, Musics, Rendered Videos, Topics, Categories, Budget.
- **Quote Videos**: Pipeline, Projects, Quotes. Rendered Videos shows both pipelines’ outputs.
- There is no need for a separate “collections manager” unless you want a single screen that lists collection names and doc counts; the existing menus already map to the right data.

### 4. **Separate Firebase project (optional)**

- For strict isolation (e.g. different team or billing), you could put Quote Videos in a second Firebase project and point Quote APIs at that DB. This is a larger change (env, init, all quote-videos APIs). Only do it if you have a strong requirement to separate.

---

## Quick reference: where is it?

- **Character short project list** → `projects` (admin: Character Shorts → Projects).
- **Quote project list** → `quote_projects` (admin: Quote Videos → Projects).
- **All rendered outputs** → `projects.final_video_url` + `quote_projects.final_video_url` (admin: Character Shorts → Rendered Videos).
- **OAuth / post-social** → `integrations` + `video_sessions` (session_id + final_video_url).
