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
  let skipButton = null
  let skipButtonTimeout = null

  /**
   * Create skip button element
   */
  function createSkipButton() {
    if (!skipButton) {
      skipButton = document.createElement('button')
      skipButton.textContent = '点击退出视频'
      skipButton.style.position = 'fixed'
      skipButton.style.left = '50%'
      skipButton.style.transform = 'translateX(-50%)'
      skipButton.style.padding = '12px 30px'
      skipButton.style.fontSize = '18px'
      skipButton.style.fontWeight = 'bold'
      skipButton.style.color = '#ffffff'
      skipButton.style.backgroundColor = 'rgba(255, 215, 0, 0.9)'
      skipButton.style.border = '2px solid #ffffff'
      skipButton.style.borderRadius = '40px'
      skipButton.style.cursor = 'pointer'
      skipButton.style.zIndex = '10000'
      skipButton.style.display = 'none'
      skipButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)'
      skipButton.style.transition = 'all 0.3s ease'
      skipButton.style.fontFamily = 'Arial, sans-serif'
      skipButton.style.whiteSpace = 'nowrap'
      skipButton.style.minWidth = 'auto'
      skipButton.style.maxWidth = '90vw'
      
      // Mobile responsive styles - use vh for viewport-relative positioning
      const isMobile = window.innerWidth <= 768
      if (isMobile) {
        skipButton.style.fontSize = '14px'
        skipButton.style.padding = '8px 20px'
        skipButton.style.bottom = '5vh' // 5% from bottom of viewport
        skipButton.style.borderRadius = '30px'
      } else {
        skipButton.style.bottom = '8vh' // 8% from bottom of viewport
      }
      
      // Hover effect
      skipButton.addEventListener('mouseenter', () => {
        skipButton.style.backgroundColor = 'rgba(255, 215, 0, 1)'
        skipButton.style.transform = 'translateX(-50%) scale(1.05)'
      })
      
      skipButton.addEventListener('mouseleave', () => {
        skipButton.style.backgroundColor = 'rgba(255, 215, 0, 0.9)'
        skipButton.style.transform = 'translateX(-50%) scale(1)'
      })
      
      // Click handler
      skipButton.addEventListener('click', () => {
        console.log('⏭️ Skip button clicked')
        hide()
      })
      
      document.body.appendChild(skipButton)
    }
    return skipButton
  }

  /**
   * Show skip button after delay
   */
  function showSkipButtonAfterDelay() {
    // Clear any existing timeout
    if (skipButtonTimeout) {
      clearTimeout(skipButtonTimeout)
    }
    
    // Show button after 2 seconds
    skipButtonTimeout = setTimeout(() => {
      const btn = createSkipButton()
      if (btn && isPlaying) {
        btn.style.display = 'block'
        console.log('✅ Skip button shown')
      }
    }, 2000) // 2 seconds
  }

  /**
   * Hide skip button
   */
  function hideSkipButton() {
    if (skipButtonTimeout) {
      clearTimeout(skipButtonTimeout)
      skipButtonTimeout = null
    }
    
    if (skipButton) {
      skipButton.style.display = 'none'
      // Also remove from DOM to ensure it's completely hidden
      if (skipButton.parentNode) {
        skipButton.parentNode.removeChild(skipButton)
      }
      skipButton = null
    }
  }

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
        videoElement.style.objectFit = 'contain'
        videoElement.style.zIndex = '9999'
        videoElement.style.backgroundColor = 'transparent'
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

    // Show skip button after 2 seconds
    showSkipButtonAfterDelay()
  }

  /**
   * Hide the video overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    // Hide skip button
    hideSkipButton()

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
