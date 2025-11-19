/**
 * Background Music Composable
 * 
 * This composable emits audio events for background music control.
 * The actual audio playback is handled by the AudioPlayer module.
 */

import { ref } from 'vue'
import { audioEvents, AUDIO_EVENTS } from './audioEventBus'

export function useBackgroundMusic() {
  const isPlaying = ref(false)

  // Start playing background music
  const start = async () => {
    console.log('🎵 Requesting background music start')
    audioEvents.emit(AUDIO_EVENTS.MUSIC_START)
    isPlaying.value = true
    return true
  }

  // Stop playing background music
  const stop = () => {
    console.log('🛑 Requesting background music stop')
    audioEvents.emit(AUDIO_EVENTS.MUSIC_STOP)
    isPlaying.value = false
  }

  // Set volume (0.0 to 1.0)
  const setVolume = (volume) => {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_SET_VOLUME, { volume })
  }

  // Pause background music (for video playback)
  const pause = () => {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_PAUSE)
  }

  // Resume background music (after video playback)
  const resume = () => {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_RESUME)
  }

  // Switch to jackpot background music
  const switchToJackpotMusic = () => {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_SWITCH_JACKPOT)
  }

  // Switch back to normal background music
  const switchToNormalMusic = () => {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_SWITCH_NORMAL)
  }

  // Set game sound enabled state
  const setGameSoundEnabled = (enabled) => {
    if (enabled) {
      audioEvents.emit(AUDIO_EVENTS.AUDIO_ENABLE)
    } else {
      audioEvents.emit(AUDIO_EVENTS.AUDIO_DISABLE)
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
