import { isBonusTile } from '../../../utils/tileHelpers'
import { useGameStore } from '../../../stores/gameStore'
import { CONFIG } from '../../../config/constants'

/**
 * Anticipation Effects - Visual feedback when near-miss jackpot occurs
 *
 * When column 0 (first column) stops with a bonus tile:
 * - Anticipation mode activates
 * - Each stopped column:
 *   - Bonus tiles IN VISIBLE ROWS get highlighted (golden glow + light burst)
 *   - Bonus tiles OUTSIDE visible rows get dark masked (not counted for jackpot)
 *   - Non-bonus tiles get dark masked
 * - Spinning columns remain normal (no effects)
 * - Creates excitement and anticipation for potential jackpot!
 * - Since 3 bonus tiles trigger jackpot, having 1 already is exciting!
 */
export function createAnticipationEffects() {
  const gameStore = useGameStore()

  // Define the 4 visible rows where jackpot is calculated
  // Adjusted by +1 to account for strip layout change (renderer reads strip[(reelTop-row)%100])
  const bufferRows = CONFIG.reels.bufferRows || 4
  const fullyVisibleRows = CONFIG.reels.fullyVisibleRows || 4
  const WIN_CHECK_START_ROW = bufferRows + 1 // e.g., 5 (was 4 before strip layout fix)
  const WIN_CHECK_END_ROW = bufferRows + fullyVisibleRows // e.g., 8 (was 7 before strip layout fix)

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
   * Check if a row is in the visible win-check area
   * @param {number} row - Grid row index
   * @returns {boolean}
   */
  function isInVisibleRows(row) {
    return row >= WIN_CHECK_START_ROW && row <= WIN_CHECK_END_ROW
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
      // Highlight ONLY bonus tiles in the 4 visible rows (where jackpot is calculated)
      if (isBonus && isInVisibleRows(row)) {
        return { highlight: true, shouldDim: false }
      }
      // Darken everything else:
      // - Bonus tiles outside visible rows (don't count for jackpot)
      // - Non-bonus tiles
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
