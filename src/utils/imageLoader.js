import { ASSETS } from '../config/assets'

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

export async function loadAllAssets() {
  const paths = ASSETS.imagePaths
  ASSETS.loadedImages = {}
  const entries = Object.entries(paths)

  await Promise.all(entries.map(([key, src]) =>
    loadImage(src).then(img => {
      ASSETS.loadedImages[key] = img
    })
  ))
}
