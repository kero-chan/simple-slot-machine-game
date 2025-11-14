import { useBackgroundMusic } from './useBackgroundMusic'

/**
 * Global audio manager singleton
 * Provides centralized access to background music controls
 */
class AudioManager {
  constructor() {
    this.backgroundMusic = null
    this.gameSoundEnabled = true // Track game sound state
  }

  initialize() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = useBackgroundMusic()
      // Sync the initial gameSound state with the background music instance
      this.backgroundMusic.setGameSoundEnabled(this.gameSoundEnabled)
    }
    return this.backgroundMusic
  }

  // Set game sound enabled state
  setGameSoundEnabled(enabled) {
    this.gameSoundEnabled = enabled
    
    // Update volume for background music
    if (this.backgroundMusic) {
      this.backgroundMusic.setGameSoundEnabled(enabled)
    }
  }

  // Get current game sound state
  isGameSoundEnabled() {
    return this.gameSoundEnabled
  }

  getInstance() {
    return this.backgroundMusic
  }

  // Convenience methods
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
