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

  let videoElement = null
  let isPlaying = false
  let onCompleteCallback = null

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

    // Create video element
    const videoSrc = ASSETS.videoPaths?.jackpot
    if (!videoSrc) {
      console.warn('❌ No video source found for jackpot')
      hide()
      return
    }

    // Create HTML video element
    videoElement = document.createElement('video')
    videoElement.src = videoSrc
    videoElement.style.position = 'fixed'
    videoElement.style.top = '0'
    videoElement.style.left = '0'
    videoElement.style.width = '100%'
    videoElement.style.height = '100%'
    videoElement.style.objectFit = 'cover'  // Cover entire screen
    videoElement.style.zIndex = '9999'  // On top of everything
    videoElement.style.backgroundColor = '#000'
    videoElement.autoplay = true
    videoElement.playsInline = true  // Important for mobile

    // When video ends, hide and trigger callback
    videoElement.addEventListener('ended', () => {
      console.log('✅ Jackpot video completed')
      hide()
    })

    // Handle video errors
    videoElement.addEventListener('error', (e) => {
      console.error('❌ Video playback error:', e)
      hide()
    })

    // Add video to DOM
    document.body.appendChild(videoElement)

    // Start playback
    videoElement.play().catch(err => {
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

    // Remove video element from DOM
    if (videoElement) {
      videoElement.pause()
      videoElement.src = ''
      if (videoElement.parentNode) {
        videoElement.parentNode.removeChild(videoElement)
      }
      videoElement = null
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
