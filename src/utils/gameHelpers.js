import { ASSETS } from '../config/assets'
import { CONFIG } from '../config/constants'

export function getRandomSymbol() {
  const symbols = Object.keys(ASSETS.symbols)
  const regularSymbols = symbols.filter(s => s !== 'scatter' && s !== 'wild')
  const rand = Math.random()
  if (rand < 0.05) return 'wild'
  if (rand < 0.10) return 'scatter'
  return regularSymbols[Math.floor(Math.random() * regularSymbols.length)]
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
