/**
 * Audio Player Module
 * 
 * Standalone module that handles all audio playback using Howler.js.
 * This module listens to audio events from the event bus and plays audio accordingly.
 * It is completely decoupled from UI components and game logic.
 */

import { Howl, Howler } from 'howler'
import { ASSETS } from '../config/assets'
import { getAudioVolume } from '../config/audioVolumes'
import { audioEvents, AUDIO_EVENTS } from './audioEventBus'

class AudioPlayer {
  constructor() {
    this.howls = {} // { audioKey: Howl instance }
    this.isInitialized = false
    this.isUnlocked = false
    this.gameSoundEnabled = true
    
    // Background music state
    this.currentMusicAudio = null
    this.currentMusicType = 'normal' // 'normal' or 'jackpot'
    this.isMusicPlaying = false
    this.wasPlayingBeforeHidden = false
    
    // Background noise state
    this.noiseInterval = null
    this.wasNoisePlayingBeforeHidden = false
    
    // Timers
    this.gameStartTimeout = null
    this.noiseStartTimeout = null
    this.isMusicStarting = false
    
    // Winning announcement audio reference
    this.winningAnnouncementAudio = null
    
    // Base volumes
    this.baseVolumes = {
      music: 0.5,
      noise: 0.7,
      gameStart: 0.6
    }

    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Setup page visibility listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  /**
   * Setup event listeners for audio events
   */
  setupEventListeners() {
    // Background music events
    audioEvents.on(AUDIO_EVENTS.MUSIC_START, () => this.startBackgroundMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_STOP, () => this.stopBackgroundMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_PAUSE, () => this.pauseBackgroundMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_RESUME, () => this.resumeBackgroundMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_SWITCH_JACKPOT, () => this.switchToJackpotMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_SWITCH_NORMAL, () => this.switchToNormalMusic())
    audioEvents.on(AUDIO_EVENTS.MUSIC_SET_VOLUME, (data) => this.setMusicVolume(data.volume))

    // Sound effect events
    audioEvents.on(AUDIO_EVENTS.EFFECT_PLAY, (data) => this.playEffect(data.audioKey, data.volume))
    audioEvents.on(AUDIO_EVENTS.EFFECT_WIN, (data) => this.playWinSound(data.wins))
    audioEvents.on(AUDIO_EVENTS.EFFECT_CONSECUTIVE_WIN, (data) => this.playConsecutiveWinSound(data.consecutiveWins, data.isFreeSpin))
    audioEvents.on(AUDIO_EVENTS.EFFECT_WINNING_ANNOUNCEMENT, () => this.playWinningAnnouncement())
    audioEvents.on(AUDIO_EVENTS.EFFECT_WINNING_ANNOUNCEMENT_STOP, () => this.stopWinningAnnouncement())
    audioEvents.on(AUDIO_EVENTS.EFFECT_WINNING_HIGHLIGHT, () => this.playWinningHighlight())

    // Global audio control events
    audioEvents.on(AUDIO_EVENTS.AUDIO_ENABLE, () => this.setGameSoundEnabled(true))
    audioEvents.on(AUDIO_EVENTS.AUDIO_DISABLE, () => this.setGameSoundEnabled(false))
    audioEvents.on(AUDIO_EVENTS.AUDIO_SET_GLOBAL_VOLUME, (data) => this.setGlobalVolume(data.volume))
  }

  /**
   * Handle page visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - track state for recovery
      if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
        this.wasPlayingBeforeHidden = true
      }
      // Stop noise interval to save resources
      if (this.noiseInterval) {
        this.wasNoisePlayingBeforeHidden = true
        clearInterval(this.noiseInterval)
        this.noiseInterval = null
      }
    } else {
      // Page is visible again
      console.log('👁️ Page visible, resuming audio...')
      
      // Resume AudioContext
      this.resumeAudioContext()
      
      // Resume background music if it was playing
      if (this.isMusicPlaying && this.currentMusicAudio) {
        if (this.currentMusicAudio.paused) {
          console.log('🔄 Resuming background music')
          this.currentMusicAudio.play().catch(err => {
            console.warn('⚠️ Resume failed, retrying in 100ms:', err)
            setTimeout(() => {
              if (this.currentMusicAudio) {
                this.currentMusicAudio.play().catch(e => console.error('❌ Resume retry failed:', e))
              }
            }, 100)
          })
        }
        this.wasPlayingBeforeHidden = false
      }
      
      // Resume noise interval
      if (this.wasNoisePlayingBeforeHidden && this.isMusicPlaying) {
        console.log('🔄 Resuming background noises')
        this.startNoiseLoop()
        this.wasNoisePlayingBeforeHidden = false
      }
    }
  }

  /**
   * Resume AudioContext if suspended
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

    // Get audio paths and flatten arrays
    const audioEntries = []
    Object.entries(ASSETS.audioPaths).forEach(([key, value]) => {
      // Skip background_music - load on demand only
      if (key === 'background_music' || key === 'background_music_jackpot') {
        console.log(`⏩ Skipping preload for: ${key}`)
        return
      }

      if (Array.isArray(value)) {
        value.forEach((path, index) => {
          audioEntries.push([`${key}_${index}`, path])
        })
      } else {
        audioEntries.push([key, value])
      }
    })

    // Create Howl instances
    audioEntries.forEach(([key, src]) => {
      try {
        if (!src) {
          console.warn(`No src found for audio: ${key}`)
          return
        }

        const isLongAudio = key.includes('background_music') || key.includes('winning_announcement')

        this.howls[key] = new Howl({
          src: [src],
          preload: true,
          html5: isLongAudio,
          pool: isLongAudio ? 2 : 5,
          onloaderror: (id, err) => {
            console.warn(`Howler load error for ${key}:`, err)
          },
          onplayerror: (id, err) => {
            console.warn(`Howler play error for ${key}:`, err)
          }
        })
      } catch (err) {
        console.error(`Error creating Howl for ${key}:`, err)
      }
    })

    this.isInitialized = true
    console.log(`✅ Howler audio initialized: ${Object.keys(this.howls).length} sounds`)

    Howler.autoUnlock = true
    Howler.html5PoolSize = 10
    console.log('🔧 Howler autoUnlock enabled, pool size: 10')
  }

  /**
   * Load audio on-demand
   */
  loadOnDemand(audioKey) {
    if (this.howls[audioKey]) {
      console.log(`ℹ️ ${audioKey} already loaded`)
      return this.howls[audioKey]
    }

    const src = ASSETS.audioPaths[audioKey]
    if (!src) {
      console.error(`❌ No path found for: ${audioKey}`)
      return null
    }

    console.log(`📥 Loading on-demand: ${audioKey}`)

    try {
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
   * Get a Howl instance
   */
  getHowl(audioKey) {
    let howl = this.howls[audioKey]

    if (!howl && (audioKey === 'background_music' || audioKey === 'background_music_jackpot')) {
      howl = this.loadOnDemand(audioKey)
    }

    if (!howl) {
      console.warn(`Howl not found: ${audioKey}`)
      return null
    }

    return howl
  }

  /**
   * Create an HTMLAudioElement-like wrapper for Howler
   */
  createAudioElement(audioKey) {
    const howl = this.getHowl(audioKey)

    if (!howl) {
      console.warn(`Cannot create audio element for: ${audioKey}`)
      return null
    }

    let soundId = null
    let isPaused = false

    return {
      _howl: howl,
      _volume: 1.0,
      _loop: false,
      _muted: false,

      set volume(val) {
        this._volume = val
        if (soundId !== null) {
          const actualVolume = this._muted ? 0 : val
          howl.volume(actualVolume, soundId)
          howl.volume(actualVolume)
        } else {
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
          const actualVolume = val ? 0 : this._volume
          howl.volume(actualVolume, soundId)
          howl.volume(actualVolume)
        } else {
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
        if (isPaused && soundId !== null) {
          howl.play(soundId)
          isPaused = false
          return Promise.resolve()
        }

        if (soundId !== null) {
          howl.stop(soundId)
        }

        soundId = howl.play()
        
        // Apply loop setting immediately after play
        if (this._loop) {
          howl.loop(true, soundId)
        }
        
        const actualVolume = this._muted ? 0 : this._volume
        howl.volume(actualVolume, soundId)
        howl.volume(actualVolume)
        isPaused = false

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

      _isHowlerWrapper: true
    }
  }

  /**
   * Unlock audio context
   */
  async unlockAudioContext() {
    try {
      console.log('🔓 Unlocking audio...')

      if (!this.isInitialized) {
        console.warn('⚠️ Howler not initialized yet, skipping unlock')
        return
      }

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

      const criticalSounds = ['game_start']
      let unlockedCount = 0

      for (const key of criticalSounds) {
        const howl = this.howls[key]
        if (howl) {
          try {
            const vol = howl.volume()
            howl.volume(0)
            const id = howl.play()
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
   * Set game sound enabled state
   */
  setGameSoundEnabled(enabled) {
    this.gameSoundEnabled = enabled

    // Update background music volume
    if (this.currentMusicAudio) {
      if (enabled) {
        const isHowlerWrapper = this.currentMusicAudio._howl !== undefined

        if (isHowlerWrapper && this.currentMusicAudio.paused === false && this.currentMusicAudio._volume === 0) {
          console.log(`🔊 [AudioPlayer] Audio was created while muted, recreating...`)
          
          const musicType = this.currentMusicType
          
          try {
            this.currentMusicAudio.pause()
          } catch (e) {
            // Ignore
          }
          this.currentMusicAudio = null
          
          const audioKey = musicType === 'jackpot' ? 'background_music_jackpot' : 'background_music'
          const audio = this.createAudioElement(audioKey)
          if (audio) {
            audio.volume = this.baseVolumes.music
            audio.muted = false
            audio.loop = true
            this.currentMusicAudio = audio
            
            console.log(`🔊 [AudioPlayer] Starting recreated audio`)
            audio.play().then(() => {
              console.log(`✅ [AudioPlayer] Recreated audio playing successfully`)
            }).catch(err => {
              console.error('❌ Failed to play recreated audio:', err)
            })
          }
        } else {
          this.currentMusicAudio.volume = this.baseVolumes.music
          this.currentMusicAudio.muted = false
          
          if (this.currentMusicAudio.paused) {
            this.currentMusicAudio.play().then(() => {
              console.log(`✅ [AudioPlayer] Audio playing successfully`)
            }).catch(err => {
              console.error('❌ Failed to play/resume audio:', err)
            })
          }
        }
      } else {
        this.currentMusicAudio.volume = 0
        this.currentMusicAudio.muted = true
        
        if (!this.currentMusicAudio.paused) {
          this.currentMusicAudio.pause()
        }
      }
    }
  }

  /**
   * Set global volume
   */
  setGlobalVolume(volume) {
    Howler.volume(volume)
  }

  // ==================== Background Music Methods ====================

  /**
   * Start background music
   */
  async startBackgroundMusic() {
    console.log('🎵 Starting background music')

    if (this.isMusicPlaying) {
      console.log('ℹ️ Background music already playing')
      return true
    }

    if (this.isMusicStarting) {
      console.log('ℹ️ Background music already starting, ignoring duplicate call')
      return true
    }

    this.isMusicStarting = true

    try {
      if (this.currentMusicAudio) {
        console.log('🛑 Stopping existing audio')
        this.currentMusicAudio.pause()
        this.currentMusicAudio = null
      }

      const audio = this.createAudioElement('background_music')
      if (!audio) {
        console.error('❌ Background music not found')
        this.isMusicStarting = false
        return false
      }

      audio.volume = this.gameSoundEnabled ? this.baseVolumes.music : 0
      audio.muted = !this.gameSoundEnabled
      audio.loop = true

      this.currentMusicAudio = audio

      audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e)
        this.isMusicPlaying = false
        this.isMusicStarting = false
      })

      if (this.gameSoundEnabled) {
        const playPromise = audio.play()

        if (playPromise) {
          try {
            await playPromise

            this.isMusicPlaying = true
            this.isMusicStarting = false

            // Play game start sound after 2 seconds
            this.gameStartTimeout = setTimeout(() => {
              this.playGameStartSound()
            }, 2000)

            // Start background noise loop after 10 seconds
            this.noiseStartTimeout = setTimeout(() => {
              this.startNoiseLoop()
            }, 10000)

            return true
          } catch (err) {
            console.error('❌ Failed to play:', err)
            this.isMusicPlaying = false
            this.isMusicStarting = false
            return false
          }
        } else {
          this.isMusicPlaying = true
          this.isMusicStarting = false
          return true
        }
      } else {
        this.isMusicPlaying = true
        this.isMusicStarting = false
        return true
      }
    } catch (err) {
      console.error('❌ Error creating audio:', err)
      this.isMusicPlaying = false
      this.isMusicStarting = false
      return false
    }
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    this.isMusicPlaying = false
    this.isMusicStarting = false
    
    if (this.gameStartTimeout) {
      clearTimeout(this.gameStartTimeout)
      this.gameStartTimeout = null
    }
    
    if (this.noiseStartTimeout) {
      clearTimeout(this.noiseStartTimeout)
      this.noiseStartTimeout = null
    }
    
    this.stopNoiseLoop()
    
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause()
      this.currentMusicAudio = null
    }
  }

  /**
   * Pause background music
   */
  pauseBackgroundMusic() {
    if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
      this.currentMusicAudio.pause()
      console.log('🔇 Background music paused')
    }
    this.stopNoiseLoop()
  }

  /**
   * Resume background music
   */
  resumeBackgroundMusic() {
    if (this.currentMusicAudio && this.isMusicPlaying && this.currentMusicAudio.paused) {
      this.currentMusicAudio.play().catch(err => {
        console.warn('Failed to resume audio:', err)
      })
      console.log('🔊 Background music resumed')
    }
    if (this.isMusicPlaying) {
      this.startNoiseLoop()
    }
  }

  /**
   * Switch to jackpot music
   */
  switchToJackpotMusic() {
    if (this.currentMusicType === 'jackpot') return

    console.log('🎰 Switching to jackpot background music')
    
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause()
      this.currentMusicAudio = null
    }

    try {
      const audio = this.createAudioElement('background_music_jackpot')
      if (!audio) {
        console.warn('Jackpot background music not found')
        return
      }

      // IMPORTANT: Set loop BEFORE setting volume and playing
      audio.loop = true
      audio.volume = this.gameSoundEnabled ? this.baseVolumes.music : 0
      audio.muted = !this.gameSoundEnabled

      this.currentMusicAudio = audio
      this.currentMusicType = 'jackpot'
      this.isMusicPlaying = true

      audio.addEventListener('error', (e) => {
        console.error('Error playing jackpot music:', e)
      })

      if (this.gameSoundEnabled) {
        audio.play().catch(err => {
          console.warn('Failed to play jackpot music:', err)
        })
        console.log('🔁 Jackpot music playing with loop enabled')
      } else {
        console.log('🔇 Jackpot music loaded but not playing (game sound disabled)')
      }
    } catch (err) {
      console.error('Error creating jackpot music:', err)
    }
  }

  /**
   * Switch to normal music
   */
  switchToNormalMusic() {
    if (this.currentMusicType === 'normal') return

    console.log('🎵 Switching back to normal background music')
    
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause()
      this.currentMusicAudio = null
    }

    try {
      const audio = this.createAudioElement('background_music')
      if (!audio) {
        console.warn('Normal background music not found')
        return
      }

      audio.volume = this.gameSoundEnabled ? this.baseVolumes.music : 0
      audio.muted = !this.gameSoundEnabled
      audio.loop = true

      this.currentMusicAudio = audio
      this.currentMusicType = 'normal'
      this.isMusicPlaying = true

      audio.addEventListener('error', (e) => {
        console.error('Error playing normal music:', e)
      })

      if (this.gameSoundEnabled) {
        audio.play().catch(err => {
          console.warn('Failed to play normal music:', err)
        })
      } else {
        console.log('🔇 Normal music loaded but not playing (game sound disabled)')
      }
    } catch (err) {
      console.error('Error creating normal music:', err)
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Play game start sound
   */
  playGameStartSound() {
    try {
      const gameStartAudio = this.createAudioElement('game_start')
      if (!gameStartAudio) {
        console.warn('Game start audio not found')
        return
      }

      gameStartAudio.volume = this.gameSoundEnabled ? this.baseVolumes.gameStart : 0
      gameStartAudio.muted = !this.gameSoundEnabled

      gameStartAudio.addEventListener('error', (e) => {
        console.error('Error playing game start audio:', e)
      })

      gameStartAudio.play().catch(err => {
        console.warn('Failed to play game start audio:', err)
      })
    } catch (err) {
      console.error('Error creating game start audio:', err)
    }
  }

  /**
   * Play random background noise
   */
  playRandomNoise() {
    if (!this.isMusicPlaying || document.hidden) return

    try {
      const noises = ASSETS.audioPaths.background_noises
      if (!noises || noises.length === 0) return

      const randomIndex = Math.floor(Math.random() * noises.length)
      const noiseAudio = this.createAudioElement(`background_noises_${randomIndex}`)
      if (!noiseAudio) {
        console.warn('Background noise not found')
        return
      }

      const shouldMute = !this.gameSoundEnabled || this.currentMusicType === 'jackpot'
      noiseAudio.volume = shouldMute ? 0 : this.baseVolumes.noise
      noiseAudio.muted = shouldMute

      noiseAudio.addEventListener('error', (e) => {
        console.error('Error playing background noise:', e)
      })

      noiseAudio.play().catch(err => {
        console.warn('Failed to play background noise:', err)
      })
    } catch (err) {
      console.error('Error creating background noise audio:', err)
    }
  }

  /**
   * Start noise loop
   */
  startNoiseLoop() {
    if (this.noiseInterval) return
    
    this.playRandomNoise()
    
    this.noiseInterval = setInterval(() => {
      this.playRandomNoise()
    }, 10000)
  }

  /**
   * Stop noise loop
   */
  stopNoiseLoop() {
    if (this.noiseInterval) {
      clearInterval(this.noiseInterval)
      this.noiseInterval = null
    }
  }

  // ==================== Sound Effects Methods ====================

  /**
   * Get volume based on game sound state
   */
  getVolume(baseVolume) {
    return this.gameSoundEnabled ? baseVolume : 0
  }

  /**
   * Play effect
   */
  playEffect(audioKey, customVolume) {
    if (!this.gameSoundEnabled) return

    console.log(`🎵 [Effect] Attempting to play: ${audioKey}`)
    try {
      const audio = this.createAudioElement(audioKey)
      if (!audio) {
        console.warn(`❌ [Effect] Audio "${audioKey}" not found`)
        return
      }

      const baseVolume = customVolume !== undefined ? customVolume : getAudioVolume(audioKey)
      audio.volume = this.getVolume(baseVolume)
      console.log(`🔊 [Effect] Volume set to: ${audio.volume} (base: ${baseVolume}) for ${audioKey}`)

      audio.addEventListener('error', (e) => {
        console.error(`❌ [Effect] Error playing "${audioKey}":`, e)
      })

      audio.play().then(() => {
        console.log(`✅ [Effect] Playing: ${audioKey}`)
      }).catch((err) => {
        console.warn(`⚠️ [Effect] Failed to play "${audioKey}":`, err)
      })
    } catch (err) {
      console.error(`❌ [Effect] Error creating audio for "${audioKey}":`, err)
    }
  }

  /**
   * Play win sound
   */
  playWinSound(wins) {
    if (!wins || wins.length === 0) return
    if (!this.gameSoundEnabled) return

    let audioKey = null

    const boySymbols = ["fa", "zhong", "bai", "bawan"]
    const girlSymbols = ["wusuo", "wutong", "liangsuo", "liangtong"]

    const symbolPriority = [
      "fa", "zhong", "bai", "bawan",
      "wusuo", "wutong", "liangsuo", "liangtong",
    ]

    for (const symbol of symbolPriority) {
      const hasSymbol = wins.some((win) => win.symbol === symbol)
      if (hasSymbol) {
        const symbolAudioMap = {
          fa: "win_fa",
          zhong: "win_zhong",
          bai: "win_bai",
          liangsuo: "win_liangsuo",
          liangtong: "win_liangtong",
          wusuo: "win_wusuo",
          wutong: "win_wutong",
          bawan: "win_bawan",
        }

        if (symbolAudioMap[symbol]) {
          audioKey = symbolAudioMap[symbol]
          break
        }
      }
    }

    if (audioKey) {
      this.playEffect(audioKey)
    }
  }

  /**
   * Play consecutive win sound
   */
  playConsecutiveWinSound(consecutiveWins, isFreeSpin = false) {
    if (!this.gameSoundEnabled) return
    
    let audioKey = null

    if (isFreeSpin) {
      if (consecutiveWins === 1) {
        audioKey = "consecutive_wins_4x"
      } else if (consecutiveWins === 2) {
        audioKey = "consecutive_wins_6x"
      } else if (consecutiveWins >= 3) {
        audioKey = "consecutive_wins_10x"
      }
    } else {
      if (consecutiveWins === 1) {
        audioKey = "consecutive_wins_2x"
      } else if (consecutiveWins === 2) {
        audioKey = "consecutive_wins_3x"
      } else if (consecutiveWins >= 3) {
        audioKey = "consecutive_wins_5x"
      }
    }

    if (!audioKey) return

    this.playEffect(audioKey)
  }

  /**
   * Play winning announcement
   */
  playWinningAnnouncement() {
    if (!this.gameSoundEnabled) return

    this.stopWinningAnnouncement()

    try {
      this.winningAnnouncementAudio = this.createAudioElement("winning_announcement")
      if (!this.winningAnnouncementAudio) {
        console.warn("Winning announcement audio not found")
        return
      }

      this.winningAnnouncementAudio.volume = this.getVolume(getAudioVolume('winning_announcement'))
      this.winningAnnouncementAudio.loop = true

      this.winningAnnouncementAudio.addEventListener("error", (e) => {
        console.error("Error playing winning announcement audio:", e)
      })

      this.winningAnnouncementAudio.play().catch((err) => {
        console.warn("Failed to play winning announcement audio:", err)
      })
    } catch (err) {
      console.error("Error creating winning announcement audio:", err)
    }
  }

  /**
   * Stop winning announcement
   */
  stopWinningAnnouncement() {
    if (this.winningAnnouncementAudio) {
      try {
        this.winningAnnouncementAudio.pause()
        this.winningAnnouncementAudio.currentTime = 0
        this.winningAnnouncementAudio = null
      } catch (err) {
        console.warn("Error stopping winning announcement audio:", err)
      }
    }
  }

  /**
   * Play winning highlight
   */
  playWinningHighlight() {
    if (!this.gameSoundEnabled) return
    
    this.playEffect('winning_highlight')
  }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer()
