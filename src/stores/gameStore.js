import { defineStore } from 'pinia'
import { CONFIG } from '../config/constants'

export const useGameStore = defineStore('game', {
  state: () => ({
    // Credits and betting
    credits: CONFIG.game.initialCredits,
    bet: CONFIG.game.minBet,
    currentWin: 0,

    // Spin state
    isSpinning: false,
    showingWinOverlay: false,

    // Win tracking
    consecutiveWins: 0,

    // Free spins
    freeSpins: 0,
    inFreeSpinMode: false,

    // UI state
    showStartScreen: true,
    
    // Loading state
    loadingProgress: { loaded: 0, total: 1 }
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
      return !state.isSpinning &&
             !state.showingWinOverlay &&
             (state.credits >= state.bet || state.inFreeSpinMode)
    },

    canIncreaseBet(state) {
      return !state.isSpinning && state.bet < CONFIG.game.maxBet
    },

    canDecreaseBet(state) {
      return !state.isSpinning && state.bet > CONFIG.game.minBet
    }
  },

  actions: {
    // Betting actions
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

    // Credit management
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

    // Win management
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

    // Spin state
    startSpin() {
      this.isSpinning = true
      this.currentWin = 0
      this.resetConsecutiveWins()
    },

    endSpin() {
      this.isSpinning = false
    },

    // Overlay state
    showWinOverlay() {
      this.showingWinOverlay = true
    },

    hideWinOverlay() {
      this.showingWinOverlay = false
    },

    // Free spins
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

    // UI state
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

    // Reset game
    resetGame() {
      this.credits = CONFIG.game.initialCredits
      this.bet = CONFIG.game.minBet
      this.currentWin = 0
      this.isSpinning = false
      this.showingWinOverlay = false
      this.consecutiveWins = 0
      this.freeSpins = 0
      this.inFreeSpinMode = false
      this.showStartScreen = true
    }
  }
})
