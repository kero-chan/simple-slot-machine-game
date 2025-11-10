export const ASSETS = {
  imagePaths: {
    wild: new URL('../assets/wild.png', import.meta.url).href,
    scatter: new URL('../assets/scatter.png', import.meta.url).href,
    dragon_red: new URL('../assets/dragon_red.png', import.meta.url).href,
    dragon_green: new URL('../assets/dragon_green.png', import.meta.url).href,
    dragon_white: new URL('../assets/dragon_white.png', import.meta.url).href,
    wind_east: new URL('../assets/wind_east.png', import.meta.url).href,
    wind_south: new URL('../assets/wind_south.png', import.meta.url).href,
    character: new URL('../assets/character.png', import.meta.url).href,
    dot: new URL('../assets/dot.png', import.meta.url).href,
    start_background: new URL('../assets/start_game_bg.jpg', import.meta.url).href,
    // Spin button assets: frame background + gold arrow
    spin: new URL('../assets/slotMachine/spin_btn/spinBtn.png', import.meta.url).href,
    spin_frame: new URL('../assets/slotMachine/spin_btn/frame.png', import.meta.url).href,
    spin_arrow: new URL('../assets/slotMachine/spin_btn/arrow.png', import.meta.url).href,
    // Tiles spritesheet (source of tile base + bamboo icon)
    tiles_50: new URL('../assets/slotMachine/tiles/50.png', import.meta.url).href,
    reels_bg: new URL('../assets/slotMachine/reels/bg.jpeg', import.meta.url).href
  },
  loadedImages: {}
}
