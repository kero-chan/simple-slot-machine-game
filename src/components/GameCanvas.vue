<template>
  <div class="game-container">
    <canvas
      ref="canvasRef"
      @click="handleCanvasClick"
      @touchend.prevent="handleCanvasTouch"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGameState } from '../composables/useGameState'
import { useGridState } from '../composables/useGridState'
import { useCanvas } from '../composables/useCanvas'
import { useRenderer } from '../composables/useRenderer'
import { useGameLogic } from '../composables/useGameLogic'
import { loadAllAssets } from '../utils/imageLoader'

const canvasRef = ref(null)

// Composables
const gameState = useGameState()
const gridState = useGridState()
const canvasState = useCanvas(canvasRef)

// Renderer
const { render } = useRenderer(canvasState, gameState, gridState)

// Game Logic
const gameLogic = useGameLogic(gameState, gridState, render)

// Initialization
const init = async () => {
  await nextTick()
  await loadAllAssets()
  canvasState.setupCanvas()
  render()
}

const handleResize = () => {
  canvasState.setupCanvas()
  render()
}

// Input handlers
const processClick = (x, y) => {
  // Check spin button (circle)
  const spinBtn = canvasState.buttons.value.spin
  const dx = x - spinBtn.x
  const dy = y - spinBtn.y
  if (dx * dx + dy * dy <= spinBtn.radius * spinBtn.radius) {
    gameLogic.spin()
    return
  }

  // Check bet minus button
  const minusBtn = canvasState.buttons.value.betMinus
  if (x >= minusBtn.x && x <= minusBtn.x + minusBtn.width &&
      y >= minusBtn.y && y <= minusBtn.y + minusBtn.height) {
    gameLogic.decreaseBet()
    return
  }

  // Check bet plus button
  const plusBtn = canvasState.buttons.value.betPlus
  if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
      y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
    gameLogic.increaseBet()
    return
  }
}

const handleCanvasClick = (e) => {
  const rect = canvasState.canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  processClick(x, y)
}

const handleCanvasTouch = (e) => {
  const touch = e.changedTouches[0]
  if (touch) {
    const rect = canvasState.canvas.value.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    processClick(x, y)
  }
}

const handleKeydown = (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    gameLogic.spin()
  }
}

// Watchers - trigger re-render when state changes
watch(() => gridState.grid.value, render, { deep: true })
watch(() => gameState.credits.value, render)
watch(() => gameState.bet.value, render)
watch(() => gameState.currentWin.value, render)
watch(() => gameState.freeSpins.value, render)
watch(() => gridState.highlightWins.value, render)

// Lifecycle
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
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('/start_game_bg.jpg') center/cover no-repeat;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100vh;
  touch-action: none;
}
</style>
