import { ASSETS } from '../config/assets'
import { CONFIG } from '../config/constants'

export function getRandomSymbol() {
  // Prefer paytable keys; this is available before assets load
  const paytableSymbols = Object.keys(CONFIG.paytable || {})
  // Regular pool excludes special symbols
  const regularFromPaytable = paytableSymbols.filter(s => s !== 'liangtong' && s !== 'liangsuo')

  // Fallback: derive from imagePaths if paytable is empty for any reason
  const imagePathSymbols = Object.keys(ASSETS.imagePaths || {})
  const regularFromAssets = imagePathSymbols.filter(s => s !== 'liangtong' && s !== 'liangsuo')

  const pool = regularFromPaytable.length ? regularFromPaytable : regularFromAssets

  // If for some reason both are empty, default to a safe symbol
  if (pool.length === 0) return 'fa'

  // Chance to inject specials
  const rand = Math.random()
  if (rand < 0.05 && paytableSymbols.includes('liangsuo')) return 'liangsuo'
  if (rand < 0.10 && paytableSymbols.includes('liangtong')) return 'liangtong'

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
