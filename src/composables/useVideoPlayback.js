/**
 * Video Playback Composable
 * 
 * This composable emits video events instead of directly managing video playback.
 * The actual video playback is handled by the VideoPlayer module.
 */

import { videoEvents, VIDEO_EVENTS } from './videoEventBus'

export function useVideoPlayback() {
  /**
   * Play a video
   * @param {string} videoKey - Video key from ASSETS.videoPaths
   * @param {Object} options - { onComplete?: function, skipDelay?: number }
   */
  const playVideo = (videoKey, options = {}) => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, {
      videoKey,
      ...options
    })
  }

  /**
   * Pause current video
   */
  const pauseVideo = () => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_PAUSE)
  }

  /**
   * Stop current video
   */
  const stopVideo = () => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_STOP)
  }

  /**
   * Skip current video (if allowed)
   */
  const skipVideo = () => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_SKIP)
  }

  /**
   * Set video volume enabled state
   */
  const setVideoVolume = (enabled) => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_VOLUME, { volume: enabled })
  }

  /**
   * Set video muted state
   */
  const setVideoMuted = (muted) => {
    videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_MUTED, { muted })
  }

  /**
   * Listen to video lifecycle events
   */
  const onVideoStarted = (callback) => {
    return videoEvents.on(VIDEO_EVENTS.VIDEO_STARTED, callback)
  }

  const onVideoEnded = (callback) => {
    return videoEvents.on(VIDEO_EVENTS.VIDEO_ENDED, callback)
  }

  const onVideoError = (callback) => {
    return videoEvents.on(VIDEO_EVENTS.VIDEO_ERROR, callback)
  }

  const onVideoReady = (callback) => {
    return videoEvents.on(VIDEO_EVENTS.VIDEO_READY, callback)
  }

  const onVideoBuffering = (callback) => {
    return videoEvents.on(VIDEO_EVENTS.VIDEO_BUFFERING, callback)
  }

  return {
    playVideo,
    pauseVideo,
    stopVideo,
    skipVideo,
    setVideoVolume,
    setVideoMuted,
    
    // Event listeners
    onVideoStarted,
    onVideoEnded,
    onVideoError,
    onVideoReady,
    onVideoBuffering
  }
}
