import { Assets } from 'pixi.js'
import { ASSETS } from '../config/assets'

export async function loadAllAssets() {
  const paths = ASSETS.imagePaths
  ASSETS.loadedImages = {}

  // Add all assets to PixiJS Assets loader
  const entries = Object.entries(paths)

  for (const [key, src] of entries) {
    Assets.add({ alias: key, src })
  }

  // Load all assets
  try {
    const loadedAssets = await Assets.load(entries.map(([key]) => key))

    // Store loaded textures in ASSETS.loadedImages
    for (const [key] of entries) {
      ASSETS.loadedImages[key] = loadedAssets[key]
    }
  } catch (error) {
    console.error('Failed to load assets:', error)
  }
}

// Keep compatibility with old Image-based loading for non-PixiJS usage
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
