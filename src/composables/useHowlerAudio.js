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
    console.log('📋 Audio paths available:', Object.keys(ASSETS.audioPaths))

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
    console.log(`📦 Creating Howl instances for ${audioEntries.length} audio files...`)
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
            // Try to unlock audio
            this.howls[key].once('unlock', () => {
              this.howls[key].play()
            })
          },
          onload: () => {
            console.log(`✓ Loaded: ${key}`)
          }
        })
        console.log(`✓ Created Howl: ${key}`)
      } catch (err) {
        console.error(`Error creating Howl for ${key}:`, err)
      }
    })

    this.isInitialized = true
    console.log(`✅ Howler audio initialized: ${Object.keys(this.howls).length} sounds`)
    console.log('🔑 Registered audio keys:', Object.keys(this.howls).join(', '))

    // Enable audio on first user interaction (Howler handles this automatically)
    Howler.autoUnlock = true

    // Add aggressive unlock listeners for mobile
    this.setupUnlockListeners()
  }

  /**
   * Setup listeners to unlock audio on any user interaction
   */
  setupUnlockListeners() {
    const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown']
    const unlockHandler = () => {
      this.unlockAudioContext()
      // Remove listeners after first unlock
      unlockEvents.forEach(event => {
        document.removeEventListener(event, unlockHandler)
      })
    }

    unlockEvents.forEach(event => {
      document.addEventListener(event, unlockHandler, { once: true, passive: true })
    })
    console.log('🔓 Unlock listeners registered for:', unlockEvents.join(', '))
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
      // Unlock Web Audio API context
      const ctx = Howler.ctx
      if (ctx && ctx.state === 'suspended') {
        console.log('🔓 Unlocking Web Audio API AudioContext...')
        await ctx.resume()
        console.log('✅ Web Audio API unlocked, state:', ctx.state)
      } else if (ctx) {
        console.log('✓ Web Audio API already running, state:', ctx.state)
      }

      // Also try to play and immediately pause all HTML5 audio elements to unlock them
      console.log('🔓 Unlocking HTML5 Audio elements...')
      let unlockedCount = 0
      for (const [key, howl] of Object.entries(this.howls)) {
        try {
          // Only unlock HTML5 audio elements
          if (howl._html5) {
            const id = howl.play()
            howl.pause(id)
            howl.seek(0, id)
            unlockedCount++
          }
        } catch (err) {
          // Ignore errors during unlock
        }
      }
      if (unlockedCount > 0) {
        console.log(`✅ Unlocked ${unlockedCount} HTML5 audio elements`)
      }
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
        // Stop previous instance if exists
        if (soundId !== null) {
          howl.stop(soundId)
        }

        // Play new instance
        soundId = howl.play()

        // Apply settings
        howl.volume(this._volume, soundId)
        howl.loop(this._loop, soundId)

        // Return a promise for compatibility
        return Promise.resolve()
      },

      pause() {
        if (soundId !== null) {
          howl.pause(soundId)
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
