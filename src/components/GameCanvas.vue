<template>
  <div class="game-container" :style="containerStyle">
    <canvas ref="canvasRef" @click="handleCanvasClick" @touchend.prevent="handleCanvasTouch"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import bgUrl from '../assets/background.jpg'
import { useSlotMachine } from '../composables/useSlotMachine'

const canvasRef = ref(null)
const {
  init,
  handleResize,
  handleCanvasClick,
  handleCanvasTouch,
  handleKeydown
} = useSlotMachine(canvasRef)

const containerStyle = {
  backgroundImage: `url(${bgUrl})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat'
}

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;   /* center vertically */
  justify-content: center; /* center horizontally */
}

canvas {
  display: block;
  touch-action: none;
}
</style>
