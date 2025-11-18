import { ASSETS } from "../config/assets";
import { audioManager } from "./audioManager";
import { howlerAudio } from "./useHowlerAudio";

/**
 * Get preloaded audio using Howler.js for mobile compatibility
 * Falls back to HTMLAudioElement if Howler not initialized
 */
function getAudio(audioKey) {
  // Try Howler first (best for mobile)
  if (howlerAudio.isReady()) {
    const audio = howlerAudio.createAudioElement(audioKey);
    if (audio) {
      console.log(`🔊 [Effect] Using Howler for: ${audioKey}`);
      return audio;
    }
    console.warn(`⚠️ [Effect] Howler ready but audio not found: ${audioKey}`);
  } else {
    console.log(`⚠️ [Effect] Howler not ready for: ${audioKey}`);
  }

  // Fallback: use regular HTMLAudioElement
  const preloadedAudio = ASSETS.loadedAudios?.[audioKey];
  if (preloadedAudio) {
    console.log(`🔊 [Effect] Using preloaded HTMLAudioElement for: ${audioKey}`);
    return preloadedAudio.cloneNode();
  }

  // Last resort: create from path
  const audioPath = ASSETS.audioPaths?.[audioKey];
  if (audioPath) {
    console.log(`🔊 [Effect] Creating new Audio from path for: ${audioKey}`);
    return new Audio(audioPath);
  }

  console.warn(`❌ [Effect] Audio "${audioKey}" not found anywhere`);
  return null;
}

/**
 * Get volume based on game sound state
 * Returns 0 if game sound is disabled, otherwise returns the base volume
 */
function getVolume(baseVolume) {
  return audioManager.isGameSoundEnabled() ? baseVolume : 0;
}

export function useAudioEffects() {
  // Store reference to the winning announcement audio for loop control
  let winningAnnouncementAudio = null;

  // Play winning announcement sound (looped) for win overlay
  const playWinningAnnouncement = () => {
    // Don't play if game sound is disabled
    if (!audioManager.isGameSoundEnabled()) {
      return;
    }

    // Stop any existing announcement first
    stopWinningAnnouncement();

    try {
      winningAnnouncementAudio = getAudio("winning_announcement");
      if (!winningAnnouncementAudio) {
        console.warn("Winning announcement audio not found");
        return;
      }

      winningAnnouncementAudio.volume = getVolume(0.7); // 70% volume
      winningAnnouncementAudio.loop = true; // Loop the audio

      winningAnnouncementAudio.addEventListener("error", (e) => {
        console.error("Error playing winning announcement audio:", e);
      });

      winningAnnouncementAudio.play().catch((err) => {
        console.warn("Failed to play winning announcement audio:", err);
      });
    } catch (err) {
      console.error("Error creating winning announcement audio:", err);
    }
  };

  // Stop winning announcement sound
  const stopWinningAnnouncement = () => {
    if (winningAnnouncementAudio) {
      try {
        winningAnnouncementAudio.pause();
        winningAnnouncementAudio.currentTime = 0; // Reset to beginning
        winningAnnouncementAudio = null;
      } catch (err) {
        console.warn("Error stopping winning announcement audio:", err);
      }
    }
  };

  // Play win sound for specific symbol combinations
  const playWinSound = (wins) => {
    if (!wins || wins.length === 0) return;
    
    // Don't play if game sound is disabled
    if (!audioManager.isGameSoundEnabled()) {
      return;
    }

    // Determine which win sound to play based on symbol type
    // Priority: jackpot > all_boy/all_girl > specific symbol
    let audioKey = null;

    // Check for jackpot (3 of a kind for bonus tile)
    const hasJackpot = wins.some((win) => {
      return win.count >= 3 && ["bonus"].includes(win.symbol);
    });

    // Check for all boy (fa, zhong, bai, bawan)
    const boySymbols = ["fa", "zhong", "bai", "bawan"];
    const allBoy = wins.every((win) => boySymbols.includes(win.symbol));

    // Check for all girl (wusuo, wutong, liangsuo, liangtong)
    const girlSymbols = ["wusuo", "wutong", "liangsuo", "liangtong"];
    const allGirl = wins.every((win) => girlSymbols.includes(win.symbol));

    // Play sound for the highest value symbol
    const symbolPriority = [
      "fa",
      "zhong",
      "bai",
      "bawan",
      "wusuo",
      "wutong",
      "liangsuo",
      "liangtong",
    ];

    for (const symbol of symbolPriority) {
      const hasSymbol = wins.some((win) => win.symbol === symbol);
      if (hasSymbol) {
        // Map symbol to audio key
        const symbolAudioMap = {
          fa: "win_fa",
          zhong: "win_zhong",
          bai: "win_bai",
          liangsuo: "win_liangsuo",
          liangtong: "win_liangtong",
          wusuo: "win_wusuo",
          wutong: "win_wutong",
          bawan: "win_bawan",
        };

        if (symbolAudioMap[symbol]) {
          audioKey = symbolAudioMap[symbol];
          break;
        }
      }
    }

    // Play the selected audio
    if (audioKey) {
      try {
        const audio = getAudio(audioKey);
        if (!audio) {
          console.warn(`Win audio "${audioKey}" not found`);
          return;
        }

        audio.volume = getVolume(0.9); // 90% volume for win sounds

        audio.addEventListener("error", (e) => {
          console.error(`Error playing win audio (${audioKey}):`, e);
        });

        audio.play().catch((err) => {
          console.warn(`Failed to play win audio (${audioKey}):`, err);
        });
      } catch (err) {
        console.error("Error creating win audio:", err);
      }
    }
  };

  // Play consecutive wins sound based on multiplier
  const playConsecutiveWinSound = (consecutiveWins, isFreeSpin = false) => {
    // Don't play if game sound is disabled
    if (!audioManager.isGameSoundEnabled()) {
      return;
    }
    
    let audioKey = null;

    // Map consecutive wins to audio file based on mode
    if (isFreeSpin) {
      // Free spin mode: x2, x4, x6, x10
      if (consecutiveWins === 1) {
        audioKey = "consecutive_wins_4x";
      } else if (consecutiveWins === 2) {
        audioKey = "consecutive_wins_6x";
      } else if (consecutiveWins === 3) {
        audioKey = "consecutive_wins_10x";
      }
    } else {
      // Normal mode: x1, x2, x3, x5
      if (consecutiveWins === 1) {
        audioKey = "consecutive_wins_2x";
      } else if (consecutiveWins === 2) {
        audioKey = "consecutive_wins_3x";
      } else if (consecutiveWins >= 3) {
        audioKey = "consecutive_wins_5x";
      }
    }

    // Don't play sound for first win (consecutiveWins === 1)
    if (!audioKey) return;

    try {
      const audio = getAudio(audioKey);
      if (!audio) {
        console.warn(`Consecutive wins audio "${audioKey}" not found`);
        return;
      }

      audio.volume = getVolume(0.6); // 60% volume for effect sounds

      audio.addEventListener("error", (e) => {
        console.error(`Error playing consecutive wins audio (${audioKey}):`, e);
      });

      audio.play().catch((err) => {
        console.warn(
          `Failed to play consecutive wins audio (${audioKey}):`,
          err
        );
      });
    } catch (err) {
      console.error("Error creating consecutive wins audio:", err);
    }
  };

  const playEffect = (effect) => {
    // Don't play if game sound is disabled
    if (!audioManager.isGameSoundEnabled()) {
      return;
    }
    
    console.log(`🎵 [Effect] Attempting to play: ${effect}`);
    try {
      const audio = getAudio(effect);
      if (!audio) {
        console.warn(`❌ [Effect] Audio "${effect}" not found`);
        return;
      }

      // Set volume based on effect type
      // Reel spin sounds need to be louder (90% volume)
      let baseVolume = 0.6; // Default 60% for most effects
      if (effect === 'reel_spin' || effect === 'reel_spin_stop') {
        baseVolume = 2; // 90% volume for reel spin sounds
      }

      audio.volume = getVolume(baseVolume);
      console.log(`🔊 [Effect] Volume set to: ${audio.volume} (base: ${baseVolume}) for ${effect}`);

      audio.addEventListener("error", (e) => {
        console.error(`❌ [Effect] Error playing "${effect}":`, e);
      });

      audio.play().then(() => {
        console.log(`✅ [Effect] Playing: ${effect}`);
      }).catch((err) => {
        console.warn(`⚠️ [Effect] Failed to play "${effect}":`, err);
      });
    } catch (err) {
      console.error(`❌ [Effect] Error creating audio for "${effect}":`, err);
    }
  };

  // Play winning highlight sound when winning frames appear
  const playWinningHighlight = () => {
    // Don't play if game sound is disabled
    if (!audioManager.isGameSoundEnabled()) {
      return;
    }
    
    try {
      const audio = getAudio("winning_highlight");
      if (!audio) {
        console.warn("Winning highlight audio not found");
        return;
      }

      audio.volume = getVolume(0.5); // 50% volume for subtle highlight sound

      audio.addEventListener("error", (e) => {
        console.error("Error playing winning highlight audio:", e);
      });

      audio.play().catch((err) => {
        console.warn("Failed to play winning highlight audio:", err);
      });
    } catch (err) {
      console.error("Error creating winning highlight audio:", err);
    }
  };

  return {
    playWinSound,
    playConsecutiveWinSound,
    playWinningAnnouncement,
    stopWinningAnnouncement,
    playEffect,
    playWinningHighlight,
  };
}
