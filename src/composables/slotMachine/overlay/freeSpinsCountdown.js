import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

/**
 * Creates a countdown overlay for free spins that appears at the bottom
 * Shows remaining free spins count during auto-play
 */
export function createFreeSpinsCountdown() {
  const container = new Container()
  container.visible = false
  container.zIndex = 900 // Above footer but below bonus overlay

  let background = null
  let labelText = null
  let countText = null
  let canvasWidth = 600
  let canvasHeight = 800

  /**
   * Show the countdown overlay - covers entire footer control panel
   */
  function show(remainingSpins, width, height) {
    canvasWidth = width
    canvasHeight = height
    container.visible = true

    // Clear previous content
    container.removeChildren()

    // Cover footer area - full width, from bottom (approximately 15% of height)
    const overlayWidth = width
    const overlayHeight = height * 0.18  // Cover footer area
    const overlayX = 0
    const overlayY = height - overlayHeight

    // Create semi-transparent brown background covering entire footer
    background = new Graphics()
    background.rect(overlayX, overlayY, overlayWidth, overlayHeight)
    background.fill({ color: 0x5c3a1a, alpha: 0.95 }) // Dark brown background
    container.addChild(background)

    // Add decorative border at top
    const borderLine = new Graphics()
    borderLine.rect(overlayX, overlayY, overlayWidth, 4)
    borderLine.fill({ color: 0xffd700, alpha: 1 }) // Gold border at top
    container.addChild(borderLine)

    // Create label text (in Chinese) - centered and larger
    const labelStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 32,
      fill: 0xffd700,
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 3 },
      align: 'center'
    }

    labelText = new Text({
      text: '剩余免费旋转次数',  // Remaining free spin count
      style: labelStyle
    })
    labelText.anchor.set(0.5)
    labelText.x = width / 2
    labelText.y = overlayY + overlayHeight * 0.35
    container.addChild(labelText)

    // Create count text (the number) - very large and prominent
    const countStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: 80,
      fontWeight: '900',
      fill: ['#fff066', '#ffd700', '#ffed4e'],
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#5c3a00', width: 6 },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        angle: Math.PI / 4,
        distance: 3,
        alpha: 0.5
      },
      align: 'center',
      letterSpacing: 4
    }

    countText = new Text({
      text: `${remainingSpins}`,
      style: countStyle
    })
    countText.anchor.set(0.5)
    countText.x = width / 2
    countText.y = overlayY + overlayHeight * 0.7
    container.addChild(countText)

    updateCount(remainingSpins)
  }

  /**
   * Update the count display
   */
  function updateCount(remainingSpins) {
    if (countText) {
      countText.text = `${remainingSpins}`
    }
  }

  /**
   * Hide the overlay
   */
  function hide() {
    container.visible = false
    container.removeChildren()
  }

  /**
   * Update animation (called every frame)
   */
  function update(timestamp) {
    if (!container.visible) return

    // Subtle pulse animation for the count
    if (countText) {
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.05
      countText.scale.set(pulse)
    }
  }

  /**
   * Build/rebuild for canvas resize
   */
  function build(width, height) {
    if (container.visible) {
      canvasWidth = width
      canvasHeight = height

      const overlayWidth = width
      const overlayHeight = height * 0.2
      const overlayX = 0
      const overlayY = height - overlayHeight

      // Rebuild background
      if (background) {
        background.clear()
        background.rect(overlayX, overlayY, overlayWidth, overlayHeight)
        background.fill({ color: 0x5c3a1a, alpha: 0.95 })
      }

      // Reposition text
      if (labelText) {
        labelText.x = width / 2
        labelText.y = overlayY + overlayHeight * 0.35
      }
      if (countText) {
        countText.x = width / 2
        countText.y = overlayY + overlayHeight * 0.7
      }
    }
  }

  return {
    container,
    show,
    hide,
    update,
    updateCount,
    build,
    isShowing: () => container.visible
  }
}
