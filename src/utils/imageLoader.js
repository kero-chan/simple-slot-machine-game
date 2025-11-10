import { Assets, Texture } from 'pixi.js'
import { ASSETS } from '../config/assets'

export async function loadAllAssets() {
  const paths = ASSETS.imagePaths || {}
  ASSETS.loadedImages = {}

  const entries = Object.entries(paths)
  if (entries.length === 0) {
    console.warn('No imagePaths found in ASSETS; nothing to load.')
    return
  }

  // Register assets with Pixi's asset loader
  for (const [alias, src] of entries) {
    try {
      Assets.add({ alias, src })
    } catch (e) {
      console.warn(`Assets.add failed for alias="${alias}" src="${src}":`, e)
    }
  }

  // Load all assets by alias
  let loaded = {}
  try {
    loaded = await Assets.load(entries.map(([alias]) => alias))
  } catch (error) {
    console.error('Failed to load assets:', error)
  }

  // Normalize and store textures into ASSETS.loadedImages
  for (const [alias, src] of entries) {
    let tex = loaded?.[alias] || null

    // If the loader returned something non-Texture, try to create a Texture
    if (!(tex instanceof Texture)) {
      try {
        tex = Texture.from(src)
      } catch (e) {
        console.warn(`Texture.from fallback failed for alias="${alias}" src="${src}":`, e)
        tex = null
      }
    }

    ASSETS.loadedImages[alias] = tex
  }
}

/**
 * Simple HTML image loader for non-Pixi usage or diagnostics.
 * Returns an HTMLImageElement or null.
 */
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`)
      resolve(null)
    }
    img.src = src
  })
}
