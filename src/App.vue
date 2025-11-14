<template>
  <div id="app">
    <div class="gameView">
      <StartScreen />
      <div
        ref="canvasRef"
        :style="canvasStyle"
        @click="handleCanvasClick"
        @touchend.prevent="handleCanvasTouch"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useSlotMachine } from "./composables/useSlotMachine";
import { useSettingsStore } from "./stores/settingsStore";
import { audioManager } from "./composables/audioManager";
import StartScreen from "./components/StartScreen.vue";
import bgUrl from "./assets/background.jpg";

const canvasRef = ref(null);
const settingsStore = useSettingsStore();

// Initialize audio manager early and set initial game sound state
audioManager.setGameSoundEnabled(settingsStore.gameSound);

const canvasStyle = {
  display: "block",
  touchAction: "none",
};

const {
  init,
  handleResize,
  handleCanvasClick,
  handleCanvasTouch,
  handleKeydown,
  stopAnimation,
} = useSlotMachine(canvasRef);

// Watch gameSound state from settings store and update audio manager
watch(
  () => settingsStore.gameSound,
  (newValue) => {
    audioManager.setGameSoundEnabled(newValue);
  }
);

onMounted(() => {
  init();
  window.addEventListener("resize", handleResize);
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  stopAnimation();
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url("./assets/background.jpg");
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

#app::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: rgb(255 0 0 / 20%);
  backdrop-filter: blur(5px);
  z-index: 1;
}

.gameView {
  position: relative;
  max-width: 100vw;
  max-height: 100vh;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Ensure 9:16 aspect ratio is maintained */
@media (min-aspect-ratio: 9/16) {
  .gameView {
    width: auto;
    height: 100vh;
  }
}

@media (max-aspect-ratio: 9/16) {
  .gameView {
    width: 100vw;
    height: auto;
  }
}

/* Canvas container - remove id selector and target by ref */
.gameView > div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

/* Canvas element itself */
.gameView canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
