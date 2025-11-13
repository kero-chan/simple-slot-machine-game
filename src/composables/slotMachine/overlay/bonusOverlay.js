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
  let bgRedOverlay = null
  let titleText = null
  let freeSpinsNumberText = null
  let messageText = null
  let startButton = null
  let startButtonText = null
  let animationStartTime = 0
  let isAnimating = false
  let onStartCallback = null

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
   * Show the bonus trigger overlay
   */
  function show(freeSpinsCount, canvasWidth, canvasHeight, onStart) {
    container.visible = true
    isAnimating = true
    animationStartTime = Date.now()
    onStartCallback = onStart

    // Play bonus trigger sound
    playEffect('reach_bonus')

    // Clear previous content
    container.removeChildren()

    // Create semi-transparent black background
    background = new Graphics()
    background.rect(0, 0, canvasWidth, canvasHeight)
    background.fill({ color: 0x000000, alpha: 0.85 })
    container.addChild(background)

    // Create red overlay background
    bgRedOverlay = new Graphics()
    bgRedOverlay.rect(0, 0, canvasWidth, canvasHeight)
    bgRedOverlay.fill({ color: 0xcc0000, alpha: 0.3 })
    container.addChild(bgRedOverlay)

    // Create title text (congratulations message in Chinese)
    const titleStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 60,
      fontWeight: 'bold',
      fill: ['#4eff4e', '#2ecc71'],
      fillGradientStops: [0, 1],
      stroke: { color: 0x000000, width: 6 },
      dropShadow: {
        color: 0x00ff00,
        blur: 10,
        angle: Math.PI / 6,
        distance: 0
      },
      align: 'center'
    }

    titleText = new Text({
      text: '恭得免费旋装',  // Congratulations on free spins
      style: titleStyle
    })
    titleText.anchor.set(0.5)
    titleText.x = canvasWidth / 2
    titleText.y = canvasHeight / 2 - 180
    container.addChild(titleText)

    // Create large number showing free spins count
    const numberStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: 200,
      fontWeight: '900',
      fill: ['#fff066', '#ffd700', '#ffed4e'],
      fillGradientStops: [0, 0.5, 1],
      stroke: { color: '#5c3a00', width: 10 },
      dropShadow: {
        color: 0x000000,
        blur: 8,
        angle: Math.PI / 4,
        distance: 5,
        alpha: 0.6
      },
      align: 'center',
      letterSpacing: 8
    }

    freeSpinsNumberText = new Text({
      text: `${freeSpinsCount}`,
      style: numberStyle
    })
    freeSpinsNumberText.anchor.set(0.5)
    freeSpinsNumberText.x = canvasWidth / 2
    freeSpinsNumberText.y = canvasHeight / 2
    container.addChild(freeSpinsNumberText)

    // Create message text (in Chinese)
    const messageStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fill: 0xffeb3b,
      stroke: { color: 0x000000, width: 3 },
      align: 'center'
    }

    messageText = new Text({
      text: '获得的免费旋转将在此处!',  // The free spins you got will be used here!
      style: messageStyle
    })
    messageText.anchor.set(0.5)
    messageText.x = canvasWidth / 2
    messageText.y = canvasHeight / 2 + 120
    container.addChild(messageText)

    // Create start button
    const buttonWidth = 200
    const buttonHeight = 70
    startButton = new Graphics()
    startButton.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15)
    startButton.fill({ color: 0xcc0000 })
    startButton.stroke({ color: 0xffd700, width: 4 })
    startButton.x = canvasWidth / 2
    startButton.y = canvasHeight / 2 + 200
    startButton.eventMode = 'static'
    startButton.cursor = 'pointer'
    container.addChild(startButton)

    // Start button text
    const buttonTextStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 36,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    }

    startButtonText = new Text({
      text: '开始',  // Start
      style: buttonTextStyle
    })
    startButtonText.anchor.set(0.5)
    startButtonText.x = startButton.x
    startButtonText.y = startButton.y
    container.addChild(startButtonText)

    // Button hover effect
    let buttonHoverScale = 1
    startButton.on('pointerover', () => {
      buttonHoverScale = 1.1
    })

    startButton.on('pointerout', () => {
      buttonHoverScale = 1
    })

    startButton.on('pointerdown', () => {
      if (onStartCallback) {
        onStartCallback()
      }
      hide()
    })

    // Add particles container and spawn coins
    container.addChild(particlesContainer)
    spawnParticles(canvasWidth, canvasHeight, 100)
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

    // Pulse animation for the free spins number
    if (freeSpinsNumberText) {
      const pulse = 1 + Math.sin(elapsed * 3) * 0.1
      freeSpinsNumberText.scale.set(pulse)
    }

    // Gently pulse the start button
    if (startButton && startButtonText) {
      const buttonPulse = 1 + Math.sin(elapsed * 2) * 0.05
      startButton.scale.set(buttonPulse)
      startButtonText.scale.set(buttonPulse)
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
      background.fill({ color: 0x000000, alpha: 0.85 })

      if (bgRedOverlay) {
        bgRedOverlay.clear()
        bgRedOverlay.rect(0, 0, canvasWidth, canvasHeight)
        bgRedOverlay.fill({ color: 0xcc0000, alpha: 0.3 })
      }

      // Reposition elements
      if (titleText) {
        titleText.x = canvasWidth / 2
        titleText.y = canvasHeight / 2 - 180
      }
      if (freeSpinsNumberText) {
        freeSpinsNumberText.x = canvasWidth / 2
        freeSpinsNumberText.y = canvasHeight / 2
      }
      if (messageText) {
        messageText.x = canvasWidth / 2
        messageText.y = canvasHeight / 2 + 120
      }
      if (startButton) {
        startButton.x = canvasWidth / 2
        startButton.y = canvasHeight / 2 + 200
      }
      if (startButtonText) {
        startButtonText.x = canvasWidth / 2
        startButtonText.y = canvasHeight / 2 + 200
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
