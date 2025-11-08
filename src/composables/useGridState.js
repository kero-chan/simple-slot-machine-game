import { ref } from 'vue'
import { createEmptyGrid } from '../utils/gameHelpers'

export function useGridState() {
  const grid = ref(createEmptyGrid())
  const goldenSymbols = ref(new Set())
  const highlightWins = ref(null)

  return {
    grid,
    goldenSymbols,
    highlightWins
  }
}
