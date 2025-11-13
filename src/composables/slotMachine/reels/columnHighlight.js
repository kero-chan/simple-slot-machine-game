import { Container, Graphics } from 'pixi.js'

/**
 * Column Highlight Manager
 * Shows animated flowing lightning/glowing stream effects on left and right borders
 * of the active slowdown column during anticipation mode
 */
export function createColumnHighlightManager() {
  const container = new Container()
  const highlightSprites = [] // Store { left, right, col } for each column
  let animationTime = 0

  /**
   * Create a glowing stream graphic
   * @param {number} width - Width of the stream
   * @param {number} height - Height of the stream
   * @returns {Graphics}
   */
  function createGlowingStream(width, height) {
    const graphics = new Graphics()

    // Create vertical gradient effect with multiple layers for glow
    const numSegments = 40
    const segmentHeight = height / numSegments

    for (let i = 0; i < numSegments; i++) {
      const y = i * segmentHeight
      const alpha = Math.sin((i / numSegments) * Math.PI) * 0.7 + 0.3 // Pulsing alpha

      // Outer glow (medium width, soft)
      graphics.beginFill(0xFFD700, alpha * 0.35) // Gold color soft outer glow
      graphics.drawRect(-width * 0.5, y, width * 2.5, segmentHeight)
      graphics.endFill()

      // Inner glow (brighter)
      graphics.beginFill(0xFFD700, alpha * 0.7) // Gold color
      graphics.drawRect(0, y, width * 1.5, segmentHeight)
      graphics.endFill()

      // Core - very bright
      graphics.beginFill(0xFFFFFF, alpha * 0.9) // White core - very bright
      graphics.drawRect(width * 0.3, y, width * 0.4, segmentHeight)
      graphics.endFill()
    }

    return graphics
  }

  /**
   * Initialize highlight sprites for all columns
   * @param {number} cols - Number of columns
   * @param {number} columnWidth - Width of each column
   * @param {number} columnHeight - Height of the visible area
   * @param {number} columnX - Starting X position for columns
   * @param {number} columnY - Starting Y position for columns
   * @param {number} stepX - Distance between column start positions (width + spacing)
   */
  function initialize(cols, columnWidth, columnHeight, columnX, columnY, stepX) {
    console.log(`🔧 Initializing column highlights: cols=${cols}, width=${columnWidth}, height=${columnHeight}`)

    // Clear existing sprites
    highlightSprites.forEach(({ left, right }) => {
      container.removeChild(left)
      container.removeChild(right)
    })
    highlightSprites.length = 0

    // Create highlight sprites for each column
    for (let col = 0; col < cols; col++) {
      const highlightWidth = 7 // Vertical bar width - thinner

      // Left highlight - flowing stream
      const leftGraphics = createGlowingStream(highlightWidth, columnHeight)
      leftGraphics.alpha = 0 // Hidden by default

      // Right highlight - flowing stream
      const rightGraphics = createGlowingStream(highlightWidth, columnHeight)
      rightGraphics.alpha = 0 // Hidden by default

      // Position sprites
      const colX = columnX + col * stepX
      const bleed = 0 // No bleed offset

      leftGraphics.x = colX - highlightWidth
      leftGraphics.y = columnY
      rightGraphics.x = colX + columnWidth
      rightGraphics.y = columnY

      console.log(`  Column ${col}: left.x=${leftGraphics.x}, right.x=${rightGraphics.x}, y=${leftGraphics.y}`)

      container.addChild(leftGraphics)
      container.addChild(rightGraphics)

      highlightSprites.push({ left: leftGraphics, right: rightGraphics, col })
    }

    console.log(`✅ Initialized ${highlightSprites.length} column highlight pairs`)
  }

  /**
   * Update animation - creates flowing/streaming effect
   * Call this every frame
   */
  function updateAnimation(deltaTime = 1) {
    animationTime += deltaTime * 0.08 // Animation speed

    // Animate with pulsing glow effect
    const glowPulse = Math.sin(animationTime) * 0.15 + 0.85 // Pulsing between 0.7-1.0

    highlightSprites.forEach(({ left, right }) => {
      if (left.alpha > 0) {
        // Apply pulsing glow effect
        const targetAlpha = 1.0 * glowPulse
        left.alpha = Math.min(left.alpha, targetAlpha)
      }
      if (right.alpha > 0) {
        const targetAlpha = 1.0 * glowPulse
        right.alpha = Math.min(right.alpha, targetAlpha)
      }
    })
  }

  /**
   * Show highlight for a specific column with flowing animation
   * @param {number} col - Column index
   * @param {number} alpha - Base alpha transparency (0-1)
   */
  function showHighlight(col, alpha = 1.0) {
    const highlight = highlightSprites.find(h => h.col === col)
    if (highlight) {
      highlight.left.alpha = alpha
      highlight.right.alpha = alpha
    }
  }

  /**
   * Hide highlight for a specific column
   * @param {number} col - Column index
   */
  function hideHighlight(col) {
    const highlight = highlightSprites.find(h => h.col === col)
    if (highlight) {
      highlight.left.alpha = 0
      highlight.right.alpha = 0
    }
  }

  /**
   * Hide all highlights
   */
  function hideAll() {
    highlightSprites.forEach(({ left, right }) => {
      left.alpha = 0
      right.alpha = 0
    })
  }

  /**
   * Update highlights based on active slowdown column
   * @param {number} activeSlowdownColumn - The column currently in slowdown (-1 if none)
   */
  function update(activeSlowdownColumn) {
    if (highlightSprites.length === 0) {
      return // Silently skip if not initialized yet
    }

    highlightSprites.forEach(({ left, right, col }) => {
      if (col === activeSlowdownColumn) {
        // Show flowing highlight for active slowdown column
        left.alpha = 1.0
        right.alpha = 1.0
        left.visible = true
        right.visible = true
      } else {
        // Hide for all other columns
        left.alpha = 0
        right.alpha = 0
      }
    })

    // Update flowing animation
    updateAnimation()
  }

  return {
    container,
    initialize,
    showHighlight,
    hideHighlight,
    hideAll,
    update
  }
}
