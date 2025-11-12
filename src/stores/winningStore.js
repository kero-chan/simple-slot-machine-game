import { defineStore } from 'pinia'
import { useTimingStore } from './timingStore'

// Winning tile states for visual control
export const WINNING_STATES = {
  IDLE: 'idle',
  HIGHLIGHTED: 'highlighted',
  FLIPPING: 'flipping',
  FLIPPED: 'flipped',
  DISAPPEARING: 'disappearing'
}

/**
 * Winning Store - Manages the current winning cycle state
 * Since the game processes one win at a time, this tracks the shared state
 * of all tiles in the current winning combination
 */
export const useWinningStore = defineStore('winning', {
  state: () => ({
    // Current state of winning tiles (all tiles share the same state)
    currentState: WINNING_STATES.IDLE,

    // When the current state started (for animation timing)
    stateStartTime: 0,

    // Cell keys of tiles in the current win (e.g., ["0:1", "0:2", "1:1"])
    winningCellKeys: []
  }),

  getters: {
    /**
     * Get timing constants from central timing store
     */
    TIMINGS: () => {
      const timingStore = useTimingStore()
      return {
        HIGHLIGHT_BEFORE_FLIP: timingStore.HIGHLIGHT_BEFORE_FLIP,
        FLIP_DURATION: timingStore.FLIP_DURATION,
        FLIP_TO_DISAPPEAR: timingStore.DISAPPEAR_WAIT
      }
    },

    /**
     * Check if a specific cell is part of the current win
     */
    isCellWinning: (state) => (cellKey) => {
      return state.winningCellKeys.includes(cellKey)
    },

    /**
     * Get the current state for a specific cell (only if it's winning)
     */
    getCellState: (state) => (cellKey) => {
      if (state.winningCellKeys.includes(cellKey)) {
        return state.currentState
      }
      return WINNING_STATES.IDLE
    },

    /**
     * Get time elapsed in current state
     */
    timeInCurrentState: (state) => {
      if (state.stateStartTime === 0) return 0
      return Date.now() - state.stateStartTime
    },

    /**
     * Check if any tiles are currently winning
     */
    hasWinningTiles: (state) => {
      return state.winningCellKeys.length > 0
    }
  },

  actions: {
    /**
     * Set winning tiles to HIGHLIGHTED state
     * @param {Array<string>} cellKeys - Array of cell keys (e.g., ["0:1", "0:2"])
     */
    setHighlighted(cellKeys) {
      this.currentState = WINNING_STATES.HIGHLIGHTED
      this.winningCellKeys = [...cellKeys]
      this.stateStartTime = Date.now()
    },

    /**
     * Transition to FLIPPING state
     */
    setFlipping() {
      if (this.currentState === WINNING_STATES.HIGHLIGHTED) {
        this.currentState = WINNING_STATES.FLIPPING
        this.stateStartTime = Date.now()
      }
    },

    /**
     * Transition to FLIPPED state
     */
    setFlipped() {
      if (this.currentState === WINNING_STATES.FLIPPING) {
        this.currentState = WINNING_STATES.FLIPPED
        this.stateStartTime = Date.now()
      }
    },

    /**
     * Transition to DISAPPEARING state
     */
    setDisappearing() {
      if (this.currentState === WINNING_STATES.FLIPPED || this.currentState === WINNING_STATES.HIGHLIGHTED) {
        this.currentState = WINNING_STATES.DISAPPEARING
        this.stateStartTime = Date.now()
      }
    },

    /**
     * Clear all winning state (when cascade starts or spinning begins)
     */
    clearWinningState() {
      this.currentState = WINNING_STATES.IDLE
      this.winningCellKeys = []
      this.stateStartTime = 0
    },

    /**
     * Helper: Convert win positions to cell keys
     * @param {Array} wins - Array of win objects with positions
     * @returns {Array<string>} Array of cell keys
     */
    winsToCellKeys(wins, bufferOffset) {
      const cellKeys = []
      if (!wins || wins.length === 0) return cellKeys

      wins.forEach(win => {
        win.positions.forEach(([col, gridRow]) => {
          const visualRow = gridRow - bufferOffset
          cellKeys.push(`${col}:${visualRow}`)
        })
      })

      return cellKeys
    }
  }
})
