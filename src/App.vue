<template>
  <div id="app">
    <canvas
      ref="canvasRef"
      :style="canvasStyle"
      @click="handleCanvasClick"
      @touchend.prevent="handleCanvasTouch"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSlotMachine } from './composables/useSlotMachine'
import bgUrl from './assets/background.jpg'

const canvasRef = ref(null)

const canvasStyle = {
  display: 'block',
  touchAction: 'none'
}

const {
  init,
  handleResize,
  handleCanvasClick,
  handleCanvasTouch,
  handleKeydown,
  stopAnimation
} = useSlotMachine(canvasRef)

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  stopAnimation()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
})
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('./assets/background.jpg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
</style>
