import { useTimingStore } from '../../../stores/timingStore'
import { gsap } from 'gsap'

/**
 * Manages drop animations for tiles cascading down
 * NOW USING GSAP for smoother, more performant animations
 */
export function createDropAnimationManager() {
  const timingStore = useTimingStore()
  const dropStates = new Map() // key -> { fromY, toY, currentY, tween, symbol }
  const completedStates = new Map() // key -> { symbol, completedAt } - Keep symbols after animation completes

  /**
   * Start a drop animation for a tile using GSAP
   * OPTIMIZED: GSAP animates sprite.y directly for butter-smooth 60fps animation
   * @param {string} key - The cellKey (col:visualRow)
   * @param {Sprite} sprite - The sprite to animate
   * @param {number} fromY - Starting Y position
   * @param {number} toY - Target Y position
   * @param {string} symbol - The symbol this sprite should display during animation
   * @param {Function} getTexture - Function to get texture for a symbol
   */
  function startDrop(key, sprite, fromY, toY, symbol, getTexture) {
    if (!sprite) return

    // CRITICAL: Set the sprite's texture AND position IMMEDIATELY to prevent visible flashing
    // The sprite must show the correct symbol at the correct starting position
    if (getTexture) {
      const tex = getTexture(symbol)
      if (tex && sprite.texture !== tex) {
        sprite.texture = tex
      }
    }

    // Set sprite to starting Y position immediately
    sprite.y = fromY

    // Kill any existing tween for this sprite
    const existingDrop = dropStates.get(key)
    if (existingDrop && existingDrop.tween) {
      existingDrop.tween.kill()
    }

    // GSAP OPTIMIZATION: Animate sprite.y directly (no intermediate object)
    // This allows GSAP to use optimized transforms and provides smoothest animation
    const tween = gsap.to(sprite, {
      y: toY,
      duration: timingStore.DROP_DURATION / 1000, // Convert to seconds (default 300ms = 0.3s)
      ease: 'power1.out', // Subtle deceleration for more natural drop feel (better than linear)
      overwrite: 'auto', // Automatically kill conflicting tweens
      onComplete: () => {
        // Animation complete - move to completed states to preserve symbol
        completedStates.set(key, {
          symbol: symbol,
          completedAt: Date.now()
        })
        dropStates.delete(key)
      }
    })

    dropStates.set(key, {
      fromY,
      toY,
      currentY: fromY, // Updated by getDropY
      tween,
      symbol // Store the symbol for this animation
    })

    // Clear from completed states if it was there
    completedStates.delete(key)
  }

  /**
   * Update - GSAP handles animation updates automatically
   * This function only cleans up completed states after grace period
   */
  function update() {
    const now = Date.now()

    // Auto-clear completed states after grace period
    // This prevents delays when waiting for drops to finish before showing win announcements
    for (const [key, completed] of completedStates.entries()) {
      if (now - completed.completedAt > timingStore.DROP_GRACE_PERIOD) {
        completedStates.delete(key)
      }
    }
  }

  /**
   * Get the current Y position for a dropping tile
   * GSAP animates sprite.y directly, so we just return baseY (sprite position is handled by GSAP)
   */
  function getDropY(key, baseY) {
    const drop = dropStates.get(key)
    if (!drop) return baseY

    // Since GSAP animates sprite.y directly, return baseY
    // The sprite's actual Y position is managed by GSAP's tween
    return baseY
  }

  /**
   * Check if a tile is currently dropping
   */
  function isDropping(key) {
    return dropStates.has(key)
  }

  /**
   * Check if ANY tiles are currently dropping
   * Only checks active animations, not completed ones in grace period
   */
  function hasActiveDrops() {
    return dropStates.size > 0
  }

  /**
   * Get the symbol for an animating sprite
   * Returns null if not animating
   */
  function getAnimatingSymbol(key) {
    const drop = dropStates.get(key)
    return drop ? drop.symbol : null
  }

  /**
   * Get the symbol for a sprite that just completed its animation
   * Returns null if not recently completed
   */
  function getCompletedSymbol(key) {
    const completed = completedStates.get(key)
    return completed ? completed.symbol : null
  }

  /**
   * Check if a sprite recently completed its drop animation
   */
  function isRecentlyCompleted(key) {
    return completedStates.has(key)
  }

  /**
   * Clear all animations - kill GSAP tweens
   */
  function clear() {
    // Kill all active GSAP tweens
    for (const [key, drop] of dropStates.entries()) {
      if (drop.tween) {
        drop.tween.kill()
      }
    }
    dropStates.clear()
    completedStates.clear()
  }

  /**
   * Clear only completed states (used when new cascade starts)
   */
  function clearCompleted() {
    completedStates.clear()
  }

  return {
    startDrop,
    update,
    getDropY,
    isDropping,
    hasActiveDrops,
    getAnimatingSymbol,
    getCompletedSymbol,
    isRecentlyCompleted,
    clear,
    clearCompleted
  }
}
