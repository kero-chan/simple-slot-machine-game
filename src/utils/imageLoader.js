import { Assets, Texture } from 'pixi.js'
import { ASSETS } from '../config/assets'

export async function loadAllAssets(onProgress = null) {
  const paths = ASSETS.imagePaths || {}
  ASSETS.loadedImages = {}

  const entries = Object.entries(paths)
  if (entries.length === 0) {
    console.warn('No imagePaths found in ASSETS; nothing to load.')
    if (onProgress) onProgress(1, 1) // Report 100% complete
    return
  }

  const totalAssets = entries.length
  let loadedCount = 0

  // Report initial progress
  if (onProgress) {
    onProgress(0, totalAssets)
  }

  // Register assets with Pixi's asset loader
  for (const [alias, src] of entries) {
    try {
      Assets.add({ alias, src })
    } catch (e) {
      console.warn(`Assets.add failed for alias="${alias}" src="${src}":`, e)
    }
  }

  // Load all assets by alias with progress tracking
  let loaded = {}
  try {
    loaded = await Assets.load(entries.map(([alias]) => alias), (progress) => {
      // Pixi's progress is 0 to 1
      const currentLoaded = Math.floor(progress * totalAssets)
      if (onProgress) onProgress(currentLoaded, totalAssets)
    })
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
    loadedCount++
    
    // Report progress after each asset is processed
    if (onProgress) onProgress(loadedCount, totalAssets)
  }

  // Log loaded assets for debugging
  const successCount = Object.values(ASSETS.loadedImages).filter(t => t).length
  
  // Final progress report
  if (onProgress) {
    onProgress(totalAssets, totalAssets)
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
