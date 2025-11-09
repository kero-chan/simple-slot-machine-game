import { watch, nextTick } from 'vue'
import { useGameState } from './slotMachine/useGameState'
import { useGridState } from './slotMachine/useGridState'
import { useCanvas } from './slotMachine/useCanvas'
import { useRenderer } from './slotMachine/useRenderer'
import { useGameLogic } from './slotMachine/useGameLogic'
import { loadAllAssets } from '../utils/imageLoader'

export function useSlotMachine(canvasRef) {
  const gameState = useGameState()
  const gridState = useGridState()
  const canvasState = useCanvas(canvasRef)
  const { render, startAnimation, stopAnimation } = useRenderer(canvasState, gameState, gridState)
  const gameLogic = useGameLogic(gameState, gridState, render)

  const init = async () => {
    try {
      await nextTick()
      canvasState.setupCanvas()
      render()

      await loadAllAssets()

      // Start animation loop for spin button
      startAnimation()

      // Remove redundant watchers to avoid double render churn
      watch(() => gridState.grid.value, render, { deep: true })
      watch(() => gameState.credits.value, render)
      watch(() => gameState.bet.value, render)
      watch(() => gameState.currentWin.value, render)
      watch(() => gridState.highlightWins.value, render)
    } catch (err) {
      console.error('SlotMachine init failed:', err)
    }
  }

  const handleResize = () => {
    canvasState.setupCanvas()
    render()
  }

  const start = () => {
    if (gameState.showStartScreen.value) {
      gameState.showStartScreen.value = false
      canvasState.setupCanvas()
      render()
    }
  }

  const processClick = (x, y) => {
    if (gameState.showStartScreen.value) {
      const sb = canvasState.buttons.value.start
      const hit = x >= sb.x && x <= sb.x + sb.width &&
                  y >= sb.y && y <= sb.y + sb.height
      if (hit) start()
      return
    }

    // Spin button hit-test using circular geometry from canvasState
    const spin = canvasState.buttons.value.spin
    const dx = x - spin.x
    const dy = y - spin.y
    const insideSpin = dx * dx + dy * dy <= spin.radius * spin.radius
    if (insideSpin) {
      gameLogic.spin()
      return
    }

    const minusBtn = canvasState.buttons.value.betMinus
    if (x >= minusBtn.x && x <= minusBtn.x + minusBtn.width &&
        y >= minusBtn.y && y <= minusBtn.y + minusBtn.height) {
      gameLogic.decreaseBet()
      return
    }

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
      if (gameState.showStartScreen.value) start()
      else gameLogic.spin()
    }
  }

  return {
    gameState,
    gridState,
    canvasState,
    init,
    render,
    handleResize,
    handleCanvasClick,
    handleCanvasTouch,
    handleKeydown,
    spin: gameLogic.spin,
    increaseBet: gameLogic.increaseBet,
    decreaseBet: gameLogic.decreaseBet,
    start,
    stopAnimation
  }
}
