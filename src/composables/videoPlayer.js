/**
 * Video Player Module
 * 
 * Standalone module that handles all video playback using Video.js library.
 * This module listens to video events from the event bus and plays videos accordingly.
 * It is completely decoupled from UI components and game logic.
 */

import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import '../assets/videoPlayer.css'
import { ASSETS } from '../config/assets'
import { videoEvents, VIDEO_EVENTS } from './videoEventBus'
import { audioEvents, AUDIO_EVENTS } from './audioEventBus'

class VideoPlayer {
  constructor() {
    this.player = null
    this.videoElement = null
    this.isPlaying = false
    this.canSkip = false
    this.skipEnableTimeout = null
    this.maxDurationTimeout = null
    this.currentVideoKey = null
    this.onCompleteCallback = null
    this.volumeEnabled = true
    this.preloadedPlayers = new Map() // Cache preloaded players
    
    // Bind methods
    this.handleVideoSkip = this.handleVideoSkip.bind(this)
    
    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Setup event listeners for video events
   */
  setupEventListeners() {
    // Video control events
    videoEvents.on(VIDEO_EVENTS.VIDEO_PLAY, (data) => this.play(data))
    videoEvents.on(VIDEO_EVENTS.VIDEO_PAUSE, () => this.pause())
    videoEvents.on(VIDEO_EVENTS.VIDEO_STOP, () => this.stop())
    videoEvents.on(VIDEO_EVENTS.VIDEO_SKIP, () => this.skip())
    
    // Video configuration events
    videoEvents.on(VIDEO_EVENTS.VIDEO_SET_VOLUME, (data) => this.setVolume(data.volume))
    videoEvents.on(VIDEO_EVENTS.VIDEO_SET_MUTED, (data) => this.setMuted(data.muted))
    
    // Preload event to prepare video during user interaction
    videoEvents.on(VIDEO_EVENTS.VIDEO_PRELOAD, (data) => this.preloadVideo(data))
  }

  /**
   * Preload a video during user interaction to maintain context
   * This should be called when user clicks spin button
   */
  async preloadVideo(data) {
    const { videoKey } = data
    
    // Check if already preloaded and still in DOM
    if (this.preloadedPlayers.has(videoKey)) {
      const cached = this.preloadedPlayers.get(videoKey)
      // Verify the video element is still in the DOM
      if (cached.videoElement && document.body.contains(cached.videoElement)) {
        console.log(`✅ Video already preloaded: ${videoKey}`)
        return
      } else {
        // Video element was removed, need to recreate
        console.log(`⚠️ Video was preloaded but element removed, recreating: ${videoKey}`)
        this.preloadedPlayers.delete(videoKey)
        // Clean up the orphaned player
        if (cached.player) {
          try {
            cached.player.dispose()
          } catch (err) {
            console.warn(`Failed to dispose orphaned player: ${videoKey}`, err)
          }
        }
      }
    }

    console.log(`🔄 Preloading video: ${videoKey}`)
    
    const player = this.createVideoPlayer(videoKey)
    if (!player) return

    // Capture the video element immediately after creation to avoid reference issues
    const videoElement = this.videoElement

    try {
      // Load video metadata
      await this.waitForVideoData(player)
      
      // Start playing muted to establish user interaction context
      player.muted(true)
      player.volume(0)
      await player.play()
      
      // Immediately pause after starting (keeps interaction context)
      player.pause()
      
      // Cache the player with its own video element reference
      this.preloadedPlayers.set(videoKey, { player, videoElement })
      
      // Hide the preloaded video - both wrapper and video element
      const playerEl = player.el()
      if (playerEl) {
        playerEl.style.display = 'none'
      }
      
      // Hide the actual video element inside
      const videoEl = player.tech(true).el()
      if (videoEl) {
        videoEl.style.display = 'none'
      }
      
      console.log(`✅ Video preloaded successfully: ${videoKey}`)
      videoEvents.emit(VIDEO_EVENTS.VIDEO_READY, { videoKey })
    } catch (err) {
      console.warn(`⚠️ Failed to preload video: ${videoKey}`, err)
      // Clean up failed preload
      if (player) {
        player.dispose()
      }
    }
  }

  /**
   * Create a Video.js player instance
   */
  createVideoPlayer(videoKey) {
    const videoSrc = ASSETS.videoPaths?.[videoKey]

    if (!videoSrc) {
      console.error(`❌ Video source not found: ${videoKey}`)
      return null
    }

    console.log(`📹 Creating Video.js player: ${videoKey}`)

    // Create video element
    const video = document.createElement('video')
    video.id = `video-player-${Date.now()}`
    video.className = 'video-js vjs-fluid vjs-big-play-centered'
    video.playsInline = true
    video.preload = 'auto'

    // Fullscreen styling with iOS Safari optimization
    video.style.position = 'fixed'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.zIndex = '9999'
    video.style.display = 'none'
    video.style.cursor = 'pointer'
    video.style.objectFit = 'contain'
    video.style.backgroundColor = 'transparent'
    video.style.pointerEvents = 'auto'
    
    // Force hardware acceleration for iOS Safari
    video.style.webkitTransform = 'translateZ(0)'
    video.style.transform = 'translateZ(0)'
    video.style.webkitBackfaceVisibility = 'hidden'
    video.style.backfaceVisibility = 'hidden'

    document.body.appendChild(video)

    // Initialize Video.js player
    const player = videojs(video, {
      controls: false,
      autoplay: false,
      preload: 'auto',
      fluid: false,
      fill: true,
      muted: true,
      techOrder: ['html5'],
      html5: {
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        nativeTextTracks: false,
        hls: {
          overrideNative: true
        }
      }
    })

    // Apply z-index and iOS optimization to Video.js wrapper (created after initialization)
    const playerEl = player.el()
    if (playerEl) {
      playerEl.style.zIndex = '9999'
      playerEl.style.position = 'fixed'
      playerEl.style.top = '0'
      playerEl.style.left = '0'
      playerEl.style.width = '100%'
      playerEl.style.height = '100%'
      playerEl.style.display = 'none'
      playerEl.style.backgroundColor = 'transparent'
      playerEl.style.pointerEvents = 'auto'
      
      // Force hardware acceleration for iOS Safari
      playerEl.style.webkitTransform = 'translateZ(0)'
      playerEl.style.transform = 'translateZ(0)'
      playerEl.style.webkitBackfaceVisibility = 'hidden'
      playerEl.style.backfaceVisibility = 'hidden'
      playerEl.style.willChange = 'transform'
    }

    // Set video source
    player.src({
      src: videoSrc,
      type: this.getVideoType(videoSrc)
    })

    // Add event listeners for both desktop and mobile
    // Using multiple event types to ensure compatibility
    video.addEventListener('click', this.handleVideoSkip, false)
    video.addEventListener('touchstart', this.handleVideoSkip, { passive: false })
    
    // Also add to player wrapper for better coverage
    if (playerEl) {
      playerEl.addEventListener('click', this.handleVideoSkip, false)
      playerEl.addEventListener('touchstart', this.handleVideoSkip, { passive: false })
    }

    this.videoElement = video
    console.log('✅ Video.js player created')
    return player
  }

  /**
   * Get video MIME type from file extension
   */
  getVideoType(videoSrc) {
    if (videoSrc.endsWith('.mp4')) return 'video/mp4'
    if (videoSrc.endsWith('.webm')) return 'video/webm'
    if (videoSrc.endsWith('.ogg')) return 'video/ogg'
    if (videoSrc.endsWith('.m3u8')) return 'application/x-mpegURL'
    return 'video/mp4' // default
  }

  /**
   * Handle click/touch on video to skip (works for both desktop and mobile)
   */
  handleVideoSkip(event) {
    // Prevent default and stop propagation for touch events
    if (event.type === 'touchstart') {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (this.canSkip && this.isPlaying) {
      console.log(`⏭️ Video ${event.type} event - skipping`)
      this.skip()
    } else {
      console.log(`⏸️ Video ${event.type} event but skip not yet enabled`)
    }
  }

  /**
   * Enable skip after delay
   */
  enableSkipAfterDelay(delay = 2000) {
    if (this.skipEnableTimeout) {
      clearTimeout(this.skipEnableTimeout)
    }
    
    this.canSkip = false
    
    this.skipEnableTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.canSkip = true
        console.log('✅ Video can now be skipped by clicking')
      }
    }, delay)
  }

  /**
   * Disable skip
   */
  disableSkip() {
    this.canSkip = false
    
    if (this.skipEnableTimeout) {
      clearTimeout(this.skipEnableTimeout)
      this.skipEnableTimeout = null
    }
    
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout)
      this.maxDurationTimeout = null
    }
  }

  /**
   * Update video volume
   */
  updateVideoVolume() {
    if (this.player) {
      // jackpot_result video is always muted
      if (this.currentVideoKey === 'jackpot_result') {
        this.player.muted(true)
        this.player.volume(0)
        console.log(`🔇 Jackpot result video is always muted`)
      } else {
        // Other videos (including jackpot) follow gameSound setting
        this.player.muted(false)
        this.player.volume(this.volumeEnabled ? 1.0 : 0)
        console.log(`🔊 Video volume set to: ${this.player.volume()} (volumeEnabled: ${this.volumeEnabled})`)
      }
    }
  }

  /**
   * Wait for video to have enough data
   */
  waitForVideoData(player) {
    return new Promise((resolve) => {
      if (player.readyState() >= 3) {
        console.log('✅ Video has enough data (readyState: ' + player.readyState() + ')')
        resolve()
      } else {
        console.log('⏳ Waiting for video data (readyState: ' + player.readyState() + ')...')

        const onCanPlay = () => {
          console.log('✅ Video can play (readyState: ' + player.readyState() + ')')
          videoEvents.emit(VIDEO_EVENTS.VIDEO_READY)
          resolve()
        }

        player.one('canplay', onCanPlay)
        player.one('canplaythrough', onCanPlay)

        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn('⏰ Video wait timeout, trying anyway')
          player.off('canplay', onCanPlay)
          player.off('canplaythrough', onCanPlay)
          resolve()
        }, 5000)
      }
    })
  }

  /**
   * Setup video event listeners
   */
  setupVideoEventListeners(player) {
    player.one('ended', () => {
      console.log('✅ Video ended')
      this.handleVideoEnd()
    })

    player.on('error', () => {
      const error = player.error()
      console.error('❌ Video error:', error)
      videoEvents.emit(VIDEO_EVENTS.VIDEO_ERROR, { error })
      this.handleVideoEnd()
    })

    player.on('waiting', () => {
      console.warn('⏸️ Video waiting for data (buffering)...')
      videoEvents.emit(VIDEO_EVENTS.VIDEO_BUFFERING)
    })

    player.on('stalled', () => {
      console.warn('⚠️ Video stalled (network issue)')
    })

    player.on('playing', () => {
      console.log('▶️ Video resumed playing')
    })

    player.on('pause', () => {
      console.log('⏸️ Video paused')
    })
  }

  /**
   * Play a video
   * @param {Object} data - { videoKey: string, onComplete?: function, skipDelay?: number }
   */
  async play(data) {
    const { videoKey, onComplete, skipDelay = 2000 } = data

    if (this.isPlaying) {
      console.warn('⚠️ Video already playing, stopping current video')
      this.stop()
    }

    this.isPlaying = true
    this.currentVideoKey = videoKey
    this.onCompleteCallback = onComplete

    console.log(`🎬 Starting video: ${videoKey}`)

    // Pause background music
    audioEvents.emit(AUDIO_EVENTS.MUSIC_PAUSE)

    // Check if video is preloaded
    const preloaded = this.preloadedPlayers.get(videoKey)
    
    if (preloaded) {
      console.log(`✅ Using preloaded video: ${videoKey}`)
      
      // Use preloaded player
      this.player = preloaded.player
      this.videoElement = preloaded.videoElement
      
      // Remove from cache
      this.preloadedPlayers.delete(videoKey)
      
      // Setup event listeners
      this.setupVideoEventListeners(this.player)
      
      // Show video - both wrapper and video element
      const playerEl = this.player.el()
      if (playerEl) {
        playerEl.style.display = 'block'
        console.log('✅ Player wrapper display set to block')
      }
      
      // Also show the actual video element inside
      const videoEl = this.player.tech(true).el()
      if (videoEl) {
        videoEl.style.display = 'block'
        console.log('✅ Video element display set to block')
      }
      
      try {
        console.log('▶️ Playing preloaded video')
        
        // Reset to beginning
        this.player.currentTime(0)
        
        // Play video (will work because interaction context is preserved)
        await this.player.play()
        
        console.log('✅ Video playing successfully')
        videoEvents.emit(VIDEO_EVENTS.VIDEO_STARTED, { videoKey })

        // Unmute after playing starts
        setTimeout(() => {
          if (this.player && this.isPlaying) {
            console.log('🔊 Unmuting video')
            this.updateVideoVolume()
          }
        }, 200)

        // Enable skip after delay
        this.enableSkipAfterDelay(skipDelay)
        
        // Set max duration timeout for jackpot_result video (7 seconds)
        if (videoKey === 'jackpot_result') {
          console.log('⏱️ Setting 7-second max duration for jackpot_result video')
          this.maxDurationTimeout = setTimeout(() => {
            if (this.isPlaying && this.currentVideoKey === 'jackpot_result') {
              console.log('⏰ Jackpot result video reached 7-second limit, stopping')
              this.handleVideoEnd()
            }
          }, 7000) // 7 seconds
        }
      } catch (err) {
        console.error('❌ Video play failed!')
        console.error('   Error:', err.name, err.message)
        videoEvents.emit(VIDEO_EVENTS.VIDEO_ERROR, { error: err })
        this.handleVideoEnd()
      }
      
      return
    }

    // Fallback: Create new player if not preloaded
    console.log('⚠️ Video not preloaded, creating new player')
    
    // Clean up old player
    if (this.player) {
      this.player.pause()
      this.player.dispose()
      this.player = null
    }

    // Create new Video.js player
    this.player = this.createVideoPlayer(videoKey)
    if (!this.player) {
      this.handleVideoEnd()
      return
    }

    // Setup event listeners
    this.setupVideoEventListeners(this.player)

    // Show video - both wrapper and video element
    const playerEl = this.player.el()
    if (playerEl) {
      playerEl.style.display = 'block'
    }
    if (this.videoElement) {
      this.videoElement.style.display = 'block'
    }

    console.log('⏳ Waiting for video to buffer...')

    try {
      // Wait for video data
      await this.waitForVideoData(this.player)

      console.log('▶️ Playing video')
      
      // Play video
      await this.player.play()
      
      console.log('✅ Video playing successfully')
      videoEvents.emit(VIDEO_EVENTS.VIDEO_STARTED, { videoKey })

      // Unmute after playing starts
      setTimeout(() => {
        if (this.player && this.isPlaying) {
          console.log('🔊 Unmuting video')
          this.updateVideoVolume()
        }
      }, 200)

      // Enable skip after delay
      this.enableSkipAfterDelay(skipDelay)
      
      // Set max duration timeout for jackpot_result video (7 seconds)
      if (videoKey === 'jackpot_result') {
        console.log('⏱️ Setting 7-second max duration for jackpot_result video')
        this.maxDurationTimeout = setTimeout(() => {
          if (this.isPlaying && this.currentVideoKey === 'jackpot_result') {
            console.log('⏰ Jackpot result video reached 7-second limit, stopping')
            this.handleVideoEnd()
          }
        }, 7000) // 7 seconds
      }
    } catch (err) {
      console.error('❌ Video play failed!')
      console.error('   Error:', err.name, err.message)
      videoEvents.emit(VIDEO_EVENTS.VIDEO_ERROR, { error: err })
      this.handleVideoEnd()
    }
  }

  /**
   * Pause video
   */
  pause() {
    if (this.player && this.isPlaying) {
      this.player.pause()
      console.log('⏸️ Video paused')
    }
  }

  /**
   * Stop video
   */
  stop() {
    this.handleVideoEnd()
  }

  /**
   * Skip video
   */
  skip() {
    if (this.canSkip && this.isPlaying) {
      console.log('⏭️ Skipping video')
      this.handleVideoEnd()
    }
  }

  /**
   * Handle video end (natural or forced)
   */
  handleVideoEnd() {
    this.isPlaying = false
    this.currentVideoKey = null

    console.log('🔽 Ending video playback')

    // Disable skip functionality
    this.disableSkip()

    // Clean up player
    if (this.player) {
      // Clean up player wrapper event listeners first (before disposing)
      const playerEl = this.player.el()
      if (playerEl) {
        playerEl.style.display = 'none'
        playerEl.removeEventListener('click', this.handleVideoSkip)
        playerEl.removeEventListener('touchstart', this.handleVideoSkip)
      }
      this.player.pause()
      this.player.dispose()
      this.player = null
    }

    // Clean up video element
    if (this.videoElement) {
      this.videoElement.removeEventListener('click', this.handleVideoSkip)
      this.videoElement.removeEventListener('touchstart', this.handleVideoSkip)
      this.videoElement.remove()
      this.videoElement = null
    }

    // Resume background music
    audioEvents.emit(AUDIO_EVENTS.MUSIC_RESUME)

    // Emit ended event
    videoEvents.emit(VIDEO_EVENTS.VIDEO_ENDED)

    // Trigger completion callback
    if (this.onCompleteCallback) {
      this.onCompleteCallback()
      this.onCompleteCallback = null
    }
  }

  /**
   * Set volume enabled state
   */
  setVolume(enabled) {
    this.volumeEnabled = enabled
    this.updateVideoVolume()
  }

  /**
   * Set muted state
   */
  setMuted(muted) {
    this.volumeEnabled = !muted
    this.updateVideoVolume()
  }

  /**
   * Check if video is currently playing
   */
  isVideoPlaying() {
    return this.isPlaying
  }
}

// Export singleton instance
export const videoPlayer = new VideoPlayer()
