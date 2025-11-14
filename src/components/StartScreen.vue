<template>
  <div v-if="gameState.showStartScreen.value" class="start-screen">
    <img
      src="../assets/start_game_bg.jpg"
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
          {{ loadingPercent < 100 ? "載入資源中" : "完成" }}
        </div>
      </div>

      <!-- Start Button -->
      <img
        v-else
        src="../assets/images/start_button.png"
        alt="Start Button"
        class="start-button"
        @click="handleStart"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useGameState } from "../composables/slotMachine/useGameState";
import { audioManager } from "../composables/audioManager";
import { howlerAudio } from "../composables/useHowlerAudio";
import { useGameStore } from "../stores/gameStore";
import { useSettingsStore } from "../stores/settingsStore";

const gameState = useGameState();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();
const backgroundMusic = audioManager.initialize();

const isLoading = computed(() => {
  const progress = gameState.loadingProgress?.value || { loaded: 0, total: 1 };
  return progress.loaded < progress.total;
});

const loadingPercent = computed(() => {
  const progress = gameState.loadingProgress?.value || { loaded: 0, total: 1 };
  const percent =
    progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
  return Math.floor(percent);
});

const handleStart = () => {
  // Unlock AudioContext (required for mobile browsers) - non-blocking
  howlerAudio.unlockAudioContext();

  // Ensure audioManager knows about gameSound state before starting
  audioManager.setGameSoundEnabled(settingsStore.gameSound);
  backgroundMusic.start();
  gameStore.hideStartScreen();
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
.start-button {
  position: absolute;
  left: 50%;
  bottom: 20%;
  transform: translateX(-50%);
  cursor: pointer;
  width: 35%;
  max-width: 300px;
  height: auto;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.start-button:hover {
  transform: translateX(-50%) scale(1.05);
  filter: brightness(1.1);
}

.start-button:active {
  transform: translateX(-50%) scale(0.98);
  filter: brightness(0.95);
}
</style>
