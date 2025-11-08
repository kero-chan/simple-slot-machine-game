import { ref, computed } from 'vue'
import { ASSETS } from '../../config/assets'

export function useSpinBtn(canvasState, gameState) {
  const animationFrame = ref(0)
  const animationSpeed = 150 // milliseconds per frame
  let lastFrameTime = 0

  // Sprite sheet layout:
  // Row 0: Square button (not used)
  // Row 1: Circular button
  // Row 2-3: Gold arrows (4 frames, 2x2 grid)
  // Row 4-5: Silver arrows (4 frames, 2x2 grid)
  const spriteConfig = {
    // Assuming the sprite sheet dimensions based on the image
    buttonRow: 1,
    goldArrowStartRow: 2,
    silverArrowStartRow: 4,
    spriteWidth: 128,  // Approximate width of each sprite
    spriteHeight: 128, // Approximate height of each sprite
    arrowFrames: 4
  }

  // Update animation frame
  const updateAnimation = (timestamp) => {
    if (timestamp - lastFrameTime >= animationSpeed) {
      animationFrame.value = (animationFrame.value + 1) % spriteConfig.arrowFrames
      lastFrameTime = timestamp
    }
  }

  // Draw the spin button using sprite sheet
  const draw = (ctx, timestamp) => {
    const btn = canvasState.buttons.value.spin
    const spriteSheet = ASSETS.loadedImages.spin_btn

    if (!spriteSheet || !spriteSheet.complete || spriteSheet.naturalHeight === 0) {
      // Fallback to old rendering if sprite not loaded
      drawFallback(ctx)
      return
    }

    // Update animation
    updateAnimation(timestamp)

    // Calculate actual sprite dimensions from the loaded image
    const sheetWidth = spriteSheet.naturalWidth
    const sheetHeight = spriteSheet.naturalHeight
    const spriteW = sheetWidth / 2  // 2 columns
    const spriteH = sheetHeight / 6  // 6 rows

    // Draw the circular button (row 1, column 0)
    const buttonRadius = btn.radius
    const buttonSize = buttonRadius * 2

    ctx.save()

    // Draw circular button sprite
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, buttonRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      spriteSheet,
      0, spriteH, // source x, y (row 1, column 0)
      spriteW, spriteH, // source width, height
      btn.x - buttonRadius,
      btn.y - buttonRadius,
      buttonSize,
      buttonSize
    )

    ctx.restore()

    // Draw rotating arrow animation on top
    if (gameState.canSpin.value) {
      // Use gold arrows (rows 2-3)
      drawArrowFrame(ctx, spriteSheet, spriteW, spriteH, btn, animationFrame.value, 2)
    } else {
      // Use silver arrows (rows 4-5) or show first frame
      drawArrowFrame(ctx, spriteSheet, spriteW, spriteH, btn, 0, 4)
    }
  }

  // Draw a specific arrow animation frame
  const drawArrowFrame = (ctx, spriteSheet, spriteW, spriteH, btn, frame, startRow) => {
    // Arrow frames are in a 2x2 grid across rows
    const col = frame % 2
    const row = startRow + Math.floor(frame / 2)

    const arrowSize = btn.radius * 1.6 // Make arrows slightly smaller than button

    ctx.save()

    // Clip to circular area
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, btn.radius * 0.9, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      spriteSheet,
      col * spriteW, row * spriteH, // source x, y
      spriteW, spriteH, // source width, height
      btn.x - arrowSize / 2,
      btn.y - arrowSize / 2,
      arrowSize,
      arrowSize
    )

    ctx.restore()
  }

  // Fallback rendering (original style) if sprite fails to load
  const drawFallback = (ctx) => {
    const btn = canvasState.buttons.value.spin

    // Outer glow
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, btn.radius + 5, 0, Math.PI * 2)
    ctx.fillStyle = gameState.canSpin.value ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 100, 100, 0.5)'
    ctx.fill()

    // Button circle
    const grad = ctx.createRadialGradient(btn.x, btn.y, 0, btn.x, btn.y, btn.radius)
    if (gameState.canSpin.value) {
      grad.addColorStop(0, '#FFD700')
      grad.addColorStop(1, '#FFA500')
    } else {
      grad.addColorStop(0, '#888')
      grad.addColorStop(1, '#555')
    }

    ctx.beginPath()
    ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Label
    ctx.fillStyle = '#000'
    ctx.font = `bold ${Math.floor(24 * canvasState.scale.value)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SPIN', btn.x, btn.y)
  }

  // Check if a point is inside the spin button
  const isPointInside = (x, y) => {
    const btn = canvasState.buttons.value.spin
    const dx = x - btn.x
    const dy = y - btn.y
    return dx * dx + dy * dy <= btn.radius * btn.radius
  }

  return {
    draw,
    isPointInside,
    animationFrame
  }
}
