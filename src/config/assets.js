export const ASSETS = {
  symbols: {
    wild: { emoji: '🀄', name: 'Wild', color: '#FFD700' },
    scatter: { emoji: '🎴', name: 'Scatter', color: '#FF4444' },
    dragon_red: { emoji: '🀆', name: 'Red Dragon', color: '#FF6B6B' },
    dragon_green: { emoji: '🀅', name: 'Green Dragon', color: '#51CF66' },
    dragon_white: { emoji: '🀄', name: 'White Dragon', color: '#E0E0E0' },
    wind_east: { emoji: '🀀', name: 'East Wind', color: '#74C0FC' },
    wind_south: { emoji: '🀁', name: 'South Wind', color: '#FFA94D' },
    bamboo: { emoji: '🎋', name: 'Bamboo', color: '#82C91E' },
    character: { emoji: '㊥', name: 'Character', color: '#FF6B9D' },
    dot: { emoji: '⚫', name: 'Dot', color: '#868E96' }
  },
  imagePaths: {
    wild: new URL('../assets/wild.png', import.meta.url).href,
    scatter: new URL('../assets/scatter.png', import.meta.url).href,
    dragon_red: new URL('../assets/dragon_red.png', import.meta.url).href,
    dragon_green: new URL('../assets/dragon_green.png', import.meta.url).href,
    dragon_white: new URL('../assets/dragon_white.png', import.meta.url).href,
    wind_east: new URL('../assets/wind_east.png', import.meta.url).href,
    wind_south: new URL('../assets/wind_south.png', import.meta.url).href,
    bamboo: new URL('../assets/bamboo.png', import.meta.url).href,
    character: new URL('../assets/character.png', import.meta.url).href,
    dot: new URL('../assets/dot.png', import.meta.url).href,
    start_background: new URL('../assets/start_game_bg.jpg', import.meta.url).href
  },
  loadedImages: {}
}
