// imports + cropped texture builder (Pixi v8-safe)
import { Container, Sprite, Texture, Rectangle } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../../config/assets'

// Single crop coordinates from tiles_30.png
// module-level config
const GLOW_RECT = { x: 221, y: 333, w: 77, h: 77, scale: 0.75 }

// Cache the cropped glow texture so we don’t rebuild every frame
let GLOW_TEXTURE = null

function getGlowTexture() {
  if (GLOW_TEXTURE) return GLOW_TEXTURE

  const sheetTex = ASSETS.loadedImages?.tiles_30
    ? ASSETS.loadedImages.tiles_30
    : Texture.from(ASSETS.imagePaths.tiles_30)

  // Use Pixi v8-friendly source; avoid gating on source.valid
  const source = sheetTex?.source || sheetTex?.baseTexture
  if (!source) {
    return null
  }

  const r = GLOW_RECT
  const frame = new Rectangle(r.x, r.y, r.w, r.h)

  // Construct subtexture immediately; Pixi will resolve asynchronously if needed
  GLOW_TEXTURE = new Texture({ source, frame })
  return GLOW_TEXTURE
}

export function useGlowOverlay(gameState, gridState) {
  const container = new Container()
  container.zIndex = 1000

  const sprites = new Map()

  // Reel layout (kept aligned with your reels math)
  const MARGIN_X = 10
  const COLS = 5
  const ROWS_FULL = 4
  const TOP_PARTIAL = 0.30

  function draw(mainRect, tileSize, timestamp, canvasW) {
    // Early exit until the cropped texture is ready
    const tex = getGlowTexture()
    if (!tex) return

    const tileW = typeof tileSize === 'number' ? tileSize : tileSize.w
    const tileH = typeof tileSize === 'number' ? tileSize : tileSize.h

    const stepX = tileW
    const originX = MARGIN_X
    const startY = mainRect.y - (1 - TOP_PARTIAL) * tileH
    const spinning = !!gameState.isSpinning?.value

    const used = new Set()

    for (let col = 0; col < COLS; col++) {
      const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
      const reelStrip = gridState.reelStrips?.value?.[col] || []
      const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

      for (let r = 0; r <= ROWS_FULL + 1; r++) {
        const xCell = originX + col * stepX
        const yCell = startY + r * tileH + offsetTiles * tileH

        let symbol
        if (spinning) {
          if (reelStrip.length === 0) continue
          const idx = ((reelTop + r) % reelStrip.length + reelStrip.length) % reelStrip.length
          symbol = reelStrip[idx]
        } else {
          symbol = gridState.grid?.value?.[col]?.[r]
        }

        if (symbol !== 'gold' && symbol !== 'bonus') continue

        const key = `${col}:${r}`
        let s = sprites.get(key)
        if (!s) {
          s = new Sprite(tex)
          s.anchor.set(0.5)
          s.blendMode = BLEND_MODES.ADD
          // lighter glow: near-white tint + higher alpha
          s.tint = 0xFFF7CC
          s.alpha = symbol === 'gold' ? 1.0 : 0.95
          container.addChild(s)
          sprites.set(key, s)
        }

        // apply scale from GLOW_RECT to size the overlay
        const baseTarget = Math.max(tileW, tileH) * 1.2
        const target = baseTarget * (GLOW_RECT.scale || 1)
        s.width = target
        s.height = target
        s.x = xCell + tileW / 2
        s.y = yCell + tileH / 2

        used.add(key)
      }
    }

    // Cleanup
    for (const [key, s] of sprites.entries()) {
      if (!used.has(key)) {
        s.parent?.removeChild(s)
        s.destroy({ children: true, texture: false, baseTexture: false })
        sprites.delete(key)
      }
    }
  }

  return { container, draw }
}
