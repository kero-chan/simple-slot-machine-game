import { Howl, Howler } from 'howler'
import { ASSETS } from '../config/assets'

/**
 * Howler.js Audio Manager
 *
 * Howler.js automatically handles mobile audio restrictions:
 * - Unlocks audio on first user interaction
 * - Works across all browsers
 * - Handles autoplay policies
 *
 * This is the industry-standard solution for mobile web audio.
 */

class HowlerAudioManager {
  constructor() {
    this.howls = {} // { audioKey: Howl instance }
    this.isInitialized = false
    this.isUnlocked = false // Track if audio has been unlocked

    // Reset unlock state on page visibility change (for reliability)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isUnlocked = false
        }
      })
    }
  }

  /**
   * Initialize all audio as Howl instances
   * Call this after assets are loaded
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Howler audio already initialized')
      return
    }

    if (!ASSETS.audioPaths) {
      console.warn('⚠️ No audio paths found in ASSETS')
      return
    }

    console.log('🔊 Initializing Howler.js audio...')

    // Get audio paths and flatten arrays (like background_noises)
    const audioEntries = []
    Object.entries(ASSETS.audioPaths).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays (e.g., background_noises)
        value.forEach((path, index) => {
          audioEntries.push([`${key}_${index}`, path])
        })
      } else {
        audioEntries.push([key, value])
      }
    })

    // Create Howl instances using original file paths
    audioEntries.forEach(([key, src]) => {
      try {
        if (!src) {
          console.warn(`No src found for audio: ${key}`)
          return
        }

        // Determine if this should use HTML5 Audio (for background music/long sounds)
        // or Web Audio API (for sound effects)
        const isLongAudio = key.includes('background_music') || key.includes('winning_announcement')

        // Create Howl instance
        this.howls[key] = new Howl({
          src: [src],
          preload: true,
          html5: isLongAudio, // Use HTML5 for long sounds, Web Audio for effects
          pool: isLongAudio ? 2 : 5, // Smaller pool for long sounds, larger for effects
          onloaderror: (id, err) => {
            console.warn(`Howler load error for ${key}:`, err)
          },
          onplayerror: (id, err) => {
            console.warn(`Howler play error for ${key}:`, err)
            // Don't auto-play on error - let Howler handle unlock automatically
          }
        })
      } catch (err) {
        console.error(`Error creating Howl for ${key}:`, err)
      }
    })

    this.isInitialized = true
    console.log(`✅ Howler audio initialized: ${Object.keys(this.howls).length} sounds`)

    // Enable Howler's built-in autoUnlock (handles Web Audio API)
    Howler.autoUnlock = true
  }

  /**
   * Get a Howl instance (or create a new one for simultaneous playback)
   */
  getHowl(audioKey) {
    const howl = this.howls[audioKey]

    if (!howl) {
      console.warn(`Howl not found: ${audioKey}`)
      console.warn(`Available Howls:`, Object.keys(this.howls))
      return null
    }

    return howl
  }

  /**
   * Play audio (returns sound ID)
   */
  play(audioKey, volume = 1.0, loop = false) {
    const howl = this.getHowl(audioKey)

    if (!howl) {
      return null
    }

    howl.volume(volume)
    howl.loop(loop)

    return howl.play()
  }

  /**
   * Stop audio
   */
  stop(audioKey, soundId = null) {
    const howl = this.getHowl(audioKey)

    if (!howl) {
      return
    }

    if (soundId !== null) {
      howl.stop(soundId)
    } else {
      howl.stop()
    }
  }

  /**
   * Set global volume
   */
  setVolume(volume) {
    Howler.volume(volume)
  }

  /**
   * Check if Howler is ready
   */
  isReady() {
    return this.isInitialized
  }

  /**
   * Unlock audio context after user gesture (e.g., Start button click)
   * This is required for mobile browsers
   */
  async unlockAudioContext() {
    try {
      console.log('🔓 Attempting to unlock audio...')

      // Always try to unlock, even if already unlocked (for reliability)
      const ctx = Howler.ctx
      if (ctx) {
        console.log(`   AudioContext state: ${ctx.state}`)
        if (ctx.state === 'suspended') {
          await ctx.resume()
          console.log('   ✅ AudioContext resumed')
        } else {
          console.log('   ✓ AudioContext already running')
        }
      } else {
        console.warn('   ⚠️ No AudioContext found')
      }

      // Force unlock by playing a silent sound if not already unlocked
      if (!this.isUnlocked && Object.keys(this.howls).length > 0) {
        const firstKey = Object.keys(this.howls)[0]
        const testHowl = this.howls[firstKey]
        if (testHowl) {
          const vol = testHowl.volume()
          testHowl.volume(0)
          const id = testHowl.play()
          setTimeout(() => {
            testHowl.stop(id)
            testHowl.volume(vol)
          }, 10)
          console.log('   ✅ Silent unlock sound played')
        }
      }

      this.isUnlocked = true
      console.log('✅ Audio unlock complete')
    } catch (err) {
      console.error('❌ Failed to unlock audio:', err)
    }
  }

  /**
   * Create an HTMLAudioElement-like wrapper for Howler
   * This allows existing code to work without changes
   */
  createAudioElement(audioKey) {
    const howl = this.getHowl(audioKey)

    if (!howl) {
      console.warn(`Cannot create audio element for: ${audioKey}`)
      return null
    }

    let soundId = null
    let isPaused = false

    // Return object that mimics HTMLAudioElement API
    return {
      _howl: howl,
      _volume: 1.0,
      _loop: false,

      set volume(val) {
        this._volume = val
        if (soundId !== null) {
          howl.volume(val, soundId)
        }
      },

      get volume() {
        return this._volume
      },

      set loop(val) {
        this._loop = val
        if (soundId !== null) {
          howl.loop(val, soundId)
        }
      },

      get loop() {
        return this._loop
      },

      get paused() {
        return isPaused
      },

      set currentTime(val) {
        if (soundId !== null) {
          howl.seek(val, soundId)
        }
      },

      get currentTime() {
        if (soundId !== null) {
          return howl.seek(soundId) || 0
        }
        return 0
      },

      play() {
        // If paused, resume the existing sound
        if (isPaused && soundId !== null) {
          howl.play(soundId)
          isPaused = false
          return Promise.resolve()
        }

        // Stop previous instance if exists and not paused
        if (soundId !== null) {
          howl.stop(soundId)
        }

        // Play new instance
        soundId = howl.play()

        // Apply settings
        howl.volume(this._volume, soundId)
        howl.loop(this._loop, soundId)

        isPaused = false

        // Return a promise for compatibility
        return Promise.resolve()
      },

      pause() {
        if (soundId !== null) {
          howl.pause(soundId)
          isPaused = true
        }
      },

      addEventListener(event, handler) {
        if (event === 'ended' && soundId !== null) {
          howl.on('end', handler, soundId)
        }
        if (event === 'error' && soundId !== null) {
          howl.on('loaderror', handler, soundId)
          howl.on('playerror', handler, soundId)
        }
      },

      removeEventListener(event, handler) {
        if (soundId !== null) {
          howl.off(event, handler, soundId)
        }
      },

      // Flag to identify this as a Howler wrapper
      _isHowlerWrapper: true
    }
  }
}

// Export singleton
export const howlerAudio = new HowlerAudioManager()
