import { gsap } from 'gsap'

/**
 * Pop Animation Manager
 * Handles tile pop animations (scale bounce effect) for bonus tiles during jackpot
 * NOW USING GSAP for smoother animations with built-in back easing
 */
export function createPopAnimationManager() {
  const activeAnimations = new Map() // cellKey -> { tween, sprite, baseScaleX, baseScaleY }

  /**
   * Start a pop animation for a tile using GSAP
   * @param {string} cellKey - The cell key (e.g., "0:1")
   * @param {Sprite} sprite - The tile sprite to animate
   */
  function startPop(cellKey, sprite) {
    if (!sprite) return

    const baseScaleX = sprite.scale.x
    const baseScaleY = sprite.scale.y
    const maxScale = 1.7 // Pop to 170% size - bigger burst!

    // Kill any existing animation for this tile
    const existing = activeAnimations.get(cellKey)
    if (existing && existing.tween) {
      existing.tween.kill()
    }

    // Create GSAP tween with back easing for overshoot effect
    const tween = gsap.to(sprite.scale, {
      x: baseScaleX * maxScale,
      y: baseScaleY * maxScale,
      duration: 0.5, // 500ms
      ease: 'back.out(1.7)', // Built-in back easing with overshoot
      onComplete: () => {
        // Animation complete - reset to base scale
        if (sprite && sprite.parent && !sprite.destroyed) {
          sprite.scale.x = baseScaleX
          sprite.scale.y = baseScaleY
        }
        activeAnimations.delete(cellKey)
      }
    })

    activeAnimations.set(cellKey, {
      tween,
      sprite,
      baseScaleX,
      baseScaleY
    })
  }

  /**
   * Update - GSAP handles updates automatically, this just checks for active animations
   * @returns {boolean} True if any animations are still active
   */
  function update() {
    // GSAP handles all updates automatically
    // Just return whether we have active animations
    return activeAnimations.size > 0
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
   * Clear all animations - kill GSAP tweens
   */
  function clear() {
    // Kill all tweens and reset sprites to base scale
    for (const [cellKey, anim] of activeAnimations.entries()) {
      if (anim.tween) {
        anim.tween.kill()
      }
      if (anim.sprite && anim.sprite.parent && !anim.sprite.destroyed) {
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
