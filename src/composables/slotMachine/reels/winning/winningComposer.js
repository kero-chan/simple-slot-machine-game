import { Graphics, Container } from 'pixi.js'

// Create a manager for winning frames that doesn't attach to sprites
export function createWinningFrameManager() {
  const container = new Container()
  const frameCache = new Map() // key -> Graphics

  function updateFrame(key, sprite, highlight, x, y) {
    if (!sprite) return

    let frame = frameCache.get(key)

    if (highlight) {
      if (!frame) {
        frame = new Graphics()
        container.addChild(frame)
        frameCache.set(key, frame)
      }

      frame.visible = true
      frame.clear()

      // Position frame at sprite's world position
      frame.x = x
      frame.y = y

      // Use sprite's actual rendered dimensions (includes scaling)
      const w = sprite.width
      const h = sprite.height

      const cornerRadius = w * 0.15     // 15% for more rounded corners
      const glowWidth = w * 0.06        // Glow extends 6% outward
      const borderWidth = w * 0.02      // Thinner border

      // Draw multiple layers for glow effect (from outer to inner)
      // Very subtle glow that doesn't obscure the tile content

      // Outer glow (barely visible)
      frame.roundRect(-glowWidth, -glowWidth, w + glowWidth * 2, h + glowWidth * 2, cornerRadius + glowWidth)
      frame.fill({ color: 0xffdd00, alpha: 0.03 })

      // Mid glow
      const midGlow = glowWidth * 0.5
      frame.roundRect(-midGlow, -midGlow, w + midGlow * 2, h + midGlow * 2, cornerRadius + midGlow)
      frame.fill({ color: 0xffdd00, alpha: 0.05 })

      // Inner glow (just around the edge)
      const innerGlow = glowWidth * 0.25
      frame.roundRect(-innerGlow, -innerGlow, w + innerGlow * 2, h + innerGlow * 2, cornerRadius + innerGlow)
      frame.fill({ color: 0xffee00, alpha: 0.08 })

      // Main border stroke (thicker and more opaque for clear definition)
      frame.roundRect(0, 0, w, h, cornerRadius)
      frame.stroke({ color: 0xffd700, width: borderWidth, alpha: 1.0 })

    } else if (frame) {
      frame.visible = false
    }
  }

  function cleanup(usedKeys) {
    for (const [key, frame] of frameCache.entries()) {
      if (!usedKeys.has(key)) {
        if (frame.parent) frame.parent.removeChild(frame)
        frame.destroy({ children: true })
        frameCache.delete(key)
      }
    }
  }

  return { container, updateFrame, cleanup }
}
