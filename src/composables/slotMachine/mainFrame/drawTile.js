import { Container, Graphics, Sprite } from 'pixi.js'
import { createSymbolSprite, updateSymbolSprite } from './drawSymbol'

// Tuning constants
const PULSE_SPEED = 0.25 // Hz, slower to avoid flash
const PULSE_SCALE_AMPLITUDE = 0.02 // 2% scale
const BORDER_COLOR = 0xffeb78 // brighter border (RGB: 255, 235, 120)
const BORDER_LINE_WIDTH = 3 // slightly thicker

export class Tile {
  constructor(x, y, size, symbol) {
    this.x = x
    this.y = y
    this.size = size
    this.symbol = symbol

    // PixiJS container for this tile
    this.container = new Container()
    this.container.position.set(x, y)

    // Visual components
    this.glowGraphics = null
    this.borderGraphics = null
    this.symbolSprite = null
    this.overlayGraphics = null
    this.sparklesContainer = null
    this.motionBlurContainer = null

    // highlight and animation state
    this.isWinning = false
    this.highlightIntensity = 0
    this.pulsePhase = Math.random() * Math.PI * 2

    // motion state
    this.velocityPx = 0

    // Disappear animation state
    this.isDisappearing = false
    this.disappearProgress = 0
    this.disappearStartTime = 0

    this.initializeGraphics()
  }

  initializeGraphics() {
    // Motion blur layer (behind everything)
    this.motionBlurContainer = new Container()
    this.container.addChild(this.motionBlurContainer)

    // Glow layer
    this.glowGraphics = new Graphics()
    this.container.addChild(this.glowGraphics)

    // Symbol sprite
    this.symbolSprite = createSymbolSprite(this.symbol, 0, 0, this.size)
    if (this.symbolSprite) {
      this.container.addChild(this.symbolSprite)
    }

    // Overlay layer (for golden tint)
    this.overlayGraphics = new Graphics()
    this.container.addChild(this.overlayGraphics)

    // Border layer
    this.borderGraphics = new Graphics()
    this.container.addChild(this.borderGraphics)

    // Sparkles layer (on top)
    this.sparklesContainer = new Container()
    this.container.addChild(this.sparklesContainer)
  }

  setPosition(x, y) {
    this.x = x
    this.y = y
    this.container.position.set(x, y)
  }

  setSize(size) {
    this.size = size
  }

  setSymbol(symbol) {
    if (this.symbol !== symbol) {
      this.symbol = symbol
      // Update symbol sprite
      if (this.symbolSprite) {
        updateSymbolSprite(this.symbolSprite, symbol, 0, 0, this.size)
      }
    }
  }

  setVelocityPx(v) {
    this.velocityPx = v
  }

  setWinning(isWinning) {
    this.isWinning = isWinning
  }

  startDisappear() {
    if (this.isDisappearing) return
    this.isDisappearing = true
    this.disappearProgress = 0
    this.disappearStartTime = performance.now()
  }

  isDisappearComplete() {
    return this.isDisappearing && this.disappearProgress >= 1
  }

  update(deltaSec) {
    // Disappear phase updates first
    if (this.isDisappearing) {
      const DISAPPEAR_DURATION = 0.3 // seconds
      this.disappearProgress = Math.min(1, this.disappearProgress + deltaSec / DISAPPEAR_DURATION)
      return
    }

    if (this.isWinning) {
      this.highlightIntensity = Math.min(1, this.highlightIntensity + deltaSec * 2) // gentle ramp
      this.pulsePhase += deltaSec * PULSE_SPEED * (Math.PI * 2)
    } else {
      this.highlightIntensity = Math.max(0, this.highlightIntensity - deltaSec * 1.5) // gentle fade
    }
  }

  draw(timestamp) {
    // Clear all graphics
    this.glowGraphics.clear()
    this.borderGraphics.clear()
    this.overlayGraphics.clear()
    this.sparklesContainer.removeChildren()
    this.motionBlurContainer.removeChildren()

    if (this.isDisappearing) {
      this.drawDisappearing(timestamp)
      return
    }

    // Motion blur
    if (this.velocityPx > 2) {
      this.drawMotionBlur()
    }

    const alpha = Math.min(1, this.highlightIntensity)

    // Pulsing scale
    const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
    const pulseScale = this.isWinning ? 1.0 + Math.sin(phase) * PULSE_SCALE_AMPLITUDE * alpha : 1.0

    // Apply pulse scale to container
    const cx = this.size / 2
    const cy = this.size / 2
    this.container.pivot.set(cx, cy)
    this.container.position.set(this.x + cx, this.y + cy)
    this.container.scale.set(pulseScale)

    // Draw winning effects
    if (this.isWinning && alpha > 0) {
      this.drawRadialGlow(alpha)
      this.drawOverlay(alpha)
      this.drawBorders(alpha)
      this.drawSparkles(alpha, timestamp)
    }

    // Make symbol visible
    if (this.symbolSprite) {
      this.symbolSprite.visible = true
      this.symbolSprite.alpha = 1
    }
  }

  drawMotionBlur() {
    const blurSteps = Math.min(Math.floor(this.velocityPx / 3), 10)
    for (let i = blurSteps; i >= 1; i--) {
      const alpha = 0.12 * (1 - i / (blurSteps + 1))
      const trailY = -(i * this.velocityPx * 0.18)

      const blurSprite = createSymbolSprite(this.symbol, 0, trailY, this.size)
      if (blurSprite) {
        blurSprite.alpha = alpha
        this.motionBlurContainer.addChild(blurSprite)
      }
    }
  }

  drawRadialGlow(alpha) {
    const cx = this.size / 2
    const cy = this.size / 2
    const size = this.size

    // Solid gold background
    const padding = size * 0.06
    this.glowGraphics.rect(padding, padding, size - padding * 2, size - padding * 2)
    this.glowGraphics.fill({ color: 0xffd700, alpha: Math.min(1, alpha * 0.95) })

    // Soft gradient depth using circles
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const r = size * 0.7 * t
      const gradAlpha = alpha * 0.7 * (1 - t) * 0.45
      this.glowGraphics.circle(cx, cy, r)
      this.glowGraphics.fill({ color: 0xffffc8, alpha: gradAlpha })
    }

    // Outer glow
    this.glowGraphics.rect(0, 0, size, size)
    this.glowGraphics.fill({ color: 0xffd700, alpha: alpha * 0.3 })
  }

  drawOverlay(alpha) {
    const cx = this.size / 2
    const cy = this.size / 2
    const size = this.size

    // Stronger golden tint overlay using circles
    const steps = 10
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const r = size * 0.75 * t
      const overlayAlpha = alpha * 0.45 * (1 - t)
      const color = interpolateColor(0xfff078, 0xffd250, 0xffbe3c, t)
      this.overlayGraphics.circle(cx, cy, r)
      this.overlayGraphics.fill({ color, alpha: overlayAlpha })
    }
  }

  drawBorders(alpha) {
    this.borderGraphics.rect(1, 1, this.size - 2, this.size - 2)
    this.borderGraphics.stroke({ color: BORDER_COLOR, width: BORDER_LINE_WIDTH, alpha: Math.min(1, alpha * 0.9) })
  }

  drawSparkles(alpha, timestamp) {
    const cx = this.size / 2
    const cy = this.size / 2
    const phase = timestamp * 0.002

    const sparkleCount = this.symbol === 'wild' ? 8 : 4
    const maxCount = Math.min(sparkleCount, 6)

    for (let i = 0; i < maxCount; i++) {
      const angle = (i / maxCount) * Math.PI * 2 + phase
      const r = this.size * (0.3 + 0.2 * Math.sin(phase + i))
      const px = cx + Math.cos(angle) * r
      const py = cy + Math.sin(angle) * r
      const sparkleSize = Math.max(1, Math.floor(this.size * 0.025))

      const sparkle = new Graphics()
      sparkle.circle(px, py, sparkleSize)
      sparkle.fill({ color: 0xffffdc, alpha: Math.min(1, alpha * 0.6) * 0.9 })
      this.sparklesContainer.addChild(sparkle)
    }
  }

  drawDisappearing(timestamp) {
    const progress = this.disappearProgress
    const eased = progress * progress // ease-in

    const alpha = 1.0 - eased
    const scale = 1.0 - (eased * 0.15)

    // Apply scale and alpha
    this.container.scale.set(scale)
    this.container.alpha = alpha

    // Keep the soft glow for the first half
    if (progress < 0.5) {
      const remaining = 1 - progress * 2
      this.drawRadialGlow(Math.max(0, remaining))
    }

    // Make symbol visible
    if (this.symbolSprite) {
      this.symbolSprite.visible = true
      this.symbolSprite.alpha = alpha
    }
  }
}

function interpolateColor(color1, color2, color3, t) {
  if (t < 0.5) {
    return lerpColor(color1, color2, t * 2)
  } else {
    return lerpColor(color2, color3, (t - 0.5) * 2)
  }
}

function lerpColor(c1, c2, t) {
  const r1 = (c1 >> 16) & 0xff
  const g1 = (c1 >> 8) & 0xff
  const b1 = c1 & 0xff

  const r2 = (c2 >> 16) & 0xff
  const g2 = (c2 >> 8) & 0xff
  const b2 = c2 & 0xff

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return (r << 16) | (g << 8) | b
}
