/**
 * Video Event Bus
 * 
 * Centralized event bus for video playback events.
 * Decouples video playing logic from UI components.
 * 
 * Usage:
 * - Components/modules emit video events using videoEvents.emit()
 * - Video player module listens to events using videoEvents.on()
 */

class VideoEventBus {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return

    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return

    const callbacks = this.listeners.get(event)
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (err) {
        console.error(`Error in video event listener for "${event}":`, err)
      }
    })
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   * @param {string} [event] - Optional event name
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

// Video event types
export const VIDEO_EVENTS = {
  // Video playback control
  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_STOP: 'video:stop',
  VIDEO_SKIP: 'video:skip',
  VIDEO_PRELOAD: 'video:preload', // Preload video during user interaction
  
  // Video lifecycle events (emitted by player)
  VIDEO_STARTED: 'video:started',
  VIDEO_ENDED: 'video:ended',
  VIDEO_ERROR: 'video:error',
  VIDEO_BUFFERING: 'video:buffering',
  VIDEO_READY: 'video:ready',
  
  // Video configuration
  VIDEO_SET_VOLUME: 'video:set:volume',
  VIDEO_SET_MUTED: 'video:set:muted',
}

// Export singleton instance
export const videoEvents = new VideoEventBus()
