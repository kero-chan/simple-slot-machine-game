import { useTimingStore } from '../../../stores/timingStore'

/**
 * Manages drop animations for tiles cascading down
 */
export function createDropAnimationManager() {
  const timingStore = useTimingStore()
  const dropStates = new Map() // key -> { fromY, toY, startTime, duration, symbol }
  const completedStates = new Map() // key -> { symbol, completedAt } - Keep symbols after animation completes

  /**
   * Start a drop animation for a tile
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

    dropStates.set(key, {
      fromY,
      toY,
      startTime: Date.now(),
      duration: timingStore.DROP_DURATION,
      symbol // Store the symbol for this animation
    })

    // Clear from completed states if it was there
    completedStates.delete(key)
  }

  /**
   * Update all active drop animations
   */
  function update() {
    const now = Date.now()

    // Update active animations
    for (const [key, drop] of dropStates.entries()) {
      const elapsed = now - drop.startTime
      const progress = Math.min(elapsed / drop.duration, 1)

      if (progress >= 1) {
        // Animation complete - move to completed states to preserve symbol
        completedStates.set(key, {
          symbol: drop.symbol,
          completedAt: now
        })
        dropStates.delete(key)
      }
    }

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
   */
  function getDropY(key, baseY) {
    const drop = dropStates.get(key)
    if (!drop) return baseY

    const now = Date.now()
    const elapsed = now - drop.startTime
    const progress = Math.min(elapsed / drop.duration, 1)

    // Ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3)

    return drop.fromY + (drop.toY - drop.fromY) * easeProgress
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
   * Clear all animations
   */
  function clear() {
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
