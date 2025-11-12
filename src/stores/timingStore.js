import { defineStore } from 'pinia'

/**
 * Timing Store - Central configuration for all game timing constants
 * This provides a single source of truth for all durations, delays, and waits
 * Making it easier to tune game feel and prevent timing inconsistencies
 */
export const useTimingStore = defineStore('timing', {
  state: () => ({
    // ========== WIN CYCLE TIMING ==========
    // The complete win cycle: Highlight → Flip → Disappear → Cascade → Wait

    // Phase 1: Highlight winning tiles
    HIGHLIGHT_BEFORE_FLIP: 600,  // ms - Show highlight effect before flip starts

    // Phase 2: Flip animation
    FLIP_DURATION: 300,           // ms - Tiles flip from visible to hidden

    // Phase 3: Disappear wait
    DISAPPEAR_WAIT: 400,          // ms - Pause to let player see tiles are gone before cascade

    // Phase 4: Gold transformation (if applicable)
    GOLD_WAIT: 300,               // ms - Wait to show wild tiles with glowing effect

    // Phase 5: Cascade wait
    CASCADE_WAIT: 1000,           // ms - Wait after cascade before checking for next win

    // ========== ANIMATION DURATIONS ==========

    // Highlight effect (glow/pulse animation)
    HIGHLIGHT_ANIMATION_DURATION: 2500,  // ms - How long highlight animation runs (can be stopped early)

    // Drop/cascade animations
    DROP_DURATION: 300,           // ms - Tiles falling down during cascade
    DROP_GRACE_PERIOD: 6000,      // ms - Keep dropped symbols stable to prevent flickering
    CASCADE_RESET_WINDOW: 300,    // ms - Window to force sprite resets after cascade
    CASCADE_MAX_WAIT: 5000,       // ms - Max time to wait for cascade animations (safety timeout)

    // Tile animations
    BUMP_DURATION: 600,           // ms - Bonus tile "bump" animation (up and down)

    // ========== SPIN TIMING ==========
    SPIN_BASE_DURATION: 2500,     // ms - Base duration for reel spin
    SPIN_REEL_STAGGER: 150,       // ms - Delay between each reel starting to spin

    // ========== COMPUTED TIMING ==========
    // These are derived from the above constants for convenience
  }),

  getters: {
    /**
     * Total time from highlight start to flip complete
     * Used by sparkle effects and other animations that need to sync with flip
     */
    totalHighlightToFlipComplete: (state) => {
      return state.HIGHLIGHT_BEFORE_FLIP + state.FLIP_DURATION
    },

    /**
     * Total time for one complete win cycle (without cascade animation time)
     * Highlight → Flip → Disappear → Cascade → Wait
     */
    totalWinCycleDuration: (state) => {
      return state.HIGHLIGHT_BEFORE_FLIP +
             state.FLIP_DURATION +
             state.DISAPPEAR_WAIT +
             state.GOLD_WAIT +
             state.DROP_DURATION +  // Assuming average drop time
             state.CASCADE_WAIT
    },

    /**
     * When flip animation starts (relative to highlight start)
     */
    flipStartTime: (state) => {
      return state.HIGHLIGHT_BEFORE_FLIP
    },

    /**
     * When flip animation ends (relative to highlight start)
     */
    flipEndTime: (state) => {
      return state.HIGHLIGHT_BEFORE_FLIP + state.FLIP_DURATION
    }
  },

  actions: {
    /**
     * Update a timing value at runtime (useful for debugging/tuning)
     */
    updateTiming(key, value) {
      if (key in this.$state) {
        this.$state[key] = value
      }
    },

    /**
     * Reset all timings to defaults (useful for testing)
     */
    resetToDefaults() {
      this.$reset()
    }
  }
})
