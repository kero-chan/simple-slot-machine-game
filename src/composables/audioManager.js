/**
 * Global audio manager singleton
 * 
 * Provides centralized access to background music controls.
 * This manager now acts as a facade and initializes the audio player module.
 */

import { useBackgroundMusic } from './useBackgroundMusic'
import { audioPlayer } from './audioPlayer'
import { audioEvents, AUDIO_EVENTS } from './audioEventBus'

class AudioManager {
  constructor() {
    this.backgroundMusic = null
    this.gameSoundEnabled = true
    this.audioPlayerInitialized = false
  }

  /**
   * Initialize audio system
   * Call this after assets are loaded
   */
  initialize() {
    // Initialize audio player module
    if (!this.audioPlayerInitialized) {
      audioPlayer.initialize()
      this.audioPlayerInitialized = true
    }

    // Initialize background music composable
    if (!this.backgroundMusic) {
      this.backgroundMusic = useBackgroundMusic()
      this.backgroundMusic.setGameSoundEnabled(this.gameSoundEnabled)
    }
    return this.backgroundMusic
  }

  /**
   * Unlock audio context (call after user gesture like Start button click)
   */
  async unlockAudioContext() {
    return audioPlayer.unlockAudioContext()
  }

  /**
   * Set game sound enabled state
   */
  setGameSoundEnabled(enabled) {
    this.gameSoundEnabled = enabled
    
    // Emit event for audio player module
    if (enabled) {
      audioEvents.emit(AUDIO_EVENTS.AUDIO_ENABLE)
    } else {
      audioEvents.emit(AUDIO_EVENTS.AUDIO_DISABLE)
    }
    
    // Update background music if initialized
    if (this.backgroundMusic) {
      this.backgroundMusic.setGameSoundEnabled(enabled)
    }
  }

  /**
   * Get current game sound state
   */
  isGameSoundEnabled() {
    return this.gameSoundEnabled
  }

  /**
   * Check if audio player is ready
   */
  isAudioReady() {
    return this.audioPlayerInitialized
  }

  /**
   * Get background music instance
   */
  getInstance() {
    return this.backgroundMusic
  }

  // Convenience methods for background music control
  pause() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
    }
  }

  resume() {
    if (this.backgroundMusic) {
      this.backgroundMusic.resume()
    }
  }

  start() {
    if (this.backgroundMusic) {
      this.backgroundMusic.start()
    }
  }

  stop() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }
  }

  switchToJackpotMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.switchToJackpotMusic()
    }
  }

  switchToNormalMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.switchToNormalMusic()
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager()
