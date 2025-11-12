import { Sprite, Container, Texture } from 'pixi.js'
import { ASSETS } from '../../../../config/assets'

/**
 * Creates rotating golden light burst effects for bonus tiles
 */
export function createLightBurstManager() {
  const container = new Container()
  const burstCache = new Map() // key -> Sprite

  // Cache the light burst texture
  let lightBurstTexture = null
  function ensureLightBurstTexture() {
    if (lightBurstTexture && lightBurstTexture.source?.valid) return lightBurstTexture

    const loaded = ASSETS.loadedImages?.golden_light_burst
    if (loaded) {
      lightBurstTexture = loaded.source ? loaded : Texture.from(loaded)
      return lightBurstTexture
    }

    const url = ASSETS.imagePaths?.golden_light_burst
    if (url) {
      lightBurstTexture = Texture.from(url)
      return lightBurstTexture
    }

    return Texture.WHITE
  }

  /**
   * Update or create light burst for a bonus tile
   * @param {string} key - Tile key
   * @param {Sprite} tileSprite - The tile sprite to center on
   * @param {boolean} shouldShow - Whether to show the effect
   * @param {number} timestamp - Current animation timestamp
   */
  function updateBurst(key, tileSprite, shouldShow, timestamp) {
    if (!tileSprite) return

    let burst = burstCache.get(key)

    if (shouldShow) {
      if (!burst) {
        const tex = ensureLightBurstTexture()
        burst = new Sprite(tex)
        burst.anchor.set(0.5, 0.5) // Center anchor for rotation
        container.addChild(burst)
        burstCache.set(key, burst)
      }

      burst.visible = true

      // Position at center of tile
      burst.x = tileSprite.x
      burst.y = tileSprite.y

      // Match tile's z-index but place behind the tile
      burst.zIndex = (tileSprite.zIndex || 0) - 1

      // Scale to be slightly larger than the tile
      const tileSize = Math.max(tileSprite.width, tileSprite.height)
      const burstSize = tileSize * 1.35 // 1.2x the tile size
      burst.width = burstSize
      burst.height = burstSize

      // Higher alpha for more visible effect
      burst.alpha = 0.7

      // Rotate continuously based on timestamp
      const rotationSpeed = 0.001 // Adjust for faster/slower rotation
      burst.rotation = (timestamp * rotationSpeed) % (Math.PI * 2)

    } else if (burst) {
      burst.visible = false
    }
  }

  /**
   * Clean up bursts that are no longer needed
   */
  function cleanup(usedKeys) {
    for (const [key, burst] of burstCache.entries()) {
      if (!usedKeys.has(key)) {
        if (burst.parent) burst.parent.removeChild(burst)
        burst.destroy({ children: true, texture: false, baseTexture: false })
        burstCache.delete(key)
      }
    }
  }

  /**
   * Clear all bursts
   */
  function clear() {
    for (const [key, burst] of burstCache.entries()) {
      if (burst.parent) burst.parent.removeChild(burst)
      burst.destroy({ children: true, texture: false, baseTexture: false })
    }
    burstCache.clear()
  }

  return { container, updateBurst, cleanup, clear }
}
