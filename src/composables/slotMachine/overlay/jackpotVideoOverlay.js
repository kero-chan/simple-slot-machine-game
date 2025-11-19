import { Container } from 'pixi.js'
import { videoEvents, VIDEO_EVENTS } from '../../videoEventBus'
import { useSettingsStore } from '../../../stores/settingsStore'
import { watch } from 'vue'

/**
 * Creates a jackpot video overlay that plays the jackpot.mp4 video
 * Shows immediately after bonus tiles are detected, before the free spins announcement
 * 
 * This now uses the event-driven video architecture
 */
export function createJackpotVideoOverlay() {
  const settingsStore = useSettingsStore()
  const container = new Container()
  container.visible = false
  container.zIndex = 1200 // Above everything else

  let isPlaying = false
  let onCompleteCallback = null
  let gameSoundWatcher = null
  let videoEndedUnsubscribe = null

  /**
   * Show the video overlay
   */
  async function show(canvasWidth, canvasHeight, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('🎬 Starting jackpot video via event system')

    // Set initial volume based on current gameSound setting
    videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_VOLUME, { volume: settingsStore.gameSound })

    // Watch for gameSound changes and update video volume
    if (!gameSoundWatcher) {
      gameSoundWatcher = watch(
        () => settingsStore.gameSound,
        (enabled) => {
          if (isPlaying) {
            videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_VOLUME, { volume: enabled })
          }
        }
      )
    }

    // Listen for video ended event
    videoEndedUnsubscribe = videoEvents.on(VIDEO_EVENTS.VIDEO_ENDED, () => {
      hide()
    })

    // Emit event to play video
    videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, {
      videoKey: 'jackpot',
      skipDelay: 2000 // Allow skip after 2 seconds
    })
  }

  /**
   * Hide the video overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    console.log('🔽 Hiding jackpot video')

    // Stop watching gameSound changes
    if (gameSoundWatcher) {
      gameSoundWatcher()
      gameSoundWatcher = null
    }

    // Unsubscribe from video events
    if (videoEndedUnsubscribe) {
      videoEndedUnsubscribe()
      videoEndedUnsubscribe = null
    }

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
    // Video playback is handled by the video player module
  }

  /**
   * Build/rebuild for canvas resize (not needed for event-driven video)
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
