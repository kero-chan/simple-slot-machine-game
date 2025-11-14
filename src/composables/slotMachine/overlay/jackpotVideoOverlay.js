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
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      hide()
    }

    // Handle buffering stalls (for heavy videos)
    const onWaiting = () => {
      console.log('⏸️ Video buffering...')
      // Video will automatically resume when buffer fills
    }

    const onPlaying = () => {
      console.log('▶️ Video playing/resumed')
    }

    video.addEventListener('ended', onEnded)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)

    // Function to start playback after seeking
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

    // For heavy videos, use progressive playback (play while buffering)
    // Don't wait for full buffer - start as soon as we have some data

    // Handle seeking with progressive playback
    const handleSeekAndPlay = () => {
      const onSeeked = () => {
        console.log('✅ Video seeked to beginning')
        video.removeEventListener('seeked', onSeeked)

        // Start playback immediately after seek, even if not fully buffered
        // Browser will buffer while playing
        startPlayback()
      }

      video.addEventListener('seeked', onSeeked, { once: true })
      video.currentTime = 0

      // Timeout in case seeked doesn't fire
      setTimeout(() => {
        if (video.style.display !== 'block') {
          console.warn('⚠️ Seeked timeout, forcing start')
          video.removeEventListener('seeked', onSeeked)
          startPlayback()
        }
      }, 500)
    }

    // Check if video needs seeking
    if (video.currentTime > 0.1) {
      // Video is not at beginning, seek to 0
      console.log(`📹 Video at ${video.currentTime}s, seeking to beginning...`)
      handleSeekAndPlay()
    } else {
      // Already at beginning, check readyState
      console.log(`📹 Video already at beginning (readyState: ${video.readyState})`)

      if (video.readyState >= 1) {
        // HAVE_METADATA or higher - start immediately
        // Browser will buffer while playing (progressive playback)
        console.log('✅ Starting progressive playback')
        startPlayback()
      } else {
        // Wait for metadata at minimum
        console.log('⏳ Waiting for video metadata...')

        const onLoadedMetadata = () => {
          console.log('✅ Metadata loaded, starting playback')
          startPlayback()
        }

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
        video.addEventListener('loadeddata', onLoadedMetadata, { once: true })

        // Timeout: force start
        setTimeout(() => {
          if (video.style.display !== 'block') {
            console.warn('⚠️ Metadata timeout, forcing start')
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('loadeddata', onLoadedMetadata)
            startPlayback()
          }
        }, 500)
      }
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
