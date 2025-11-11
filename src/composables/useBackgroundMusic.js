import { ref, onBeforeUnmount } from 'vue'
import { ASSETS } from '../config/assets'

export function useBackgroundMusic() {
  const currentAudio = ref(null)
  const audioQueue = ref([])
  const isPlaying = ref(false)
  let isProcessing = false

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Create a new shuffled queue of audio tracks
  const createQueue = () => {
    return shuffleArray([...ASSETS.audioPaths])
  }

  // Play the next track in queue
  const playNext = () => {
    // Prevent recursive calls
    if (isProcessing) return
    isProcessing = true

    // Use setTimeout to break the call stack
    setTimeout(() => {
      if (!isPlaying.value) {
        isProcessing = false
        return
      }

      if (audioQueue.value.length === 0) {
        // Refill queue with shuffled tracks
        audioQueue.value = createQueue()
      }

      const nextTrack = audioQueue.value.shift()
      
      if (currentAudio.value) {
        currentAudio.value.pause()
        currentAudio.value.removeEventListener('ended', handleTrackEnded)
        currentAudio.value.removeEventListener('error', handleTrackError)
        currentAudio.value = null
      }

      try {
        const audio = new Audio(nextTrack)
        audio.volume = 0.3 // Set volume to 30% (adjust as needed)
        audio.preload = 'auto'
        
        currentAudio.value = audio
        
        // When track ends, play the next one
        audio.addEventListener('ended', handleTrackEnded)
        
        // Handle errors
        audio.addEventListener('error', handleTrackError)
        
        audio.play().catch(err => {
          console.warn('Failed to play audio (autoplay may be blocked):', err)
          isProcessing = false
          // Don't try next track immediately, wait for user interaction
        })
        
        isProcessing = false
      } catch (err) {
        console.error('Error creating audio:', err)
        isProcessing = false
      }
    }, 100)
  }

  const handleTrackEnded = () => {
    playNext()
  }

  const handleTrackError = (e) => {
    console.error('Error loading audio track:', e)
    isProcessing = false
    // Try next track after a delay
    setTimeout(() => {
      if (isPlaying.value) {
        playNext()
      }
    }, 1000)
  }

  // Start playing background music
  const start = () => {
    if (isPlaying.value) return
    
    isPlaying.value = true
    // Initialize queue
    audioQueue.value = createQueue()
    playNext()
  }

  // Stop playing background music
  const stop = () => {
    isPlaying.value = false
    isProcessing = false
    
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value.removeEventListener('ended', handleTrackEnded)
      currentAudio.value.removeEventListener('error', handleTrackError)
      currentAudio.value = null
    }
    audioQueue.value = []
  }

  // Set volume (0.0 to 1.0)
  const setVolume = (volume) => {
    if (currentAudio.value) {
      currentAudio.value.volume = Math.max(0, Math.min(1, volume))
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stop()
  })

  return {
    isPlaying,
    start,
    stop,
    setVolume
  }
}
