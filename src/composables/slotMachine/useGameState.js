import { ref, computed } from 'vue'
import { CONFIG } from '../../config/constants'

export function useGameState() {
    const credits = ref(CONFIG.game.initialCredits)
    const bet = ref(CONFIG.game.minBet)
    const currentWin = ref(0)
    const isSpinning = ref(false)
    const consecutiveWins = ref(0)
    const freeSpins = ref(0)
    const inFreeSpinMode = ref(false)
    // Control which screen to show
    const showStartScreen = ref(true)

    const currentMultiplier = computed(() => {
        const multipliers = CONFIG.multipliers
        const index = Math.min(consecutiveWins.value, multipliers.length - 1)
        return multipliers[index]
    })

    const canSpin = computed(() => {
        return !isSpinning.value && credits.value >= bet.value
    })

    return {
        credits,
        bet,
        currentWin,
        isSpinning,
        consecutiveWins,
        currentMultiplier,
        canSpin,
        showStartScreen
    }
}
