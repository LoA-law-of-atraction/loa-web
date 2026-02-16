/**
 * Edit model – central source of truth for the timeline.
 * Mimics Shotstack Studio SDK pattern: single Edit object drives rendering and export.
 *
 * The Edit holds the timeline structure (tracks, clips) in Shotstack format.
 * UI renders from edit.timeline; getEdit() returns the same JSON for the Shotstack API.
 */

/**
 * @typedef {Object} EditConfig
 * @property {Object} output - { format, size: { width, height } }
 * @property {Object} timeline - { background, tracks: Array<{ clips: Clip[] }> }
 */

/**
 * @typedef {Object} Clip
 * @property {Object} asset - { type, src, volume?, ... }
 * @property {number} start - Start time in seconds
 * @property {number|string} length - Duration in seconds or "auto"
 * @property {Object} [transition] - { in, out }
 */

/**
 * Edit – represents a video project with its timeline and clips.
 *
 * @example
 * const edit = Edit.fromConfig({ timeline, output });
 * edit.getEdit();        // Full Shotstack JSON
 * edit.getClip(0, 0);   // First clip in first track
 * edit.totalDurationMs;  // Total duration in ms
 */
export class Edit {
  /**
   * @param {EditConfig} config - { timeline, output }
   */
  constructor(config) {
    /** @type {Object} */
    this.timeline = config?.timeline ?? { background: "#000000", tracks: [] };
    /** @type {Object} */
    this.output = config?.output ?? { format: "mp4", size: { width: 1080, height: 1920 } };
  }

  /**
   * Create an Edit from a full Shotstack edit payload.
   * @param {EditConfig} config
   * @returns {Edit}
   */
  static fromConfig(config) {
    return new Edit(config);
  }

  /**
   * Return the full edit JSON for Shotstack API.
   * @returns {EditConfig}
   */
  getEdit() {
    return {
      timeline: { ...this.timeline },
      output: { ...this.output },
    };
  }

  /**
   * Get a track by index.
   * @param {number} trackIndex
   * @returns {{ clips: Clip[] } | undefined}
   */
  getTrack(trackIndex) {
    const tracks = this.timeline.tracks ?? [];
    return tracks[trackIndex];
  }

  /**
   * Get a clip by track and clip index.
   * @param {number} trackIndex
   * @param {number} clipIndex
   * @returns {Clip | undefined}
   */
  getClip(trackIndex, clipIndex) {
    const track = this.getTrack(trackIndex);
    if (!track?.clips) return undefined;
    return track.clips[clipIndex];
  }

  /**
   * Get all video clips from the first track (with optional scene_id/label metadata).
   * @param {Array<{scene_id: string|number}>} [sceneMetadata] - Optional scene_id per index
   * @returns {Array<Clip & { scene_id?: string|number, label?: string }>}
   */
  getVideoClips(sceneMetadata = []) {
    const track = this.getTrack(0);
    const clips = track?.clips ?? [];
    return clips.map((c, i) => ({
      ...c,
      scene_id: sceneMetadata[i]?.scene_id ?? i,
      label: sceneMetadata[i]?.label ?? `Scene ${i + 1}`,
    }));
  }

  /**
   * Total duration in seconds.
   * @returns {number}
   */
  get totalDurationSeconds() {
    const track = this.getTrack(0);
    const clips = track?.clips ?? [];
    if (clips.length === 0) return 0;
    return Math.max(
      ...clips.map((c) => (Number(c.start) || 0) + (Number(c.length) || 0))
    );
  }

  /**
   * Total duration in milliseconds.
   * @returns {number}
   */
  get totalDurationMs() {
    return this.totalDurationSeconds * 1000;
  }

  /**
   * Check if timeline has voiceover track.
   * @returns {boolean}
   */
  get hasVoiceover() {
    const track = this.getTrack(1);
    return !!track?.clips?.length;
  }

  /**
   * Check if timeline has music track.
   * @returns {boolean}
   */
  get hasMusic() {
    const track = this.getTrack(2);
    return !!track?.clips?.length;
  }

  /**
   * Get voiceover clip (track 1, clip 0).
   * @returns {Clip | undefined}
   */
  getVoiceoverClip() {
    return this.getClip(1, 0);
  }

  /**
   * Get music clip (track 2, clip 0).
   * @returns {Clip | undefined}
   */
  getMusicClip() {
    return this.getClip(2, 0);
  }
}
