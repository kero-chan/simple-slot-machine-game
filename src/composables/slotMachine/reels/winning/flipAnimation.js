/**
 * Manages flip animations for winning tiles
 * Tiles flip from left to right and then disappear
 */
export function createFlipAnimationManager() {
  const animations = new Map() // key -> { startTime, sprite, duration }

  /**
   * Start a flip animation for a tile
   * @param {string} key - Tile key (e.g., "0:1")
   * @param {Sprite} sprite - The sprite to animate
   * @param {number} baseScaleX - The base scale X to animate from
   */
  function startFlip(key, sprite, baseScaleX = 1) {
    if (!sprite || animations.has(key)) return

    console.log(`🔄 Starting flip animation for tile: ${key}`)

    animations.set(key, {
      startTime: Date.now(),
      sprite: sprite,
      duration: 800, // 800ms for complete flip and disappear
      delay: 500, // 500ms delay to show winning frame first
      baseScaleX: baseScaleX
    })
  }

  /**
   * Update all active flip animations
   */
  function update() {
    const now = Date.now()

    for (const [key, anim] of animations.entries()) {
      const elapsed = now - anim.startTime

      // Wait for delay before starting flip animation
      if (elapsed < anim.delay) {
        // During delay: show tile normally (let draw loop handle it)
        continue
      }

      // Calculate progress after delay
      const animElapsed = elapsed - anim.delay
      const progress = Math.min(animElapsed / anim.duration, 1)

      if (progress >= 1) {
        // Animation complete - hide tile
        console.log(`✅ Flip animation complete for tile: ${key}`)
        anim.sprite.alpha = 0
        anim.sprite.scale.x = 0
        animations.delete(key)
      } else {
        // Animate the flip: shrink horizontally from left to right, then fade out
        const baseScale = anim.baseScaleX

        // Shrink horizontally from baseScale to 0 (turns edge-on)
        anim.sprite.scale.x = baseScale * (1 - progress)

        // Fade out in the last 30% of animation
        if (progress > 0.7) {
          const fadeProgress = (progress - 0.7) / 0.3 // 0 to 1 in last 30%
          anim.sprite.alpha = 1 - fadeProgress
        } else {
          anim.sprite.alpha = 1
        }
      }
    }
  }

  /**
   * Clear all animations
   */
  function clear() {
    // Don't reset sprite states here - let the draw loop handle it
    animations.clear()
  }

  /**
   * Reset a specific tile animation (when tile is reused)
   */
  function reset(key, sprite) {
    if (animations.has(key)) {
      animations.delete(key)
    }
    // Don't reset sprite states here - let the draw loop handle it
  }

  /**
   * Check if a tile is currently animating
   */
  function isAnimating(key) {
    return animations.has(key)
  }

  /**
   * Check if a tile is in the delay period (showing frame before flip)
   */
  function isInDelay(key) {
    const anim = animations.get(key)
    if (!anim) return false
    const elapsed = Date.now() - anim.startTime
    return elapsed < anim.delay
  }

  return {
    startFlip,
    update,
    clear,
    reset,
    isAnimating,
    isInDelay
  }
}
