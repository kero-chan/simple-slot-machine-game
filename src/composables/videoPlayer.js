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
    this.isPlaying = false
    this.canSkip = false
    this.skipEnableTimeout = null
    this.maxDurationTimeout = null
    this.currentVideoKey = null
    this.onCompleteCallback = null
    this.volumeEnabled = true
    this.players = new Map() // Persistent video players, never disposed
    
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
    
    // Check if already exists
    if (this.players.has(videoKey)) {
      console.log(`✅ Video already loaded: ${videoKey}`)
      return
    }

    console.log(`🔄 Preloading video: ${videoKey}`)
    
    try {
      const player = await this.getOrCreatePlayer(videoKey)
      
      // Start playing muted to establish user interaction context
      player.muted(true)
      player.volume(0)
      await player.play()
      
      // Immediately pause after starting (keeps interaction context)
      player.pause()
      player.currentTime(0)
      
      console.log(`✅ Video preloaded successfully: ${videoKey}`)
      videoEvents.emit(VIDEO_EVENTS.VIDEO_READY, { videoKey })
    } catch (err) {
      console.warn(`⚠️ Failed to preload video: ${videoKey}`, err)
    }
  }

  /**
   * Get existing player or create new one (persistent, never disposed)
   */
  async getOrCreatePlayer(videoKey) {
    // Return existing player if available
    if (this.players.has(videoKey)) {
      const playerData = this.players.get(videoKey)
      
      // Verify player is still valid
      if (playerData.player && playerData.videoElement && document.body.contains(playerData.videoElement)) {
        return playerData.player
      }
      
      // Player was corrupted, remove it
      console.warn(`⚠️ Player for ${videoKey} was corrupted, recreating...`)
      this.players.delete(videoKey)
      if (playerData.player) {
        try {
          playerData.player.dispose()
        } catch (err) {
          console.warn('Failed to dispose corrupted player:', err)
        }
      }
    }
    
    // Create new player
    const player = this.createVideoPlayer(videoKey)
    if (!player) {
      throw new Error(`Failed to create player for ${videoKey}`)
    }
    
    const videoElement = player.tech(true).el()
    
    // Store in persistent cache
    this.players.set(videoKey, { player, videoElement })
    
    // Setup event listeners once
    this.setupVideoEventListeners(player)
    
    // Wait for video data
    await this.waitForVideoData(player)
    
    return player
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
    // Start hidden but keep in render tree
    video.style.position = 'fixed'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.zIndex = '-9999' // Hidden in background
    video.style.opacity = '0'
    video.style.visibility = 'hidden'
    video.style.pointerEvents = 'none'
    video.style.cursor = 'pointer'
    video.style.objectFit = 'contain'
    video.style.backgroundColor = 'transparent'
    
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
    // Start hidden in background
    const playerEl = player.el()
    if (playerEl) {
      playerEl.style.zIndex = '-9999' // Hidden in background
      playerEl.style.position = 'fixed'
      playerEl.style.top = '0'
      playerEl.style.left = '0'
      playerEl.style.width = '100%'
      playerEl.style.height = '100%'
      playerEl.style.opacity = '0'
      playerEl.style.visibility = 'hidden'
      playerEl.style.pointerEvents = 'none'
      playerEl.style.backgroundColor = 'transparent'
      
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
   * Show video (bring to foreground)
   */
  showVideo(player) {
    const playerEl = player.el()
    const videoEl = player.tech(true).el()
    
    if (playerEl) {
      playerEl.style.zIndex = '9999'
      playerEl.style.opacity = '1'
      playerEl.style.visibility = 'visible'
      playerEl.style.pointerEvents = 'auto'
    }
    
    if (videoEl) {
      videoEl.style.opacity = '1'
      videoEl.style.visibility = 'visible'
    }
    
    // Force reflow
    if (videoEl) {
      void videoEl.offsetHeight
    }
  }
  
  /**
   * Hide video (send to background)
   */
  hideVideo(player) {
    const playerEl = player.el()
    const videoEl = player.tech(true).el()
    
    if (playerEl) {
      playerEl.style.zIndex = '-9999'
      playerEl.style.opacity = '0'
      playerEl.style.visibility = 'hidden'
      playerEl.style.pointerEvents = 'none'
    }
    
    if (videoEl) {
      videoEl.style.opacity = '0'
      videoEl.style.visibility = 'hidden'
    }
  }

  /**
   * Update video volume
   */
  updateVideoVolume() {
    if (!this.currentVideoKey) return
    
    const playerData = this.players.get(this.currentVideoKey)
    if (!playerData) return
    
    const player = playerData.player
    
    // jackpot_result video is always muted
    if (this.currentVideoKey === 'jackpot_result') {
      player.muted(true)
      player.volume(0)
      console.log(`🔇 Jackpot result video is always muted`)
    } else {
      // Other videos (including jackpot) follow gameSound setting
      player.muted(false)
      player.volume(this.volumeEnabled ? 1.0 : 0)
      console.log(`🔊 Video volume set to: ${player.volume()} (volumeEnabled: ${this.volumeEnabled})`)
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
   * Setup video event listeners (called once per player)
   */
  setupVideoEventListeners(player) {
    const videoElement = player.tech(true).el()
    const playerEl = player.el()
    
    // Add click/touch handlers for skip functionality
    if (videoElement) {
      videoElement.addEventListener('click', this.handleVideoSkip, false)
      videoElement.addEventListener('touchstart', this.handleVideoSkip, { passive: false })
    }
    if (playerEl) {
      playerEl.addEventListener('click', this.handleVideoSkip, false)
      playerEl.addEventListener('touchstart', this.handleVideoSkip, { passive: false })
    }
    
    // Video playback events
    player.on('ended', () => {
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

    try {
      // Get or create player
      const player = await this.getOrCreatePlayer(videoKey)
      
      // Reset to beginning
      player.currentTime(0)
      
      // Show video
      this.showVideo(player)
      
      console.log('▶️ Playing video')
      
      // Play video
      await player.play()
      
      // Wait a bit to ensure play has started
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check if play was successful
      if (player.paused()) {
        console.warn('⚠️ Video still paused after play, retrying...')
        await player.play()
      }
      
      console.log('✅ Video playing successfully')
      videoEvents.emit(VIDEO_EVENTS.VIDEO_STARTED, { videoKey })

      // Unmute after playing starts
      setTimeout(() => {
        if (this.isPlaying && this.currentVideoKey === videoKey) {
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
      console.error('   Stack:', err.stack)
      videoEvents.emit(VIDEO_EVENTS.VIDEO_ERROR, { error: err })
      this.handleVideoEnd()
    }
  }

  /**
   * Pause video
   */
  pause() {
    if (!this.currentVideoKey || !this.isPlaying) return
    
    const playerData = this.players.get(this.currentVideoKey)
    if (playerData) {
      playerData.player.pause()
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
    const videoKey = this.currentVideoKey
    
    this.isPlaying = false
    this.currentVideoKey = null

    console.log('🔽 Ending video playback')

    // Disable skip functionality
    this.disableSkip()

    // Hide player (keep in background, don't dispose)
    if (videoKey) {
      const playerData = this.players.get(videoKey)
      if (playerData) {
        const player = playerData.player
        
        // Pause and reset
        player.pause()
        player.currentTime(0)
        
        // Hide video
        this.hideVideo(player)
        
        console.log(`✅ Video ${videoKey} hidden and reset`)
      }
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
  
  /**
   * Clean up all players (call on app unmount)
   */
  dispose() {
    console.log('🧹 Disposing all video players')
    
    for (const [videoKey, playerData] of this.players.entries()) {
      try {
        playerData.player.dispose()
        console.log(`✅ Disposed player: ${videoKey}`)
      } catch (err) {
        console.warn(`Failed to dispose player ${videoKey}:`, err)
      }
    }
    
    this.players.clear()
  }
}

// Export singleton instance
export const videoPlayer = new VideoPlayer()
