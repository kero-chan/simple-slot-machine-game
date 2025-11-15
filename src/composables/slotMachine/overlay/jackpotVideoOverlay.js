import { Container } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { audioManager } from '../../audioManager'
import { howlerAudio } from '../../useHowlerAudio'
import { watch } from 'vue'
import { getPreloadedVideo } from '../../../utils/videoManager'

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
    if (videoElement && videoElement.readyState >= 1) {
      // Native video API for volume control
      const volume = settingsStore.gameSound ? 1.0 : 0
      videoElement.volume = volume
      videoElement.muted = (volume === 0)
      console.log(`🔊 Video volume set to: ${volume}`)
    }
  }

  /**
   * Handle video ended event
   */
  function handleVideoEnded() {
    console.log('✅ Video ended')
    hide()
  }

  /**
   * Handle video error event
   */
  function handleVideoError() {
    const error = videoElement?.error
    console.error('❌ Video error:', error)
    hide()
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
    console.log('🖱️ Video clicked! canSkip:', canSkip, 'isPlaying:', isPlaying)

    if (canSkip && isPlaying) {
      console.log('⏭️ Video clicked - skipping')
      event.preventDefault()
      event.stopPropagation()
      hide()
    } else if (!canSkip && isPlaying) {
      console.log('⏸️ Video clicked but skip not yet enabled (wait 2 seconds)')
    } else {
      console.log('⏸️ Video clicked but not playing')
    }
  }

  /**
   * Get preloaded video element for instant playback
   */
  function createVideoElement() {
    console.log('📹 Getting preloaded jackpot video')

    // Get preloaded video from cache
    const video = getPreloadedVideo('jackpot')

    if (!video) {
      console.error('❌ Failed to get jackpot video')
      return null
    }

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

    // Add click handler
    video.addEventListener('click', handleVideoClick)

    console.log('✅ Preloaded video ready - Size:', video.videoWidth, 'x', video.videoHeight, '- ReadyState:', video.readyState)
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
      videoElement.removeEventListener('click', handleVideoClick)
      videoElement.removeEventListener('ended', handleVideoEnded)
      videoElement.removeEventListener('error', handleVideoError)
      if (videoElement.parentNode) {
        videoElement.remove()
      }
      videoElement = null
    }

    // Get preloaded video element
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

    // Native video event listeners
    videoElement.addEventListener('ended', handleVideoEnded, { once: true })
    videoElement.addEventListener('error', handleVideoError, { once: true })

    // Monitor buffering/loading issues
    videoElement.addEventListener('waiting', () => {
      console.warn('⏸️ Video: Waiting for data (buffering)...')
    })

    videoElement.addEventListener('stalled', () => {
      console.warn('⚠️ Video: Stalled (network issue)')
    })

    videoElement.addEventListener('suspend', () => {
      console.warn('⏹️ Video: Suspended (browser paused loading)')
    })

    videoElement.addEventListener('playing', () => {
      console.log('▶️ Video: Playing')
    })

    videoElement.addEventListener('pause', () => {
      console.log('⏸️ Video: Paused')
    })

    // Show video
    videoElement.style.display = 'block'

    console.log('⏳ Video: Waiting for video to buffer...')
    console.log('   Video src:', videoElement.src)
    console.log('   Initial readyState:', videoElement.readyState)

    // Wait for video to have enough data using native video API
    const waitForData = () => {
      return new Promise((resolve) => {
        if (!videoElement) {
          console.warn('⚠️ Video element is null, aborting wait')
          resolve()
          return
        }

        if (videoElement.readyState >= 3) {
          // HAVE_FUTURE_DATA - enough to play
          console.log('✅ Video has enough data (readyState: ' + videoElement.readyState + ')')
          resolve()
        } else {
          console.log('⏳ Video waiting for data (readyState: ' + videoElement.readyState + ')...')

          const onCanPlay = () => {
            if (!videoElement) return
            console.log('✅ Video can play (readyState: ' + videoElement.readyState + ')')
            resolve()
          }

          videoElement.addEventListener('canplay', onCanPlay, { once: true })
          videoElement.addEventListener('canplaythrough', onCanPlay, { once: true })

          // Timeout after 5 seconds
          setTimeout(() => {
            console.warn('⏰ Video wait timeout, trying anyway')
            if (videoElement) {
              videoElement.removeEventListener('canplay', onCanPlay)
              videoElement.removeEventListener('canplaythrough', onCanPlay)
            }
            resolve()
          }, 5000)
        }
      })
    }

    // Wait then play using native video API
    waitForData().then(() => {
      if (!videoElement || !isPlaying) {
        console.warn('⚠️ Video element disposed during wait')
        return Promise.reject(new Error('Video element disposed'))
      }

      console.log('▶️ Playing video')
      console.log('   Final readyState:', videoElement.readyState)
      console.log('   Final networkState:', videoElement.networkState)

      // Use native video play() method which returns a promise
      return videoElement.play()
    }).then(() => {
      if (!videoElement || !isPlaying) {
        console.warn('⚠️ Video element disposed during play')
        return
      }

      console.log('✅ Video playing successfully')
      console.log('   Video duration:', videoElement.duration)
      console.log('   Video currentTime:', videoElement.currentTime)

      // Unmute after playing starts
      setTimeout(() => {
        if (videoElement && isPlaying) {
          console.log('🔊 Video: Unmuting video')
          updateVideoVolume()
        }
      }, 200)
    }).catch(err => {
      console.error('❌ Video play failed!')
      console.error('   Error:', err.name, err.message)
      if (videoElement) {
        console.error('   Video readyState:', videoElement.readyState)
        console.error('   Video networkState:', videoElement.networkState)
        console.error('   Video error:', videoElement.error)
      }
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

    // Clean up video element
    if (videoElement) {
      try {
        // Pause and hide the video
        videoElement.pause()
        videoElement.style.display = 'none'

        // Remove event listeners
        videoElement.removeEventListener('click', handleVideoClick)

        // Don't remove from DOM - it's a preloaded video that will be reused
        // Just hide it for next use
      } catch (err) {
        console.warn('⚠️ Error during video cleanup:', err)
      } finally {
        videoElement = null
      }
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
