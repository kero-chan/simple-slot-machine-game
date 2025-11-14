import { defineStore } from 'pinia'

/**
 * Settings store - persisted to localStorage
 * Only contains user preferences that should persist across sessions
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    gameSound: true
  }),

  actions: {
    toggleGameSound() {
      this.gameSound = !this.gameSound
    },

    setGameSound(value) {
      this.gameSound = value
    }
  },

  // Persist all settings to localStorage
  persist: {
    key: 'slot-game-settings',
    storage: localStorage
  }
})
