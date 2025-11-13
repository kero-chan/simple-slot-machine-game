import { ASSETS } from "../config/assets";

/**
 * Get preloaded audio or create new one if not preloaded
 * Uses blob URL from preloaded audio to avoid network requests
 */
function getAudio(audioKey) {
  // Try to get preloaded audio
  const preloadedAudio = ASSETS.loadedAudios?.[audioKey];

  if (preloadedAudio) {
    // Clone the preloaded audio element
    // This reuses the same blob URL without making network requests
    const audio = preloadedAudio.cloneNode();
    return audio;
  }

  // Fallback: create from path (shouldn't happen if preload works)
  console.warn(`Audio "${audioKey}" not preloaded, loading from path`);
  const audioPath = ASSETS.audioPaths?.[audioKey];
  if (audioPath) {
    return new Audio(audioPath);
  }

  return null;
}

export function useAudioEffects() {
  // Store reference to the winning announcement audio for loop control
  let winningAnnouncementAudio = null;

  // Play winning announcement sound (looped) for win overlay
  const playWinningAnnouncement = () => {
    // Stop any existing announcement first
    stopWinningAnnouncement();

    try {
      winningAnnouncementAudio = getAudio('winning_announcement');
      if (!winningAnnouncementAudio) {
        console.warn("Winning announcement audio not found");
        return;
      }

      winningAnnouncementAudio.volume = 0.7; // 70% volume
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

    // Determine which win sound to play based on symbol type
    // Priority: jackpot > all_boy/all_girl > specific symbol
    let audioKey = null;

    // Check for jackpot (3 of a kind for bonus tile)
    const hasJackpot = wins.some((win) => {
      return win.count >= 3 && ["bonus"].includes(win.symbol);
    });

    if (hasJackpot) {
      audioKey = "win_megagrand";
    } else {
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
            zhong: "zhong",
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
    }

    // Play the selected audio
    if (audioKey) {
      try {
        const audio = getAudio(audioKey);
        if (!audio) {
          console.warn(`Win audio "${audioKey}" not found`);
          return;
        }

        audio.volume = 0.9; // 90% volume for win sounds

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

      audio.volume = 0.6; // 60% volume for effect sounds

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
    try {
      const audio = getAudio(effect);
      if (!audio) {
        console.warn(`Effect audio "${effect}" not found`);
        return;
      }

      audio.volume = 0.6; // 60% volume for effect sounds

      audio.addEventListener("error", (e) => {
        console.error(`Error playing effect audio (${effect}):`, e);
      });

      audio.play().catch((err) => {
        console.warn(
          `Failed to play effect audio (${effect}):`,
          err
        );
      });
    } catch (err) {
      console.error("Error creating effect audio:", err);
    }
  }

  return {
    playWinSound,
    playConsecutiveWinSound,
    playWinningAnnouncement,
    stopWinningAnnouncement,
    playEffect,
  };
}
