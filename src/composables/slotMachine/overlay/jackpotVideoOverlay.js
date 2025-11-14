import { Container } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { audioManager } from '../../audioManager'
import { howlerAudio } from '../../useHowlerAudio'
import { watch } from 'vue'

/**
 * Creates a jackpot video overlay that plays the jackpot.mp4 video
 * Shows immediately after bonus tiles are detected, before the free spins announcement
 */
export function createJackpotVideoOverlay() {
  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()
  const container = new Container()
  container.visible = false
  container.zIndex = 1200 // Above everything else

  let isPlaying = false
  let onCompleteCallback = null
  let videoElement = null
  let canSkip = false // Flag to allow skipping after 2 seconds
  let skipEnableTimeout = null
  let gameSoundWatcher = null // Store watcher to cleanup later
  let currentVideoSrc = null // Track current video source

  /**
   * Update video volume based on gameSound state
   */
  function updateVideoVolume() {
    if (videoElement) {
      // Keep muted=true for mobile compatibility, control volume instead
      videoElement.muted = false // Unmute but control via volume
      videoElement.volume = settingsStore.gameSound ? 1.0 : 0
      console.log(`🔊 Video volume set to: ${videoElement.volume}`)
    }
  }

  /**
   * Enable skip after 2 seconds
   */
  function enableSkipAfterDelay() {
    // Clear any existing timeout
    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
    }
    
    canSkip = false
    
    // Enable skip after 2 seconds
    skipEnableTimeout = setTimeout(() => {
      if (isPlaying) {
        canSkip = true
        console.log('✅ Video can now be skipped by clicking')
      }
    }, 2000) // 2 seconds
  }

  /**
   * Disable skip and clear timeout
   */
  function disableSkip() {
    canSkip = false
    
    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
      skipEnableTimeout = null
    }
  }

  /**
   * Handle click on video to skip
   */
  function handleVideoClick(event) {
    if (canSkip && isPlaying) {
      console.log('⏭️ Video clicked - skipping')
      hide()
    } else {
      console.log('⏸️ Video clicked but skip not yet enabled')
    }
  }

  /**
   * Create a simple video element (no preloading, no Howler)
   */
  function createVideoElement() {
    const videoSrc = ASSETS.videoPaths?.jackpot

    if (!videoSrc) {
      console.error('❌ Jackpot video source not found')
      return null
    }

    console.log('📹 Creating video:', videoSrc)

    // Simple video element
    const video = document.createElement('video')
    video.src = videoSrc
    video.playsInline = true
    video.muted = true
    video.preload = 'none' // Don't preload anything

    // Fullscreen styling
    video.style.position = 'fixed'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = 'contain'
    video.style.zIndex = '9999'
    video.style.backgroundColor = 'black'
    video.style.display = 'none'
    video.style.cursor = 'pointer'

    document.body.appendChild(video)
    video.addEventListener('click', handleVideoClick)

    console.log('✅ Video created')
    return video
  }

  /**
   * Show the video overlay
   */
  async function show(canvasWidth, canvasHeight, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('🎬 Starting jackpot video')

    // Resume AudioContext
    if (howlerAudio.isReady()) {
      await howlerAudio.resumeAudioContext()
    }

    // Pause background audio
    audioManager.pause()

    // Clean up old video
    if (videoElement) {
      videoElement.pause()
      videoElement.removeEventListener('click', handleVideoClick)
      videoElement.remove()
      videoElement = null
    }

    // Create new video
    videoElement = createVideoElement()
    if (!videoElement) {
      hide()
      return
    }

    // Watch for gameSound changes
    if (!gameSoundWatcher) {
      gameSoundWatcher = watch(
        () => settingsStore.gameSound,
        () => {
          if (isPlaying && videoElement) {
            updateVideoVolume()
          }
        }
      )
    }

    // Simple event listeners
    videoElement.addEventListener('ended', () => {
      console.log('✅ Video ended')
      hide()
    }, { once: true })

    videoElement.addEventListener('error', (e) => {
      console.error('❌ Video error:', e.target.error)
      hide()
    }, { once: true })

    // Show and play
    videoElement.style.display = 'block'

    console.log('▶️ Playing video')
    console.log('   Video src:', videoElement.src)
    console.log('   Video readyState:', videoElement.readyState)
    console.log('   Video networkState:', videoElement.networkState)

    videoElement.play().then(() => {
      console.log('✅ Video playing successfully')
      console.log('   Video duration:', videoElement.duration)
      console.log('   Video currentTime:', videoElement.currentTime)

      // Unmute after playing starts
      setTimeout(() => {
        if (videoElement && isPlaying) {
          console.log('🔊 Unmuting video')
          updateVideoVolume()
        }
      }, 200)
    }).catch(err => {
      console.error('❌ Video play failed!')
      console.error('   Error:', err.name, err.message)
      console.error('   Video readyState:', videoElement.readyState)
      console.error('   Video networkState:', videoElement.networkState)
      console.error('   Video error:', videoElement.error)
      hide()
    })

    // Enable skip after 2 seconds
    enableSkipAfterDelay()
  }

  /**
   * Hide the video overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    console.log('🔽 Hiding jackpot video')

    // Disable skip functionality
    disableSkip()

    // Stop watching gameSound changes
    if (gameSoundWatcher) {
      gameSoundWatcher()
      gameSoundWatcher = null
    }

    // Clean up video element completely
    if (videoElement) {
      videoElement.pause()
      videoElement.removeEventListener('click', handleVideoClick)
      videoElement.remove() // Remove from DOM
      videoElement = null
    }

    // Don't resume music here - let free spin mode handle jackpot music

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
