import { AnimatedSprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

/**
 * Create a firework animation sprite
 * @param {Object} options - Configuration options
 * @param {number} options.frameWidth - Width of each frame in the spritesheet
 * @param {number} options.frameHeight - Height of each frame in the spritesheet
 * @param {number} options.frameCount - Number of frames in the animation
 * @param {number} options.columns - Number of columns in the spritesheet (default: frames per row)
 * @param {number} options.animationSpeed - Animation speed (default: 0.5)
 * @param {boolean} options.loop - Whether to loop the animation (default: true)
 * @returns {AnimatedSprite|null} Animated sprite or null if texture not available
 */
export function createFireworkSprite(options = {}) {
  const {
    frameWidth = 128,
    frameHeight = 128,
    frameCount = 16,
    columns = 4,
    animationSpeed = 0.2, // Slower default for smoother animation
    loop = true
  } = options

  const fireworkTexture = ASSETS.loadedImages?.firework
  if (!fireworkTexture) {
    console.warn('Firework texture not loaded')
    return null
  }

  // Create frames from spritesheet
  const frames = []
  for (let i = 0; i < frameCount; i++) {
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = col * frameWidth
    const y = row * frameHeight

    const frame = new Texture({
      source: fireworkTexture.source,
      frame: new Rectangle(x, y, frameWidth, frameHeight)
    })
    frames.push(frame)
  }

  // Create animated sprite
  const animatedSprite = new AnimatedSprite(frames)
  animatedSprite.anchor.set(0.5)
  animatedSprite.animationSpeed = animationSpeed
  animatedSprite.loop = loop
  
  // Apply blend mode for black background
  animatedSprite.blendMode = 'screen'

  return animatedSprite
}

/**
 * Create a firework effect that auto-plays and removes itself when done
 * @param {Container} container - Parent container to add the firework to
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Additional options (scale, etc.)
 */
export function playFireworkEffect(container, x, y, options = {}) {
  const {
    scale = 1,
    onComplete = null,
    ...spriteOptions
  } = options

  const firework = createFireworkSprite({
    loop: false, // Don't loop for one-time effect
    ...spriteOptions
  })

  if (!firework) return

  firework.x = x
  firework.y = y
  firework.scale.set(scale)

  // Add to container
  container.addChild(firework)

  // Handle completion
  firework.onComplete = () => {
    if (onComplete) onComplete()
    container.removeChild(firework)
    firework.destroy()
  }

  // Start animation
  firework.play()

  return firework
}

/**
 * Create a looping firework sprite for continuous effect
 * @param {Object} options - Configuration options
 * @returns {AnimatedSprite|null} Animated sprite ready to be added to container
 */
export function createLoopingFirework(options = {}) {
  const {
    scale = 1,
    autoPlay = true,
    ...spriteOptions
  } = options

  const firework = createFireworkSprite({
    loop: true,
    ...spriteOptions
  })

  if (!firework) return null

  firework.scale.set(scale)

  if (autoPlay) {
    firework.play()
  }

  return firework
}
