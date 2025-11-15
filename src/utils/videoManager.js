import { ASSETS } from '../config/assets'

/**
 * Video Manager - Provides access to preloaded videos for instant playback
 *
 * Videos are preloaded during the loading phase and stored in ASSETS.loadedVideos
 * This manager clones the preloaded videos so they can be reused multiple times
 */

/**
 * Get the preloaded video element (reuses the same element - NOT a clone)
 * IMPORTANT: The returned video can be used by only ONE overlay at a time
 * Calling this multiple times for the same key returns the SAME element
 *
 * @param {string} videoKey - Key from ASSETS.videoPaths (e.g., 'jackpot', 'jackpot_result')
 * @returns {HTMLVideoElement|null} - Preloaded video element or null if not available
 */
export function getPreloadedVideo(videoKey) {
  const preloadedVideo = ASSETS.loadedVideos?.[videoKey]

  if (!preloadedVideo) {
    console.warn(`⚠️ Video "${videoKey}" not preloaded, creating fresh element`)
    // Fallback: create new video element
    const videoSrc = ASSETS.videoPaths?.[videoKey]
    if (!videoSrc) {
      console.error(`❌ Video "${videoKey}" not found in ASSETS.videoPaths`)
      return null
    }

    return createFreshVideo(videoSrc)
  }

  // Return the preloaded video directly (already has metadata loaded!)
  console.log(`📹 Using preloaded video: ${videoKey} (readyState: ${preloadedVideo.readyState}, ${preloadedVideo.videoWidth}x${preloadedVideo.videoHeight})`)

  // Reset video to beginning
  preloadedVideo.currentTime = 0
  preloadedVideo.muted = true
  preloadedVideo.style.display = 'none'

  // Already in DOM from preloading phase
  return preloadedVideo
}

/**
 * Create a fresh video element (fallback when preloading failed)
 */
function createFreshVideo(src) {
  console.log('📹 Creating fresh video element:', src)

  const video = document.createElement('video')
  video.src = src
  video.preload = 'auto'
  video.playsInline = true
  video.muted = true
  video.style.display = 'none'

  document.body.appendChild(video)

  return video
}

/**
 * Check if a video has been preloaded and is ready
 */
export function isVideoPreloaded(videoKey) {
  const video = ASSETS.loadedVideos?.[videoKey]
  return video && video.readyState >= 2 // HAVE_CURRENT_DATA or better
}

/**
 * Get video info for debugging
 */
export function getVideoInfo(videoKey) {
  const video = ASSETS.loadedVideos?.[videoKey]
  if (!video) return null

  return {
    key: videoKey,
    src: video.src,
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    readyState: video.readyState,
    networkState: video.networkState,
    preloaded: video.readyState >= 2
  }
}

/**
 * Log all preloaded videos status
 */
export function logPreloadedVideos() {
  console.group('📹 Preloaded Videos Status')

  const videoKeys = Object.keys(ASSETS.videoPaths || {})

  for (const key of videoKeys) {
    const info = getVideoInfo(key)
    if (info) {
      console.log(`✅ ${key}:`, `${info.width}x${info.height}`, `${info.duration.toFixed(2)}s`, `readyState: ${info.readyState}`)
    } else {
      console.log(`❌ ${key}: Not preloaded`)
    }
  }

  console.groupEnd()
}
