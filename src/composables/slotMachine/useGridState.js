import { ref } from 'vue'
import { createEmptyGrid, createReelStrips } from '../../utils/gameHelpers'
import { CONFIG } from '../../config/constants'

export function useGridState() {
  const grid = ref(createEmptyGrid())
  const goldenSymbols = ref(new Set())
  const highlightWins = ref(null)
  const spinOffsets = ref(Array(CONFIG.reels.count).fill(0))
  const spinVelocities = ref(Array(CONFIG.reels.count).fill(0))
  const reelStrips = ref(createReelStrips(CONFIG.reels.count, CONFIG.reels.rows + 20))
  const reelTopIndex = ref(Array(CONFIG.reels.count).fill(0))
  const highlightAnim = ref({ start: 0, duration: 0 })
  // Track tiles flagged to disappear (Set of "col,row")
  const disappearPositions = ref(new Set())

  return {
    grid,
    goldenSymbols,
    highlightWins,
    spinOffsets,
    spinVelocities,
    reelStrips,
    reelTopIndex,
    highlightAnim,
    disappearPositions
  }
}
