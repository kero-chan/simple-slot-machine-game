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

  // CENTRALIZED: Import winning check rows from single source of truth
  // These define which grid rows are checked for wins/bonuses
  const WIN_CHECK_START_ROW = CONFIG.reels.winCheckStartRow // 5
  const WIN_CHECK_END_ROW = CONFIG.reels.winCheckEndRow // 8

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

    // Highlight bonus tiles in ALL columns (not just column 0)
    // This creates anticipation across the entire board
    return isBonusTile(cell) && isInVisibleRows(row)
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
   * Check if a column has any bonus tiles in visible rows
   * @param {number} col - Column index
   * @param {Array} grid - The game grid
   * @returns {boolean}
   */
  function columnHasBonusTiles(col, grid) {
    for (let row = WIN_CHECK_START_ROW; row <= WIN_CHECK_END_ROW; row++) {
      if (isBonusTile(grid[col][row])) {
        return true
      }
    }
    return false
  }

  /**
   * Get visual properties for a tile during anticipation mode
   * @param {number} col - Column index
   * @param {number} row - Grid row index
   * @param {string} cell - The tile symbol
   * @param {boolean} columnIsSpinning - Whether this column is currently spinning
   * @param {Array} grid - The game grid
   * @returns {Object} - { highlight, shouldDim }
   */
  function getTileVisualState(col, row, cell, columnIsSpinning = false, grid = null) {
    if (!gameStore.anticipationMode) {
      return { highlight: false, shouldDim: false }
    }

    const isBonus = isBonusTile(cell)

    // For STOPPED columns during anticipation mode:
    if (!columnIsSpinning) {
      // Per spec.txt line 25-26:
      // - Columns WITH bonus tiles: highlight bonus, darken non-bonus
      // - Columns WITHOUT bonus tiles: darken all tiles
      const hasBonusTiles = grid ? columnHasBonusTiles(col, grid) : false

      if (hasBonusTiles) {
        // Column has bonus tiles - highlight bonus in visible rows, darken everything else
        if (isBonus && isInVisibleRows(row)) {
          return { highlight: true, shouldDim: false }
        }
        // Darken non-bonus tiles
        return { highlight: false, shouldDim: true }
      } else {
        // Column has NO bonus tiles - darken entire column
        return { highlight: false, shouldDim: true }
      }
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
