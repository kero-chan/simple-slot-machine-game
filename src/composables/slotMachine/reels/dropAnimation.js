/**
 * Manages drop animations for tiles cascading down
 */
export function createDropAnimationManager() {
  const dropStates = new Map() // key -> { fromY, toY, startTime, duration }

  /**
   * Start a drop animation for a tile
   */
  function startDrop(key, sprite, fromY, toY) {
    if (!sprite) return

    dropStates.set(key, {
      fromY,
      toY,
      startTime: Date.now(),
      duration: 300 // 300ms drop
    })

    console.log(`⬇️ Tile ${key} dropping from ${fromY} to ${toY}`)
  }

  /**
   * Update all active drop animations
   */
  function update() {
    const now = Date.now()

    for (const [key, drop] of dropStates.entries()) {
      const elapsed = now - drop.startTime
      const progress = Math.min(elapsed / drop.duration, 1)

      if (progress >= 1) {
        // Animation complete
        dropStates.delete(key)
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
   * Clear all animations
   */
  function clear() {
    dropStates.clear()
  }

  return {
    startDrop,
    update,
    getDropY,
    isDropping,
    clear
  }
}
