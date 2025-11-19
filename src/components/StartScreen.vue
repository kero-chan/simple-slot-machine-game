<template>
  <div v-if="gameState.showStartScreen.value" class="start-screen">
    <img
      src="../assets/slotMachine/background/background_start_game.jpg"
      alt="Background"
      class="background-image"
    />

    <div class="content">
      <!-- Loading Progress -->
      <div v-if="isLoading" class="loading-container">
        <div class="progress-bar-bg">
          <div
            class="progress-bar-fill"
            :style="{ width: `${loadingPercent}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{
            loadingPercent < 100
              ? "載入資源中"
              : !isHowlerReady
              ? "準備音效系統..."
              : "完成"
          }}
        </div>
      </div>

      <!-- Start Button -->
      <div v-else class="start-button-container">
        <img
          src="../assets/slotMachine/glyphs/glyph_start_button.png"
          alt="Start Button"
          class="start-button"
          :class="{ 'button-loading': isUnlockingAudio }"
          @click="handleStart"
        />

        <!-- Loading Spinner Overlay -->
        <div v-if="isUnlockingAudio" class="loading-spinner">
          <div class="spinner"></div>
          <div class="loading-text">準備中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useGameState } from "../composables/slotMachine/useGameState";
import { audioManager } from "../composables/audioManager";
import { Howler } from "howler";
import { useGameStore } from "../stores/gameStore";
import { useSettingsStore } from "../stores/settingsStore";

const gameState = useGameState();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();

audioManager.setGameSoundEnabled(settingsStore.gameSound);

const backgroundMusic = audioManager.initialize();

const isHowlerReady = ref(false);

const isLoading = computed(() => {
  const progress = gameState.loadingProgress?.value || { loaded: 0, total: 1 };
  const assetsLoaded = progress.loaded >= progress.total;

  // Show loading until both assets are loaded AND Howler is ready
  return !assetsLoaded || !isHowlerReady.value;
});

const loadingPercent = computed(() => {
  const progress = gameState.loadingProgress?.value || { loaded: 0, total: 1 };
  const percent =
    progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
  return Math.floor(percent);
});

const isUnlockingAudio = ref(false);

// Check if audio player is ready
const checkHowlerReady = () => {
  if (audioManager.isAudioReady()) {
    console.log('✅ Audio player is ready - showing Start button');
    isHowlerReady.value = true;
  } else {
    console.log('⏳ Waiting for audio player to be ready...');
    // Keep checking every 100ms until ready
    setTimeout(checkHowlerReady, 100);
  }
};

// Start checking when assets finish loading
const startHowlerCheck = () => {
  const progress = gameState.loadingProgress?.value || { loaded: 0, total: 1 };
  if (progress.loaded >= progress.total && !isHowlerReady.value) {
    checkHowlerReady();
  }
};

// Watch loading progress
watch(() => gameState.loadingProgress?.value, (newProgress) => {
  if (newProgress && newProgress.loaded >= newProgress.total) {
    startHowlerCheck();
  }
}, { immediate: true, deep: true });

// Watch gameSound setting changes and sync with audioManager
watch(() => settingsStore.gameSound, (newValue) => {
  audioManager.setGameSoundEnabled(newValue);
});

const handleStart = async () => {
  if (isUnlockingAudio.value) {
    console.warn('⚠️ Start button already processing, ignoring click');
    return;
  }

  console.log('🎮 Start button clicked (Audio ready: ' + audioManager.isAudioReady() + ')');
  isUnlockingAudio.value = true;

  // Timeout protection: force unlock after 3 seconds
  const unlockTimeout = setTimeout(() => {
    if (isUnlockingAudio.value) {
      console.warn('⚠️ Audio unlock timeout - forcing game start');

      // Force start game even if unlock failed
      audioManager.setGameSoundEnabled(settingsStore.gameSound);
      backgroundMusic.start();
      gameStore.hideStartScreen();
    }
  }, 3000);

  try {
    // Step 1: Unlock AudioContext (required for mobile browsers)
    console.log('🔓 Step 1: Starting audio unlock...');
    await audioManager.unlockAudioContext();
    console.log('✅ Step 1 complete: Audio unlock finished');

    // Step 2: Verify AudioContext is running
    const ctx = Howler.ctx;
    if (ctx) {
      console.log(`📊 AudioContext state after unlock: ${ctx.state}`);
      if (ctx.state === 'suspended') {
        console.warn('⚠️ AudioContext still suspended, trying to resume again...');
        await ctx.resume();
        console.log(`📊 AudioContext state after retry: ${ctx.state}`);
      }
    } else {
      console.warn('⚠️ No AudioContext found');
    }

    // Step 3: Additional delay to ensure everything is settled
    console.log('⏳ Step 2: Waiting for audio to settle...');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear timeout since we succeeded
    clearTimeout(unlockTimeout);

    // Step 4: Set audio state
    console.log('🔊 Step 3: Setting game sound enabled...');
    audioManager.setGameSoundEnabled(settingsStore.gameSound);

    // Step 5: Start background music with retry
    console.log('🎵 Step 4: Starting background music...');
    let musicStarted = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await backgroundMusic.start();

        if (result) {
          console.log(`✅ Background music start attempt ${attempt} succeeded`);
          musicStarted = true;
          break;
        } else {
          console.warn(`⚠️ Background music start attempt ${attempt} returned false`);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (err) {
        console.warn(`⚠️ Background music start attempt ${attempt} failed:`, err);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    if (!musicStarted) {
      console.error('❌ All background music start attempts failed - continuing anyway');
    }

    // Step 6: Hide start screen
    console.log('🎮 Step 5: Hiding start screen...');
    gameStore.hideStartScreen();

    console.log('✅ Game start complete');
  } catch (error) {
    console.error('❌ Failed to start game:', error);

    // Clear timeout
    clearTimeout(unlockTimeout);

    // Force start game anyway
    console.log('🔄 Force starting game despite error...');
    audioManager.setGameSoundEnabled(settingsStore.gameSound);

    // Try to start music anyway
    try {
      await backgroundMusic.start();
    } catch (musicErr) {
      console.error('❌ Background music also failed:', musicErr);
    }

    gameStore.hideStartScreen();
  }
};
</script>

<style scoped>
.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999999;
  overflow: hidden;
}

/* Ensure 16:9 aspect ratio is maintained */
@media (min-aspect-ratio: 9/16) {
  .start-screen {
    width: auto;
    height: 100vh;
  }
}

@media (max-aspect-ratio: 9/16) {
  .start-screen {
    width: 100vw;
    height: auto;
  }
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Loading Section */
.loading-container {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 60%;
  max-width: 500px;
}

.progress-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.progress-bar-bg {
  width: 100%;
  height: 16px;
  background: linear-gradient(
    180deg,
    rgba(80, 40, 40, 0.6),
    rgba(40, 20, 20, 0.8)
  );
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    #ff6b4a 0%,
    #ff8c5a 25%,
    #ffaa6a 50%,
    #ff8c5a 75%,
    #ff6b4a 100%
  );
  background-size: 200% 100%;
  border-radius: 20px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(255, 107, 74, 0.6), 0 0 40px rgba(255, 107, 74, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  animation: shimmer 2s infinite linear;
}

.progress-bar-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 20px 20px 0 0;
}

.progress-bar-fill::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 60%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: shine 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes shine {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

/* Start Button */
.start-button-container {
  position: absolute;
  left: 50%;
  bottom: 20%;
  transform: translateX(-50%);
  width: 35%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.start-button {
  cursor: pointer;
  width: 100%;
  height: auto;
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.start-button:hover:not(.button-loading) {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.start-button:active:not(.button-loading) {
  transform: scale(0.98);
  filter: brightness(0.95);
}

.start-button.button-loading {
  opacity: 0.6;
  cursor: wait;
  pointer-events: none;
}

/* Loading Spinner */
.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 10;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #ff6b4a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 0 12px rgba(255, 107, 74, 0.3);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
