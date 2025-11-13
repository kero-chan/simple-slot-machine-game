import { Container } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { audioManager } from '../../audioManager'

/**
 * Creates a jackpot video overlay that plays the jackpot.mp4 video
 * Shows immediately after bonus tiles are detected, before the free spins announcement
 */
export function createJackpotVideoOverlay() {
  const gameStore = useGameStore()
  const container = new Container()
  container.visible = false
  container.zIndex = 1200 // Above everything else

  let isPlaying = false
  let onCompleteCallback = null
  let videoElement = null

  /**
   * Get and configure the preloaded video element
   */
  function getVideoElement() {
    if (!videoElement) {
      // Get preloaded video from assets (loaded during initial loading screen)
      videoElement = ASSETS.loadedVideos?.jackpot

      if (videoElement) {
        // Configure video element styles (already in DOM from asset loader)
        videoElement.style.position = 'fixed'
        videoElement.style.top = '0'
        videoElement.style.left = '0'
        videoElement.style.width = '100%'
        videoElement.style.height = '100%'
        videoElement.style.objectFit = 'cover'
        videoElement.style.zIndex = '9999'
        videoElement.style.backgroundColor = '#000'
        videoElement.style.display = 'none' // Hidden until needed
        videoElement.playsInline = true
        console.log('✅ Jackpot video ready from preloaded assets')
      } else {
        console.warn('❌ Jackpot video not found in preloaded assets')
      }
    }
    return videoElement
  }

  /**
   * Show the video overlay
   */
  function show(canvasWidth, canvasHeight, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('🎬 Starting jackpot video...')

    // Pause all background audio
    audioManager.pause()

    // Get the preloaded video element
    const video = getVideoElement()
    if (!video) {
      console.warn('❌ Video element not preloaded')
      hide()
      return
    }

    // Show the preloaded video
    video.style.display = 'block'
    video.currentTime = 0 // Reset to beginning
    video.muted = false // Unmute for playback (was muted during preload for mobile compatibility)

    // Set up event listeners (only once per show)
    const onEnded = () => {
      console.log('✅ Jackpot video completed')
      video.removeEventListener('ended', onEnded)
      hide()
    }

    video.addEventListener('ended', onEnded)

    // Start playback (should be instant since video is preloaded)
    video.play().catch(err => {
      console.error('❌ Failed to play video:', err)
      hide()
    })
  }

  /**
   * Hide the video overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    // Hide video but keep it preloaded for next time
    if (videoElement) {
      videoElement.pause()
      videoElement.style.display = 'none'
      videoElement.currentTime = 0 // Reset for next playback
    }

    // Resume background audio
    audioManager.resume()

    // Trigger completion callback
    if (onCompleteCallback) {
      onCompleteCallback()
      onCompleteCallback = null
    }
  }

  /**
   * Update (not needed for video, but kept for consistency)
   */
  function update(timestamp) {
    // Video playback is handled by the browser
  }

  /**
   * Build/rebuild for canvas resize (not needed for fullscreen video)
   */
  function build(canvasWidth, canvasHeight) {
    // Video is always fullscreen via CSS
  }

  return {
    container,
    show,
    hide,
    update,
    build,
    isShowing: () => isPlaying || container.visible
  }
}
