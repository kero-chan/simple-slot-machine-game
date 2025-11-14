import { ref } from 'vue'
import { ASSETS } from '../config/assets'
import { howlerAudio } from './useHowlerAudio'

/**
 * Get preloaded audio using Howler.js for mobile compatibility
 * Falls back to HTMLAudioElement if Howler not initialized
 */
function getAudio(audioKey) {
  // Try Howler first (best for mobile)
  if (howlerAudio.isReady()) {
    console.log(`🔊 Using Howler for: ${audioKey}`)
    const audio = howlerAudio.createAudioElement(audioKey)
    if (audio) {
      return audio
    }
    console.warn(`⚠️ Howler ready but audio not found: ${audioKey}`)
  } else {
    console.log(`⚠️ Howler not ready, using fallback for: ${audioKey}`)
  }

  // Fallback: use regular HTMLAudioElement
  const preloadedAudio = ASSETS.loadedAudios?.[audioKey]
  if (preloadedAudio) {
    console.log(`🔊 Using preloaded HTMLAudioElement for: ${audioKey}`)
    return preloadedAudio.cloneNode()
  }

  // Last resort: create from path
  const audioPath = ASSETS.audioPaths?.[audioKey]
  if (audioPath) {
    console.log(`🔊 Creating new Audio element from path for: ${audioKey}`)
    return new Audio(audioPath)
  }

  console.warn(`❌ Audio "${audioKey}" not found`)
  return null
}

export function useBackgroundMusic() {
  const currentAudio = ref(null)
  const isPlaying = ref(false)
  const wasPlayingBeforeHidden = ref(false)
  const currentMusicType = ref('normal') // 'normal' or 'jackpot'
  const gameSoundEnabled = ref(true) // Track game sound state
  const baseVolume = {
    music: 0.5,        // Base volume for background music
    noise: 0.7,        // Base volume for noise
    gameStart: 0.6     // Base volume for game start sound
  }
  let visibilityListenerAdded = false
  let gameStartTimeout = null
  let noiseStartTimeout = null
  let noiseInterval = null
  const wasNoisePlayingBeforeHidden = ref(false)

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden (user switched tab/locks phone)
      // Don't manually pause music - let browser handle it
      // Just track state for recovery
      if (currentAudio.value && !currentAudio.value.paused) {
        wasPlayingBeforeHidden.value = true
      }
      // Stop noise interval to save resources
      if (noiseInterval) {
        wasNoisePlayingBeforeHidden.value = true
        clearInterval(noiseInterval)
        noiseInterval = null
      }
    } else {
      // Page is visible again - resume everything
      console.log('👁️ Page visible, resuming audio...')

      // Resume background music if it was playing
      if (isPlaying.value && currentAudio.value) {
        // Check if audio is paused (browser might have paused it)
        if (currentAudio.value.paused) {
          console.log('🔄 Resuming background music')
          currentAudio.value.play().catch(err => {
            console.warn('⚠️ Resume failed, retrying in 100ms:', err)
            // Retry after a short delay
            setTimeout(() => {
              if (currentAudio.value) {
                currentAudio.value.play().catch(e => console.error('❌ Resume retry failed:', e))
              }
            }, 100)
          })
        }
        wasPlayingBeforeHidden.value = false
      }

      // Resume noise interval
      if (wasNoisePlayingBeforeHidden.value && isPlaying.value) {
        console.log('🔄 Resuming background noises')
        startNoiseLoop()
        wasNoisePlayingBeforeHidden.value = false
      }
    }
  }

  // Play a random background noise
  const playRandomNoise = () => {
    if (!isPlaying.value || document.hidden) return

    try {
      const noises = ASSETS.audioPaths.background_noises
      if (!noises || noises.length === 0) return

      // Pick a random noise
      const randomIndex = Math.floor(Math.random() * noises.length)

      // Use preloaded audio (indexed as background_noises_0, background_noises_1, etc.)
      const noiseAudio = getAudio(`background_noises_${randomIndex}`)
      if (!noiseAudio) {
        console.warn('Background noise not found')
        return
      }

      noiseAudio.volume = gameSoundEnabled.value ? baseVolume.noise : 0

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

  // Start the noise loop (play random noise every 5 seconds)
  const startNoiseLoop = () => {
    if (noiseInterval) return // Already started
    
    // Play first noise immediately
    playRandomNoise()
    
    // Then play every 5 seconds
    noiseInterval = setInterval(() => {
      playRandomNoise()
    }, 10000) // 10 seconds interval
  }

  // Stop the noise loop
  const stopNoiseLoop = () => {
    if (noiseInterval) {
      clearInterval(noiseInterval)
      noiseInterval = null
    }
  }

  // Start playing background music
  const start = async () => {
    console.log('🎵 Starting background music')

    if (isPlaying.value) {
      console.log('ℹ️ Background music already playing')
      return true
    }

    // Add visibility listener only once
    if (!visibilityListenerAdded) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAdded = true
    }

    try {
      // Stop any existing audio first
      if (currentAudio.value) {
        console.log('🛑 Stopping existing audio')
        currentAudio.value.pause()
        currentAudio.value = null
      }

      // Use preloaded audio
      const audio = getAudio('background_music')
      if (!audio) {
        console.error('❌ Background music not found')
        return false
      }

      // Set playing immediately AFTER we have audio
      isPlaying.value = true

      audio.volume = gameSoundEnabled.value ? baseVolume.music : 0
      audio.loop = true

      currentAudio.value = audio

      // Handle errors
      audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e)
        isPlaying.value = false
      })

      const playPromise = audio.play()

      if (playPromise) {
        try {
          await playPromise
          console.log('✅ Background music playing successfully')

          // Play game start sound after 2 seconds
          gameStartTimeout = setTimeout(() => {
            playGameStartSound()
          }, 2000)

          // Start background noise loop after 10 seconds
          noiseStartTimeout = setTimeout(() => {
            startNoiseLoop()
          }, 10000) // 10 seconds delay

          return true
        } catch (err) {
          console.error('❌ Failed to play:', err)
          isPlaying.value = false
          return false
        }
      } else {
        console.log('ℹ️ No play promise (legacy browser)')
        return true
      }
    } catch (err) {
      console.error('❌ Error creating audio:', err)
      isPlaying.value = false
      return false
    }
  }

  // Play game start sound effect
  const playGameStartSound = () => {
    try {
      // Use preloaded audio
      const gameStartAudio = getAudio('game_start')
      if (!gameStartAudio) {
        console.warn('Game start audio not found')
        return
      }

      gameStartAudio.volume = gameSoundEnabled.value ? baseVolume.gameStart : 0

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

  // Stop playing background music
  const stop = () => {
    isPlaying.value = false
    
    // Clear the game start timeout if it hasn't triggered yet
    if (gameStartTimeout) {
      clearTimeout(gameStartTimeout)
      gameStartTimeout = null
    }
    
    // Clear the noise start timeout if it hasn't triggered yet
    if (noiseStartTimeout) {
      clearTimeout(noiseStartTimeout)
      noiseStartTimeout = null
    }
    
    // Stop noise loop
    stopNoiseLoop()
    
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value = null
    }
  }

  // Set volume (0.0 to 1.0)
  const setVolume = (volume) => {
    if (currentAudio.value) {
      currentAudio.value.volume = Math.max(0, Math.min(1, volume))
    }
  }

  // Pause background music (for video playback)
  const pause = () => {
    if (currentAudio.value && !currentAudio.value.paused) {
      currentAudio.value.pause()
      console.log('🔇 Background music paused')
    }
    // Also stop noise loop
    stopNoiseLoop()
  }

  // Resume background music (after video playback)
  const resume = () => {
    if (currentAudio.value && isPlaying.value && currentAudio.value.paused) {
      currentAudio.value.play().catch(err => {
        console.warn('Failed to resume audio:', err)
      })
      console.log('🔊 Background music resumed')
    }
    // Resume noise loop if it was playing
    if (isPlaying.value) {
      startNoiseLoop()
    }
  }

  // Switch to jackpot background music
  const switchToJackpotMusic = () => {
    if (currentMusicType.value === 'jackpot') return // Already playing jackpot music

    console.log('🎰 Switching to jackpot background music')
    
    // Stop current music
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value = null
    }

    try {
      // Use preloaded jackpot music
      const audio = getAudio('background_music_jackpot')
      if (!audio) {
        console.warn('Jackpot background music not found')
        return
      }

      audio.volume = gameSoundEnabled.value ? baseVolume.music : 0 // Set volume based on game sound state
      audio.loop = true // Loop the audio infinitely

      currentAudio.value = audio
      currentMusicType.value = 'jackpot'
      isPlaying.value = true  // Ensure playing state is set

      // Handle errors
      audio.addEventListener('error', (e) => {
        console.error('Error playing jackpot music:', e)
      })

      audio.play().catch(err => {
        console.warn('Failed to play jackpot music:', err)
      })

      console.log('✅ Jackpot music playing')
    } catch (err) {
      console.error('Error creating jackpot music:', err)
    }
  }

  // Switch back to normal background music
  const switchToNormalMusic = () => {
    if (currentMusicType.value === 'normal') return // Already playing normal music

    console.log('🎵 Switching back to normal background music')
    
    // Stop current music
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value = null
    }

    try {
      // Use preloaded normal music
      const audio = getAudio('background_music')
      if (!audio) {
        console.warn('Normal background music not found')
        return
      }

      audio.volume = gameSoundEnabled.value ? baseVolume.music : 0 // Set volume based on game sound state
      audio.loop = true // Loop the audio infinitely

      currentAudio.value = audio
      currentMusicType.value = 'normal'
      isPlaying.value = true  // Ensure playing state is set

      // Handle errors
      audio.addEventListener('error', (e) => {
        console.error('Error playing normal music:', e)
      })

      audio.play().catch(err => {
        console.warn('Failed to play normal music:', err)
      })

      console.log('✅ Normal music playing')
    } catch (err) {
      console.error('Error creating normal music:', err)
    }
  }

  // Set game sound enabled state
  const setGameSoundEnabled = (enabled) => {
    gameSoundEnabled.value = enabled
    
    // Update volume for current audio
    if (currentAudio.value) {
      currentAudio.value.volume = enabled ? baseVolume.music : 0
    }
  }

  return {
    isPlaying,
    start,
    stop,
    pause,
    resume,
    setVolume,
    switchToJackpotMusic,
    switchToNormalMusic,
    setGameSoundEnabled
  }
}
