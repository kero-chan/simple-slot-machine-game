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
            // Spin animation finished
            // Only check for bonus tiles if NOT already in free spin mode
            if (gameStore.inFreeSpinMode) {
              // Skip bonus check during free spins, go directly to win checking
              gameStore.startCheckingWins()
            } else {
              // Normal spin - check for bonus tiles
              gameStore.startCheckingBonus()
            }
            break

          case GAME_STATES.CHECKING_BONUS:
            // Check for bonus tiles
            await handleCheckBonus()
            break

          case GAME_STATES.POPPING_BONUS_TILES:
            // Pop bonus tiles animation (will be handled by the pop animation component)
            // The pop animation will call gameStore.completeBonusTilePop() when done
            break

          case GAME_STATES.SHOWING_JACKPOT_VIDEO:
            // Show jackpot video (will be handled by the video overlay component)
            // The video overlay will call gameStore.completeJackpotVideo() when done
            break

          case GAME_STATES.SHOWING_BONUS_OVERLAY:
            // Show bonus overlay (will be handled by the overlay component)
            handleShowBonusOverlay()
            break

          case GAME_STATES.FREE_SPINS_ACTIVE:
            // Free spins auto-roll is handled by watch in useSlotMachine
            // Transition to IDLE after a short delay to allow the watch to detect the state
            setTimeout(() => {
              if (gameStore.gameFlowState === GAME_STATES.FREE_SPINS_ACTIVE) {
                gameStore.transitionTo(GAME_STATES.IDLE)
              }
            }, 100)
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

  const handleCheckBonus = async () => {
    const bonusCount = gameLogic.checkBonusTiles()

    // If bonus is triggered, highlight bonus tiles and wait so user can see them
    if (bonusCount >= CONFIG.game.minBonusToTrigger) {
      // Find all bonus tile positions in fully visible rows
      const bonusCellKeys = []
      const bufferRows = CONFIG.reels.bufferRows
      const fullyVisibleRows = CONFIG.reels.fullyVisibleRows
      const VISIBLE_START_ROW = bufferRows
      const VISIBLE_END_ROW = bufferRows + fullyVisibleRows - 1

      for (let col = 0; col < CONFIG.reels.count; col++) {
        for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
          const cell = gridState.grid[col][row]
          if (cell === 'bonus') {
            bonusCellKeys.push(`${col}:${row}`)
          }
        }
      }

      // Highlight bonus tiles (show win_frame only, no flip)
      if (bonusCellKeys.length > 0) {
        winningStore.setHighlighted(bonusCellKeys)
      }

      // Clear highlighting before showing video
      winningStore.clearWinningState()
    }

    gameStore.setBonusResults(bonusCount)
  }

  const handleShowBonusOverlay = () => {
    // The overlay will be shown by the main game composable
    // When user clicks "Start", it will call completeBonusOverlay
  }

  const handleCheckWins = async () => {
    const wins = gameLogic.findWinningCombinations()

    if (wins.length > 0) {
      // Calculate win amount
      const waysWinAmount = gameLogic.calculateWinAmount(wins)
      const multipliedWays = waysWinAmount * gameStore.currentMultiplier * gameStore.bet

      // Add to accumulated total
      gameStore.addWinAmount(multipliedWays)

      // Silent accumulation during free spins
      if (gameStore.inFreeSpinMode) {
        console.log(`💎 Free spin win: ${multipliedWays} (multiplier: ${gameStore.currentMultiplier}x) | Total so far: ${gameStore.accumulatedWinAmount}`)
        
        // Play consecutive win sound for free spin mode
        gameLogic.playConsecutiveWinSound(gameStore.consecutiveWins, true)
        
        // Play win sound for symbol combinations
        if (gameStore.consecutiveWins > 0) {
          setTimeout(() => {
            gameLogic.playWinSound(wins)
          }, 500);
        } else {
          gameLogic.playWinSound(wins)
        }
        // Wins accumulate silently during free spins
      } else {
        // Normal mode - play sounds
        // Play consecutive win sound (multiplier sound)
        gameLogic.playConsecutiveWinSound(gameStore.consecutiveWins, false)

        // Play win sound for symbol combinations
        if (gameStore.consecutiveWins > 0) {
          setTimeout(() => {
            gameLogic.playWinSound(wins)
          }, 500);
        } else {
          gameLogic.playWinSound(wins)
        }
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
