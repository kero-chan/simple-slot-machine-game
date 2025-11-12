import { ASSETS } from "../config/assets";

export function useAudioEffects() {
  // Store reference to the winning announcement audio for loop control
  let winningAnnouncementAudio = null;

  // Play winning announcement sound (looped) for win overlay
  const playWinningAnnouncement = () => {
    // Stop any existing announcement first
    stopWinningAnnouncement();

    try {
      const audioPath = ASSETS.audioPaths.winning_announcement;
      if (!audioPath) {
        console.warn("Winning announcement audio path not found");
        return;
      }

      winningAnnouncementAudio = new Audio(audioPath);
      winningAnnouncementAudio.volume = 0.7; // 70% volume
      winningAnnouncementAudio.loop = true; // Loop the audio

      winningAnnouncementAudio.addEventListener("error", (e) => {
        console.error("Error loading winning announcement audio:", e);
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

    console.log("[dev] wins for playWinSound:", wins);
    

    // Determine which win sound to play based on symbol type
    // Priority: jackpot > all_boy/all_girl > specific symbol
    let audioKey = null;

    // Check for jackpot (5 of a kind for high value symbols)
    const hasJackpot = wins.some((win) => {
      return win.count === 5 && ["fa", "zhong", "bai"].includes(win.symbol);
    });

    if (hasJackpot) {
      audioKey = "win_jackpot";
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
            bai: "win_bai",
            liangsuo: "win_liangsuo",
            liangtong: "win_liangtong",
            wusuo: "win_wusuo",
            wutong: "win_wutong",
          };

          if (symbolAudioMap[symbol]) {
            audioKey = symbolAudioMap[symbol];
            break;
          }
        }
      }
    }

    // Play the selected audio
    if (audioKey && ASSETS.audioPaths[audioKey]) {
      try {
        const audio = new Audio(ASSETS.audioPaths[audioKey]);
        audio.volume = 0.9; // 90% volume for win sounds

        audio.addEventListener("error", (e) => {
          console.error(`Error loading win audio (${audioKey}):`, e);
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
  const playConsecutiveWinSound = (consecutiveWins) => {
    let audioKey = null;

    // Map consecutive wins to audio file
    if (consecutiveWins === 1) {
      audioKey = "consecutive_wins_2x";
    } else if (consecutiveWins === 2) {
      audioKey = "consecutive_wins_3x";
    } else if (consecutiveWins >= 3) {
      audioKey = "consecutive_wins_5x";
    }

    // Don't play sound for first win (consecutiveWins === 1)
    if (!audioKey) return;

    try {
      const audio = new Audio(ASSETS.audioPaths[audioKey]);
      audio.volume = 0.6; // 60% volume for effect sounds

      audio.addEventListener("error", (e) => {
        console.error(`Error loading consecutive wins audio (${audioKey}):`, e);
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

  return {
    playWinSound,
    playConsecutiveWinSound,
    playWinningAnnouncement,
    stopWinningAnnouncement,
  };
}
