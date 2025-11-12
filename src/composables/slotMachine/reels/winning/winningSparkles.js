/**
 * Manages sparkling effects for winning tiles during their highlight/flip animations
 */
import { Container, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../../config/assets'
import { useTimingStore } from '../../../../stores/timingStore'

// Basic reel layout
const COLS = 5
const ROWS_FULL = 4
const TOP_PARTIAL = 0.30
const BUFFER_OFFSET = 4

// Sparkle tuning for winning tiles
const DOTS_PER_TILE = 12
const DOT_SPAWN_RATE = 0.35  // Higher spawn rate for more sparkles
const DOT_MIN_SIZE = 12
const DOT_MAX_SIZE = 35

// Lifetime (ms)
const DOT_MIN_LIFE = 600
const DOT_MAX_LIFE = 1200

// Speeds
const DOT_SPEED_MIN = 0.8  // px/frame outward
const DOT_SPEED_MAX = 2.0

// Approx frame time
const FRAME_MS_APPROX = 16.7

// Cache the star texture
let STAR_TEX = null
function ensureStarTexture() {
  if (STAR_TEX && STAR_TEX.source?.valid) return STAR_TEX

  const loaded = ASSETS.loadedImages?.win_gold
  if (loaded) {
    STAR_TEX = loaded.source ? loaded : Texture.from(loaded)
    return STAR_TEX
  }

  const url = ASSETS.imagePaths?.win_gold
  if (url) {
    STAR_TEX = Texture.from(url)
    return STAR_TEX
  }

  return null
}

export function createWinningSparkles() {
  const container = new Container()
  container.zIndex = 1001 // Above glow overlay

  const timingStore = useTimingStore()
  const dotsMap = new Map() // key -> { list: [] }

  function spawnDot(key, tileW, tileH, xCell, yCell, timestamp) {
    let entry = dotsMap.get(key)
    if (!entry) {
      entry = { list: [] }
      dotsMap.set(key, entry)
    }
    if (entry.list.length >= DOTS_PER_TILE) return
    if (Math.random() > DOT_SPAWN_RATE) return

    const tex = ensureStarTexture() || Texture.WHITE
    const s = new Sprite(tex)
    s.blendMode = BLEND_MODES.ADD
    s.anchor.set(0.5)

    const sizeMin = Math.min(DOT_MIN_SIZE, DOT_MAX_SIZE)
    const sizeMax = Math.max(DOT_MIN_SIZE, DOT_MAX_SIZE)
    const pxSize = Math.round(sizeMin + Math.random() * (sizeMax - sizeMin))
    s.width = pxSize
    s.height = pxSize

    // Start near center of tile with slight randomness
    const centerX = xCell + tileW * 0.5
    const centerY = yCell + tileH * 0.5
    s.x = centerX + (Math.random() * 2 - 1) * tileW * 0.2
    s.y = centerY + (Math.random() * 2 - 1) * tileH * 0.2
    s.alpha = 1.0

    // Motion: random direction outward from center
    const angle = Math.random() * Math.PI * 2
    const speed = DOT_SPEED_MIN + Math.random() * (DOT_SPEED_MAX - DOT_SPEED_MIN)
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    // Life with variance
    const life = (DOT_MIN_LIFE + Math.random() * (DOT_MAX_LIFE - DOT_MIN_LIFE)) * (0.9 + Math.random() * 0.2)

    container.addChild(s)
    entry.list.push({ sprite: s, born: timestamp, life, vx, vy })
  }

  function updateDots(entry, timestamp) {
    if (!entry) return
    const alive = []
    for (const p of entry.list) {
      const age = timestamp - p.born
      const t = Math.min(Math.max(age / p.life, 0), 1)

      // Move outward with velocity
      p.sprite.x += p.vx
      p.sprite.y += p.vy

      // Ease-out fade and shrink
      p.sprite.alpha = (1 - t) * (1 - t)
      p.sprite.width *= 0.996
      p.sprite.height *= 0.996

      if (t < 1) {
        alive.push(p)
      } else {
        p.sprite.parent?.removeChild(p.sprite)
        p.sprite.destroy({ children: true, texture: false, baseTexture: false })
      }
    }
    entry.list = alive
  }

  function draw(mainRect, tileSize, timestamp, canvasW, gridState) {
    const tileW = typeof tileSize === 'number' ? tileSize : tileSize.w
    const tileH = typeof tileSize === 'number' ? tileSize : tileSize.h

    // Match reels positioning
    const margin = 10
    const availableWidth = canvasW - (margin * 2)
    const scaledTileW = availableWidth / COLS
    const scaledTileH = scaledTileW * (tileH / tileW)
    const stepX = scaledTileW
    const originX = margin

    const startY = mainRect.y - (1 - TOP_PARTIAL) * scaledTileH

    const used = new Set()

    // Get winning positions
    const winningPositions = new Set()
    const wins = gridState.highlightWins || []
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        winningPositions.add(`${col},${row}`)
      })
    })

    // Check if we're in the flip animation window
    // NOTE: highlightAnim uses Date.now(), but timestamp is performance.now()
    // We need to use Date.now() for consistency
    const now = Date.now()
    const highlightAnim = gridState.highlightAnim
    const FLIP_DELAY = timingStore.HIGHLIGHT_BEFORE_FLIP
    const FLIP_DURATION = timingStore.FLIP_DURATION
    let isFlipTime = false

    if (highlightAnim && highlightAnim.start > 0) {
      const elapsed = now - highlightAnim.start
      isFlipTime = elapsed >= FLIP_DELAY && elapsed <= (FLIP_DELAY + FLIP_DURATION)
    }

    // Spawn sparkles only during flip animation
    if (winningPositions.size > 0 && isFlipTime) {
      for (let col = 0; col < COLS; col++) {
        for (let r = 1; r <= ROWS_FULL; r++) {  // Only visible rows
          const gridRow = r + BUFFER_OFFSET
          const posKey = `${col},${gridRow}`

          if (!winningPositions.has(posKey)) continue

          const xCell = originX + col * stepX
          const yCell = startY + r * scaledTileH

          const key = `${col}:${r}`

          // Spawn new sparkles (use Date.now() for consistency with highlightAnim)
          spawnDot(key, scaledTileW, scaledTileH, xCell, yCell, now)
          used.add(key)
        }
      }
    }

    // Always update all existing sparkles (even after flip ends)
    for (const [key, entry] of dotsMap.entries()) {
      updateDots(entry, now)  // Use Date.now() for consistency
      // If entry still has particles, keep it alive
      if (entry.list.length > 0) {
        used.add(key)
      }
    }

    // Cleanup only entries with no particles left
    for (const [key, entry] of dotsMap.entries()) {
      if (!used.has(key)) {
        dotsMap.delete(key)
      }
    }
  }

  function clear() {
    // Clear all sparkles
    for (const [key, entry] of dotsMap.entries()) {
      for (const p of entry.list) {
        p.sprite.parent?.removeChild(p.sprite)
        p.sprite.destroy({ children: true, texture: false, baseTexture: false })
      }
    }
    dotsMap.clear()
  }

  return { container, draw, clear }
}
