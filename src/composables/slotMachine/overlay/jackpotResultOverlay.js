import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioEffects } from '../../useAudioEffects'
import { getCounterDuration } from '../../../utils/gameHelpers'
import { getPreloadedVideo } from '../../../utils/videoManager'

/**
 * Creates a jackpot result overlay that displays total wins after all free spins (jackpot mode) complete
 * Shows congratulatory message and total accumulated amount with jackpot image background
 */
export function createJackpotResultOverlay(gameState) {
  const gameStore = useGameStore()
  const { playEffect } = useAudioEffects()
  const container = new Container()
  container.visible = false
  container.zIndex = 1000 // On top

  let background = null
  let bgImage = null
  let bgVideo = null // HTML video element for background
  let videoSprite = null // PIXI Sprite for video
  let videoSpriteReady = false // Track if video sprite is successfully created
  let clickOverlay = null // Graphics overlay for click detection
  let canSkip = false // Flag to allow skipping video after 2 seconds
  let skipEnableTimeout = null
  let titleText = null
  let messageText = null
  let amountContainer = null  // Container for image-based number sprites
  let animationStartTime = 0
  let isAnimating = false
  let targetAmount = 0
  let currentDisplayAmount = 0
  let canvasWidth = 600
  let canvasHeight = 800
  let isFadingOut = false

  // Particle system for celebration
  const particlesContainer = new Container()
  const particles = []

  /**
   * Enable skip after 2 seconds
   */
  function enableSkipAfterDelay() {
    // Clear any existing timeout
    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
    }

    canSkip = false

    // Enable skip after 2 seconds
    skipEnableTimeout = setTimeout(() => {
      if (isAnimating) {
        canSkip = true
        console.log('✅ Jackpot result overlay can now be skipped by clicking')
      }
    }, 2000) // 2 seconds
  }

  /**
   * Disable skip and clear timeout
   */
  function disableSkip() {
    canSkip = false

    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
      skipEnableTimeout = null
    }
  }

  /**
   * Handle click on overlay to skip
   */
  function handleOverlayClick(event) {
    if (canSkip && isAnimating) {
      console.log('⏭️ Jackpot result overlay clicked - skipping')
      startFadeOut()
    } else {
      console.log('⏸️ Jackpot result overlay clicked but skip not yet enabled')
    }
  }

  /**
   * Create clickable overlay
   */
  function createClickOverlay(width, height) {
    if (clickOverlay) {
      clickOverlay.clear()
    } else {
      clickOverlay = new Graphics()
      clickOverlay.eventMode = 'static' // Enable interaction
      clickOverlay.cursor = 'pointer'
      clickOverlay.on('pointerdown', handleOverlayClick)
    }

    // Create transparent overlay that covers the entire screen
    clickOverlay.rect(0, 0, width, height)
    clickOverlay.fill({ color: 0x000000, alpha: 0.001 }) // Nearly transparent
    clickOverlay.zIndex = 999 // Below particles but above video

    return clickOverlay
  }

  /**
   * Spawn celebration particles - enhanced for more excitement!
   */
  function spawnParticles(canvasWidth, canvasHeight, count = 250) {
    const goldTexture = ASSETS.loadedImages?.win_gold || ASSETS.imagePaths?.win_gold
    if (!goldTexture) return

    const texture = goldTexture instanceof Texture ? goldTexture : Texture.from(goldTexture)

    for (let i = 0; i < count; i++) {
      const particle = new Sprite(texture)
      particle.anchor.set(0.5)
      particle.blendMode = BLEND_MODES.ADD

      // Random position - some from top, some from sides for variety
      if (Math.random() > 0.3) {
        // Most fall from top
        particle.x = Math.random() * canvasWidth
        particle.y = -50 - Math.random() * canvasHeight * 0.8
      } else {
        // Some shoot up from bottom
        particle.x = Math.random() * canvasWidth
        particle.y = canvasHeight + 50
      }

      // Random size with more variety
      const size = 15 + Math.random() * 70
      particle.width = size
      particle.height = size

      // Falling/rising velocity
      const speedFactor = size / 40
      particle.vx = (Math.random() - 0.5) * 3

      if (particle.y < 0) {
        // Falling from top
        particle.vy = (0.6 + Math.random() * 2.0) * speedFactor
        particle.gravity = 0.08
      } else {
        // Rising from bottom
        particle.vy = -(2.0 + Math.random() * 3.0) * speedFactor
        particle.gravity = 0.12  // Stronger gravity to pull them down
      }

      // Random rotation speed - faster for more energy
      particle.rotationSpeed = (Math.random() - 0.5) * 0.25

      // Lifetime
      particle.life = 5000 + Math.random() * 4000
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
   * Show the jackpot result overlay
   */
  function show(totalAmount, cWidth, cHeight) {
    canvasWidth = cWidth
    canvasHeight = cHeight
    container.visible = true
    container.alpha = 1 // Reset alpha
    isAnimating = true
    isFadingOut = false
    animationStartTime = Date.now()
    targetAmount = totalAmount
    currentDisplayAmount = 0

    // Play a special sound for free spin completion (different from normal wins)
    // You can add a specific sound file for this, e.g., 'free_spin_complete'
    if (totalAmount > 0) {
      playEffect('jackpot_finalize')  // Reuse bonus sound, or add a new 'free_spin_complete' sound
    }

    console.log('🎉 FREE SPIN RESULT OVERLAY - Total:', totalAmount)

    // Clear previous content
    container.removeChildren()

    // Clean up previous video if exists
    if (bgVideo) {
      bgVideo.pause()
      bgVideo.remove()
      bgVideo = null
    }
    if (videoSprite) {
      videoSprite.destroy(true)
      videoSprite = null
    }
    videoSpriteReady = false

    // Get preloaded jackpot_result video for instant playback
    console.log('📹 Getting preloaded jackpot result video')

    bgVideo = getPreloadedVideo('jackpot_result')

    if (bgVideo && bgVideo.videoWidth > 0 && bgVideo.videoHeight > 0) {
      try {
        bgVideo.loop = true
        bgVideo.style.display = 'none'

        console.log('✅ Preloaded video ready:', bgVideo.videoWidth, 'x', bgVideo.videoHeight, '- readyState:', bgVideo.readyState)

        // Create PIXI texture and sprite from preloaded video (already has metadata!)
        const videoTexture = Texture.from(bgVideo)
        videoSprite = new Sprite(videoTexture)
        videoSprite.anchor.set(0.5)
        videoSprite.x = canvasWidth / 2
        videoSprite.y = canvasHeight / 2

        // Set proper scale with loaded dimensions
        const scaleX = canvasWidth / bgVideo.videoWidth
        const scaleY = canvasHeight / bgVideo.videoHeight
        const scale = Math.max(scaleX, scaleY)
        videoSprite.scale.set(scale)

        // Add to container at the back
        container.addChildAt(videoSprite, 0)
        videoSpriteReady = true

        console.log('✅ Video sprite created successfully')

        // Start playing (should start instantly since preloaded)
        bgVideo.play()
          .then(() => {
            console.log('✅ Jackpot result video playing')
          })
          .catch(err => {
            console.warn('⚠️ Video play failed:', err)
          })
      } catch (error) {
        console.warn('Failed to setup jackpot result video:', error)
        bgVideo = null
        videoSprite = null
      }
    } else if (bgVideo) {
      console.warn('⚠️ Video does not have valid dimensions yet:', bgVideo.videoWidth, 'x', bgVideo.videoHeight, '- readyState:', bgVideo.readyState)
      bgVideo = null
      videoSprite = null
    }

    // If video failed to load, use colored background
    if (!bgVideo || !videoSprite) {
      console.warn('⚠️ Using fallback background (video not available)')
      const fallbackBg = new Graphics()
      fallbackBg.rect(0, 0, canvasWidth, canvasHeight)
      fallbackBg.fill({ color: 0x1a0a2a, alpha: 0.95 })
      container.addChild(fallbackBg)
    }

    // Congratulations title text
    const titleStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 64,
      fontWeight: 'bold',
      fill: ['#ffff66', '#ffeb3b', '#ffd700'],
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#8B4513', width: 6 },
      dropShadow: {
        color: 0xff6600,
        blur: 15,
        angle: Math.PI / 6,
        distance: 0,
        alpha: 0.8
      },
      align: 'center',
      letterSpacing: 3
    }

    titleText = new Text({
      text: '恭喜获得',  // Congratulations
      style: titleStyle
    })
    titleText.anchor.set(0.5)
    titleText.x = canvasWidth / 2
    titleText.y = canvasHeight * 0.30
    titleText.alpha = 0  // Start invisible
    titleText.scale.set(0.5)  // Start small
    container.addChild(titleText)

    // Create image-based amount display (reduced final size to prevent cutoff)
    amountContainer = createNumberDisplay(0)
    // Set pivot to center so scaling happens from center point
    amountContainer.pivot.set(amountContainer.width / 2, amountContainer.height / 2)
    amountContainer.x = canvasWidth / 2
    amountContainer.y = canvasHeight * 0.52
    amountContainer.alpha = 0  // Start invisible
    amountContainer.scale.set(0.2)  // Start very small
    container.addChild(amountContainer)

    // Add clickable overlay for skip functionality
    const overlay = createClickOverlay(canvasWidth, canvasHeight)
    container.addChild(overlay)

    // Add particles container (on top of clickable overlay)
    container.addChild(particlesContainer)
    spawnParticles(canvasWidth, canvasHeight, 250)  // More particles for celebration!

    // Enable skip after 2 seconds
    enableSkipAfterDelay()
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

    // Disable skip functionality
    disableSkip()

    // Clean up click overlay
    if (clickOverlay) {
      clickOverlay.off('pointerdown', handleOverlayClick)
      clickOverlay.destroy()
      clickOverlay = null
    }

    // Clean up video completely
    if (bgVideo) {
      bgVideo.pause()
      bgVideo.remove() // Remove from DOM
      bgVideo = null
    }
    if (videoSprite) {
      videoSprite.destroy(true)
      videoSprite = null
    }
    videoSpriteReady = false

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

    // Update video texture if video sprite is ready and video is playing
    if (videoSpriteReady && videoSprite && bgVideo && !bgVideo.paused && bgVideo.readyState >= 2) {
      try {
        // Update texture source from video
        videoSprite.texture.update()
      } catch (err) {
        // Suppress errors during texture update to prevent stack overflow
        console.warn('Video texture update skipped:', err.message)
      }
    }

    // === STAGED ENTRANCE ANIMATIONS ===

    // Stage 1: Title entrance (0-0.6s)
    if (titleText && elapsed < 0.6) {
      const progress = elapsed / 0.6
      const easeOut = 1 - Math.pow(1 - progress, 3)
      titleText.alpha = easeOut
      titleText.scale.set(0.5 + easeOut * 0.5)  // Scale from 0.5 to 1
    } else if (titleText && elapsed >= 0.6) {
      titleText.alpha = 1
      titleText.scale.set(1)
      // Gentle pulse after entrance
      const pulse = 1 + Math.sin((elapsed - 0.6) * 2) * 0.03
      titleText.scale.set(pulse)
    }

    // Stage 2: Amount entrance (0.4-1.0s) with dramatic scale-up
    if (amountContainer && elapsed >= 0.4 && elapsed < 1.0) {
      const progress = (elapsed - 0.4) / 0.6
      const easeOut = 1 - Math.pow(1 - progress, 3)
      amountContainer.alpha = easeOut
      amountContainer.scale.set(0.3 + easeOut * 0.7)  // Scale from 0.3 to 1
    } else if (amountContainer && elapsed >= 1.0) {
      amountContainer.alpha = 1
    }

    // Stage 3: Counter animation - dynamic duration based on number size
    const counterStart = 1.0
    const counterDuration = getCounterDuration(targetAmount)
    const counterEnd = counterStart + counterDuration

    if (elapsed >= counterStart && elapsed < counterEnd) {
      const counterElapsed = elapsed - counterStart
      const counterProgress = counterElapsed / counterDuration
      // Ease-out cubic for smoother, more exciting counting
      const easeProgress = 1 - Math.pow(1 - counterProgress, 3)
      currentDisplayAmount = Math.floor(targetAmount * easeProgress)

      if (amountContainer) {
        // Recreate number display with updated amount
        const oldY = amountContainer.y
        const oldAlpha = amountContainer.alpha
        const centerX = canvasWidth / 2
        container.removeChild(amountContainer)
        amountContainer.destroy({ children: true })

        amountContainer = createNumberDisplay(currentDisplayAmount)
        // Set pivot to center for proper scaling
        amountContainer.pivot.set(amountContainer.width / 2, amountContainer.height / 2)
        amountContainer.x = centerX
        amountContainer.y = oldY
        amountContainer.alpha = oldAlpha

        // Dramatic scaling during counting (reduced base scale to prevent cutoff)
        const countPulse = 0.65 + Math.sin(counterElapsed * 15) * 0.03
        amountContainer.scale.set(countPulse)

        container.addChild(amountContainer)
      }
    } else if (elapsed >= counterEnd) {
      // Ensure final amount is exact
      if (currentDisplayAmount !== targetAmount) {
        currentDisplayAmount = targetAmount
        if (amountContainer) {
          const oldY = amountContainer.y
          const oldAlpha = amountContainer.alpha
          const centerX = canvasWidth / 2
          container.removeChild(amountContainer)
          amountContainer.destroy({ children: true })

          amountContainer = createNumberDisplay(targetAmount)
          // Set pivot to center for proper scaling
          amountContainer.pivot.set(amountContainer.width / 2, amountContainer.height / 2)
          amountContainer.x = centerX
          amountContainer.y = oldY
          amountContainer.alpha = oldAlpha
          container.addChild(amountContainer)
        }
      }

      // Bigger pulse animation after counter finishes (reduced to prevent cutoff)
      if (amountContainer) {
        const pulse = 0.65 + Math.sin((elapsed - counterEnd) * 2.5) * 0.08
        amountContainer.scale.set(pulse)
      }
    }

    // Update particles every frame
    updateParticles()

    // Video plays automatically through PIXI's texture system

    // Start fade out 2 seconds after counting finishes (counterEnd is at 4.0s, so 4 + 2 = 6)
    const displayTime = counterEnd + 2
    if (elapsed > displayTime && !isFadingOut) {
      startFadeOut()
    }
  }

  /**
   * Build/rebuild for canvas resize
   */
  function build(canvasWidth, canvasHeight) {
    if (container.visible) {
      // Rebuild clickable overlay for new size
      if (clickOverlay) {
        clickOverlay.clear()
        clickOverlay.rect(0, 0, canvasWidth, canvasHeight)
        clickOverlay.fill({ color: 0x000000, alpha: 0.001 })
      }

      // Reposition and rescale video sprite
      if (videoSprite && bgVideo) {
        videoSprite.x = canvasWidth / 2
        videoSprite.y = canvasHeight / 2
        const scaleX = canvasWidth / bgVideo.videoWidth
        const scaleY = canvasHeight / bgVideo.videoHeight
        const scale = Math.max(scaleX, scaleY)
        videoSprite.scale.set(scale)
      }
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight * 0.30
      }
      if (amountContainer) {
        amountContainer.x = canvasWidth / 2 - amountContainer.width / 2
        amountContainer.y = canvasHeight * 0.52
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
