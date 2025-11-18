/**
 * Audio Volume Configuration
 * Centralized volume settings for all game sounds
 * Values are base volumes that will be multiplied by master volume
 */

export const AUDIO_VOLUMES = {
  // ========== EFFECT SOUNDS ==========
  // Reel spin effects
  reel_spin: 2.0,           // 90% - Loud spinning sound
  reel_spin_stop: 0.4,      // 40% - Quieter stop sound
  
  // Game effects
  lot: 0.6,                 // 60% - Default effect volume
  reach_bonus: 0.6,         // 60% - Bonus reached sound
  jackpot_finalize: 0.6,    // 60% - Jackpot completion sound
  
  // ========== WIN SOUNDS ==========
  // Symbol win sounds
  win_fa: 0.9,              // 90% - High value symbol
  win_zhong: 0.9,           // 90% - High value symbol
  win_bai: 0.9,             // 90% - High value symbol
  win_bawan: 0.9,           // 90% - High value symbol
  win_wusuo: 0.9,           // 90% - Medium value symbol
  win_wutong: 0.9,          // 90% - Medium value symbol
  win_liangsuo: 0.9,        // 90% - Low value symbol
  win_liangtong: 0.9,       // 90% - Low value symbol
  
  // ========== CONSECUTIVE WIN SOUNDS ==========
  consecutive_wins_2x: 0.6, // 60% - Multiplier x2
  consecutive_wins_3x: 0.6, // 60% - Multiplier x3
  consecutive_wins_4x: 0.6, // 60% - Multiplier x4
  consecutive_wins_5x: 0.6, // 60% - Multiplier x5
  consecutive_wins_6x: 0.6, // 60% - Multiplier x6
  consecutive_wins_10x: 0.6, // 60% - Multiplier x10
  
  // ========== SPECIAL SOUNDS ==========
  winning_announcement: 0.7, // 70% - Win overlay announcement (looped)
  winning_highlight: 0.5,    // 50% - Subtle winning frame highlight
  
  // ========== DEFAULT ==========
  default: 0.6              // 60% - Default volume for unlisted sounds
}

/**
 * Get volume for a specific audio effect
 * @param {string} audioKey - The audio key/identifier
 * @returns {number} - Base volume (0.0 to 1.0+)
 */
export function getAudioVolume(audioKey) {
  return AUDIO_VOLUMES[audioKey] ?? AUDIO_VOLUMES.default
}
