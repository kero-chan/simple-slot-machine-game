import { Assets, Texture } from 'pixi.js'
import { ASSETS } from '../config/assets'

/**
 * Preload video element - downloads entire video into memory
 */
async function preloadVideo(src) {
  try {
    console.log('📹 Downloading video:', src)

    // Fetch the video file completely
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`)
    }

    // Get video as blob
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    console.log(`✅ Video downloaded (${(blob.size / 1024 / 1024).toFixed(2)} MB)`)

    // Determine preload strategy based on video type
    // jackpot.mp4 needs full preloading for smooth playback with audio
    // jackpot_result.mp4 can use metadata-only (it's just background)
    const isJackpotVideo = src.includes('jackpot.mp4') && !src.includes('jackpot_result')
    const preloadStrategy = isJackpotVideo ? 'auto' : 'metadata'

    console.log(`📹 Using preload strategy: ${preloadStrategy} for ${src}`)

    // Create video element with blob URL
    const video = document.createElement('video')
    video.src = blobUrl
    video.preload = preloadStrategy
    video.style.display = 'none'
    video.playsInline = true
    video.muted = true // Muted videos are more likely to load on mobile

    // Enable hardware acceleration on mobile
    video.setAttribute('playsinline', 'true') // iOS compatibility
    video.setAttribute('webkit-playsinline', 'true') // Older iOS

    // For jackpot video, optimize for smooth playback
    if (isJackpotVideo) {
      video.style.willChange = 'transform' // Hint for hardware acceleration
      video.style.transform = 'translateZ(0)' // Force GPU layer
    }

    // Add to DOM
    document.body.appendChild(video)

    // Wait for video to be ready with timeout
    return new Promise((resolve) => {
      let resolved = false

      const finish = (result) => {
        if (!resolved) {
          resolved = true
          resolve(result)
        }
      }

      // Different readiness events based on preload strategy
      const onReady = () => {
        console.log(`✅ Video ready for playback (readyState: ${video.readyState})`)
        finish(video)
      }

      if (preloadStrategy === 'auto') {
        // For full preload, wait for enough data to play through
        console.log('⏳ Waiting for video to buffer fully...')
        video.addEventListener('canplaythrough', onReady, { once: true })
        // Fallback to canplay if canplaythrough takes too long
        setTimeout(() => {
          if (!resolved) {
            console.log('⏰ canplaythrough timeout, using canplay instead')
            video.addEventListener('canplay', onReady, { once: true })
          }
        }, 5000)
      } else {
        // For metadata-only, just wait for basic readiness
        video.addEventListener('loadeddata', onReady, { once: true })
        video.addEventListener('loadedmetadata', onReady, { once: true })
        video.addEventListener('canplay', onReady, { once: true })
      }

      video.addEventListener('error', (e) => {
        console.error('❌ Video element error:', e)
        finish(null)
      })

      // Timeout after 15 seconds for mobile devices
      setTimeout(() => {
        console.warn('⚠️ Video loading timeout, continuing anyway...')
        finish(video) // Return video element even if not fully loaded
      }, 15000)

      // Try to trigger load explicitly
      video.load()
    })
  } catch (error) {
    console.error('❌ Video preload failed:', error)
    return null
  }
}

/**
 * Preload audio element - downloads entire audio into memory
 */
async function preloadAudio(src) {
  try {
    // Fetch the audio file completely
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    // Get audio as blob
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    // Create audio element with blob URL
    const audio = new Audio()
    audio.src = blobUrl
    audio.preload = 'metadata' // Changed from 'auto' for better mobile compatibility

    // Wait for audio to be ready with timeout
    return new Promise((resolve) => {
      let resolved = false

      const finish = (result) => {
        if (!resolved) {
          resolved = true
          resolve(result)
        }
      }

      // Mobile-friendly: Use multiple events to detect readiness
      const onReady = () => {
        finish(audio)
      }

      audio.addEventListener('canplaythrough', onReady)
      audio.addEventListener('loadedmetadata', onReady)
      audio.addEventListener('canplay', onReady)

      audio.addEventListener('error', (e) => {
        console.error('❌ Audio element error:', e)
        finish(null)
      })

      // Timeout after 5 seconds for mobile devices
      setTimeout(() => {
        console.warn('⚠️ Audio loading timeout, continuing anyway...')
        finish(audio) // Return audio element even if not fully loaded
      }, 5000)

      // Start loading from blob
      audio.load()
    })
  } catch (error) {
    console.error('❌ Audio preload failed:', error)
    return null
  }
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
