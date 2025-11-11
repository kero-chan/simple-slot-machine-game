export const ASSETS = {
  imagePaths: {
    start_background: new URL('../assets/start_game_bg.jpg', import.meta.url).href,
    // Spin button assets: frame background + gold arrow
    spin: new URL('../assets/slotMachine/spin_btn/spinBtn.png', import.meta.url).href,
    // Tiles spritesheets
    tiles_50: new URL('../assets/slotMachine/tiles/50.png', import.meta.url).href,
    tiles_29: new URL('../assets/slotMachine/tiles/29.png', import.meta.url).href,
    tiles_34: new URL('../assets/slotMachine/tiles/34.png', import.meta.url).href,
    tiles_star: new URL('../assets/slotMachine/tiles/star.png', import.meta.url).href,
    reels_bg: new URL('../assets/slotMachine/reels/bg.jpeg', import.meta.url).href,
    // Consecutive wins spritesheets
    header_background: new URL('../assets/consecutiveWins/43.png', import.meta.url).href,
    header_title: new URL('../assets/consecutiveWins/58.png', import.meta.url).href,
    header_multiplier_active: new URL('../assets/consecutiveWins/64.png', import.meta.url).href,
    header_multiplier_default: new URL('../assets/consecutiveWins/65.png', import.meta.url).href,
    // Footer
    footer_bg: new URL('../assets/footer_bg.png', import.meta.url).href,
    footer_notification: new URL('../assets/notification_bar.png', import.meta.url).href,
    footer_notification_text: new URL('../assets/notification_text.png', import.meta.url).href
  },
  loadedImages: {},
  audioPaths: [
    new URL('../assets/audio/background_music_01.mp3', import.meta.url).href,
    new URL('../assets/audio/background_music_02.mp3', import.meta.url).href,
    new URL('../assets/audio/background_music_03.mp3', import.meta.url).href
  ]
}
