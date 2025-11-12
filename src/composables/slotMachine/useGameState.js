import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { storeToRefs } from 'pinia'

export function useGameState() {
    const gameStore = useGameStore()

    // Use storeToRefs to maintain reactivity for state properties
    const {
        credits,
        bet,
        currentWin,
        isSpinning,
        showingWinOverlay,
        consecutiveWins,
        freeSpins,
        inFreeSpinMode,
        showStartScreen,
        loadingProgress,
        gameSound
    } = storeToRefs(gameStore)

    // Getters are already computed in the store, but we need to access them as refs
    const currentMultiplier = computed(() => gameStore.currentMultiplier)
    const canSpin = computed(() => gameStore.canSpin)

    return {
        credits,
        bet,
        currentWin,
        isSpinning,
        showingWinOverlay,
        consecutiveWins,
        freeSpins,
        inFreeSpinMode,
        currentMultiplier,
        canSpin,
        showStartScreen,
        loadingProgress,
        gameSound
    }
}
