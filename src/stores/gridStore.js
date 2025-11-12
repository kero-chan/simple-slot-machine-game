import { defineStore } from 'pinia'
import { createEmptyGrid, createReelStrips } from '../utils/gameHelpers'
import { CONFIG } from '../config/constants'

export const useGridStore = defineStore('grid', {
  state: () => ({
    // Main grid: 5 columns × (6 game rows + 4 buffer rows) = 5 × 10
    grid: createEmptyGrid(),

    // Reel strips for spinning animation (longer strip = smoother animation)
    reelStrips: createReelStrips(CONFIG.reels.count, CONFIG.reels.stripLength),
    reelTopIndex: Array(CONFIG.reels.count).fill(0),

    // Spin animation state
    spinOffsets: Array(CONFIG.reels.count).fill(0),
    spinVelocities: Array(CONFIG.reels.count).fill(0),
    convergenceMode: Array(CONFIG.reels.count).fill(false), // Per-column convergence flag

    // Win highlight animation (DEPRECATED - now managed by winningStore)
    highlightWins: null,
    highlightAnim: { start: 0, duration: 0 },

    // Disappear animation (DEPRECATED - now managed by winningStore)
    disappearPositions: new Set(),
    disappearAnim: { start: 0, duration: 0 },

    // Cascade/drop animation state
    lastCascadeTime: 0,
    lastRemovedPositions: new Set(),
    isDropAnimating: false,
    previousGridSnapshot: null
  }),

  actions: {
    resetGrid() {
      this.grid = createEmptyGrid()
    },

    resetSpinState() {
      this.spinOffsets = Array(CONFIG.reels.count).fill(0)
      this.spinVelocities = Array(CONFIG.reels.count).fill(0)
      this.convergenceMode = Array(CONFIG.reels.count).fill(false)
    },

    clearHighlights() {
      this.highlightWins = null
      this.highlightAnim = { start: 0, duration: 0 }
    },

    clearDisappear() {
      this.disappearPositions = new Set()
      this.disappearAnim = { start: 0, duration: 0 }
    },

    regenerateReelStrips() {
      this.reelStrips = createReelStrips(CONFIG.reels.count, CONFIG.reels.stripLength)
      this.reelTopIndex = Array(CONFIG.reels.count).fill(0)
    }
  }
})
