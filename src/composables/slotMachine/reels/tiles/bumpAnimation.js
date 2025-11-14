import { gsap } from 'gsap'

/**
 * Manages bump animations for bonus tiles when they appear
 * NOW USING GSAP for smoother animations
 */
export function createBumpAnimationManager() {
  const animations = new Map() // key -> { tween, sprite, baseScaleX, baseScaleY }
  const bumpedTiles = new Set() // Track tiles that have already been bumped

  /**
   * Start a bump animation for a tile using GSAP
   * @param {string} key - Tile key (e.g., "0:1")
   * @param {Sprite} sprite - The sprite to animate
   */
  function startBump(key, sprite) {
    if (!sprite || animations.has(key) || bumpedTiles.has(key)) return

    const baseScaleX = sprite.scale.x
    const baseScaleY = sprite.scale.y

    // Create a timeline for the bump animation
    const timeline = gsap.timeline({
      onComplete: () => {
        // Animation complete - restore original scale
        if (sprite && !sprite.destroyed) {
          sprite.scale.x = baseScaleX
          sprite.scale.y = baseScaleY
        }
        bumpedTiles.add(key)
        animations.delete(key)
      }
    })

    // Bump animation: squeeze down and bounce back
    // Using custom ease with sine wave for smooth squeeze effect
    timeline.to(sprite.scale, {
      x: baseScaleX * 0.8,
      y: baseScaleY * 0.8,
      duration: 0.3,
      ease: 'sine.inOut'
    }).to(sprite.scale, {
      x: baseScaleX,
      y: baseScaleY,
      duration: 0.3,
      ease: 'sine.inOut'
    })

    animations.set(key, {
      tween: timeline,
      sprite: sprite,
      baseScaleX,
      baseScaleY
    })
  }

  /**
   * Update - GSAP handles updates automatically, this is a no-op now
   */
  function update() {
    // GSAP handles all updates automatically
  }

  /**
   * Clear all animations and tracking - kill GSAP tweens
   */
  function clear() {
    for (const [key, anim] of animations.entries()) {
      if (anim.tween) {
        anim.tween.kill()
      }
      if (anim.sprite && !anim.sprite.destroyed) {
        anim.sprite.scale.x = anim.baseScaleX
        anim.sprite.scale.y = anim.baseScaleY
      }
    }
    animations.clear()
    bumpedTiles.clear()
  }

  /**
   * Reset a specific tile (when it's reused or removed) - kill GSAP tween
   */
  function reset(key) {
    const anim = animations.get(key)
    if (anim) {
      if (anim.tween) {
        anim.tween.kill()
      }
      if (anim.sprite && !anim.sprite.destroyed) {
        anim.sprite.scale.x = anim.baseScaleX
        anim.sprite.scale.y = anim.baseScaleY
      }
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
