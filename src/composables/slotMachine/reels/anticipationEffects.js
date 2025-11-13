import { isBonusTile } from '../../../utils/tileHelpers'
import { useGameStore } from '../../../stores/gameStore'

/**
 * Anticipation Effects - Visual feedback when near-miss jackpot occurs
 *
 * When column 0 (first column) stops with a bonus tile:
 * - Anticipation mode activates
 * - Each stopped column:
 *   - Bonus tiles get highlighted (golden glow + light burst)
 *   - Non-bonus tiles get dark masked
 * - Spinning columns remain normal (no effects)
 * - Creates excitement and anticipation for potential jackpot!
 * - Since 3 bonus tiles trigger jackpot, having 1 already is exciting!
 */
export function createAnticipationEffects() {
  const gameStore = useGameStore()

  /**
   * Check if a tile should be highlighted during anticipation mode
   * @param {number} col - Column index
   * @param {number} row - Grid row index
   * @param {string} cell - The tile symbol
   * @returns {boolean} - True if this tile should be highlighted
   */
  function shouldHighlightTile(col, row, cell) {
    // Only apply during anticipation mode
    if (!gameStore.anticipationMode) return false

    // Only highlight bonus tiles in column 0 (first column)
    if (col !== 0) return false

    return isBonusTile(cell)
  }

  /**
   * Check if anticipation mode is active
   * @returns {boolean}
   */
  function isActive() {
    return gameStore.anticipationMode
  }

  /**
   * Get visual properties for a tile during anticipation mode
   * @param {number} col - Column index
   * @param {number} row - Grid row index
   * @param {string} cell - The tile symbol
   * @param {boolean} columnIsSpinning - Whether this column is currently spinning
   * @returns {Object} - { highlight, shouldDim }
   */
  function getTileVisualState(col, row, cell, columnIsSpinning = false) {
    if (!gameStore.anticipationMode) {
      return { highlight: false, shouldDim: false }
    }

    const isBonus = isBonusTile(cell)

    // For STOPPED columns during anticipation mode:
    if (!columnIsSpinning) {
      // Highlight bonus tiles (any column that has stopped)
      if (isBonus) {
        return { highlight: true, shouldDim: false }
      }
      // Darken non-bonus tiles in stopped columns
      return { highlight: false, shouldDim: true }
    }

    // Column is still spinning - no effects applied
    return { highlight: false, shouldDim: false }
  }

  return {
    shouldHighlightTile,
    isActive,
    getTileVisualState
  }
}
