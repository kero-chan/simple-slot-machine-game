import { Graphics } from 'pixi.js'

export function applyWinningFrame(sprite, highlight = false) {
  if (!sprite) return

  if (highlight) {
    // Create or reuse overlay graphics
    let frame = sprite._winningFrame
    if (!frame) {
      frame = new Graphics()
      sprite.addChild(frame)
      sprite._winningFrame = frame
    }

    frame.visible = true
    frame.clear()

    // Use texture dimensions, not sprite dimensions (sprite is scaled)
    const w = sprite.texture.width
    const h = sprite.texture.height

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

  } else if (sprite._winningFrame) {
    sprite._winningFrame.visible = false
  }
}
