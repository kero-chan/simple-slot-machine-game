import { Graphics, Container } from 'pixi.js'

// Create a manager for winning frames that doesn't attach to sprites
export function createWinningFrameManager(onNewFrameCallback = null) {
  const container = new Container()
  const frameCache = new Map() // key -> Graphics
  const activeFrames = new Set() // Track which frames are currently visible/winning

  function updateFrame(key, sprite, highlight, x, y, isBonus = false) {
    if (!sprite) return

    let frame = frameCache.get(key)

    if (highlight) {
      // Check if this is a NEW winning frame (wasn't active before)
      const isNewFrame = !activeFrames.has(key)

      if (!frame) {
        frame = new Graphics()
        container.addChild(frame)
        frameCache.set(key, frame)
      }

      frame.visible = true

      // Track this frame as active and trigger callback for new frames
      if (isNewFrame) {
        activeFrames.add(key)
        // Trigger audio callback when a new winning frame appears
        if (onNewFrameCallback) {
          onNewFrameCallback(key)
        }
      }
      frame.clear()

      // Position frame at sprite's center (x, y are already the center position)
      frame.x = x
      frame.y = y

      // Apply same scale and alpha as sprite for flip animation
      frame.scale.x = sprite.scale.x
      frame.scale.y = sprite.scale.y
      frame.alpha = sprite.alpha

      // Match sprite's z-index for proper layering
      frame.zIndex = sprite.zIndex || 0

      // Use texture dimensions (unscaled)
      const w = sprite.texture.width
      const h = sprite.texture.height

      const cornerRadius = w * 0.15     // 15% for more rounded corners

      // Bonus tiles get more dramatic effects
      const glowWidth = isBonus ? w * 0.12 : w * 0.06        // Bonus: 12% glow (2x larger)
      const borderWidth = isBonus ? w * 0.035 : w * 0.02     // Bonus: thicker border

      // Choose colors based on tile type
      const outerColor = isBonus ? 0x8800ff : 0xffdd00  // Purple for bonus, gold for winning
      const midColor = isBonus ? 0xaa00ff : 0xffdd00    // Brighter purple
      const innerColor = isBonus ? 0xcc44ff : 0xffee00  // Bright purple/pink
      const borderColor = isBonus ? 0xdd66ff : 0xffd700 // Luminous purple/pink

      // Bonus tiles get more visible glow
      const outerAlpha = isBonus ? 0.15 : 0.03
      const midAlpha = isBonus ? 0.25 : 0.05
      const innerAlpha = isBonus ? 0.35 : 0.08

      // Draw multiple layers for glow effect (from outer to inner)
      // Center the frame drawing (since frame has center anchor now)
      const offsetX = -w / 2
      const offsetY = -h / 2

      // Outer glow
      frame.roundRect(offsetX - glowWidth, offsetY - glowWidth, w + glowWidth * 2, h + glowWidth * 2, cornerRadius + glowWidth)
      frame.fill({ color: outerColor, alpha: outerAlpha })

      // Mid glow
      const midGlow = glowWidth * 0.5
      frame.roundRect(offsetX - midGlow, offsetY - midGlow, w + midGlow * 2, h + midGlow * 2, cornerRadius + midGlow)
      frame.fill({ color: midColor, alpha: midAlpha })

      // Inner glow (just around the edge)
      const innerGlow = glowWidth * 0.25
      frame.roundRect(offsetX - innerGlow, offsetY - innerGlow, w + innerGlow * 2, h + innerGlow * 2, cornerRadius + innerGlow)
      frame.fill({ color: innerColor, alpha: innerAlpha })

      // Main border stroke (thicker and more opaque for clear definition)
      frame.roundRect(offsetX, offsetY, w, h, cornerRadius)
      frame.stroke({ color: borderColor, width: borderWidth, alpha: 1.0 })

    } else if (frame) {
      frame.visible = false
      // Remove from active frames when no longer winning
      activeFrames.delete(key)
    }
  }

  function cleanup(usedKeys) {
    for (const [key, frame] of frameCache.entries()) {
      if (!usedKeys.has(key)) {
        if (frame.parent) frame.parent.removeChild(frame)
        frame.destroy({ children: true })
        frameCache.delete(key)
        activeFrames.delete(key)
      }
    }
  }

  return { container, updateFrame, cleanup }
}
