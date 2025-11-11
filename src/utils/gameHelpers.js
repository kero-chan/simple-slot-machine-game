import { ASSETS } from '../config/assets'
import { CONFIG } from '../config/constants'

export function getRandomSymbol() {
  // Prefer paytable keys; this is available before assets load
  const paytableSymbols = Object.keys(CONFIG.paytable || {})
  const fromPaytable = paytableSymbols.filter(s => s !== 'gold')

  const imagePathSymbols = Object.keys(ASSETS.imagePaths || {})
  const fromAssets = imagePathSymbols.filter(s => s !== 'gold')

  const pool = fromPaytable.length ? fromPaytable : fromAssets
  if (pool.length === 0) return 'fa'

  return pool[Math.floor(Math.random() * pool.length)]
}

export function createEmptyGrid() {
  const grid = []
  for (let col = 0; col < CONFIG.reels.count; col++) {
    grid[col] = []
    for (let row = 0; row < CONFIG.reels.rows; row++) {
      grid[col][row] = getRandomSymbol()
    }
  }
  return grid
}

export function createReelStrips(count, length) {
  const strips = []
  for (let c = 0; c < count; c++) {
    const strip = []
    for (let i = 0; i < length; i++) {
      strip.push(getRandomSymbol())
    }
    strips.push(strip)
  }
  return strips
}
