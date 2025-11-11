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
  const renderer = useRenderer(canvasState, gameState, gridState)
  const gameLogic = useGameLogic(gameState, gridState, renderer.render, renderer.showWinOverlay)

  // Wire Pixi footer controls to game logic actions
  renderer.setControls({
    spin: () => {
      // Note: Gold tiles are now selected AFTER spin completes in useGameLogic
      gameLogic.spin()
    },
    increaseBet: gameLogic.increaseBet,
    decreaseBet: gameLogic.decreaseBet
  })

  const init = async () => {
    try {
      await nextTick()
      await canvasState.setupCanvas()

      // Load assets
      await loadAllAssets()

      // Initialize renderer
      renderer.init()

      // Start animation
      renderer.startAnimation()
    } catch (err) {
      console.error('SlotMachine init failed:', err)
    }
  }

  const handleResize = async () => {
    await canvasState.setupCanvas()
  }

  const start = () => {
    if (gameState.showStartScreen.value) {
      gameState.showStartScreen.value = false
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
      // Note: Gold tiles are now selected AFTER spin completes in useGameLogic
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
    const canvasEl = canvasState.canvas.value
    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    processClick(x, y)
  }

  const handleCanvasTouch = (e) => {
    const canvasEl = canvasState.canvas.value
    if (!canvasEl) return
    const touch = e.changedTouches[0]
    if (touch) {
      const rect = canvasEl.getBoundingClientRect()
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
    render: renderer.render,
    handleResize,
    handleCanvasClick,
    handleCanvasTouch,
    handleKeydown,
    spin: gameLogic.spin,
    increaseBet: gameLogic.increaseBet,
    decreaseBet: gameLogic.decreaseBet,
    start,
    stopAnimation: renderer.stopAnimation
  }
}
