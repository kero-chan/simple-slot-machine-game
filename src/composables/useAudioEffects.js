import { ASSETS } from '../config/assets'

export function useAudioEffects() {
  // Play consecutive wins sound based on multiplier
  const playConsecutiveWinSound = (consecutiveWins) => {
    let audioKey = null
    
    // Map consecutive wins to audio file
    if (consecutiveWins === 2) {
      audioKey = 'consecutive_wins_2x'
    } else if (consecutiveWins === 3) {
      audioKey = 'consecutive_wins_3x'
    } else if (consecutiveWins >= 4) {
      audioKey = 'consecutive_wins_5x'
    }
    
    // Don't play sound for first win (consecutiveWins === 1)
    if (!audioKey) return
    
    try {
      const audio = new Audio(ASSETS.audioPaths[audioKey])
      audio.volume = 0.6 // 60% volume for effect sounds
      
      audio.addEventListener('error', (e) => {
        console.error(`Error loading consecutive wins audio (${audioKey}):`, e)
      })
      
      audio.play().catch(err => {
        console.warn(`Failed to play consecutive wins audio (${audioKey}):`, err)
      })
    } catch (err) {
      console.error('Error creating consecutive wins audio:', err)
    }
  }

  return {
    playConsecutiveWinSound
  }
}
