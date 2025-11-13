import { Assets, Texture } from 'pixi.js'
import { ASSETS } from '../config/assets'

/**
 * Preload video element
 */
function preloadVideo(src) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = src
    video.preload = 'auto'
    video.style.display = 'none'

    video.addEventListener('loadeddata', () => {
      console.log('✅ Video preloaded:', src)
      resolve(video)
    })

    video.addEventListener('error', (e) => {
      console.error('❌ Video preload error:', e)
      resolve(null)
    })

    // Add to DOM to trigger loading
    document.body.appendChild(video)
  })
}

/**
 * Preload audio element
 */
function preloadAudio(src) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = src
    audio.preload = 'auto'

    audio.addEventListener('canplaythrough', () => {
      resolve(audio)
    })

    audio.addEventListener('error', (e) => {
      console.error('❌ Audio preload error:', e)
      resolve(null)
    })

    // Start loading
    audio.load()
  })
}

export async function loadAllAssets(onProgress = null) {
  const paths = ASSETS.imagePaths || {}
  const videoPaths = ASSETS.videoPaths || {}
  const audioPaths = ASSETS.audioPaths || {}
  ASSETS.loadedImages = {}
  ASSETS.loadedVideos = {}
  ASSETS.loadedAudios = {}

  const entries = Object.entries(paths)
  const videoEntries = Object.entries(videoPaths)

  // Flatten audio paths (handle both simple paths and arrays like background_noises)
  const audioEntries = []
  for (const [key, value] of Object.entries(audioPaths)) {
    if (Array.isArray(value)) {
      // Handle arrays (e.g., background_noises)
      value.forEach((path, index) => {
        audioEntries.push([`${key}_${index}`, path])
      })
    } else {
      audioEntries.push([key, value])
    }
  }

  const totalAssets = entries.length + videoEntries.length + audioEntries.length

  if (totalAssets === 0) {
    console.warn('No assets found in ASSETS; nothing to load.')
    if (onProgress) onProgress(1, 1) // Report 100% complete
    return
  }

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

  // Load videos
  console.log(`📹 Loading ${videoEntries.length} video(s)...`)
  for (const [alias, src] of videoEntries) {
    try {
      const videoElement = await preloadVideo(src)
      ASSETS.loadedVideos[alias] = videoElement
      loadedCount++

      // Report progress after each video is loaded
      if (onProgress) onProgress(loadedCount, totalAssets)
    } catch (error) {
      console.error(`Failed to load video "${alias}":`, error)
      ASSETS.loadedVideos[alias] = null
      loadedCount++
      if (onProgress) onProgress(loadedCount, totalAssets)
    }
  }

  // Load audio files
  console.log(`🔊 Loading ${audioEntries.length} audio file(s)...`)
  for (const [alias, src] of audioEntries) {
    try {
      const audioElement = await preloadAudio(src)
      ASSETS.loadedAudios[alias] = audioElement
      loadedCount++

      // Report progress after each audio is loaded
      if (onProgress) onProgress(loadedCount, totalAssets)
    } catch (error) {
      console.error(`Failed to load audio "${alias}":`, error)
      ASSETS.loadedAudios[alias] = null
      loadedCount++
      if (onProgress) onProgress(loadedCount, totalAssets)
    }
  }

  // Log loaded assets for debugging
  const successCount = Object.values(ASSETS.loadedImages).filter(t => t).length
  const videoSuccessCount = Object.values(ASSETS.loadedVideos).filter(v => v).length
  const audioSuccessCount = Object.values(ASSETS.loadedAudios).filter(a => a).length
  console.log(`✅ Loaded ${successCount}/${entries.length} images, ${videoSuccessCount}/${videoEntries.length} videos, and ${audioSuccessCount}/${audioEntries.length} audio files`)

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
