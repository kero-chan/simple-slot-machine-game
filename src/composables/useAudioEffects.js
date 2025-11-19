/**
 * Audio Effects Composable
 * 
 * This composable emits audio events instead of directly playing audio.
 * The actual audio playback is handled by the AudioPlayer module.
 */

import { audioEvents, AUDIO_EVENTS } from './audioEventBus'

export function useAudioEffects() {
  // Play winning announcement sound (looped) for win overlay
  const playWinningAnnouncement = () => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_WINNING_ANNOUNCEMENT)
  }

  // Stop winning announcement sound
  const stopWinningAnnouncement = () => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_WINNING_ANNOUNCEMENT_STOP)
  }

  // Play win sound for specific symbol combinations
  const playWinSound = (wins) => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_WIN, { wins })
  }

  // Play consecutive wins sound based on multiplier
  const playConsecutiveWinSound = (consecutiveWins, isFreeSpin = false) => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_CONSECUTIVE_WIN, { consecutiveWins, isFreeSpin })
  }

  // Play generic effect sound
  const playEffect = (effect) => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_PLAY, { audioKey: effect })
  }

  // Play winning highlight sound when winning frames appear
  const playWinningHighlight = () => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_WINNING_HIGHLIGHT)
  }

  return {
    playWinSound,
    playConsecutiveWinSound,
    playWinningAnnouncement,
    stopWinningAnnouncement,
    playEffect,
    playWinningHighlight,
  }
}
