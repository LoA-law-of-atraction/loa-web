/**
 * Playhead engine – single timebase for timeline UI and media sync.
 * Mimics Shotstack Studio SDK: uses requestAnimationFrame for smooth playhead updates.
 *
 * Drives playheadTimeMs from media elements when playing; supports seek/pause.
 */

/**
 * @typedef {Object} PlayheadState
 * @property {number} playheadTimeMs - Current position in milliseconds
 * @property {boolean} isPlaying
 * @property {number} totalDurationMs
 */

/**
 * PlayheadEngine – rAF-based playhead driver.
 */
export class PlayheadEngine {
  /**
   * @param {Object} options
   * @param {() => number} options.getVideoTime - () => video.currentTime in seconds
   * @param {() => number} options.getCurrentClipStart - () => clip.start in seconds
   * @param {() => number} options.getTotalDurationMs - () => total duration ms
   * @param {(ms: number) => void} options.onPlayheadUpdate - (playheadTimeMs) => void
   */
  constructor({ getVideoTime, getCurrentClipStart, getTotalDurationMs, onPlayheadUpdate }) {
    this.getVideoTime = getVideoTime;
    this.getCurrentClipStart = getCurrentClipStart;
    this.getTotalDurationMs = getTotalDurationMs;
    this.onPlayheadUpdate = onPlayheadUpdate;
    this.rafId = null;
    this.isPlaying = false;
  }

  /**
   * Start the rAF loop (call when playback starts).
   */
  start() {
    if (this.rafId != null) return;
    this.isPlaying = true;

    const tick = () => {
      if (!this.isPlaying) return;
      const clipStart = this.getCurrentClipStart();
      const videoTime = this.getVideoTime();
      const totalMs = this.getTotalDurationMs();
      const playheadTimeMs = Math.min(
        totalMs,
        Math.round((clipStart + videoTime) * 1000)
      );
      this.onPlayheadUpdate(playheadTimeMs);
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /**
   * Stop the rAF loop (call when playback stops).
   */
  stop() {
    this.isPlaying = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Convert playhead to seconds for display/scrub.
   * @param {number} ms
   * @returns {number}
   */
  static msToSeconds(ms) {
    return ms / 1000;
  }

  /**
   * Convert seconds to ms.
   * @param {number} sec
   * @returns {number}
   */
  static secondsToMs(sec) {
    return Math.round(sec * 1000);
  }
}
