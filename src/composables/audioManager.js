import { useBackgroundMusic } from './useBackgroundMusic'

/**
 * Global audio manager singleton
 * Provides centralized access to background music controls
 */
class AudioManager {
  constructor() {
    this.backgroundMusic = null
  }

  initialize() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = useBackgroundMusic()
    }
    return this.backgroundMusic
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
