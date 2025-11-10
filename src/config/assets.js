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
    start_background: new URL('../assets/start_game_bg.jpg', import.meta.url).href,
    // Spin button assets: frame background + gold arrow
    spin_frame: new URL('../assets/slotMachine/spin_btn/frame.png', import.meta.url).href,
    spin_arrow: new URL('../assets/slotMachine/spin_btn/arrow.png', import.meta.url).href,
    // Tiles spritesheet (source of tile base + bamboo icon)
    // tiles_50: new URL('../assets/tiles/50.png', import.meta.url).href,
    reels_bg: new URL('../assets/slotMachine/reels/bg.jpeg', import.meta.url).href
  },
  loadedImages: {}
}

// Compose Bamboo from tiles_50 spritesheet and register in loadedImages
// Uses HTMLCanvas 2D to avoid depending on PixiApp during bootstrap
import { Texture } from 'pixi.js'

async function ensureBambooFromSheet() {
  try {
    if (ASSETS.loadedImages.bamboo) return
    const url = ASSETS.imagePaths.tiles_50
    if (!url) return

    const img = await loadImage(url)

    // TODO: Replace these placeholder rects with exact slices for your sheet.
    // All values are pixels in the 50.png coordinate space.
    // tileBaseRect: the rounded white tile background
    // bambooIconRect: the green "bamboo" glyph
    const tileBaseRect = { x: 820, y: 60, w: 180, h: 180 }
    const bambooIconRect = { x: 190, y: 190, w: 190, h: 190 }

    // Guard against out-of-bounds
    clampRect(tileBaseRect, img.width, img.height)
    clampRect(bambooIconRect, img.width, img.height)

    // Compose to offscreen canvas (transparent background)
    const outSize = 512
    const canvas = document.createElement('canvas')
    canvas.width = outSize
    canvas.height = outSize
    const ctx = canvas.getContext('2d')

    // Draw tile base scaled to full canvas
    drawSlice(ctx, img, tileBaseRect, { x: 0, y: 0, w: outSize, h: outSize })

    // Draw bamboo icon centered, scaled to ~78% of tile area
    const iconScale = 0.78
    const iconW = Math.floor(outSize * iconScale)
    const iconH = Math.floor(outSize * iconScale)
    const iconX = Math.floor((outSize - iconW) / 2)
    const iconY = Math.floor((outSize - iconH) / 2)
    drawSlice(ctx, img, bambooIconRect, { x: iconX, y: iconY, w: iconW, h: iconH })

    // Register as Pixi Texture for use by reels
    const tex = Texture.from(canvas)
    ASSETS.loadedImages.bamboo = tex
  } catch (e) {
    // If the file is missing or slicing fails, keep default bamboo.png
    console.warn('Bamboo composition skipped:', e?.message || e)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function clampRect(rect, maxW, maxH) {
  rect.x = Math.max(0, Math.min(rect.x, maxW))
  rect.y = Math.max(0, Math.min(rect.y, maxH))
  rect.w = Math.max(1, Math.min(rect.w, maxW - rect.x))
  rect.h = Math.max(1, Math.min(rect.h, maxH - rect.y))
}

function drawSlice(ctx, img, srcRect, dstRect) {
  ctx.drawImage(
    img,
    srcRect.x, srcRect.y, srcRect.w, srcRect.h,
    dstRect.x, dstRect.y, dstRect.w, dstRect.h
  )
}

// Kick off composition once the assets module is imported
void ensureBambooFromSheet()
