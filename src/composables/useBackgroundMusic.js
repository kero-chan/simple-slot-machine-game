import { ref, watch } from 'vue'
import { ASSETS } from '../config/assets'
import { useMenuStateStore } from '../stores/menuStateStore'

export function useBackgroundMusic() {
  const menuStore = useMenuStateStore()
  const currentAudio = ref(null)
  const isPlaying = ref(false)
  const wasPlayingBeforeHidden = ref(false)
  let visibilityListenerAdded = false
  let gameStartTimeout = null
  let noiseStartTimeout = null
  let noiseInterval = null
  const wasNoisePlayingBeforeHidden = ref(false)

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden (user switched tab)
      if (currentAudio.value && !currentAudio.value.paused) {
        wasPlayingBeforeHidden.value = true
        currentAudio.value.pause()
      }
      // Stop noise interval when tab is hidden
      if (noiseInterval) {
        wasNoisePlayingBeforeHidden.value = true
        clearInterval(noiseInterval)
        noiseInterval = null
      }
    } else {
      // Page is visible again
      if (wasPlayingBeforeHidden.value && currentAudio.value && isPlaying.value) {
        currentAudio.value.play().catch(err => {
          console.warn('Failed to resume audio:', err)
        })
        wasPlayingBeforeHidden.value = false
      }
      // Resume noise interval when tab is visible again
      if (wasNoisePlayingBeforeHidden.value && isPlaying.value) {
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
      const noiseAudio = new Audio(noises[randomIndex])
      noiseAudio.volume = 0.7 * menuStore.volume // Apply volume from store
      
      noiseAudio.addEventListener('error', (e) => {
        console.error('Error loading background noise:', e)
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
  const start = () => {
    if (isPlaying.value) return
    
    // Add visibility listener only once
    if (!visibilityListenerAdded) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityListenerAdded = true
    }
    
    try {
      const audio = new Audio(ASSETS.audioPaths.background_music)
      audio.volume = menuStore.volume // Use volume from store
      audio.loop = true // Loop the audio infinitely
      audio.preload = 'auto'
      
      currentAudio.value = audio
      
      // Handle errors
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e)
      })
      
      audio.play().catch(err => {
        console.warn('Failed to play audio (autoplay may be blocked):', err)
      })
      
      isPlaying.value = true

      // Play game start sound after 2 seconds
      gameStartTimeout = setTimeout(() => {
        playGameStartSound()
      }, 2000)

      // Start background noise loop after 10 seconds
      noiseStartTimeout = setTimeout(() => {
        startNoiseLoop()
      }, 10000) // 10 seconds delay
    } catch (err) {
      console.error('Error creating audio:', err)
    }
  }

  // Play game start sound effect
  const playGameStartSound = () => {
    try {
      const gameStartAudio = new Audio(ASSETS.audioPaths.game_start)
      gameStartAudio.volume = 0.8 * menuStore.volume // Apply volume from store
      
      gameStartAudio.addEventListener('error', (e) => {
        console.error('Error loading game start audio:', e)
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

  // Watch for volume changes from store
  watch(() => menuStore.volume, (newVolume, oldVolume) => {
    if (!currentAudio.value) return
    
    currentAudio.value.volume = newVolume
    
    // If volume changed from 0 to 1 and music should be playing
    if (oldVolume === 0 && newVolume === 1 && isPlaying.value) {
      const playPromise = currentAudio.value.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.info('Could not resume audio after volume change')
        })
      }
      
      // Restart noise loop if it was stopped
      if (!noiseInterval) {
        startNoiseLoop()
      }
    }
    // If volume changed from 1 to 0, pause the audio
    else if (oldVolume === 1 && newVolume === 0 && isPlaying.value) {
      if (!currentAudio.value.paused) {
        currentAudio.value.pause()
      }
      
      // Stop noise loop
      stopNoiseLoop()
    }
  })


  return {
    isPlaying,
    start,
    stop,
    setVolume
  }
}
