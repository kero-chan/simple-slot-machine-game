import { defineStore } from "pinia";

export const useMenuStateStore = defineStore("menuState", {
  state: () => ({
    volume: 1, // 1 = on, 0 = off (default to on)
  }),

  getters: {
    isVolumeOn: (state) => state.volume === 1,
  },

  actions: {
    toggleVolume() {
      this.volume = this.volume === 1 ? 0 : 1;
    },
    setVolume(value) {
      this.volume = value === 1 ? 1 : 0;
    },
  },

  persist: {
    key: 'slot-game-menu-state',
    storage: localStorage,
    paths: ['volume'], // Only persist volume
  },
});
