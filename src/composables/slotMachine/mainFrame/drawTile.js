import { drawSymbol } from './drawSymbol'

// Tuning constants
const PULSE_SPEED = 0.25 // Hz, slower to avoid flash
const PULSE_SCALE_AMPLITUDE = 0.02 // 2% scale
const BORDER_COLOR = 'rgba(255, 235, 120, 1)'  // brighter border
const BORDER_LINE_WIDTH = 3                    // slightly thicker

function drawRadialGlow(ctx, x, y, size, alpha) {
  const cx = x + size / 2
  const cy = y + size / 2

  // Solid gold background
  ctx.save()
  ctx.globalAlpha = Math.min(1, alpha * 0.95)           // stronger opacity
  ctx.fillStyle = '#FFD700'
  const padding = size * 0.06                            // less padding → more coverage
  ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2)
  ctx.restore()

  // Soft gradient depth
  ctx.save()
  ctx.globalAlpha = Math.min(1, alpha * 0.7)            // stronger gradient
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7) // slightly larger radius
  gradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)') // brighter center
  gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.45)')
  gradient.addColorStop(1, 'rgba(255, 180, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, size, size)
  ctx.restore()

  // Subtle outer glow
  ctx.save()
  ctx.shadowColor = `rgba(255, 200, 0, ${alpha * 0.7})`
  ctx.shadowBlur = 12                                    // slightly higher blur
  ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`    // stronger outer fill
  ctx.fillRect(x, y, size, size)
  ctx.restore()
}

function drawBorders(ctx, x, y, size, alpha) {
  ctx.save()
  ctx.globalAlpha = Math.min(1, alpha * 0.9)             // stronger visibility
  ctx.strokeStyle = BORDER_COLOR
  ctx.lineWidth = BORDER_LINE_WIDTH
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2)
  ctx.restore()
}

function drawSparkles(ctx, x, y, size, count, alpha, timestamp) {
  const cx = x + size / 2
  const cy = y + size / 2
  const phase = timestamp * 0.002
  ctx.save()
  ctx.globalAlpha = Math.min(1, alpha * 0.6)             // slightly more visible

  const maxCount = Math.min(count, 6)
  for (let i = 0; i < maxCount; i++) {
    const angle = (i / maxCount) * Math.PI * 2 + phase
    const r = size * (0.3 + 0.2 * Math.sin(phase + i))
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r
    const sparkleSize = Math.max(1, Math.floor(size * 0.025)) // a tad bigger
    ctx.fillStyle = 'rgba(255, 255, 220, 0.9)'
    ctx.beginPath()
    ctx.arc(px, py, sparkleSize, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawTile(ctx, {
  symbol,
  x,
  y,
  size,
  timestamp,
  isSpinning,
  velocityPx,
  isWinning,
  effectAlpha
}) {
  // Motion blur while spinning
  if (isSpinning && velocityPx > 2) {
    ctx.save()
    const blurSteps = Math.min(Math.floor(velocityPx / 3), 10)
    for (let i = blurSteps; i >= 1; i--) {
      ctx.globalAlpha = 0.12 * (1 - i / (blurSteps + 1))
      const trailY = y - (i * velocityPx * 0.18)
      drawSymbol(ctx, symbol, x, trailY, size)
    }
    ctx.restore()
  }

  const alpha = effectAlpha ?? 1
  if (isWinning && alpha > 0) {
    // Subtle pulse
    const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
    const pulseScale = 1.0 + Math.sin(phase) * PULSE_SCALE_AMPLITUDE * alpha
    const cx = x + size / 2
    const cy = y + size / 2

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(pulseScale, pulseScale)
    ctx.translate(-cx, -cy)

    // Solid yellow background + soft glow
    drawRadialGlow(ctx, x, y, size, alpha)

    // Symbol on top
    drawSymbol(ctx, symbol, x, y, size)

    // Stronger golden tint overlay (non-additive)
    ctx.save()
    ctx.globalAlpha = Math.min(1, alpha * 0.45)
    const topGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.75)
    topGrad.addColorStop(0, 'rgba(255, 240, 120, 1.0)')
    topGrad.addColorStop(0.6, 'rgba(255, 210, 80, 0.45)')
    topGrad.addColorStop(1, 'rgba(255, 190, 60, 0.0)')
    ctx.fillStyle = topGrad
    ctx.fillRect(x, y, size, size)
    ctx.restore()

    // Subtle border
    drawBorders(ctx, x, y, size, alpha)

    ctx.restore()

    // Subtle sparkles
    const sparkleCount = symbol === 'wild' ? 8 : 4
    drawSparkles(ctx, x, y, size, sparkleCount, alpha * 0.5, timestamp)
    return
  }

  // Default tile
  drawSymbol(ctx, symbol, x, y, size)
}

export class Tile {
  constructor(x, y, size, symbol) {
    this.x = x
    this.y = y
    this.size = size
    this.symbol = symbol

    // highlight and animation state
    this.isWinning = false
    this.highlightIntensity = 0
    this.pulsePhase = Math.random() * Math.PI * 2

    // motion state
    this.velocityPx = 0
  }

  setPosition(x, y) { this.x = x; this.y = y }
  setSize(size) { this.size = size }
  setSymbol(symbol) { this.symbol = symbol }
  setVelocityPx(v) { this.velocityPx = v }

  setWinning(isWinning) {
    this.isWinning = isWinning
  }

  update(deltaSec) {
    if (this.isWinning) {
      this.highlightIntensity = Math.min(1, this.highlightIntensity + deltaSec * 2) // gentle ramp
      this.pulsePhase += deltaSec * PULSE_SPEED * (Math.PI * 2)
    } else {
      this.highlightIntensity = Math.max(0, this.highlightIntensity - deltaSec * 1.5) // gentle fade
    }
  }

  drawMotionBlur(ctx) {
    if (this.velocityPx <= 2) return
    const blurSteps = Math.min(Math.floor(this.velocityPx / 3), 10)
    ctx.save()
    for (let i = blurSteps; i >= 1; i--) {
      ctx.globalAlpha = 0.12 * (1 - i / (blurSteps + 1))
      const trailY = this.y - (i * this.velocityPx * 0.18)
      drawSymbol(ctx, this.symbol, this.x, trailY, this.size)
    }
    ctx.restore()
  }

  draw(ctx, timestamp, effectAlpha) {
    // motion blur behind
    this.drawMotionBlur(ctx)

    const baseAlpha = effectAlpha ?? 1
    const alpha = Math.min(1, baseAlpha * this.highlightIntensity)

    const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
    const pulseScale = this.isWinning ? 1.0 + Math.sin(phase) * PULSE_SCALE_AMPLITUDE * alpha : 1.0
    const cx = this.x + this.size / 2
    const cy = this.y + this.size / 2

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(pulseScale, pulseScale)
    ctx.translate(-cx, -cy)

    if (this.isWinning && alpha > 0) {
      drawRadialGlow(ctx, this.x, this.y, this.size, alpha)
    }

    drawSymbol(ctx, this.symbol, this.x, this.y, this.size)

    if (this.isWinning && alpha > 0) {
      // Stronger golden tint overlay (non-additive)
      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha * 0.45)
      const topGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.size * 0.75)
      topGrad.addColorStop(0, 'rgba(255, 240, 120, 1.0)')
      topGrad.addColorStop(0.6, 'rgba(255, 210, 80, 0.45)')
      topGrad.addColorStop(1, 'rgba(255, 190, 60, 0.0)')
      ctx.fillStyle = topGrad
      ctx.fillRect(this.x, this.y, this.size, this.size)
      ctx.restore()

      drawBorders(ctx, this.x, this.y, this.size, alpha)
    }

    ctx.restore()

    if (this.isWinning) {
      const sparkleCount = this.symbol === 'wild' ? 8 : 4
      drawSparkles(ctx, this.x, this.y, this.size, sparkleCount, Math.min(1, alpha * 0.5), timestamp)
    }
  }
}
