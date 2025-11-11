import { ref } from 'vue'
import { ASSETS } from '../config/assets'

export function useBackgroundMusic() {
  const currentAudio = ref(null)
  const isPlaying = ref(false)
  const wasPlayingBeforeHidden = ref(false)
  let visibilityListenerAdded = false
  let gameStartTimeout = null

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden (user switched tab)
      if (currentAudio.value && !currentAudio.value.paused) {
        wasPlayingBeforeHidden.value = true
        currentAudio.value.pause()
      }
    } else {
      // Page is visible again
      if (wasPlayingBeforeHidden.value && currentAudio.value && isPlaying.value) {
        currentAudio.value.play().catch(err => {
          console.warn('Failed to resume audio:', err)
        })
        wasPlayingBeforeHidden.value = false
      }
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
      audio.volume = 1 // Set volume to 100% (adjust as needed)
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
    } catch (err) {
      console.error('Error creating audio:', err)
    }
  }

  // Play game start sound effect
  const playGameStartSound = () => {
    try {
      const gameStartAudio = new Audio(ASSETS.audioPaths.game_start)
      gameStartAudio.volume = 0.5 // Slightly louder for effect
      
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


  return {
    isPlaying,
    start,
    stop,
    setVolume
  }
}
