import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { BLEND_MODES } from '@pixi/constants'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioEffects } from '../../useAudioEffects'

/**
 * Creates a free spin result overlay that displays total wins after all free spins complete
 * Shows congratulatory message and total accumulated amount
 */
export function createFreeSpinResultOverlay(gameState) {
  const gameStore = useGameStore()
  const { playEffect } = useAudioEffects()
  const container = new Container()
  container.visible = false
  container.zIndex = 1000 // On top

  let background = null
  let bgImage = null
  let titleText = null
  let messageText = null
  let amountText = null
  let animationStartTime = 0
  let isAnimating = false
  let targetAmount = 0
  let currentDisplayAmount = 0

  // Particle system for celebration
  const particlesContainer = new Container()
  const particles = []

  /**
   * Spawn celebration particles
   */
  function spawnParticles(canvasWidth, canvasHeight, count = 200) {
    const goldTexture = ASSETS.loadedImages?.win_gold || ASSETS.imagePaths?.win_gold
    if (!goldTexture) return

    const texture = goldTexture instanceof Texture ? goldTexture : Texture.from(goldTexture)

    for (let i = 0; i < count; i++) {
      const particle = new Sprite(texture)
      particle.anchor.set(0.5)
      particle.blendMode = BLEND_MODES.ADD

      // Random position across top of screen
      particle.x = Math.random() * canvasWidth
      particle.y = -50 - Math.random() * canvasHeight * 0.8

      // Random size
      const size = 10 + Math.random() * 60
      particle.width = size
      particle.height = size

      // Falling velocity
      const speedFactor = size / 40
      particle.vx = (Math.random() - 0.5) * 2
      particle.vy = (0.5 + Math.random() * 1.5) * speedFactor

      // Gravity
      particle.gravity = 0.05

      // Random rotation speed
      particle.rotationSpeed = (Math.random() - 0.5) * 0.15

      // Lifetime
      particle.life = 4000 + Math.random() * 3000
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
   * Show the free spin result overlay
   */
  function show(totalAmount, canvasWidth, canvasHeight) {
    container.visible = true
    isAnimating = true
    animationStartTime = Date.now()
    targetAmount = totalAmount
    currentDisplayAmount = 0

    // Play a special sound for free spin completion (different from normal wins)
    // You can add a specific sound file for this, e.g., 'free_spin_complete'
    if (totalAmount > 0) {
      playEffect('reach_bonus')  // Reuse bonus sound, or add a new 'free_spin_complete' sound
    }

    console.log('🎉 FREE SPIN RESULT OVERLAY - Total:', totalAmount)

    // Clear previous content
    container.removeChildren()

    // Create semi-transparent background with golden tint
    background = new Graphics()
    background.rect(0, 0, canvasWidth, canvasHeight)
    background.fill({ color: 0x1a0a00, alpha: 0.9 })
    container.addChild(background)

    // Add background image
    try {
      const bgSrc = ASSETS.loadedImages?.win_bg || ASSETS.imagePaths?.win_bg
      if (bgSrc) {
        const bgTexture = bgSrc instanceof Texture ? bgSrc : Texture.from(bgSrc)
        bgImage = new Sprite(bgTexture)
        bgImage.anchor.set(0.5)
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2

        const bgScale = canvasWidth / bgImage.width
        bgImage.scale.set(bgScale)

        container.addChild(bgImage)
      }
    } catch (error) {
      console.warn('Failed to load bg image:', error)
    }

    // Create title text
    const titleStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 70,
      fontWeight: 'bold',
      fill: ['#ffd700', '#ffed4e'],
      fillGradientStops: [0, 1],
      stroke: { color: 0x000000, width: 8 },
      dropShadow: {
        color: 0xffd700,
        blur: 20,
        angle: Math.PI / 6,
        distance: 0
      },
      align: 'center'
    }

    titleText = new Text({
      text: '免费旋转总计',  // Free Spins Total
      style: titleStyle
    })
    titleText.anchor.set(0.5)
    titleText.x = canvasWidth / 2
    titleText.y = canvasHeight / 2 - 200
    container.addChild(titleText)

    // Message text
    const messageStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: 36,
      fill: 0xffeb3b,
      stroke: { color: 0x000000, width: 3 },
      align: 'center'
    }

    messageText = new Text({
      text: '恭喜！您在免费旋转中赢得',  // Congratulations! You won in free spins
      style: messageStyle
    })
    messageText.anchor.set(0.5)
    messageText.x = canvasWidth / 2
    messageText.y = canvasHeight / 2 - 120
    container.addChild(messageText)

    // Amount text - large and prominent
    const amountStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: 120,
      fontWeight: '900',
      fill: ['#ffe066', '#ffd700', '#ffed4e'],
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#5c3a00', width: 10 },
      dropShadow: {
        color: '#000000',
        blur: 6,
        angle: Math.PI / 4,
        distance: 4,
        alpha: 0.5
      },
      align: 'center',
      letterSpacing: 6
    }

    amountText = new Text({
      text: '0',
      style: amountStyle
    })
    amountText.anchor.set(0.5)
    amountText.x = canvasWidth / 2
    amountText.y = canvasHeight / 2 + 50
    container.addChild(amountText)

    // Add particles container
    container.addChild(particlesContainer)
    spawnParticles(canvasWidth, canvasHeight, 200)
  }

  /**
   * Hide the overlay
   */
  function hide() {
    container.visible = false
    isAnimating = false
    clearParticles()
    container.removeChildren()

    // Notify state machine that overlay is complete
    gameStore.completeWinOverlay()
  }

  /**
   * Update animation (called every frame)
   */
  function update(timestamp) {
    if (!isAnimating || !container.visible) return

    const elapsed = (Date.now() - animationStartTime) / 1000

    // Counter animation (0 to target over 3 seconds)
    const counterDuration = 3
    if (elapsed < counterDuration) {
      const counterProgress = Math.min(elapsed / counterDuration, 1)
      // Ease-out for smoother counting
      const easeProgress = 1 - Math.pow(1 - counterProgress, 3)
      currentDisplayAmount = Math.floor(targetAmount * easeProgress)

      if (amountText) {
        amountText.text = currentDisplayAmount.toLocaleString()
      }
    } else if (currentDisplayAmount !== targetAmount) {
      // Ensure final amount is exact
      currentDisplayAmount = targetAmount
      if (amountText) {
        amountText.text = targetAmount.toLocaleString()
      }
    }

    // Update particles every frame
    updateParticles()

    // Pulse animation for title and amount
    if (titleText) {
      const pulse = 1 + Math.sin(elapsed * 2) * 0.05
      titleText.scale.set(pulse)
    }

    if (amountText && elapsed >= counterDuration) {
      const pulse = 1 + Math.sin(elapsed * 3) * 0.08
      amountText.scale.set(pulse)
    }

    // Auto-hide after 6 seconds total
    const hideTime = counterDuration + 3
    if (elapsed > hideTime) {
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
      background.fill({ color: 0x1a0a00, alpha: 0.9 })

      // Reposition bg image
      if (bgImage) {
        bgImage.x = canvasWidth / 2
        bgImage.y = canvasHeight / 2
        const bgScale = canvasWidth / bgImage.texture.width
        bgImage.scale.set(bgScale)
      }

      // Reposition text elements
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight / 2 - 200
      }
      if (messageText) {
        messageText.x = canvasWidth / 2
        messageText.y = canvasHeight / 2 - 120
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
    build,
    isShowing: () => isAnimating || container.visible
  }
}
