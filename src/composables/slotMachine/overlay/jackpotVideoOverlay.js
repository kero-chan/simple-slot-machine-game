import { Container } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { audioManager } from '../../audioManager'
import { howlerAudio } from '../../useHowlerAudio'
import { watch } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

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
  let player = null // Video.js player instance
  let canSkip = false // Flag to allow skipping after 2 seconds
  let skipEnableTimeout = null
  let gameSoundWatcher = null // Store watcher to cleanup later
  let currentVideoSrc = null // Track current video source

  /**
   * Update video volume based on gameSound state
   */
  function updateVideoVolume() {
    if (player && player.readyState() >= 1) {
      // Video.js API for volume control
      const volume = settingsStore.gameSound ? 1.0 : 0
      player.volume(volume)
      player.muted(volume === 0)
      console.log(`🔊 Video.js volume set to: ${volume}`)
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
   * Create a Video.js player optimized for mobile MP4 playback
   */
  function createVideoElement() {
    const videoSrc = ASSETS.videoPaths?.jackpot

    if (!videoSrc) {
      console.error('❌ Jackpot video source not found')
      return null
    }

    console.log('📹 Creating Video.js player:', videoSrc)

    // Create video element
    const video = document.createElement('video')
    video.className = 'video-js vjs-default-skin'
    video.playsInline = true

    document.body.appendChild(video)

    // Initialize Video.js with mobile-optimized settings
    const vjsPlayer = videojs(video, {
      autoplay: 'muted', // Mobile-friendly autoplay
      preload: 'auto',
      controls: false, // No controls overlay
      fluid: false,
      responsive: true,
      playsinline: true,
      muted: true,
      sources: [{
        src: videoSrc,
        type: 'video/mp4'
      }],
      html5: {
        vhs: {
          withCredentials: false
        },
        nativeVideoTracks: true,
        nativeAudioTracks: true,
        nativeTextTracks: true
      }
    })

    // Apply fullscreen styling to the Video.js wrapper element
    const vjsElement = vjsPlayer.el()
    vjsElement.style.position = 'fixed'
    vjsElement.style.top = '0'
    vjsElement.style.left = '0'
    vjsElement.style.width = '100%'
    vjsElement.style.height = '100%'
    vjsElement.style.zIndex = '9999'
    vjsElement.style.backgroundColor = 'black'
    vjsElement.style.display = 'none'
    vjsElement.style.cursor = 'pointer'
    vjsElement.style.pointerEvents = 'auto' // Ensure clicks work
    vjsElement.style.touchAction = 'manipulation' // Better touch handling

    // Style the inner video element using querySelector
    const videoEl = vjsElement.querySelector('video')
    if (videoEl) {
      videoEl.style.width = '100%'
      videoEl.style.height = '100%'
      videoEl.style.objectFit = 'contain'
      videoEl.style.pointerEvents = 'none' // Let clicks pass through to parent
    }

    // Add CSS to hide Video.js UI components
    const vjsStyle = document.createElement('style')
    vjsStyle.textContent = `
      .video-js .vjs-big-play-button { display: none !important; }
      .video-js .vjs-control-bar { display: none !important; }
      .video-js .vjs-loading-spinner { display: none !important; }
      .video-js .vjs-poster { pointer-events: none !important; }
    `
    document.head.appendChild(vjsStyle)

    // Handle clicks AND touches for skipping (mobile support)
    vjsElement.addEventListener('click', handleVideoClick, { capture: true })
    vjsElement.addEventListener('touchend', handleVideoClick, { capture: true })

    console.log('✅ Click handlers attached to Video.js element')

    console.log('✅ Video.js player created')
    return { video, player: vjsPlayer }
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

    // Clean up old video and player
    if (player) {
      player.dispose()
      player = null
    }
    if (videoElement) {
      videoElement.removeEventListener('click', handleVideoClick)
      if (videoElement.parentNode) {
        videoElement.remove()
      }
      videoElement = null
    }

    // Create new Video.js player
    const result = createVideoElement()
    if (!result) {
      hide()
      return
    }

    videoElement = result.video
    player = result.player

    // Watch for gameSound changes
    if (!gameSoundWatcher) {
      gameSoundWatcher = watch(
        () => settingsStore.gameSound,
        () => {
          if (isPlaying && player) {
            updateVideoVolume()
          }
        }
      )
    }

    // Video.js event listeners
    player.one('ended', () => {
      console.log('✅ Video.js: Video ended')
      hide()
    })

    player.one('error', () => {
      const error = player.error()
      console.error('❌ Video.js error:', error)
      hide()
    })

    // Monitor buffering/loading issues
    player.on('waiting', () => {
      console.warn('⏸️ Video.js: Waiting for data (buffering)...')
    })

    player.on('stalled', () => {
      console.warn('⚠️ Video.js: Stalled (network issue)')
    })

    player.on('suspend', () => {
      console.warn('⏹️ Video.js: Suspended (browser paused loading)')
    })

    player.on('playing', () => {
      console.log('▶️ Video.js: Playing')
    })

    player.on('pause', () => {
      console.log('⏸️ Video.js: Paused')
    })

    // Show video by displaying the Video.js wrapper element
    const vjsElement = player.el()
    vjsElement.style.display = 'block'

    console.log('⏳ Video.js: Waiting for video to buffer...')
    console.log('   Video src:', player.currentSrc())
    console.log('   Initial readyState:', player.readyState())

    // Wait for video to have enough data using Video.js API
    const waitForData = () => {
      return new Promise((resolve, reject) => {
        if (!player) {
          reject(new Error('Player not initialized'))
          return
        }

        if (player.readyState() >= 3) {
          // HAVE_FUTURE_DATA - enough to play
          console.log('✅ Video.js has enough data (readyState: ' + player.readyState() + ')')
          resolve()
        } else {
          console.log('⏳ Video.js waiting for data (readyState: ' + player.readyState() + ')...')

          const onCanPlay = () => {
            if (!player) return
            console.log('✅ Video.js can play (readyState: ' + player.readyState() + ')')
            resolve()
          }

          player.one('canplay', onCanPlay)
          player.one('canplaythrough', onCanPlay)

          // Timeout after 5 seconds
          setTimeout(() => {
            console.warn('⏰ Video.js wait timeout, trying anyway')
            if (player) {
              player.off('canplay', onCanPlay)
              player.off('canplaythrough', onCanPlay)
            }
            resolve()
          }, 5000)
        }
      })
    }

    // Wait then play using Video.js API
    waitForData().then(() => {
      if (!player || !isPlaying) {
        console.warn('⚠️ Player disposed during wait')
        return Promise.reject(new Error('Player disposed'))
      }

      console.log('▶️ Video.js: Playing video')
      console.log('   Final readyState:', player.readyState())

      // Use Video.js play() method which returns a promise
      return player.play()
    }).then(() => {
      if (!player || !isPlaying) {
        console.warn('⚠️ Player disposed during play')
        return
      }

      console.log('✅ Video.js: Playing successfully')
      console.log('   Video duration:', player.duration())
      console.log('   Video currentTime:', player.currentTime())

      // Unmute after playing starts
      setTimeout(() => {
        if (player && isPlaying) {
          console.log('🔊 Video.js: Unmuting video')
          updateVideoVolume()
        }
      }, 200)
    }).catch(err => {
      console.error('❌ Video.js play failed!')
      console.error('   Error:', err.name, err.message)
      if (player) {
        console.error('   ReadyState:', player.readyState())
        const error = player.error()
        if (error) {
          console.error('   Video.js error:', error.code, error.message)
        }
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

    // Clean up Video.js player
    if (player) {
      try {
        // Hide the video element first
        const vjsElement = player.el()
        if (vjsElement) {
          vjsElement.style.display = 'none'
          vjsElement.removeEventListener('click', handleVideoClick, { capture: true })
          vjsElement.removeEventListener('touchend', handleVideoClick, { capture: true })
        }

        // Remove all event listeners
        player.off('ended')
        player.off('error')
        player.off('waiting')
        player.off('stalled')
        player.off('suspend')
        player.off('playing')
        player.off('pause')
        player.off('canplay')
        player.off('canplaythrough')

        // Dispose of the player (cleans up everything)
        player.dispose()
      } catch (err) {
        console.warn('⚠️ Error during player cleanup:', err)
      } finally {
        player = null
      }
    }

    // Video element cleanup is handled by player.dispose()
    videoElement = null

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
