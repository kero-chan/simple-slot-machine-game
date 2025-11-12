import { watch } from 'vue'
import { useGameStore, GAME_STATES } from '../../stores/gameStore'
import { useWinningStore } from '../../stores/winningStore'
import { useTimingStore } from '../../stores/timingStore'
import { getBufferOffset } from '../../utils/gameHelpers'
import { CONFIG } from '../../config/constants'

/**
 * Game Flow Controller - Orchestrates game state transitions
 * This controller watches the game state and triggers appropriate actions/animations
 */
export function useGameFlowController(gameLogic, gridState, render) {
  const gameStore = useGameStore()
  const winningStore = useWinningStore()
  const timingStore = useTimingStore()
  const BUFFER_OFFSET = getBufferOffset()

  // Track active timers so we can clean them up
  let activeTimer = null

  const clearActiveTimer = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
      activeTimer = null
    }
  }

  /**
   * Main state machine watcher
   */
  const startWatching = () => {
    // Watch game flow state and trigger appropriate actions
    const unwatch = watch(
      () => gameStore.gameFlowState,
      async (newState, oldState) => {
        switch (newState) {
          case GAME_STATES.SPINNING:
            // Clear all winning state when spinning starts
            winningStore.clearWinningState()
            break

          case GAME_STATES.SPIN_COMPLETE:
            // Spin animation finished, start checking for wins
            gameStore.startCheckingWins()
            break

          case GAME_STATES.CHECKING_WINS:
            // Check for winning combinations
            await handleCheckWins()
            break

          case GAME_STATES.HIGHLIGHTING_WINS:
            // Show win highlighting animation
            await handleHighlightWins()
            break

          case GAME_STATES.TRANSFORMING_GOLD:
            // Transform gold tiles
            await handleGoldTransformation()
            break

          case GAME_STATES.WAITING_AFTER_GOLD:
            // Wait after gold transformation
            handleGoldWait()
            break

          case GAME_STATES.DISAPPEARING_TILES:
            // Make winning tiles disappear
            await handleDisappearingTiles()
            break

          case GAME_STATES.CASCADING:
            // Cascade tiles down
            await handleCascade()
            break

          case GAME_STATES.WAITING_AFTER_CASCADE:
            // Wait after cascade
            handleCascadeWait()
            break

          case GAME_STATES.NO_WINS:
            // No more wins found
            handleNoWins()
            break

          case GAME_STATES.SHOWING_WIN_OVERLAY:
            // Show big win overlay
            handleShowWinOverlay()
            break

          case GAME_STATES.IDLE:
            // Clean up
            clearActiveTimer()
            break
        }
      },
      { immediate: false }
    )

    return unwatch
  }

  // ========== State Handlers ==========

  const handleCheckWins = async () => {
    const wins = gameLogic.findWinningCombinations()

    if (wins.length > 0) {
      // Calculate win amount
      const waysWinAmount = gameLogic.calculateWinAmount(wins)
      const multipliedWays = waysWinAmount * gameStore.currentMultiplier * gameStore.bet

      // Add to accumulated total
      gameStore.addWinAmount(multipliedWays)

      // Play consecutive win sound (multiplier sound)
      gameLogic.playConsecutiveWinSound(gameStore.consecutiveWins)

      // Play win sound for symbol combinations
      if (gameStore.consecutiveWins > 0) {
        setTimeout(() => {
          gameLogic.playWinSound(wins)
        }, 500);
      } else {
        gameLogic.playWinSound(wins)
      }
    }

    // Set results (will auto-transition to next state)
    gameStore.setWinResults(wins)
  }

  const handleHighlightWins = async () => {
    const wins = gameStore.currentWins
    if (!wins || wins.length === 0) {
      gameStore.completeHighlighting()
      return
    }

    // Convert wins to cell keys and set to HIGHLIGHTED state
    const cellKeys = winningStore.winsToCellKeys(wins, BUFFER_OFFSET)
    winningStore.setHighlighted(cellKeys)

    // Start highlight animation (non-blocking)
    gameLogic.highlightWinsAnimation(wins)

    // Wait for highlight duration before starting flip
    await new Promise(resolve => setTimeout(resolve, timingStore.HIGHLIGHT_BEFORE_FLIP))

    // Transition to FLIPPING state
    winningStore.setFlipping()

    // Wait for flip to complete
    await new Promise(resolve => setTimeout(resolve, timingStore.FLIP_DURATION))

    // Transition to FLIPPED state
    winningStore.setFlipped()

    // Stop highlight animation immediately after flip completes
    gameLogic.stopHighlightAnimation()

    // Animation complete - move to next phase immediately
    gameStore.completeHighlighting()
  }

  const handleGoldTransformation = async () => {
    const wins = gameStore.currentWins
    if (!wins || wins.length === 0) {
      gameStore.completeGoldTransformation()
      return
    }

    await gameLogic.transformGoldTilesToWild(wins)
    render()

    gameStore.completeGoldTransformation()
  }

  const handleGoldWait = () => {
    // Use timer but it's controlled by state machine
    clearActiveTimer()
    activeTimer = setTimeout(() => {
      gameStore.completeGoldWait()
    }, timingStore.GOLD_WAIT)
  }

  const handleDisappearingTiles = async () => {
    const wins = gameStore.currentWins
    if (!wins || wins.length === 0) {
      gameStore.completeDisappearing()
      return
    }

    // Transition to DISAPPEARING state
    winningStore.setDisappearing()

    // Run disappear animation
    await gameLogic.animateDisappear(wins)

    // Complete
    gameStore.completeDisappearing()
  }

  const handleCascade = async () => {
    const wins = gameStore.currentWins
    if (!wins || wins.length === 0) {
      gameStore.completeCascade()
      return
    }

    // Clear winning state since positions are changing during cascade
    winningStore.clearWinningState()

    // Run cascade
    await gameLogic.cascadeSymbols(wins)

    // Complete
    gameStore.completeCascade()
  }

  const handleCascadeWait = () => {
    // Wait before checking for next wins
    clearActiveTimer()
    activeTimer = setTimeout(() => {
      gameStore.completeCascadeWait()
    }, timingStore.CASCADE_WAIT)
  }

  const handleNoWins = () => {
    // Check if we should show overlay
    gameStore.completeNoWins()
  }

  const handleShowWinOverlay = () => {
    const intensity = gameLogic.getWinIntensity(gameStore.allWinsThisSpin)

    if (gameLogic.showWinOverlay) {
      gameLogic.showWinOverlay(intensity, gameStore.accumulatedWinAmount)
    }

    // Overlay will call completeWinOverlay when done
    // For now, we'll need the overlay to call this
  }

  // ========== Public API ==========

  return {
    startWatching,
    clearActiveTimer
  }
}
