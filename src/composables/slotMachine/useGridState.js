import { ref } from 'vue'
import { createEmptyGrid, createReelStrips } from '../../utils/gameHelpers'
import { CONFIG } from '../../config/constants'

export function useGridState() {
  const grid = ref(createEmptyGrid())
  const highlightWins = ref(null)
  const spinOffsets = ref(Array(CONFIG.reels.count).fill(0))
  const spinVelocities = ref(Array(CONFIG.reels.count).fill(0))
  const reelStrips = ref(createReelStrips(CONFIG.reels.count, CONFIG.reels.rows + 20))
  const reelTopIndex = ref(Array(CONFIG.reels.count).fill(0))
  const highlightAnim = ref({ start: 0, duration: 0 })
  // Track tiles flagged to disappear (Set of "col,row")
  const disappearPositions = ref(new Set())
  // Track fade-out animation window
  const disappearAnim = ref({ start: 0, duration: 0 })
  // Track cascade state for drop animations
  const lastCascadeTime = ref(0)
  const lastRemovedPositions = ref(new Set())
  const isDropAnimating = ref(false)
  // Store grid snapshot before cascade for drop animations
  let previousGridSnapshot = null

  return {
    grid,
    highlightWins,
    spinOffsets,
    spinVelocities,
    reelStrips,
    reelTopIndex,
    highlightAnim,
    disappearPositions,
    disappearAnim,
    lastCascadeTime,
    lastRemovedPositions,
    isDropAnimating,
    previousGridSnapshot,
    get previousGridSnapshot() { return previousGridSnapshot },
    set previousGridSnapshot(value) { previousGridSnapshot = value }
  }
}
