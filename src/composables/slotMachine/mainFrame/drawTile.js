import { drawSymbol } from './drawSymbol'

// Tuning constants
const GLOW_MIN = 15
const GLOW_MAX = 30
const PULSE_SPEED = 0.5 // Hz
const PULSE_MIN_SCALE = 1.0
const PULSE_MAX_SCALE = 1.08
const BORDER_COLOR_OUTER = 'rgba(255, 240, 100, 1)'
const BORDER_COLOR_INNER = 'rgba(255, 255, 200, 0.8)'

function drawRadialGlow(ctx, x, y, size, alpha, blur) {
  const cx = x + size / 2
  const cy = y + size / 2
  const radius = size * 0.7

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  gradient.addColorStop(0, 'rgba(255, 223, 0, 0.9)')
  gradient.addColorStop(1, 'rgba(255, 180, 0, 0.0)')

  ctx.save()
  ctx.shadowColor = 'rgba(255, 223, 0, 1)'
  ctx.shadowBlur = blur
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function withPulse(ctx, x, y, size, timestamp) {
  const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
  const s = PULSE_MIN_SCALE + (Math.sin(phase) * (PULSE_MAX_SCALE - PULSE_MIN_SCALE))
  ctx.save()
  ctx.translate(x + size / 2, y + size / 2)
  ctx.scale(s, s)
  ctx.translate(-(x + size / 2), -(y + size / 2))
  return () => ctx.restore()
}

function drawBorders(ctx, x, y, size, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = BORDER_COLOR_OUTER
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, size, size)
  ctx.strokeStyle = BORDER_COLOR_INNER
  ctx.lineWidth = 1
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4)
  ctx.restore()
}

function drawSparkles(ctx, x, y, size, count, alpha, timestamp) {
  const cx = x + size / 2
  const cy = y + size / 2
  const phase = timestamp * 0.003
  ctx.save()
  ctx.globalAlpha = alpha
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + phase * 0.3
    const r = size * (0.25 + 0.35 * Math.sin(phase + i))
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r * 0.6
    const sparkleSize = Math.max(2, Math.floor(size * 0.04))
    ctx.fillStyle = 'rgba(255, 215, 0, 1)'
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

  if (isWinning && effectAlpha > 0) {
    // Glow behind
    const glowBlur = GLOW_MIN + (GLOW_MAX - GLOW_MIN) * effectAlpha
    drawRadialGlow(ctx, x, y, size, effectAlpha, glowBlur)

    // Pulsing scale
    const restore = withPulse(ctx, x, y, size, timestamp)
    drawSymbol(ctx, symbol, x, y, size)
    restore()

    // Borders
    drawBorders(ctx, x, y, size, Math.min(1, effectAlpha))

    // Particles (stronger for wild)
    const isWild = symbol === 'wild'
    const count = isWild ? 16 : 10
    drawSparkles(ctx, x, y, size, count, Math.min(0.9, effectAlpha), timestamp)
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
    this.glowRadius = 15
    this.particles = []

    // motion state
    this.velocityPx = 0
  }

  setPosition(x, y) { this.x = x; this.y = y }
  setSize(size) { this.size = size }
  setSymbol(symbol) { this.symbol = symbol }
  setVelocityPx(v) { this.velocityPx = v }

  setWinning(isWinning) {
    if (isWinning && !this.isWinning) {
      this.createParticles()
    }
    this.isWinning = isWinning
  }

  createParticles() {
    const cx = this.x + this.size / 2
    const cy = this.y + this.size / 2
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * this.size,
        y: cy + (Math.random() - 0.5) * this.size,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        life: 1.0,
        size: Math.random() * 4 + 2,
        rotation: Math.random() * Math.PI * 2
      })
    }
  }

  update(deltaSec) {
    if (this.isWinning) {
      this.highlightIntensity = Math.min(1, this.highlightIntensity + deltaSec * 3)
      this.pulsePhase += deltaSec * 3
      const pulseAmount = Math.sin(this.pulsePhase) * 0.5 + 0.5
      this.glowRadius = 15 + pulseAmount * 15
    } else {
      this.highlightIntensity = Math.max(0, this.highlightIntensity - deltaSec * 5)
    }

    // particles update
    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= deltaSec * 0.5
      p.rotation += deltaSec * 2
    })
    this.particles = this.particles.filter(p => p.life > 0)
    if (this.isWinning && this.particles.length < 5 && Math.random() < 0.1) {
      this.createParticles()
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

  drawParticles(ctx, alpha) {
    this.particles.forEach(p => {
      if (p.life <= 0) return
      ctx.save()
      ctx.globalAlpha = p.life * alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      const size = p.size * (0.5 + p.life * 0.5)
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        const inner = size * 0.4
        const outer = size
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
        ctx.lineTo(Math.cos(angle + Math.PI / 5) * inner, Math.sin(angle + Math.PI / 5) * inner)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })
  }

  draw(ctx, timestamp, effectAlpha) {
    // motion blur behind
    this.drawMotionBlur(ctx)

    const centerX = this.x + this.size / 2
    const centerY = this.y + this.size / 2
    const combinedAlpha = Math.min(1, (effectAlpha ?? 1) * this.highlightIntensity)

    // pulse scale
    const phase = (timestamp / 1000) * (Math.PI * 2 * 0.5)
    const pulseScale = this.isWinning
      ? 1.0 + Math.sin(phase) * 0.08 * this.highlightIntensity
      : 1.0

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(pulseScale, pulseScale)
    ctx.translate(-centerX, -centerY)

    if (combinedAlpha > 0) {
      // glow behind tile
      const blur = 15 + 15 * combinedAlpha
      drawRadialGlow(ctx, this.x, this.y, this.size, combinedAlpha, blur)
    }

    drawSymbol(ctx, this.symbol, this.x, this.y, this.size)

    if (combinedAlpha > 0) {
      drawBorders(ctx, this.x, this.y, this.size, combinedAlpha)
    }

    ctx.restore()

    if (this.isWinning) {
      this.drawParticles(ctx, combinedAlpha)
    }
  }
}
