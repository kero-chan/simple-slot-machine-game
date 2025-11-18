import { defineStore } from 'pinia'
import { CONFIG } from '../config/constants'
import { audioManager } from '../composables/audioManager'
import { useSettingsStore } from './settingsStore'

// Game state machine states
export const GAME_STATES = {
  IDLE: 'idle',
  SPINNING: 'spinning',
  SPIN_COMPLETE: 'spin_complete',
  CHECKING_BONUS: 'checking_bonus',
  POPPING_BONUS_TILES: 'popping_bonus_tiles',
  SHOWING_JACKPOT_VIDEO: 'showing_jackpot_video',
  SHOWING_BONUS_OVERLAY: 'showing_bonus_overlay',
  FREE_SPINS_ACTIVE: 'free_spins_active',
  CHECKING_WINS: 'checking_wins',
  NO_WINS: 'no_wins',
  HIGHLIGHTING_WINS: 'highlighting_wins',
  TRANSFORMING_GOLD: 'transforming_gold',
  WAITING_AFTER_GOLD: 'waiting_after_gold',
  DISAPPEARING_TILES: 'disappearing_tiles',
  CASCADING: 'cascading',
  WAITING_AFTER_CASCADE: 'waiting_after_cascade',
  SHOWING_WIN_OVERLAY: 'showing_win_overlay'
}

export const useGameStore = defineStore('game', {
  state: () => ({
    credits: CONFIG.game.initialCredits,
    bet: CONFIG.game.minBet,
    currentWin: 0,

    isSpinning: false,
    showingWinOverlay: false,

    gameFlowState: GAME_STATES.IDLE,
    previousGameFlowState: null,

    consecutiveWins: 0,
    currentWins: null,
    accumulatedWinAmount: 0,
    lastWinAmount: 0,
    allWinsThisSpin: [],

    freeSpins: 0,
    inFreeSpinMode: false,

    // Anticipation mode (near-miss feature for bonus tiles)
    anticipationMode: false,

    // UI state
    showStartScreen: true,
    animationComplete: false,

    // Loading state
    loadingProgress: { loaded: 0, total: 1 }
  }),

  getters: {
    currentMultiplier(state) {
      let multipliers = state.inFreeSpinMode
        ? CONFIG.freeSpinMultipliers
        : CONFIG.multipliers

      // Double multipliers when in free-spin mode
      if (state.inFreeSpinMode) {
        multipliers = multipliers.map(m => m * 2)
      }

      const index = Math.min(state.consecutiveWins, multipliers.length - 1)
      return multipliers[index] * CONFIG.game.bettingMultiplierRate
    },

    // Get gameSound from settingsStore
    gameSound() {
      const settingsStore = useSettingsStore()
      return settingsStore.gameSound
    },

    canSpin(state) {
      return state.gameFlowState === GAME_STATES.IDLE &&
             !state.showingWinOverlay &&
             (state.credits >= state.bet || state.inFreeSpinMode)
    },

    canIncreaseBet(state) {
      return state.gameFlowState === GAME_STATES.IDLE && state.bet < CONFIG.game.maxBet
    },

    canDecreaseBet(state) {
      return state.gameFlowState === GAME_STATES.IDLE && state.bet > CONFIG.game.minBet
    },

    isInProgress(state) {
      return state.gameFlowState !== GAME_STATES.IDLE
    }
  },

  actions: {
    transitionTo(newState) {
      this.previousGameFlowState = this.gameFlowState
      this.gameFlowState = newState
      this.animationComplete = false
    },

    startSpinCycle() {
      if (this.gameFlowState !== GAME_STATES.IDLE) return false

      // Free spin mode doesn't deduct credits but decrements free spins
      if (this.inFreeSpinMode) {
        if (this.freeSpins <= 0) return false
        this.freeSpins--  // Decrement free spins count
      } else {
        if (this.credits < this.bet) return false
        this.credits -= this.bet
        // Only reset accumulated amount in normal mode
        this.accumulatedWinAmount = 0
        this.lastWinAmount = 0
        this.allWinsThisSpin = []
      }

      this.currentWin = 0
      this.consecutiveWins = 0
      this.currentWins = null
      this.anticipationMode = false  // Reset anticipation mode at start of spin

      this.transitionTo(GAME_STATES.SPINNING)
      this.isSpinning = true

      return true
    },

    completeSpinAnimation() {
      if (this.gameFlowState !== GAME_STATES.SPINNING) return
      this.transitionTo(GAME_STATES.SPIN_COMPLETE)
      this.isSpinning = false
    },

    startCheckingBonus() {
      if (this.gameFlowState !== GAME_STATES.SPIN_COMPLETE) return
      this.transitionTo(GAME_STATES.CHECKING_BONUS)
    },

    setBonusResults(bonusCount) {
      // Only award free spins if not already in free spin mode
      if (bonusCount >= CONFIG.game.minBonusToTrigger && !this.inFreeSpinMode) {
        const freeSpinsAwarded = CONFIG.game.freeSpinsPerScatter
        this.addFreeSpins(freeSpinsAwarded)
        // Pop tiles first, then show video, then bonus overlay
        this.transitionTo(GAME_STATES.POPPING_BONUS_TILES)
      } else {
        this.transitionTo(GAME_STATES.CHECKING_WINS)
      }
    },

    completeBonusTilePop() {
      if (this.gameFlowState !== GAME_STATES.POPPING_BONUS_TILES) return
      this.transitionTo(GAME_STATES.SHOWING_JACKPOT_VIDEO)
    },

    completeJackpotVideo() {
      if (this.gameFlowState !== GAME_STATES.SHOWING_JACKPOT_VIDEO) return
      this.transitionTo(GAME_STATES.SHOWING_BONUS_OVERLAY)
    },

    completeBonusOverlay() {
      if (this.gameFlowState !== GAME_STATES.SHOWING_BONUS_OVERLAY) return
      this.enterFreeSpinMode()
      // Reset accumulated amount when starting free spins
      this.accumulatedWinAmount = 0
      this.allWinsThisSpin = []
      this.transitionTo(GAME_STATES.FREE_SPINS_ACTIVE)
    },

    startFreeSpinRound() {
      if (!this.inFreeSpinMode) return false
      if (this.freeSpins <= 0) {
        this.exitFreeSpinMode()
        return false
      }

      this.freeSpins--
      return true
    },

    startCheckingWins() {
      if (this.gameFlowState !== GAME_STATES.SPIN_COMPLETE &&
          this.gameFlowState !== GAME_STATES.WAITING_AFTER_CASCADE &&
          this.gameFlowState !== GAME_STATES.CHECKING_BONUS) return
      this.transitionTo(GAME_STATES.CHECKING_WINS)
    },

    setWinResults(wins) {
      this.currentWins = wins

      if (!wins || wins.length === 0) {
        this.transitionTo(GAME_STATES.NO_WINS)
      } else {
        this.consecutiveWins++
        this.allWinsThisSpin.push(...wins)
        this.transitionTo(GAME_STATES.HIGHLIGHTING_WINS)
      }
    },

    completeHighlighting() {
      if (this.gameFlowState !== GAME_STATES.HIGHLIGHTING_WINS) return
      this.transitionTo(GAME_STATES.TRANSFORMING_GOLD)
    },

    completeGoldTransformation() {
      if (this.gameFlowState !== GAME_STATES.TRANSFORMING_GOLD) return
      this.transitionTo(GAME_STATES.WAITING_AFTER_GOLD)
    },

    completeGoldWait() {
      if (this.gameFlowState !== GAME_STATES.WAITING_AFTER_GOLD) return
      this.transitionTo(GAME_STATES.DISAPPEARING_TILES)
    },

    completeDisappearing() {
      if (this.gameFlowState !== GAME_STATES.DISAPPEARING_TILES) return
      this.transitionTo(GAME_STATES.CASCADING)
    },

    completeCascade() {
      if (this.gameFlowState !== GAME_STATES.CASCADING) return
      this.transitionTo(GAME_STATES.WAITING_AFTER_CASCADE)
    },

    completeCascadeWait() {
      if (this.gameFlowState !== GAME_STATES.WAITING_AFTER_CASCADE) return
      this.transitionTo(GAME_STATES.CHECKING_WINS)
    },

    completeNoWins() {
      if (this.gameFlowState !== GAME_STATES.NO_WINS) return

      // During free spins, skip win overlay and continue spinning
      if (this.inFreeSpinMode) {
        if (this.freeSpins > 0) {
          // Continue to next free spin
          this.transitionTo(GAME_STATES.FREE_SPINS_ACTIVE)
        } else {
          // All free spins done - show total accumulated wins
          if (this.accumulatedWinAmount > 0) {
            console.log('💰 FREE SPINS COMPLETE! Total win:', this.accumulatedWinAmount)
            this.transitionTo(GAME_STATES.SHOWING_WIN_OVERLAY)
          } else {
            this.endSpinCycle()
          }
        }
      } else {
        // Normal mode - show overlay for this spin's wins
        if (this.accumulatedWinAmount > 0) {
          this.transitionTo(GAME_STATES.SHOWING_WIN_OVERLAY)
        } else {
          this.endSpinCycle()
        }
      }
    },

    completeWinOverlay() {
      if (this.gameFlowState !== GAME_STATES.SHOWING_WIN_OVERLAY) return
      // Win overlay shown - always end the cycle (free spins are done at this point)
      this.endSpinCycle()
    },

    endSpinCycle() {
      if (this.accumulatedWinAmount > 0) {
        this.credits += this.accumulatedWinAmount
        this.currentWin = this.accumulatedWinAmount
      }

      // Exit free spin mode if no spins left
      if (this.inFreeSpinMode && this.freeSpins <= 0) {
        this.exitFreeSpinMode()
      }

      this.transitionTo(GAME_STATES.IDLE)
      this.currentWins = null
    },

    markAnimationComplete() {
      this.animationComplete = true
    },

    addWinAmount(amount) {
      this.lastWinAmount = amount
      this.accumulatedWinAmount += amount
    },
    increaseBet() {
      if (this.canIncreaseBet) {
        this.bet += CONFIG.game.betStep
      }
    },

    decreaseBet() {
      if (this.canDecreaseBet) {
        this.bet -= CONFIG.game.betStep
      }
    },

    setBet(amount) {
      if (amount >= CONFIG.game.minBet && amount <= CONFIG.game.maxBet) {
        this.bet = amount
      }
    },

    addCredits(amount) {
      this.credits += amount
    },

    deductBet() {
      if (this.credits >= this.bet) {
        this.credits -= this.bet
        return true
      }
      return false
    },

    setCurrentWin(amount) {
      this.currentWin = amount
      if (amount > 0) {
        this.addCredits(amount)
      }
    },

    incrementConsecutiveWins() {
      this.consecutiveWins++
    },

    resetConsecutiveWins() {
      this.consecutiveWins = 0
    },

    startSpin() {
      this.isSpinning = true
      this.currentWin = 0
      this.resetConsecutiveWins()
    },

    endSpin() {
      this.isSpinning = false
    },

    showWinOverlay() {
      this.showingWinOverlay = true
    },

    hideWinOverlay() {
      this.showingWinOverlay = false
    },

    addFreeSpins(count) {
      this.freeSpins += count
    },

    useFreeSpins() {
      if (this.freeSpins > 0) {
        this.freeSpins--
        return true
      }
      return false
    },

    enterFreeSpinMode() {
      this.inFreeSpinMode = true

      // Resume AudioContext before free spins (multiple auto-spins can take > 4 seconds)
      import('../composables/useHowlerAudio').then(async ({ howlerAudio }) => {
        if (howlerAudio.isReady()) {
          await howlerAudio.resumeAudioContext()
          console.log('🔓 Audio context resumed before free spins')
        }
      })

      // Switch to jackpot background music
      audioManager.switchToJackpotMusic()
    },

    exitFreeSpinMode() {
      this.inFreeSpinMode = false
      this.freeSpins = 0
      // Switch back to normal background music
      audioManager.switchToNormalMusic()
    },

    hideStartScreen() {
      this.showStartScreen = false
    },

    showStartScreenAgain() {
      this.showStartScreen = true
    },

    // Loading state
    updateLoadingProgress(loaded, total) {
      this.loadingProgress = { loaded, total }
    },

    // switch game sound on/off
    toggleGameSound() {
      const settingsStore = useSettingsStore()
      settingsStore.toggleGameSound()
      
      // Sync with audioManager
      import('../composables/audioManager').then(({ audioManager }) => {
        audioManager.setGameSoundEnabled(settingsStore.gameSound)
      })
    },

    // Anticipation mode controls
    activateAnticipationMode() {
      this.anticipationMode = true

      // Resume AudioContext before anticipation mode (can last 4000ms × number of columns)
      import('../composables/useHowlerAudio').then(async ({ howlerAudio }) => {
        if (howlerAudio.isReady()) {
          await howlerAudio.resumeAudioContext()
          console.log('🔓 Audio context resumed before anticipation mode')
        }
      })
    },

    deactivateAnticipationMode() {
      this.anticipationMode = false
    },

    // Reset game
    resetGame() {
      this.credits = CONFIG.game.initialCredits
      this.bet = CONFIG.game.minBet
      this.currentWin = 0
      this.isSpinning = false
      this.showingWinOverlay = false
      this.gameFlowState = GAME_STATES.IDLE
      this.consecutiveWins = 0
      this.freeSpins = 0
      this.inFreeSpinMode = false
      this.showStartScreen = true
      this.accumulatedWinAmount = 0
      this.lastWinAmount = 0
      this.allWinsThisSpin = []
      this.anticipationMode = false
    }
  }
})
