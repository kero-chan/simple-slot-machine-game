import { Assets, Texture } from 'pixi.js'
import { ASSETS } from '../config/assets'

/**
 * Skip video preloading - videos will be created on-demand
 * This is simpler and more reliable on mobile
 */
async function preloadVideo(src) {
  // Don't preload videos - just return null
  // Videos will be created fresh when needed
  console.log('📹 Skipping video preload (will create on-demand):', src)
  return null
}

/**
 * Skip audio preloading - Howler.js will handle all audio loading
 * This prevents blob URL conflicts and decode errors on mobile
 */
async function preloadAudio(src) {
  // Don't preload audio - just return null
  // Howler.js will load audio from original paths when needed
  console.log('🔊 Skipping audio preload (Howler will load on-demand):', src)
  return null
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
  console.log(`📸 Preparing ${entries.length} image(s)...`)
  for (const [alias, src] of entries) {
    try {
      Assets.add({ alias, src })
    } catch (e) {
      console.warn(`Assets.add failed for alias="${alias}" src="${src}":`, e)
    }
  }

  // Load all images by alias with progress tracking
  // Pixi Assets.load() downloads full images and caches them as textures in memory
  console.log(`📸 Downloading ${entries.length} image(s)...`)
  let loaded = {}
  let lastReportedProgress = 0

  try {
    loaded = await Assets.load(entries.map(([alias]) => alias), (progress) => {
      // Pixi's progress is 0 to 1 for images only
      const imagesLoaded = Math.floor(progress * entries.length)

      // Only report if progress actually increased (avoid duplicate reports)
      if (imagesLoaded > lastReportedProgress) {
        lastReportedProgress = imagesLoaded
        if (onProgress) {
          onProgress(imagesLoaded, totalAssets)
          console.log(`📊 Loading progress: ${imagesLoaded}/${totalAssets}`)
        }
      }
    })
    console.log(`✅ All images downloaded and cached`)
  } catch (error) {
    console.error('Failed to load images:', error)
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

  // Set loadedCount to number of images loaded and report
  loadedCount = entries.length
  if (onProgress) {
    onProgress(loadedCount, totalAssets)
    console.log(`📊 Images complete: ${loadedCount}/${totalAssets}`)
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
  console.log(`🔊 Downloading ${audioEntries.length} audio file(s)...`)
  for (const [alias, src] of audioEntries) {
    try {
      const audioElement = await preloadAudio(src)
      if (audioElement) {
        ASSETS.loadedAudios[alias] = audioElement
      }
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

  // Initialize Howler.js for mobile compatibility
  // Howler will load audio from original paths (not blob URLs)
  try {
    const { howlerAudio } = await import('../composables/useHowlerAudio')
    howlerAudio.initialize()
    console.log('🎵 Howler.js initialized')

    // Wait a bit to ensure Howler instances are fully ready
    // This prevents race condition where Start button appears before Howler is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('✅ Howler.js ready for playback')
  } catch (err) {
    console.warn('Failed to initialize Howler.js:', err)
  }

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
