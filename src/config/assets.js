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
    header_multiplier_active: new URL('../assets/consecutiveWins/64.png', import.meta.url).href,
    header_multiplier_default: new URL('../assets/consecutiveWins/65.png', import.meta.url).href,
    // Footer
    footer_bg: new URL('../assets/footer_bg.png', import.meta.url).href,
    footer_notification_bg: new URL('../assets/notification_bg.png', import.meta.url).href,
    footer_notification_text: new URL('../assets/notification_text.png', import.meta.url).href,
    footer_icon_setting: new URL('../assets/6.png', import.meta.url).href,
    footer_icon_setting1: new URL('../assets/46.png', import.meta.url).href
  },
  loadedImages: {},
  audioPaths: {
    background_music: new URL('../assets/audio/background_music.mp3', import.meta.url).href,
    game_start: new URL('../assets/audio/game_start.mp3', import.meta.url).href,
    consecutive_wins_2x: new URL('../assets/audio/consecutive_wins/2x.mp3', import.meta.url).href,
    consecutive_wins_3x: new URL('../assets/audio/consecutive_wins/3x.mp3', import.meta.url).href,
    consecutive_wins_5x: new URL('../assets/audio/consecutive_wins/5x.mp3', import.meta.url).href,
    background_noises: [
      new URL('../assets/audio/background_noise/noise_1.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_2.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_3.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_4.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_5.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_6.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_7.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_8.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_9.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_10.mp3', import.meta.url).href,
      new URL('../assets/audio/background_noise/noise_11.mp3', import.meta.url).href
    ]
  }
}
