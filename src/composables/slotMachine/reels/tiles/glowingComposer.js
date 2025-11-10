// Top imports
import { Container, Sprite, Texture, Graphics } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../../config/assets'

// Basic reel layout
const MARGIN_X = 10
const COLS = 5
const ROWS_FULL = 4
const TOP_PARTIAL = 0.30

// Sparkle tuning: bottom → top star dots
const DOTS_PER_TILE = 16
const DOT_SPAWN_RATE = 0.30
const DOT_MIN_SIZE = 20
const DOT_MAX_SIZE = 50

// Lifetime (ms) — extended to allow travel above the tile
const DOT_MIN_LIFE = 800   // was 450
const DOT_MAX_LIFE = 4000  // was 900

// Speeds
const DOT_UP_SPEED_MIN = 0.6  // px/frame upward
const DOT_UP_SPEED_MAX = 1.3
const DOT_DRIFT_MAX = 0.4     // px/frame horizontal drift

// New: how high dots travel relative to tile height (e.g., 1.8 → 180%)
const DOT_TRAVEL_FACTOR = 1.8

// Approx frame time for converting frames → ms
const FRAME_MS_APPROX = 16.7

// Cache the star texture once; fallback keeps dots visible
// Cache a valid Pixi Texture for the star, regardless of source type
let STAR_TEX = null
function ensureStarTexture() {
  if (STAR_TEX && STAR_TEX.source?.valid) return STAR_TEX

  const loaded = ASSETS.loadedImages?.tiles_star
  if (loaded) {
    STAR_TEX = loaded.source ? loaded : Texture.from(loaded)
    return STAR_TEX
  }

  const url = ASSETS.imagePaths?.tiles_star
  if (url) {
    STAR_TEX = Texture.from(url)
    return STAR_TEX
  }

  return null
}

export function useGlowOverlay(gameState, gridState, options = {}) {
  const container = new Container()
  container.zIndex = 1000

  // Add a graphics mask to clip to the board area
  let maskGraphics = null

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

    // Start in bottom band
    s.x = xCell + tileW * (0.3 + Math.random() * 0.4)
    s.y = yCell + tileH * (0.82 + Math.random() * 0.12)
    s.alpha = 1.0

    // Motion
    const vy = -(DOT_UP_SPEED_MIN + Math.random() * (DOT_UP_SPEED_MAX - DOT_UP_SPEED_MIN))
    const vx = (Math.random() * 2 - 1) * DOT_DRIFT_MAX

    // Life so dot rises DOT_TRAVEL_FACTOR × tileH pixels
    const desiredRisePx = tileH * DOT_TRAVEL_FACTOR
    const framesNeeded = desiredRisePx / Math.max(0.001, Math.abs(vy))
    let life = framesNeeded * FRAME_MS_APPROX
    // Clamp to configured min/max and add slight variance
    life = Math.max(DOT_MIN_LIFE, Math.min(DOT_MAX_LIFE, life)) * (0.9 + Math.random() * 0.2)

    container.addChild(s)
    entry.list.push({ sprite: s, born: timestamp, life, vx, vy })
  }

  function updateDots(entry, timestamp) {
    if (!entry) return
    const alive = []
    for (const p of entry.list) {
      const age = timestamp - p.born
      const t = Math.min(Math.max(age / p.life, 0), 1)

      // Move upward with slight random drift
      p.sprite.x += p.vx
      p.sprite.y += p.vy

      // Ease-out fade and slight shrink for sparkle feel
      p.sprite.alpha = (1 - t) * (1 - t)
      p.sprite.width *= 0.997
      p.sprite.height *= 0.997

      if (t < 1) {
        alive.push(p)
      } else {
        p.sprite.parent?.removeChild(p.sprite)
        p.sprite.destroy({ children: true, texture: false, baseTexture: false })
      }
    }
    entry.list = alive
  }

  function draw(mainRect, tileSize, timestamp) {
    const tileW = typeof tileSize === 'number' ? tileSize : tileSize.w
    const tileH = typeof tileSize === 'number' ? tileSize : tileSize.h

    // Update mask so effects never appear in header/footer
    const boardW = COLS * tileW
    const boardH = ROWS_FULL * tileH + TOP_PARTIAL * tileH
    if (!maskGraphics) {
      maskGraphics = new Graphics()
      container.addChild(maskGraphics)
      container.mask = maskGraphics
    }
    maskGraphics.clear()
    maskGraphics.rect(mainRect.x, mainRect.y, boardW, boardH)
    maskGraphics.fill(0xffffff)

    const originX = MARGIN_X
    const startY = mainRect.y - (1 - TOP_PARTIAL) * tileH
    const spinning = !!gameState.isSpinning?.value

    const used = new Set()

    for (let col = 0; col < COLS; col++) {
      const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
      const reelStrip = gridState.reelStrips?.value?.[col] || []
      const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

      for (let r = 0; r <= ROWS_FULL + 1; r++) {
        const xCell = originX + col * tileW
        const yCell = startY + r * tileH + offsetTiles * tileH

        let symbol
        if (spinning) {
          if (reelStrip.length === 0) continue
          const idx = ((reelTop + r) % reelStrip.length + reelStrip.length) % reelStrip.length
          symbol = reelStrip[idx]
        } else {
          symbol = gridState.grid?.value?.[col]?.[r]
        }

        // Only gold and bonus tiles
        if (symbol !== 'gold' && symbol !== 'bonus') continue

        const key = `${col}:${r}`

        // Spawn and update dots
        spawnDot(key, tileW, tileH, xCell, yCell, timestamp)
        const dotEntry = dotsMap.get(key)
        if (dotEntry) updateDots(dotEntry, timestamp)

        used.add(key)
      }
    }

    // Cleanup dots for tiles no longer active
    for (const [key, entry] of dotsMap.entries()) {
      if (!used.has(key)) {
        for (const p of entry.list) {
          p.sprite.parent?.removeChild(p.sprite)
          p.sprite.destroy({ children: true, texture: false, baseTexture: false })
        }
        dotsMap.delete(key)
      }
    }
  }

  return { container, draw }
}
