import { Container, Graphics, Text } from 'pixi.js'

/**
 * Creates a winning overlay popup that displays win information
 * Shows "SMALL WIN", "MEDIUM WIN", "BIG WIN", or "MEGA WIN"
 */
export function createWinOverlay(gameState) {
  const container = new Container()
  container.visible = false
  container.zIndex = 1000 // Ensure it's on top

  let background = null
  let titleText = null
  let amountText = null
  let animationStartTime = 0
  let isAnimating = false
  let currentIntensity = 'small'

  /**
   * Get overlay configuration based on win intensity
   */
  function getOverlayConfig(intensity) {
    const configs = {
      small: {
        title: 'SMALL WIN!',
        titleColor: 0xffeb3b,
        bgColor: 0x000000,
        bgAlpha: 0.6,
        scale: 0.6,
        glowColor: 0xffd700
      },
      medium: {
        title: 'MEDIUM WIN!',
        titleColor: 0xff9800,
        bgColor: 0x000000,
        bgAlpha: 0.7,
        scale: 0.8,
        glowColor: 0xff9800
      },
      big: {
        title: 'BIG WIN!',
        titleColor: 0xff5722,
        bgColor: 0x1a0000,
        bgAlpha: 0.8,
        scale: 1.0,
        glowColor: 0xff0000
      },
      mega: {
        title: 'MEGA WIN!!!',
        titleColor: 0xffd700,
        bgColor: 0x1a0a00,
        bgAlpha: 0.9,
        scale: 1.2,
        glowColor: 0xffd700
      }
    }

    return configs[intensity] || configs.small
  }

  /**
   * Show the winning overlay
   */
  function show(intensity, amount, canvasWidth, canvasHeight) {
    currentIntensity = intensity
    const config = getOverlayConfig(intensity)

    container.visible = true
    isAnimating = true
    animationStartTime = Date.now()

    // Clear previous content
    container.removeChildren()

    // Create semi-transparent background
    background = new Graphics()
    background.rect(0, 0, canvasWidth, canvasHeight)
    background.fill({ color: config.bgColor, alpha: config.bgAlpha })
    container.addChild(background)

    // Title text styling
    const titleStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 80 * config.scale,
      fontWeight: 'bold',
      fill: config.titleColor,
      stroke: { color: 0x000000, width: 8 },
      dropShadow: {
        color: config.glowColor,
        blur: 15,
        angle: Math.PI / 6,
        distance: 0
      },
      align: 'center'
    }

    titleText = new Text({
      text: config.title,
      style: titleStyle
    })
    titleText.anchor.set(0.5)
    titleText.x = canvasWidth / 2
    titleText.y = canvasHeight / 2 - 50
    container.addChild(titleText)

    // Amount text styling
    const amountStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: 50,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 4 },
      dropShadow: {
        color: 0x000000,
        blur: 8,
        angle: Math.PI / 6,
        distance: 3
      },
      align: 'center'
    }

    amountText = new Text({
      text: `+${amount.toLocaleString()} Credits`,
      style: amountStyle
    })
    amountText.anchor.set(0.5)
    amountText.x = canvasWidth / 2
    amountText.y = canvasHeight / 2 + 50
    container.addChild(amountText)
  }

  /**
   * Hide the overlay
   */
  function hide() {
    container.visible = false
    isAnimating = false
    container.removeChildren()
  }

  /**
   * Update animation (called every frame)
   */
  function update(timestamp) {
    if (!isAnimating || !container.visible) return

    const elapsed = (Date.now() - animationStartTime) / 1000
    const config = getOverlayConfig(currentIntensity)

    // Animation phases:
    // 0-0.3s: Scale in
    // 0.3-2.0s: Pulse and shine
    // 2.0-2.5s: Scale out

    if (elapsed < 0.3) {
      // Scale in animation
      const progress = elapsed / 0.3
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const scale = easeOut * config.scale

      if (titleText) {
        titleText.scale.set(scale)
      }
      if (amountText) {
        const amountScale = easeOut * 1.0
        amountText.scale.set(amountScale)
      }

    } else if (elapsed < 2.0) {
      // Pulse animation
      const pulseTime = (elapsed - 0.3) * 2
      const pulse = 1 + Math.sin(pulseTime * Math.PI * 2) * 0.1

      if (titleText) {
        titleText.scale.set(config.scale * pulse)

        // Glow pulse effect via alpha on drop shadow
        const glowPulse = 0.7 + Math.sin(pulseTime * Math.PI * 4) * 0.3
        titleText.alpha = 0.9 + glowPulse * 0.1
      }

      if (amountText) {
        const amountPulse = 1 + Math.sin(pulseTime * Math.PI * 2) * 0.05
        amountText.scale.set(amountPulse)
      }

    } else if (elapsed < 2.5) {
      // Scale out animation
      const fadeProgress = (elapsed - 2.0) / 0.5
      const easeIn = Math.pow(fadeProgress, 2)
      const alpha = 1 - easeIn

      if (titleText) {
        titleText.alpha = alpha
        const scale = config.scale * (1 + easeIn * 0.5)
        titleText.scale.set(scale)
      }

      if (amountText) {
        amountText.alpha = alpha
      }

      if (background) {
        background.alpha = background.alpha * (1 - fadeProgress)
      }

    } else {
      // Animation complete
      hide()
    }
  }

  /**
   * Build/rebuild for canvas resize
   */
  function build(canvasWidth, canvasHeight) {
    if (container.visible && background) {
      // Rebuild background for new size
      background.clear()
      background.rect(0, 0, canvasWidth, canvasHeight)
      const config = getOverlayConfig(currentIntensity)
      background.fill({ color: config.bgColor, alpha: config.bgAlpha })

      // Reposition text elements
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight / 2 - 50
      }
      if (amountText) {
        amountText.x = canvasWidth / 2
        amountText.y = canvasHeight / 2 + 50
      }
    }
  }

  return {
    container,
    show,
    hide,
    update,
    build
  }
}
