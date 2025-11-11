import { ASSETS } from '../config/assets'
import { CONFIG } from '../config/constants'

/**
 * Get a random symbol, optionally with gold variant
 * @param {Object} options - Optional configuration
 * @param {number} options.col - Column index (0-4)
 * @param {number} options.visualRow - Visual row index (0-5)
 * @param {boolean} options.allowGold - Whether gold variants are allowed
 * @param {number} options.goldChance - Probability of gold (0-1), default 0.15
 * @returns {string} Symbol name, possibly with "_gold" suffix
 */
export function getRandomSymbol(options = {}) {
  const { col, visualRow, allowGold = false, goldChance = 0.15 } = options

  // Prefer paytable keys; this is available before assets load
  const paytableSymbols = Object.keys(CONFIG.paytable || {})
  const fromPaytable = paytableSymbols.filter(s => s !== 'gold')

  const imagePathSymbols = Object.keys(ASSETS.imagePaths || {})
  const fromAssets = imagePathSymbols.filter(s => s !== 'gold')

  const pool = fromPaytable.length ? fromPaytable : fromAssets
  if (pool.length === 0) return 'fa'

  let symbol = pool[Math.floor(Math.random() * pool.length)]

  // Check if we should make this a gold variant
  if (allowGold && Math.random() < goldChance) {
    // Gold rules: only in columns 1,2,3 (zero-based) and visible rows 1-4
    const GOLD_ALLOWED_COLS = [1, 2, 3]
    const GOLD_ALLOWED_VISUAL_ROWS = [1, 2, 3, 4]

    const isAllowedPosition =
      (col === undefined || GOLD_ALLOWED_COLS.includes(col)) &&
      (visualRow === undefined || GOLD_ALLOWED_VISUAL_ROWS.includes(visualRow))

    // Don't make special symbols gold
    const canBeGold = symbol !== 'liangsuo' && symbol !== 'liangtong' && symbol !== 'bonus' && symbol !== 'gold'

    if (isAllowedPosition && canBeGold) {
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
    // Create buffer rows + game rows
    for (let row = 0; row < totalRows; row++) {
      // Convert grid row to visual row for gold rules
      const visualRow = row - BUFFER_OFFSET
      grid[col][row] = getRandomSymbol({ col, visualRow, allowGold: true })
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
      strip.push(getRandomSymbol({ col: c, allowGold: true }))
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
