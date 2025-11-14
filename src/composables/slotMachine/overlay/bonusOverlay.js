import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioEffects } from '../../useAudioEffects'

/**
 * Creates a bonus trigger overlay that displays when 3+ bonus tiles appear
 * Shows congratulatory message and number of free spins awarded
 */
export function createBonusOverlay(gameState) {
  const gameStore = useGameStore()
  const { playEffect } = useAudioEffects()
  const container = new Container()
  container.visible = false
  container.zIndex = 1100 // Above win overlay

  let background = null
  let bgImage = null  // Fullscreen jackpot_begin_bg image
  let titleText = null
  let freeSpinsNumberContainer = null  // Container for image-based number sprites
  let messageText = null
  let startButton = null
  let startButtonText = null
  let animationStartTime = 0
  let isAnimating = false
  let onStartCallback = null
  let canvasWidth = 600
  let canvasHeight = 800

  // Particle system for coins
  const particlesContainer = new Container()
  const particles = []

  /**
   * Spawn coin particles falling from the sky
   */
  function spawnParticles(canvasWidth, canvasHeight, count = 80) {
    const goldTexture = ASSETS.loadedImages?.win_gold || ASSETS.imagePaths?.win_gold
    if (!goldTexture) return

    const texture = goldTexture instanceof Texture ? goldTexture : Texture.from(goldTexture)

    for (let i = 0; i < count; i++) {
      const particle = new Sprite(texture)
      particle.anchor.set(0.5)
      particle.blendMode = BLEND_MODES.ADD

      // Random position across top of screen
      particle.x = Math.random() * canvasWidth
      particle.y = -50 - Math.random() * canvasHeight * 0.5

      // Random size
      const size = 15 + Math.random() * 40
      particle.width = size
      particle.height = size

      // Falling velocity
      const speedFactor = size / 30
      particle.vx = (Math.random() - 0.5) * 3
      particle.vy = (0.8 + Math.random() * 1.5) * speedFactor

      // Gravity
      particle.gravity = 0.08

      // Random rotation speed
      particle.rotationSpeed = (Math.random() - 0.5) * 0.2

      // Lifetime
      particle.life = 3000 + Math.random() * 2000
      particle.born = Date.now()
      particle.alpha = 0.7 + Math.random() * 0.3

      particlesContainer.addChild(particle)
      particles.push(particle)
    }
  }

  function updateParticles() {
    const now = Date.now()
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      const age = now - p.born

      // Apply gravity
      p.vy += p.gravity

      // Move particle
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed

      // Fade out
      const t = age / p.life
      if (t < 1) {
        p.alpha = (1 - t) * 0.8
        p.scale.set(1 - t * 0.3)
      } else {
        // Remove dead particles
        p.parent?.removeChild(p)
        p.destroy()
        particles.splice(i, 1)
      }
    }
  }

  function clearParticles() {
    for (const p of particles) {
      p.parent?.removeChild(p)
      p.destroy()
    }
    particles.length = 0
  }

  /**
   * Create image-based number display using i40_XX sprites
   */
  function createNumberDisplay(number) {
    const numberContainer = new Container()
    const digits = String(number).split('')

    // Configuration for punctuation (same as footer)
    const PUNCTUATION_SCALE_FACTOR = 0.5  // Comma/period half size of digits
    const PERIOD_Y_POSITION = 1.0   // Period aligned with bottom of numbers
    const COMMA_Y_POSITION = 0.65   // Comma slightly above mid-height

    // First pass: get reference height from a digit
    let referenceHeight = 0
    for (const d of digits) {
      if (d >= '0' && d <= '9') {
        const imageSrc = ASSETS.loadedImages?.[`i40_0${d}`] || ASSETS.imagePaths?.[`i40_0${d}`]
        if (imageSrc) {
          const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
          const tempSprite = new Sprite(texture)
          referenceHeight = tempSprite.height
          break
        }
      }
    }

    let offsetX = 0

    for (const d of digits) {
      let sprite

      if (d === ',' || d === '.') {
        // Use i40_10 for comma, handle period if present
        const imageSrc = ASSETS.loadedImages?.i40_10 || ASSETS.imagePaths?.i40_10
        if (!imageSrc) continue
        const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
        sprite = new Sprite(texture)

        // Apply punctuation scaling and positioning
        const spriteScale = (referenceHeight / sprite.height) * PUNCTUATION_SCALE_FACTOR
        sprite.scale.set(spriteScale)
        sprite.x = offsetX - sprite.width * 0.1
        // Use different Y positions for period vs comma
        sprite.y = referenceHeight * (d === '.' ? PERIOD_Y_POSITION : COMMA_Y_POSITION)

        numberContainer.addChild(sprite)
        offsetX += sprite.width * 0.7  // Tighter spacing for punctuation
      } else if (d >= '0' && d <= '9') {
        // Use i40_0X for digits
        const imageSrc = ASSETS.loadedImages?.[`i40_0${d}`] || ASSETS.imagePaths?.[`i40_0${d}`]
        if (!imageSrc) continue
        const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
        sprite = new Sprite(texture)
        sprite.x = offsetX
        sprite.y = 0
        numberContainer.addChild(sprite)
        offsetX += sprite.width * 0.95  // Slight spacing between digits
      }
    }

    return numberContainer
  }

  /**
   * Show the bonus trigger overlay
   */
  function show(freeSpinsCount, cWidth, cHeight, onStart) {
    canvasWidth = cWidth
    canvasHeight = cHeight
    container.visible = true
    isAnimating = true
    animationStartTime = Date.now()
    onStartCallback = onStart

    // Play bonus trigger sound
    playEffect('reach_bonus')

    // Clear previous content
    container.removeChildren()

    // Create dark background first
    background = new Graphics()
    background.rect(0, 0, canvasWidth, canvasHeight)
    background.fill({ color: 0x000000, alpha: 0.7 })
    container.addChild(background)

    // Use jackpot_begin_bg image as FULLSCREEN background
    let bgImageLoaded = false
    try {
      const imageSrc = ASSETS.loadedImages?.jackpot_begin_bg || ASSETS.imagePaths?.jackpot_begin_bg

      if (imageSrc) {
        const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
        bgImage = new Sprite(texture)
        bgImage.anchor.set(0.5)
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2

        // Scale to cover entire canvas (fullscreen)
        const scaleX = canvasWidth / bgImage.width
        const scaleY = canvasHeight / bgImage.height
        const scale = Math.max(scaleX, scaleY) // Cover entire screen
        bgImage.scale.set(scale)

        container.addChild(bgImage)
        bgImageLoaded = true
        console.log('✅ Jackpot begin fullscreen image loaded')
      } else {
        console.warn('❌ No imageSrc found for jackpot_begin_bg')
      }
    } catch (error) {
      console.warn('Failed to load jackpot_begin_bg image:', error)
    }

    // If image failed to load, use colored background fallback
    if (!bgImageLoaded) {
      const fallbackBg = new Graphics()
      fallbackBg.rect(0, 0, canvasWidth, canvasHeight)
      fallbackBg.fill({ color: 0x8B0000, alpha: 0.95 })  // Dark red fallback
      container.addChild(fallbackBg)
    }

    // Create title text (congratulations message in Chinese)
    const titleStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: ['#ffff66', '#ffeb3b', '#ffd700'],  // Bright gold gradient
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#8B4513', width: 5 },  // Brown stroke for contrast
      dropShadow: {
        color: 0xff6600,  // Orange glow
        blur: 12,
        angle: Math.PI / 6,
        distance: 0,
        alpha: 0.7
      },
      align: 'center',
      letterSpacing: 2
    }

    titleText = new Text({
      text: '恭喜获得免费旋转',  // Congratulations on free spins
      style: titleStyle
    })
    titleText.anchor.set(0.5)
    titleText.x = canvasWidth / 2
    titleText.y = canvasHeight * 0.32  // Moved down to prevent cutoff
    titleText.alpha = 0  // Start invisible for fade-in animation
    container.addChild(titleText)

    // Create large number showing free spins count using image-based sprites
    freeSpinsNumberContainer = createNumberDisplay(freeSpinsCount)
    freeSpinsNumberContainer.x = canvasWidth / 2 - freeSpinsNumberContainer.width / 2
    freeSpinsNumberContainer.y = canvasHeight * 0.50 - freeSpinsNumberContainer.height / 2  // Centered vertically
    freeSpinsNumberContainer.alpha = 0  // Start invisible for fade-in animation
    freeSpinsNumberContainer.scale.set(0.5)  // Start smaller for scale-up animation
    container.addChild(freeSpinsNumberContainer)

    // Create message text (in Chinese) - cleaner and smaller
    const messageStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 32,
      fontWeight: 'bold',
      fill: ['#ffeb3b', '#ffd700'],  // Gold gradient
      fillGradientStops: [0, 1],
      stroke: { color: '#5c3a1a', width: 3 },  // Brown stroke
      dropShadow: {
        color: 0x000000,
        blur: 6,
        angle: Math.PI / 4,
        distance: 2,
        alpha: 0.6
      },
      align: 'center',
      letterSpacing: 1
    }

    messageText = new Text({
      text: '获得的免费旋转将在此处!',  // The free spins you got will be used here!
      style: messageStyle
    })
    messageText.anchor.set(0.5)
    messageText.x = canvasWidth / 2
    messageText.y = canvasHeight * 0.66  // Better spacing below number
    messageText.alpha = 0  // Start invisible for fade-in animation
    container.addChild(messageText)

    // Create start button - cleaner and better positioned
    const buttonWidth = 220
    const buttonHeight = 70
    startButton = new Graphics()
    startButton.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15)
    startButton.fill({ color: 0xdc143c })  // Crimson red
    startButton.stroke({ color: 0xffd700, width: 4 })  // Gold border
    startButton.x = canvasWidth / 2
    startButton.y = canvasHeight * 0.78  // Better spacing below message
    startButton.eventMode = 'static'
    startButton.cursor = 'pointer'
    startButton.alpha = 0  // Start invisible for fade-in animation
    container.addChild(startButton)

    // Start button text - cleaner
    const buttonTextStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 42,
      fontWeight: 'bold',
      fill: ['#ffffff', '#ffff99'],  // White to light yellow
      fillGradientStops: [0, 1],
      stroke: { color: 0x8B0000, width: 2 },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        angle: Math.PI / 4,
        distance: 2,
        alpha: 0.7
      },
      align: 'center'
    }

    startButtonText = new Text({
      text: '开始',  // Start
      style: buttonTextStyle
    })
    startButtonText.anchor.set(0.5)
    startButtonText.x = startButton.x
    startButtonText.y = startButton.y
    startButtonText.alpha = 0  // Start invisible for fade-in animation
    container.addChild(startButtonText)

    // Button hover effect - smoother
    startButton.on('pointerover', () => {
      startButton.scale.set(1.05)
      startButtonText.scale.set(1.05)
    })

    startButton.on('pointerout', () => {
      startButton.scale.set(1)
      startButtonText.scale.set(1)
    })

    startButton.on('pointerdown', () => {
      if (onStartCallback) {
        onStartCallback()
      }
      hide()
    })

    // Add particles container and spawn particles (reduced count for better performance)
    container.addChild(particlesContainer)
    spawnParticles(canvasWidth, canvasHeight, 80)  // Moderate amount for celebration
  }

  /**
   * Hide the overlay
   */
  function hide() {
    container.visible = false
    isAnimating = false
    clearParticles()
    container.removeChildren()
  }

  /**
   * Update animation (called every frame)
   */
  function update(timestamp) {
    if (!isAnimating || !container.visible) return

    const elapsed = (Date.now() - animationStartTime) / 1000

    // Update particles every frame
    updateParticles()

    // Subtle pulse animation for background image
    if (bgImage && bgImage.texture) {
      const scaleX = canvasWidth / bgImage.texture.width
      const scaleY = canvasHeight / bgImage.texture.height
      const baseScale = Math.max(scaleX, scaleY)
      const pulse = baseScale * (1 + Math.sin(elapsed * 1.2) * 0.015)  // Very subtle pulse
      bgImage.scale.set(pulse)
    }

    // Sequential entrance animations (staggered reveals)
    // Title fades in first (0-0.5s)
    if (titleText && elapsed < 0.5) {
      titleText.alpha = Math.min(1, elapsed * 2)
    } else if (titleText) {
      titleText.alpha = 1
      // Gentle idle pulse after entrance
      const titlePulse = 1 + Math.sin(elapsed * 1.8) * 0.03
      titleText.scale.set(titlePulse)
    }

    // Number scales up and fades in second (0.3-0.9s)
    if (freeSpinsNumberContainer && elapsed >= 0.3 && elapsed < 0.9) {
      const progress = (elapsed - 0.3) / 0.6
      const easeOut = 1 - Math.pow(1 - progress, 3)  // Cubic ease-out
      freeSpinsNumberContainer.alpha = easeOut
      freeSpinsNumberContainer.scale.set(0.5 + easeOut * 0.5)  // Scale from 0.5 to 1
    } else if (freeSpinsNumberContainer && elapsed >= 0.9) {
      freeSpinsNumberContainer.alpha = 1
      // Gentle pulse after entrance (NO rotation)
      const pulse = 1 + Math.sin(elapsed * 2) * 0.04
      freeSpinsNumberContainer.scale.set(pulse)
    }

    // Message fades in third (0.7-1.1s)
    if (messageText && elapsed >= 0.7 && elapsed < 1.1) {
      messageText.alpha = (elapsed - 0.7) / 0.4
    } else if (messageText) {
      messageText.alpha = 1
    }

    // Button fades in last (1.0-1.4s)
    if (startButton && startButtonText && elapsed >= 1.0 && elapsed < 1.4) {
      const alpha = (elapsed - 1.0) / 0.4
      startButton.alpha = alpha
      startButtonText.alpha = alpha
    } else if (startButton && startButtonText && elapsed >= 1.4) {
      startButton.alpha = 1
      startButtonText.alpha = 1
      // Gentle pulse to draw attention
      const buttonPulse = 1 + Math.sin(elapsed * 2.2) * 0.05
      if (startButton.scale.x === 1) {  // Only apply if not hovering
        startButton.scale.set(buttonPulse)
        startButtonText.scale.set(buttonPulse)
      }
    }
  }

  /**
   * Build/rebuild for canvas resize
   */
  function build(cWidth, cHeight) {
    canvasWidth = cWidth
    canvasHeight = cHeight

    if (container.visible && background) {
      // Rebuild background for new size
      background.clear()
      background.rect(0, 0, canvasWidth, canvasHeight)
      background.fill({ color: 0x000000, alpha: 0.7 })

      // Reposition and rescale fullscreen jackpot_begin_bg image
      if (bgImage && bgImage.texture) {
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2
        const scaleX = canvasWidth / bgImage.texture.width
        const scaleY = canvasHeight / bgImage.texture.height
        const scale = Math.max(scaleX, scaleY)
        bgImage.scale.set(scale)
      }

      // Reposition elements using percentage-based layout
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight * 0.32
      }
      if (freeSpinsNumberContainer) {
        freeSpinsNumberContainer.x = canvasWidth / 2 - freeSpinsNumberContainer.width / 2
        freeSpinsNumberContainer.y = canvasHeight * 0.50 - freeSpinsNumberContainer.height / 2
      }
      if (messageText) {
        messageText.x = canvasWidth / 2
        messageText.y = canvasHeight * 0.66
      }
      if (startButton) {
        startButton.x = canvasWidth / 2
        startButton.y = canvasHeight * 0.78
      }
      if (startButtonText) {
        startButtonText.x = canvasWidth / 2
        startButtonText.y = canvasHeight * 0.78
      }
    }
  }

  return {
    container,
    show,
    hide,
    update,
    build,
    isShowing: () => isAnimating || container.visible
  }
}
