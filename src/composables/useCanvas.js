import { ref } from 'vue'
import { CONFIG } from '../config/constants'

export function useCanvas(canvasRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const canvasWidth = ref(0)
  const canvasHeight = ref(0)
  const scale = ref(1)
  const reelOffset = ref({ x: 0, y: 0 })

  const buttons = ref({
    spin: { x: 0, y: 0, radius: 50 },
    betPlus: { x: 0, y: 0, width: 60, height: 50 },
    betMinus: { x: 0, y: 0, width: 60, height: 50 }
  })

  const setupCanvas = () => {
    if (!canvasRef.value) return

    canvas.value = canvasRef.value
    ctx.value = canvas.value.getContext('2d')

    const container = canvas.value.parentElement
    const containerWidth = container.clientWidth
    const containerHeight = window.innerHeight

    const maxWidth = Math.min(containerWidth, 600)
    const aspectRatio = CONFIG.canvas.baseHeight / CONFIG.canvas.baseWidth
    const width = maxWidth
    const height = Math.min(width * aspectRatio, containerHeight - 20)

    canvas.value.width = width
    canvas.value.height = height
    canvasWidth.value = width
    canvasHeight.value = height

    scale.value = width / CONFIG.canvas.baseWidth

    // Calculate reel positioning
    const symbolSize = Math.floor(CONFIG.reels.symbolSize * scale.value)
    const spacing = Math.floor(CONFIG.reels.spacing * scale.value)
    const reelAreaWidth = symbolSize * CONFIG.reels.count + spacing * (CONFIG.reels.count - 1)

    reelOffset.value.x = (width - reelAreaWidth) / 2
    reelOffset.value.y = height * 0.25

    // Button positions
    buttons.value.spin.x = width / 2
    buttons.value.spin.y = height - 100 * scale.value
    buttons.value.spin.radius = 50 * scale.value

    buttons.value.betMinus.x = width / 2 - 100 * scale.value
    buttons.value.betMinus.y = height - 200 * scale.value
    buttons.value.betMinus.width = 60 * scale.value
    buttons.value.betMinus.height = 50 * scale.value

    buttons.value.betPlus.x = width / 2 + 40 * scale.value
    buttons.value.betPlus.y = height - 200 * scale.value
    buttons.value.betPlus.width = 60 * scale.value
    buttons.value.betPlus.height = 50 * scale.value
  }

  return {
    canvas,
    ctx,
    canvasWidth,
    canvasHeight,
    scale,
    reelOffset,
    buttons,
    setupCanvas
  }
}
