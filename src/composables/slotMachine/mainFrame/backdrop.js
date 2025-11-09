import { Graphics } from 'pixi.js'

let backdrop = null

export function drawBackdrop(container, w, h) {
  if (!backdrop) {
    backdrop = new Graphics()
    container.addChild(backdrop)
  }

  backdrop.clear()

  // Create gradient effect using multiple rectangles
  const steps = 20
  const colors = [0x1f7a3f, 0x2e8f4b, 0x207940]
  const stops = [0, 0.5, 1]

  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const color = interpolateGradient(colors, stops, t)
    const y = (h / steps) * i
    const height = Math.ceil(h / steps) + 1
    backdrop.rect(0, y, w, height)
    backdrop.fill({ color })
  }
}

function interpolateGradient(colors, stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i] && t <= stops[i + 1]) {
      const localT = (t - stops[i]) / (stops[i + 1] - stops[i])
      return lerpColor(colors[i], colors[i + 1], localT)
    }
  }
  return colors[colors.length - 1]
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
