/**
 * Manages bump animations for bonus tiles when they appear
 */
export function createBumpAnimationManager() {
  const animations = new Map() // key -> { startTime, sprite, duration, baseScale }
  const bumpedTiles = new Set() // Track tiles that have already been bumped

  /**
   * Start a bump animation for a tile
   * @param {string} key - Tile key (e.g., "0:1")
   * @param {Sprite} sprite - The sprite to animate
   */
  function startBump(key, sprite) {
    if (!sprite || animations.has(key) || bumpedTiles.has(key)) return

    animations.set(key, {
      startTime: Date.now(),
      sprite: sprite,
      duration: 600, // 600ms for bump animation (up and down)
      baseScale: sprite.scale.y // Store original scale
    })
  }

  /**
   * Update all active bump animations
   */
  function update() {
    const now = Date.now()

    for (const [key, anim] of animations.entries()) {
      const elapsed = now - anim.startTime
      const progress = Math.min(elapsed / anim.duration, 1)

      if (progress >= 1) {
        // Animation complete - restore original scale
        anim.sprite.scale.y = anim.baseScale
        bumpedTiles.add(key) // Mark as bumped
        animations.delete(key)
      } else {
        // Bump animation: scale up then down
        // Using sine wave for smooth bump effect
        const bumpProgress = Math.sin(progress * Math.PI) // 0 -> 1 -> 0
        const scaleModifier = 1 + (bumpProgress * 0.3) // Scale up to 1.3x
        anim.sprite.scale.y = anim.baseScale * scaleModifier
      }
    }
  }

  /**
   * Clear all animations and tracking
   */
  function clear() {
    for (const [key, anim] of animations.entries()) {
      if (anim.sprite) {
        anim.sprite.scale.y = anim.baseScale
      }
    }
    animations.clear()
    bumpedTiles.clear()
  }

  /**
   * Reset a specific tile (when it's reused or removed)
   */
  function reset(key) {
    const anim = animations.get(key)
    if (anim && anim.sprite) {
      anim.sprite.scale.y = anim.baseScale
    }
    animations.delete(key)
    bumpedTiles.delete(key)
  }

  /**
   * Check if a tile is currently animating
   */
  function isAnimating(key) {
    return animations.has(key)
  }

  /**
   * Check if a tile has already been bumped
   */
  function hasBumped(key) {
    return bumpedTiles.has(key)
  }

  return {
    startBump,
    update,
    clear,
    reset,
    isAnimating,
    hasBumped
  }
}
