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
        videoElement.style.cursor = 'pointer' // Show pointer to indicate clickable

        // Ensure hardware acceleration is enabled for smooth playback
        videoElement.style.willChange = 'transform'
        videoElement.style.transform = 'translateZ(0)'

        videoElement.playsInline = true
        videoElement.setAttribute('playsinline', 'true')
        videoElement.setAttribute('webkit-playsinline', 'true')

        // Add click event listener
        videoElement.addEventListener('click', handleVideoClick)

        // Set initial volume based on gameSound state
        updateVideoVolume()

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
  async function show(canvasWidth, canvasHeight, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('🎬 Starting jackpot video...')

    // Resume AudioContext in case it was suspended (video can be several seconds long)
    if (howlerAudio.isReady()) {
      await howlerAudio.resumeAudioContext()
      console.log('🔓 Audio context resumed before jackpot video')
    }

    // Pause all background audio
    audioManager.pause()

    // Get the preloaded video element
    const video = getVideoElement()
    if (!video) {
      console.warn('❌ Video element not preloaded')
      hide()
      return
    }

    // IMPORTANT: Keep muted during play() for mobile compatibility
    // We'll unmute after playback starts successfully
    video.muted = true

    // Reset to beginning
    video.currentTime = 0

    // Watch for gameSound changes while video is playing
    if (!gameSoundWatcher) {
      gameSoundWatcher = watch(
        () => settingsStore.gameSound,
        () => {
          if (isPlaying) {
            updateVideoVolume()
          }
        }
      )
    }

    // Set up event listeners (only once per show)
    const onEnded = () => {
      console.log('✅ Jackpot video completed')
      video.removeEventListener('ended', onEnded)
      hide()
    }

    video.addEventListener('ended', onEnded)

    // Function to start playback
    const startPlayback = () => {
      console.log(`📹 Starting video playback (readyState: ${video.readyState})`)

      // Show video
      video.style.display = 'block'

      // Start playback while muted (better mobile compatibility)
      video.play()
        .then(() => {
          console.log('✅ Video playback started successfully')
          // Now that it's playing, unmute and set volume
          updateVideoVolume()
        })
        .catch(err => {
          console.error('❌ Failed to play video:', err)
          hide()
        })
    }

    // Check if video has enough data buffered
    if (video.readyState >= 3) {
      // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA - ready to play
      startPlayback()
    } else {
      console.log('⏳ Waiting for video to buffer...')

      // Wait for video to have enough data
      const onCanPlay = () => {
        console.log('✅ Video buffered and ready')
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('canplaythrough', onCanPlay)
        startPlayback()
      }

      video.addEventListener('canplay', onCanPlay, { once: true })
      video.addEventListener('canplaythrough', onCanPlay, { once: true })

      // Force load if needed
      if (video.readyState === 0) {
        console.log('📹 Triggering video load...')
        video.load()
      }

      // Timeout: force start after 2 seconds even if not fully buffered
      setTimeout(() => {
        if (video.style.display !== 'block') {
          console.warn('⚠️ Video buffering timeout - forcing playback')
          video.removeEventListener('canplay', onCanPlay)
          video.removeEventListener('canplaythrough', onCanPlay)
          startPlayback()
        }
      }, 2000)
    }

    // Enable skip after 2 seconds
    enableSkipAfterDelay()
  }

  /**
   * Hide the video overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    // Disable skip functionality
    disableSkip()

    // Stop watching gameSound changes
    if (gameSoundWatcher) {
      gameSoundWatcher()
      gameSoundWatcher = null
    }

    // Hide video but keep it preloaded for next time
    if (videoElement) {
      videoElement.pause()
      videoElement.style.display = 'none'
      videoElement.currentTime = 0 // Reset for next playback
    }

    // Don't resume music here - let the next state (free spin mode) handle starting jackpot music
    // If we resume here, it will resume NORMAL music, then free spins will switch to jackpot music
    // This causes a brief moment of normal music playing before switching

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
