import { ref } from 'vue'
import { createEmptyGrid, createReelStrips } from '../../utils/gameHelpers'
import { CONFIG } from '../../config/constants'

export function useGridState() {
  const grid = ref(createEmptyGrid())
  const goldenSymbols = ref(new Set())
  const highlightWins = ref(null)
  const spinOffsets = ref(Array(CONFIG.reels.count).fill(0))       // fractional tiles [0,1)
  const spinVelocities = ref(Array(CONFIG.reels.count).fill(0))    // tiles per frame

  const reelStrips = ref(createReelStrips(CONFIG.reels.count, CONFIG.reels.rows + 20))
  const reelTopIndex = ref(Array(CONFIG.reels.count).fill(0))
  const highlightAnim = ref({ start: 0, duration: 0 })

  return {
    grid,
    goldenSymbols,
    highlightWins,
    spinOffsets,
    spinVelocities,
    reelStrips,
    reelTopIndex,
    highlightAnim
  }
}
