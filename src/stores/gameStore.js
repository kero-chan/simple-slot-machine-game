import { defineStore } from 'pinia'
import { CONFIG } from '../config/constants'

// Game state machine states
export const GAME_STATES = {
  IDLE: 'idle',
  SPINNING: 'spinning',
  SPIN_COMPLETE: 'spin_complete',
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
    allWinsThisSpin: [],

    freeSpins: 0,
    inFreeSpinMode: false,

    showStartScreen: true,
    animationComplete: false
  }),

  getters: {
    currentMultiplier(state) {
      const multipliers = state.inFreeSpinMode
        ? CONFIG.freeSpinMultipliers
        : CONFIG.multipliers
      const index = Math.min(state.consecutiveWins, multipliers.length - 1)
      return multipliers[index]
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
      console.log(`[GameStore] State: ${this.gameFlowState} -> ${newState}`)
      this.previousGameFlowState = this.gameFlowState
      this.gameFlowState = newState
      this.animationComplete = false
    },

    startSpinCycle() {
      if (this.gameFlowState !== GAME_STATES.IDLE) return false
      if (this.credits < this.bet) return false

      this.credits -= this.bet
      this.currentWin = 0
      this.accumulatedWinAmount = 0
      this.allWinsThisSpin = []
      this.consecutiveWins = 0
      this.currentWins = null

      this.transitionTo(GAME_STATES.SPINNING)
      this.isSpinning = true

      return true
    },

    completeSpinAnimation() {
      if (this.gameFlowState !== GAME_STATES.SPINNING) return
      this.transitionTo(GAME_STATES.SPIN_COMPLETE)
    },

    startCheckingWins() {
      if (this.gameFlowState !== GAME_STATES.SPIN_COMPLETE &&
          this.gameFlowState !== GAME_STATES.WAITING_AFTER_CASCADE) return
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

      if (this.accumulatedWinAmount > 0) {
        this.transitionTo(GAME_STATES.SHOWING_WIN_OVERLAY)
      } else {
        this.endSpinCycle()
      }
    },

    completeWinOverlay() {
      if (this.gameFlowState !== GAME_STATES.SHOWING_WIN_OVERLAY) return
      this.endSpinCycle()
    },

    endSpinCycle() {
      if (this.accumulatedWinAmount > 0) {
        this.credits += this.accumulatedWinAmount
        this.currentWin = this.accumulatedWinAmount
      }

      this.transitionTo(GAME_STATES.IDLE)
      this.isSpinning = false
      this.currentWins = null
    },

    markAnimationComplete() {
      this.animationComplete = true
    },

    addWinAmount(amount) {
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
    },

    exitFreeSpinMode() {
      this.inFreeSpinMode = false
      this.freeSpins = 0
    },

    hideStartScreen() {
      this.showStartScreen = false
    },

    showStartScreenAgain() {
      this.showStartScreen = true
    },

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
      this.allWinsThisSpin = []
    }
  }
})
