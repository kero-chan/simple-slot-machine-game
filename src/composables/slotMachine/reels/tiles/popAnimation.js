/**
 * Pop Animation Manager
 * Handles tile pop animations (scale bounce effect) for bonus tiles during jackpot
 */
export function createPopAnimationManager() {
  const activeAnimations = new Map() // cellKey -> animation state

  /**
   * Start a pop animation for a tile
   * @param {string} cellKey - The cell key (e.g., "0:1")
   * @param {Sprite} sprite - The tile sprite to animate
   */
  function startPop(cellKey, sprite) {
    if (!sprite) return

    activeAnimations.set(cellKey, {
      sprite,
      startTime: performance.now(),
      duration: 500, // 500ms total animation for dramatic effect
      baseScaleX: sprite.scale.x,
      baseScaleY: sprite.scale.y,
      maxScale: 1.7, // Pop to 170% size - bigger burst!
    })
  }

  /**
   * Update all active pop animations
   * @returns {boolean} True if any animations are still active
   */
  function update() {
    const now = performance.now()
    let hasActive = false

    for (const [cellKey, anim] of activeAnimations.entries()) {
      const elapsed = now - anim.startTime
      const progress = Math.min(elapsed / anim.duration, 1)

      if (progress >= 1) {
        // Animation complete - reset to base scale
        if (anim.sprite && anim.sprite.parent) {
          anim.sprite.scale.x = anim.baseScaleX
          anim.sprite.scale.y = anim.baseScaleY
        }
        activeAnimations.delete(cellKey)
      } else {
        hasActive = true

        // Dramatic burst animation: explosive scale up
        // Use back easing for overshoot effect
        const scale = anim.baseScaleX * (1 + (anim.maxScale - 1) * easeOutBack(progress))

        if (anim.sprite && anim.sprite.parent) {
          anim.sprite.scale.x = scale
          anim.sprite.scale.y = scale
        }
      }
    }

    return hasActive
  }

  /**
   * Back easing out - creates overshoot effect
   * Goes past the target and bounces back - perfect for "pop out of screen" feeling
   */
  function easeOutBack(t) {
    const c1 = 1.70158
    const c3 = c1 + 1

    return t === 1
      ? 0 // End at 0 (back to original scale)
      : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  /**
   * Check if a tile is currently animating
   */
  function isAnimating(cellKey) {
    return activeAnimations.has(cellKey)
  }

  /**
   * Check if any animations are active
   */
  function hasActiveAnimations() {
    return activeAnimations.size > 0
  }

  /**
   * Clear all animations
   */
  function clear() {
    // Reset all sprites to base scale
    for (const [cellKey, anim] of activeAnimations.entries()) {
      if (anim.sprite && anim.sprite.parent) {
        anim.sprite.scale.x = anim.baseScaleX
        anim.sprite.scale.y = anim.baseScaleY
      }
    }
    activeAnimations.clear()
  }

  return {
    startPop,
    update,
    isAnimating,
    hasActiveAnimations,
    clear,
  }
}
