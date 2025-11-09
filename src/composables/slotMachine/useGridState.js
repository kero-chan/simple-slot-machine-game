import { ref } from 'vue'
import { createEmptyGrid } from '../../utils/gameHelpers'
import { CONFIG } from '../../config/constants'

export function useGridState() {
  const grid = ref(createEmptyGrid())
  const goldenSymbols = ref(new Set())
  const highlightWins = ref(null)
  const spinOffsets = ref(Array(CONFIG.reels.count).fill(0))       // tile units
  const spinVelocities = ref(Array(CONFIG.reels.count).fill(0))    // tile units per frame

  return {
    grid,
    goldenSymbols,
    highlightWins,
    spinOffsets,
    spinVelocities
  }
}
