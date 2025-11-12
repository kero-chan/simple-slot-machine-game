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
      baseScaleX: sprite.scale.x, // Store original X scale
      baseScaleY: sprite.scale.y  // Store original Y scale
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
        anim.sprite.scale.x = anim.baseScaleX
        anim.sprite.scale.y = anim.baseScaleY
        bumpedTiles.add(key) // Mark as bumped
        animations.delete(key)
      } else {
        // Bump animation: scale down then back to normal
        // Using sine wave for smooth squeeze effect
        const bumpProgress = Math.sin(progress * Math.PI) // 0 -> 1 -> 0
        const scaleModifier = 1 - (bumpProgress * 0.2) // Scale down to 0.8x
        anim.sprite.scale.x = anim.baseScaleX * scaleModifier
        anim.sprite.scale.y = anim.baseScaleY * scaleModifier
      }
    }
  }

  /**
   * Clear all animations and tracking
   */
  function clear() {
    for (const [key, anim] of animations.entries()) {
      if (anim.sprite) {
        anim.sprite.scale.x = anim.baseScaleX
        anim.sprite.scale.y = anim.baseScaleY
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
      anim.sprite.scale.x = anim.baseScaleX
      anim.sprite.scale.y = anim.baseScaleY
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
