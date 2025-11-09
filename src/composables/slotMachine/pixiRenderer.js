import { Application, Container, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { GlowFilter } from '@pixi/filter-glow'
import { BlurFilter } from '@pixi/filter-blur'
import { ASSETS } from '../../config/assets'
import { computeGridMetrics } from './mainFrame/metrics'

export function usePixiReelsRenderer() {
  let app = null
  const stage = new Container()
  const reelsContainer = new Container()
  stage.addChild(reelsContainer)

  // Cache sprites by "col,row"
  const spriteCache = new Map()
  let lastSize = { w: 0, h: 0 }

  const ensureApp = (width, height) => {
    if (!app) {
      app = new Application({
        width,
        height,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        backgroundAlpha: 0,            // transparent for compositing
        preserveDrawingBuffer: true    // allow extraction if needed
      })
      app.stage.addChild(stage)
      lastSize = { w: width, h: height }
    } else if (lastSize.w !== width || lastSize.h !== height) {
      app.renderer.resize(width, height)
      lastSize = { w: width, h: height }
    }
  }

  const buildOrUpdateTileSprite = (key, x, y, size, symbol, isWinning, velocityPx, timestamp, effectAlpha) => {
    let sp = spriteCache.get(key)

    const img = ASSETS.loadedImages && ASSETS.loadedImages[symbol]
    if (!img || !img.complete || img.naturalHeight === 0) return

    const tex = Texture.from(img)

    const padding = Math.floor(size * 0.06)
    const w = size - padding * 2
    const h = size - padding * 2

    if (!sp) {
      sp = new Sprite(tex)
      sp.x = x + padding
      sp.y = y + padding
      sp.width = w
      sp.height = h

      const glow = new GlowFilter({
        distance: Math.max(6, Math.floor(size * 0.08)),
        outerStrength: 1.5,
        innerStrength: 0.0,
        color: 0xFFD700,
        quality: 0.25
      })
      const blur = new BlurFilter(Math.max(1, Math.floor(size * 0.015)))
      sp.filters = [glow, blur]

      reelsContainer.addChild(sp)
      spriteCache.set(key, sp)
    } else {
      sp.texture = tex
      sp.x = x + padding
      sp.y = y + padding
      sp.width = w
      sp.height = h
    }

    const isSpinning = velocityPx > 2
    sp.alpha = isSpinning ? 0.95 : 1.0

    const baseAlpha = effectAlpha ?? 1
    if (isWinning && baseAlpha > 0) {
      const PULSE_SPEED = 0.25
      const PULSE_SCALE_AMPLITUDE = 0.02
      const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
      const pulseScale = 1.0 + Math.sin(phase) * PULSE_SCALE_AMPLITUDE * baseAlpha
      sp.scale.set(pulseScale, pulseScale)
      sp.tint = 0xFFF1A0
      // Use modular constants for blend mode
      sp.blendMode = BLEND_MODES.ADD
    } else {
      sp.scale.set(1, 1)
      sp.tint = 0xFFFFFF
      sp.blendMode = BLEND_MODES.NORMAL
    }
  }

  const drawReelsToPixi = (mainRect, gridState, gameState, timestamp) => {
    ensureApp(mainRect.w, mainRect.h)

    // IMPORTANT: compute metrics in local coordinates of offscreen canvas
    const localRect = { x: 0, y: 0, w: mainRect.w, h: mainRect.h }
    const m = computeGridMetrics(localRect)

    for (let col = 0; col < m.cols; col++) {
      const offsetTiles = (gridState.spinOffsets?.value?.[col] ?? 0)
      const velocityTiles = (gridState.spinVelocities?.value?.[col] ?? 0)
      const velocityPx = velocityTiles * m.symbolSize

      for (let row = 0; row < m.rows; row++) {
        // Use originX/originY from metrics inside the offscreen canvas
        const x = m.originX + col * (m.symbolSize + m.spacingX)
        const baseY = m.originY + row * (m.symbolSize + m.spacingY)
        const y = baseY + offsetTiles * m.symbolSize

        const spinning = gameState.isSpinning.value || offsetTiles > 0
        const symbol = spinning
          ? (() => {
              const strip = gridState.reelStrips.value[col]
              const top = gridState.reelTopIndex.value[col]
              const idx = (top + row) % strip.length
              return strip[idx]
            })()
          : gridState.grid.value[col][row]

        const isWinning = gridState.highlightWins.value
          ? gridState.highlightWins.value.some(win =>
              win.positions.some(([c, r]) => c === col && r === row)
            )
          : false

        const key = `${col},${row}`
        buildOrUpdateTileSprite(key, x, y, m.symbolSize, symbol, isWinning, velocityPx, timestamp, 1)
      }
    }

    app.renderer.render(app.stage)
  }

  const getCanvas = () => {
    return app?.view || null
  }

  return { drawReelsToPixi, getCanvas }
}
