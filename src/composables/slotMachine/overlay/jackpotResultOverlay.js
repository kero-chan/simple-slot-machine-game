import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioEffects } from '../../useAudioEffects'

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
  let clickOverlay = null // Graphics overlay for click detection
  let canSkip = false // Flag to allow skipping video after 2 seconds
  let skipEnableTimeout = null
  let titleText = null
  let messageText = null
  let amountText = null
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
    
    // Stop and clean up previous video if exists
    if (bgVideo) {
      bgVideo.pause()
      bgVideo.currentTime = 0
      bgVideo.src = ''
      bgVideo.load()
      bgVideo = null
    }
    if (videoSprite) {
      videoSprite.destroy(true)
      videoSprite = null
    }

    // Use jackpot_result.mp4 video as FULLSCREEN background
    let bgVideoLoaded = false
    try {
      const videoSrc = ASSETS.videoPaths?.jackpot_result

      if (videoSrc) {
        // Create HTML video element
        bgVideo = document.createElement('video')
        bgVideo.src = videoSrc
        bgVideo.loop = true
        bgVideo.muted = true
        bgVideo.playsInline = true
        bgVideo.preload = 'auto'
        bgVideo.crossOrigin = 'anonymous'
        
        // Wait for video to be ready before creating texture
        bgVideo.addEventListener('loadeddata', () => {
          console.log('✅ Video data loaded, creating texture...')
          
          // Create PIXI texture from video AFTER it's loaded
          const videoTexture = Texture.from(bgVideo)
          videoSprite = new Sprite(videoTexture)
          videoSprite.anchor.set(0.5)
          videoSprite.x = canvasWidth / 2
          videoSprite.y = canvasHeight / 2
          
          // Set proper scale
          const scaleX = canvasWidth / bgVideo.videoWidth
          const scaleY = canvasHeight / bgVideo.videoHeight
          const scale = Math.max(scaleX, scaleY)
          videoSprite.scale.set(scale)
          
          // Add to container (at the beginning so it's behind other elements)
          container.addChildAt(videoSprite, 0)
          
          // Start playing
          bgVideo.play().then(() => {
            console.log('✅ Jackpot result video playing')
          }).catch(err => {
            console.warn('Failed to play video:', err)
          })
        }, { once: true })

        // Load the video
        bgVideo.load()
        bgVideoLoaded = true
      } else {
        console.warn('❌ No videoSrc found for jackpot_result')
      }
    } catch (error) {
      console.warn('Failed to load jackpot result video:', error)
    }

    // If video failed to load, use colored background
    if (!bgVideoLoaded) {
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

    // Amount text - large and prominent with glow effect
    const amountStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: 140,
      fontWeight: '900',
      fill: ['#ffff99', '#ffd700', '#ffed4e'],
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#d4af37', width: 8 },
      dropShadow: {
        color: 0xffd700,  // Gold glow
        blur: 30,
        angle: Math.PI / 4,
        distance: 0,
        alpha: 0.9
      },
      align: 'center',
      letterSpacing: 6,
      trim: false,
      padding: 20
    }

    amountText = new Text({
      text: '0',
      style: amountStyle
    })
    amountText.anchor.set(0.5)
    amountText.x = canvasWidth / 2
    amountText.y = canvasHeight * 0.52
    amountText.alpha = 0  // Start invisible
    amountText.scale.set(0.3)  // Start very small
    container.addChild(amountText)

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
    
    // Clean up video
    if (bgVideo) {
      bgVideo.pause()
      bgVideo.currentTime = 0
      bgVideo.src = ''
      bgVideo.load()
      bgVideo = null
    }
    if (videoSprite) {
      videoSprite.destroy(true)
      videoSprite = null
    }

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

    // Update video texture if video is playing
    if (videoSprite && bgVideo && !bgVideo.paused) {
      videoSprite.texture.update()
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
    if (amountText && elapsed >= 0.4 && elapsed < 1.0) {
      const progress = (elapsed - 0.4) / 0.6
      const easeOut = 1 - Math.pow(1 - progress, 3)
      amountText.alpha = easeOut
      amountText.scale.set(0.3 + easeOut * 0.7)  // Scale from 0.3 to 1
    } else if (amountText && elapsed >= 1.0) {
      amountText.alpha = 1
    }

    // Stage 3: Counter animation (1.0-4.0s) - counts up to target
    const counterStart = 1.0
    const counterDuration = 3.0
    const counterEnd = counterStart + counterDuration

    if (elapsed >= counterStart && elapsed < counterEnd) {
      const counterElapsed = elapsed - counterStart
      const counterProgress = counterElapsed / counterDuration
      // Ease-out cubic for smoother, more exciting counting
      const easeProgress = 1 - Math.pow(1 - counterProgress, 3)
      currentDisplayAmount = Math.floor(targetAmount * easeProgress)

      if (amountText) {
        amountText.text = currentDisplayAmount.toLocaleString()

        // Dramatic scaling during counting
        const countPulse = 1 + Math.sin(counterElapsed * 15) * 0.05
        amountText.scale.set(countPulse)
      }
    } else if (elapsed >= counterEnd) {
      // Ensure final amount is exact
      if (currentDisplayAmount !== targetAmount) {
        currentDisplayAmount = targetAmount
        if (amountText) {
          amountText.text = targetAmount.toLocaleString()
        }
      }

      // Bigger pulse animation after counter finishes
      if (amountText) {
        const pulse = 1 + Math.sin((elapsed - counterEnd) * 2.5) * 0.12
        amountText.scale.set(pulse)
      }
    }

    // Update particles every frame
    updateParticles()

    // Video plays automatically through PIXI's texture system

    // Start fade out after 7 seconds (show only 7 seconds of the 10-second video)
    const displayTime = 7
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
      if (amountText) {
        amountText.x = canvasWidth / 2
        amountText.y = canvasHeight * 0.52
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
