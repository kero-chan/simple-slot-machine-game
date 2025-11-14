import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioEffects } from '../../useAudioEffects'
import { audioManager } from '../../audioManager'
import { getCounterDuration } from '../../../utils/gameHelpers'

/**
 * Creates a winning overlay popup that displays win information
 * Shows "SMALL WIN", "GRAND WIN", "MEGA WIN", or "JACKPOT"
 */
export function createWinOverlay(gameState) {
  const gameStore = useGameStore()
  const { playWinningAnnouncement, stopWinningAnnouncement } = useAudioEffects()
  const container = new Container()
  container.visible = false
  container.zIndex = 1000 // Ensure it's on top

  let background = null
  let bgImage = null  // Background image for win announcement
  let titleText = null
  let titleImage = null  // Image for grand/mega/jackpot
  let amountContainer = null  // Container for image-based number sprites
  let animationStartTime = 0
  let isAnimating = false
  let currentIntensity = 'small'
  let targetAmount = 0  // Final amount to display
  let currentDisplayAmount = 0  // Current animated amount
  let isFadingOut = false

  // Particle system for chaotic gold particles
  const particlesContainer = new Container()
  const particles = []

  // Spawn gold particles falling from the sky - money rain effect
  function spawnParticles(canvasWidth, canvasHeight, count = 50) {
    const goldTexture = ASSETS.loadedImages?.win_gold || ASSETS.imagePaths?.win_gold
    if (!goldTexture) return

    const texture = goldTexture instanceof Texture ? goldTexture : Texture.from(goldTexture)

    for (let i = 0; i < count; i++) {
      const particle = new Sprite(texture)
      particle.anchor.set(0.5)
      particle.blendMode = BLEND_MODES.ADD

      // Random position across top of screen
      particle.x = Math.random() * canvasWidth
      particle.y = -50 - Math.random() * canvasHeight * 0.8  // Start above screen, staggered over larger range

      // Random size (more varied, including smaller coins for depth perception)
      const size = 10 + Math.random() * 60  // 10-70px (smaller range, more varied)
      particle.width = size
      particle.height = size

      // Falling velocity: slower and gentler, varies with size (smaller = slower for depth effect)
      const speedFactor = size / 40  // Normalize around 40px
      particle.vx = (Math.random() - 0.5) * 2  // Gentle horizontal drift: -1 to 1
      particle.vy = (0.5 + Math.random() * 1.5) * speedFactor  // Slower downward: 0.5-2 based on size

      // Gentler gravity
      particle.gravity = 0.05

      // Random rotation speed (gentler tumbling)
      particle.rotationSpeed = (Math.random() - 0.5) * 0.15

      // Longer lifetime for gentle rain effect
      particle.life = 4000 + Math.random() * 3000  // 4-7 seconds
      particle.born = Date.now()
      particle.alpha = 0.6 + Math.random() * 0.3

      particlesContainer.addChild(particle)
      particles.push(particle)
    }
  }

  function updateParticles() {
    const now = Date.now()
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      const age = now - p.born

      // Apply gravity (accelerate downward)
      p.vy += p.gravity

      // Move particle
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed

      // Fade out
      const t = age / p.life
      if (t < 1) {
        p.alpha = (1 - t) * 0.8
        p.scale.set(1 - t * 0.3)  // Shrink as it fades
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
  function createNumberDisplay(amount) {
    const numberContainer = new Container()
    const formattedAmount = amount.toLocaleString()  // e.g., "12,345"
    const digits = formattedAmount.split('')

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
   * Get overlay configuration based on win intensity
   */
  function getOverlayConfig(intensity) {
    const configs = {
      small: {
        title: '',
        titleColor: 0xffeb3b,
        bgColor: 0x000000,
        bgAlpha: 0.6,
        scale: 0.6,
        glowColor: 0xffd700,
        useImage: true,
        imageKey: 'win_small'
      },
      grand: {
        title: '',  // No text - image contains the text
        titleColor: 0xff9800,
        bgColor: 0x000000,
        bgAlpha: 0.7,
        scale: 0.8,
        glowColor: 0xff9800,
        useImage: true,
        imageKey: 'win_grand'
      },
      mega: {
        title: '',  // No text - image contains the text
        titleColor: 0xff5722,
        bgColor: 0x1a0000,
        bgAlpha: 0.8,
        scale: 1.0,
        glowColor: 0xff0000,
        useImage: true,
        imageKey: 'win_mega'
      },
      jackpot: {
        title: '',  // No text - image contains the text
        titleColor: 0xffd700,
        bgColor: 0x1a0a00,
        bgAlpha: 0.9,
        scale: 1.2,
        glowColor: 0xffd700,
        useImage: true,
        imageKey: 'win_megagrand'
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
    container.alpha = 1 // Reset alpha
    isAnimating = true
    isFadingOut = false
    animationStartTime = Date.now()
    targetAmount = amount
    currentDisplayAmount = 0  // Start from 0 for counter animation

    // Pause background music and play winning announcement audio (looped)
    audioManager.pause()
    playWinningAnnouncement()

    // Clear previous content
    container.removeChildren()

    // Create semi-transparent background
    background = new Graphics()
    background.rect(0, 0, canvasWidth, canvasHeight)
    background.fill({ color: config.bgColor, alpha: config.bgAlpha })
    container.addChild(background)

    // Add bg image on top of dark overlay - full canvas width
    try {
      const bgSrc = ASSETS.loadedImages?.win_bg || ASSETS.imagePaths?.win_bg
      if (bgSrc) {
        const bgTexture = bgSrc instanceof Texture ? bgSrc : Texture.from(bgSrc)
        bgImage = new Sprite(bgTexture)
        bgImage.anchor.set(0.5)
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2

        // Scale bg image to fullscreen - fit height and cover
        const scaleX = canvasWidth / bgImage.width
        const scaleY = canvasHeight / bgImage.height
        const bgScale = Math.max(scaleX, scaleY) // Cover entire screen
        bgImage.scale.set(bgScale)

        container.addChild(bgImage)
      }
    } catch (error) {
      console.warn('Failed to load win bg image:', error)
    }

    // Create title - either image or text
    let imageLoaded = false
    if (config.useImage && config.imageKey) {
      // Try to use image for grand/mega/jackpot
      try {
        const imageSrc = ASSETS.loadedImages?.[config.imageKey] || ASSETS.imagePaths?.[config.imageKey]

        if (imageSrc) {
          const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
          titleImage = new Sprite(texture)
          titleImage.anchor.set(0.5)
          titleImage.x = canvasWidth / 2
          titleImage.y = canvasHeight / 2 - 120  // Higher up to make room for amount text

          // Scale image to much bigger size
          const targetHeight = 280 * config.scale  // Increased from 180 to 280
          const imageScale = targetHeight / titleImage.height
          titleImage.scale.set(imageScale)

          container.addChild(titleImage)
          imageLoaded = true
        } else {
          console.warn(`❌ No imageSrc found for ${config.imageKey}`)
        }
      } catch (error) {
        console.warn(`Failed to load win image ${config.imageKey}:`, error)
      }
    }

    if (!imageLoaded) {
      // Use text for small win
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
    }

    // Create image-based amount display
    amountContainer = createNumberDisplay(0)  // Start at 0, will be animated
    amountContainer.x = canvasWidth / 2 - amountContainer.width / 2
    amountContainer.y = canvasHeight / 2 + 50
    container.addChild(amountContainer)

    // Add particles container and spawn chaotic particles
    container.addChild(particlesContainer)
    spawnParticles(canvasWidth, canvasHeight, 150)  // 150 particles for denser rain
  }

  /**
   * Start fade out animation
   */
  function startFadeOut() {
    isFadingOut = true
    animationStartTime = Date.now() // Reset for fade animation
  }

  /**
   * Hide the overlay (called after fade completes)
   */
  function hide() {
    container.visible = false
    container.alpha = 1 // Reset for next show
    isAnimating = false
    isFadingOut = false
    clearParticles()
    container.removeChildren()

    // Stop winning announcement audio and resume background music
    stopWinningAnnouncement()
    audioManager.resume()

    // Notify state machine that overlay is complete
    gameStore.completeWinOverlay()
  }

  /**
   * Update animation (called every frame)
   */
  function update(timestamp) {
    if (!isAnimating || !container.visible) return

    const elapsed = (Date.now() - animationStartTime) / 1000

    // Handle fade out animation
    if (isFadingOut) {
      const fadeDuration = 0.5 // 500ms fade out
      const fadeProgress = Math.min(elapsed / fadeDuration, 1)
      container.alpha = 1 - fadeProgress

      if (fadeProgress >= 1) {
        hide()
      }
      return
    }

    const config = getOverlayConfig(currentIntensity)

    // Counter animation - dynamic duration based on number size
    const counterDuration = getCounterDuration(targetAmount)
    if (elapsed < counterDuration) {
      const counterProgress = Math.min(elapsed / counterDuration, 1)
      // Ease-out for smoother counting
      const easeProgress = 1 - Math.pow(1 - counterProgress, 3)
      currentDisplayAmount = Math.floor(targetAmount * easeProgress)

      if (amountContainer) {
        // Recreate number display with updated amount
        const oldY = amountContainer.y
        const centerX = background ? background.width / 2 : 300
        container.removeChild(amountContainer)
        amountContainer.destroy({ children: true })

        amountContainer = createNumberDisplay(currentDisplayAmount)
        amountContainer.x = centerX - amountContainer.width / 2
        amountContainer.y = oldY
        container.addChild(amountContainer)
      }
    } else if (currentDisplayAmount !== targetAmount) {
      // Ensure final amount is exact
      currentDisplayAmount = targetAmount
      if (amountContainer) {
        const oldY = amountContainer.y
        const centerX = background ? background.width / 2 : 300
        container.removeChild(amountContainer)
        amountContainer.destroy({ children: true })

        amountContainer = createNumberDisplay(targetAmount)
        amountContainer.x = centerX - amountContainer.width / 2
        amountContainer.y = oldY
        container.addChild(amountContainer)
      }
    }

    // Update particles every frame
    updateParticles()

    // Start fade out 2 seconds AFTER counting is done (counterDuration + 2)
    const displayTime = counterDuration + 2
    if (elapsed > displayTime && !isFadingOut) {
      startFadeOut()
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

      // Reposition bg image - fullscreen
      if (bgImage) {
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2
        const scaleX = canvasWidth / bgImage.texture.width
        const scaleY = canvasHeight / bgImage.texture.height
        const bgScale = Math.max(scaleX, scaleY) // Cover entire screen
        bgImage.scale.set(bgScale)
      }

      // Reposition title elements
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight / 2 - 50
      }
      if (titleImage) {
        titleImage.x = canvasWidth / 2
        titleImage.y = canvasHeight / 2 - 80
      }
      if (amountContainer) {
        amountContainer.x = canvasWidth / 2 - amountContainer.width / 2
        amountContainer.y = canvasHeight / 2 + 50
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
