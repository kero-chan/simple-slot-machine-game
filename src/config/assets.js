export const ASSETS = {
  imagePaths: {
    start_background: new URL('../assets/start_game_bg.jpg', import.meta.url).href,
    // Spin button assets: frame background + gold arrow
    spin: new URL('../assets/slotMachine/spin_btn/spinBtn.png', import.meta.url).href,
    spin_frame: new URL('../assets/slotMachine/spin_btn/frame.png', import.meta.url).href,
    spin_arrow: new URL('../assets/slotMachine/spin_btn/arrow.png', import.meta.url).href,
    // Tiles spritesheets
    tiles_50: new URL('../assets/slotMachine/tiles/50.png', import.meta.url).href,
    tiles_29: new URL('../assets/slotMachine/tiles/29.png', import.meta.url).href,
    tiles_34: new URL('../assets/slotMachine/tiles/34.png', import.meta.url).href,
    tiles_21: new URL('../assets/slotMachine/tiles/21.png', import.meta.url).href,
    tiles_30: new URL('../assets/slotMachine/tiles/30.png', import.meta.url).href,
    reels_bg: new URL('../assets/slotMachine/reels/bg.jpeg', import.meta.url).href,
    // Consecutive wins spritesheets
    'header_background': new URL('../assets/consecutiveWins/43.png', import.meta.url).href,
    'text': new URL('../assets/consecutiveWins/58.png', import.meta.url).href,
    'consecutive_wins_active': new URL('../assets/consecutiveWins/64.png', import.meta.url).href,
    'consecutive_wins_default': new URL('../assets/consecutiveWins/65.png', import.meta.url).href,
  },
  loadedImages: {}
}
