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

    // Handle page visibility for mobile power management
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Page became visible - resume AudioContext if suspended
          this.resumeAudioContext()
        }
      })
    }
  }

  /**
   * Resume AudioContext if it got suspended (e.g., after tab switch or AFK)
   */
  async resumeAudioContext() {
    const ctx = Howler.ctx
    if (ctx && ctx.state === 'suspended') {
      console.log('🔄 Resuming suspended AudioContext...')
      try {
        await ctx.resume()
        console.log('✅ AudioContext resumed')
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err)
      }
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
      // Skip background_music - load on demand only
      if (key === 'background_music' || key === 'background_music_jackpot') {
        console.log(`⏩ Skipping preload for: ${key}`)
        return
      }

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

    // Enable Howler's built-in autoUnlock (handles Web Audio API automatically)
    Howler.autoUnlock = true
    Howler.html5PoolSize = 10 // Increase HTML5 audio pool to prevent "pool exhausted" errors
    console.log('🔧 Howler autoUnlock enabled, pool size: 10')
  }

  /**
   * Load audio on-demand (for background music that wasn't preloaded)
   */
  loadOnDemand(audioKey) {
    // Check if already loaded
    if (this.howls[audioKey]) {
      console.log(`ℹ️ ${audioKey} already loaded`)
      return this.howls[audioKey]
    }

    // Get path from ASSETS
    const src = ASSETS.audioPaths[audioKey]
    if (!src) {
      console.error(`❌ No path found for: ${audioKey}`)
      return null
    }

    console.log(`📥 Loading on-demand: ${audioKey}`)

    try {
      // Create Howl instance
      const isLongAudio = audioKey.includes('background_music')
      this.howls[audioKey] = new Howl({
        src: [src],
        preload: true,
        html5: isLongAudio,
        pool: 2,
        onloaderror: (id, err) => {
          console.warn(`Howler load error for ${audioKey}:`, err)
        },
        onplayerror: (id, err) => {
          console.warn(`Howler play error for ${audioKey}:`, err)
        }
      })

      console.log(`✅ Loaded on-demand: ${audioKey}`)
      return this.howls[audioKey]
    } catch (err) {
      console.error(`❌ Failed to load ${audioKey}:`, err)
      return null
    }
  }

  /**
   * Get a Howl instance (or create a new one for simultaneous playback)
   */
  getHowl(audioKey) {
    let howl = this.howls[audioKey]

    // If not found, try loading on-demand (for background music)
    if (!howl && (audioKey === 'background_music' || audioKey === 'background_music_jackpot')) {
      howl = this.loadOnDemand(audioKey)
    }

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
      console.log('🔓 Unlocking audio...')

      // Check if Howler is initialized
      if (!this.isInitialized) {
        console.warn('⚠️ Howler not initialized yet, skipping unlock')
        return
      }

      // Step 1: Resume Web Audio API context
      const ctx = Howler.ctx
      if (ctx) {
        console.log(`   📊 AudioContext state: ${ctx.state}`)
        if (ctx.state === 'suspended') {
          await ctx.resume()
          console.log('   ✅ AudioContext resumed')
        } else {
          console.log('   ℹ️ AudioContext already running')
        }
      } else {
        console.warn('   ⚠️ No AudioContext found')
      }

      // Step 2: Unlock only critical sounds that are preloaded
      // Background music is loaded on-demand, so skip it
      const criticalSounds = ['game_start']
      let unlockedCount = 0

      for (const key of criticalSounds) {
        const howl = this.howls[key]
        if (howl) {
          try {
            const vol = howl.volume()
            howl.volume(0)
            const id = howl.play()

            // Wait a tiny bit to ensure playback starts
            await new Promise(resolve => setTimeout(resolve, 10))

            howl.stop(id)
            howl.volume(vol)
            unlockedCount++
          } catch (err) {
            console.warn(`   ⚠️ Failed to unlock ${key}:`, err.message)
          }
        } else {
          console.warn(`   ⚠️ Sound not found: ${key}`)
        }
      }

      console.log(`   ✅ ${unlockedCount}/${criticalSounds.length} critical sounds unlocked`)

      this.isUnlocked = true
      console.log('✅ Audio ready')
    } catch (err) {
      console.error('❌ Failed to unlock audio:', err)
      this.isUnlocked = true
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
      _muted: false,

      set volume(val) {
        this._volume = val
        if (soundId !== null) {
          // Apply volume only if not muted
          const actualVolume = this._muted ? 0 : val
          howl.volume(actualVolume, soundId)
          howl.volume(actualVolume) // Also set global
        } else {
          // Set global volume even if no soundId yet
          const actualVolume = this._muted ? 0 : val
          howl.volume(actualVolume)
        }
      },

      get volume() {
        return this._volume
      },

      set muted(val) {
        this._muted = val
        if (soundId !== null) {
          // If muted, set volume to 0, otherwise use stored volume
          const actualVolume = val ? 0 : this._volume
          howl.volume(actualVolume, soundId)
          howl.volume(actualVolume) // Also set global
        } else {
          // Set global volume even if no soundId yet
          const actualVolume = val ? 0 : this._volume
          howl.volume(actualVolume)
        }
      },

      get muted() {
        return this._muted
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

        // Apply settings (volume respects muted state)
        const actualVolume = this._muted ? 0 : this._volume
        
        // Set volume on both the specific sound AND the global Howl
        howl.volume(actualVolume, soundId)
        howl.volume(actualVolume) // Also set global volume for this Howl
        
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
