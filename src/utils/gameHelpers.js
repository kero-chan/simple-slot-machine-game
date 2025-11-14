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
  // Gold variants only appear in columns 1, 2, 3 (middle 3 columns of 0-4)
  // Not restricted by row - can appear in any row
  // Note: symbol from pool is already guaranteed to not be wild or bonus
  if (allowGold && Math.random() < goldChance) {
    const GOLD_ALLOWED_COLS = [1, 2, 3]

    const isAllowedColumn = col === undefined || GOLD_ALLOWED_COLS.includes(col)

    if (isAllowedColumn) {
      symbol = symbol + '_gold'
    }
  }

  return symbol
}

/**
 * Calculate dynamic counter duration based on number magnitude
 * Small numbers count faster, large numbers take more time
 * Uses logarithmic scale for natural feel
 * @param {number} amount - The target amount to count to
 * @returns {number} Duration in seconds
 */
export function getCounterDuration(amount) {
  // Logarithmic scale: small numbers are very fast, scales smoothly with magnitude
  // log10(10) = 1.0 → 0.6s
  // log10(100) = 2.0 → 1.2s
  // log10(1000) = 3.0 → 1.8s
  // log10(10000) = 4.0 → 2.4s
  // log10(100000) = 5.0 → 3.0s
  const duration = Math.log10(amount + 1) * 0.6
  return Math.max(0.3, Math.min(duration, 4.5)) // Min 0.3s, max 4.5s
}

export function createEmptyGrid() {
  const grid = []
  const bufferRows = CONFIG.reels.bufferRows || 0
  const totalRows = CONFIG.reels.rows + bufferRows
  const BUFFER_OFFSET = bufferRows
  const fullyVisibleRows = CONFIG.reels.fullyVisibleRows || 4

  // Fully visible rows start at bufferRows
  const fullyVisibleStart = bufferRows
  const fullyVisibleEnd = bufferRows + fullyVisibleRows - 1

  for (let col = 0; col < CONFIG.reels.count; col++) {
    grid[col] = []
    let bonusCountInVisibleRows = 0

    // Create buffer rows + game rows
    for (let row = 0; row < totalRows; row++) {
      // Convert grid row to visual row for gold rules
      const visualRow = row - BUFFER_OFFSET

      // Check if we're in fully visible rows
      const isVisibleRow = row >= fullyVisibleStart && row <= fullyVisibleEnd

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
 * Enforce max 1 bonus tile per column in fully visible rows
 * @param {Array} grid - The grid to validate and fix
 */
export function enforceBonusLimit(grid) {
  const bufferRows = CONFIG.reels.bufferRows || 0
  const BUFFER_OFFSET = bufferRows
  const totalRows = CONFIG.reels.rows + bufferRows
  const fullyVisibleRows = CONFIG.reels.fullyVisibleRows || 4

  // Fully visible rows start at bufferRows
  const fullyVisibleStart = bufferRows
  const fullyVisibleEnd = bufferRows + fullyVisibleRows - 1

  for (let col = 0; col < CONFIG.reels.count; col++) {
    const bonusPositions = []

    // Find all bonus tiles in fully visible rows
    for (let row = 0; row < grid[col].length; row++) {
      const isVisibleRow = row >= fullyVisibleStart && row <= fullyVisibleEnd

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
