/**
 * Audio Event Bus
 * 
 * Centralized event bus for audio events.
 * Decouples audio playing logic from UI components.
 * 
 * Usage:
 * - Components/modules emit audio events using audioEvents.emit()
 * - Audio player module listens to events using audioEvents.on()
 */

class AudioEventBus {
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
        console.error(`Error in audio event listener for "${event}":`, err)
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

// Audio event types
export const AUDIO_EVENTS = {
  // Background music events
  MUSIC_START: 'music:start',
  MUSIC_STOP: 'music:stop',
  MUSIC_PAUSE: 'music:pause',
  MUSIC_RESUME: 'music:resume',
  MUSIC_SWITCH_JACKPOT: 'music:switch:jackpot',
  MUSIC_SWITCH_NORMAL: 'music:switch:normal',
  MUSIC_SET_VOLUME: 'music:set:volume',

  // Sound effect events
  EFFECT_PLAY: 'effect:play',
  EFFECT_WIN: 'effect:win',
  EFFECT_CONSECUTIVE_WIN: 'effect:consecutive:win',
  EFFECT_WINNING_ANNOUNCEMENT: 'effect:winning:announcement',
  EFFECT_WINNING_ANNOUNCEMENT_STOP: 'effect:winning:announcement:stop',
  EFFECT_WINNING_HIGHLIGHT: 'effect:winning:highlight',

  // Global audio control events
  AUDIO_ENABLE: 'audio:enable',
  AUDIO_DISABLE: 'audio:disable',
  AUDIO_SET_GLOBAL_VOLUME: 'audio:set:global:volume',
}

// Export singleton instance
export const audioEvents = new AudioEventBus()
