import { ASSETS } from '../config/assets'
import { CONFIG } from '../config/constants'
import { isBonusTile } from './tileHelpers'

/**
 * Get a random symbol, optionally with gold variant
 * @param {Object} options - Optional configuration
 * @param {number} options.col - Column index (0-4)
 * @param {number} options.visualRow - Visual row index (0-5)
 * @param {boolean} options.allowGold - Whether gold variants are allowed
 * @param {number} options.goldChance - Probability of gold (0-1), default 0.15
 * @param {number} options.wildChance - Probability of wild (0-1), default 0.02
 * @param {number} options.bonusChance - Probability of bonus (0-1), default 0.03
 * @param {boolean} options.allowBonus - Whether bonus tiles are allowed, default true
 * @returns {string} Symbol name, possibly with "_gold" suffix
 */
export function getRandomSymbol(options = {}) {
  const {
    col,
    visualRow,
    allowGold = false,
    goldChance = CONFIG.spawnRates?.goldChance ?? 0.15,
    wildChance = CONFIG.spawnRates?.wildChance ?? 0.02,
    bonusChance = CONFIG.spawnRates?.bonusChance ?? 0.03,
    allowBonus = true
  } = options

  // Prefer paytable keys; this is available before assets load
  const paytableSymbols = Object.keys(CONFIG.paytable || {})
  // Filter out wild and bonus from the regular pool (they have special spawn logic)
  const fromPaytable = paytableSymbols.filter(s => s !== 'wild' && s !== 'bonus')

  const imagePathSymbols = Object.keys(ASSETS.imagePaths || {})
  const fromAssets = imagePathSymbols.filter(s => s !== 'wild' && s !== 'bonus')

  const pool = fromPaytable.length ? fromPaytable : fromAssets
  if (pool.length === 0) return 'fa'

  // Small chance for wild tile (2% by default, lower than other tiles)
  if (Math.random() < wildChance) {
    return 'wild'
  }

  // Small chance for bonus tile (3% by default)
  if (allowBonus && Math.random() < bonusChance) {
    return 'bonus'
  }

  let symbol = pool[Math.floor(Math.random() * pool.length)]

  // Check if we should make this a gold variant
  // Gold variants only appear in columns 1, 2, 3 (middle 3 columns)
  // Note: symbol from pool is already guaranteed to not be wild or bonus
  if (allowGold && Math.random() < goldChance) {
    const GOLD_ALLOWED_COLS = [1, 2, 3]
    const GOLD_ALLOWED_VISUAL_ROWS = [1, 2, 3, 4]

    const isAllowedPosition =
      (col === undefined || GOLD_ALLOWED_COLS.includes(col)) &&
      (visualRow === undefined || GOLD_ALLOWED_VISUAL_ROWS.includes(visualRow))

    if (isAllowedPosition) {
      symbol = symbol + '_gold'
    }
  }

  return symbol
}

export function createEmptyGrid() {
  const grid = []
  const bufferRows = CONFIG.reels.bufferRows || 0
  const totalRows = CONFIG.reels.rows + bufferRows
  const BUFFER_OFFSET = bufferRows

  for (let col = 0; col < CONFIG.reels.count; col++) {
    grid[col] = []
    let bonusCountInVisibleRows = 0

    // Create buffer rows + game rows
    for (let row = 0; row < totalRows; row++) {
      // Convert grid row to visual row for gold rules
      const visualRow = row - BUFFER_OFFSET

      // Check if we're in visible rows (1-4 in visual coordinates)
      const isVisibleRow = visualRow >= 1 && visualRow <= 4

      // If we already have a bonus in this column's visible rows, don't allow more
      const allowBonus = !(isVisibleRow && bonusCountInVisibleRows >= 1)

      const symbol = getRandomSymbol({ col, visualRow, allowGold: true, allowBonus })
      grid[col][row] = symbol

      // Track bonus tiles in visible rows
      if (isBonusTile(symbol) && isVisibleRow) {
        bonusCountInVisibleRows++
      }
    }
  }
  return grid
}

export function createReelStrips(count, length) {
  const strips = []
  for (let c = 0; c < count; c++) {
    const strip = []
    for (let i = 0; i < length; i++) {
      // Allow gold in reel strips based on column
      // Visual row not specified since strips rotate
      // Bonus tiles allowed in strips but will be rare due to bonusChance
      strip.push(getRandomSymbol({ col: c, allowGold: true, allowBonus: true }))
    }
    strips.push(strip)
  }
  return strips
}

// Get the offset for buffer rows (gameRow = gridRow - bufferOffset)
export function getBufferOffset() {
  return CONFIG.reels.bufferRows || 0
}

// Fill buffer rows with random symbols (called before win evaluation)
export function fillBufferRows(grid) {
  const bufferRows = CONFIG.reels.bufferRows || 0
  if (bufferRows === 0) return

  for (let col = 0; col < CONFIG.reels.count; col++) {
    for (let row = 0; row < bufferRows; row++) {
      grid[col][row] = getRandomSymbol()
    }
  }
}

/**
 * Enforce max 1 bonus tile per column in visible rows (1-4)
 * @param {Array} grid - The grid to validate and fix
 */
export function enforceBonusLimit(grid) {
  const bufferRows = CONFIG.reels.bufferRows || 0
  const BUFFER_OFFSET = bufferRows

  for (let col = 0; col < CONFIG.reels.count; col++) {
    const bonusPositions = []

    // Find all bonus tiles in visible rows (1-4 in visual coordinates)
    for (let row = 0; row < grid[col].length; row++) {
      const visualRow = row - BUFFER_OFFSET
      const isVisibleRow = visualRow >= 1 && visualRow <= 4

      if (isVisibleRow && isBonusTile(grid[col][row])) {
        bonusPositions.push(row)
      }
    }

    // If more than 1 bonus tile, replace extras with random symbols
    if (bonusPositions.length > 1) {
      // Keep the first one, replace the rest
      for (let i = 1; i < bonusPositions.length; i++) {
        const row = bonusPositions[i]
        const visualRow = row - BUFFER_OFFSET
        // Replace with a random non-bonus symbol
        grid[col][row] = getRandomSymbol({
          col,
          visualRow,
          allowGold: true,
          allowBonus: false
        })
      }
    }
  }
}
