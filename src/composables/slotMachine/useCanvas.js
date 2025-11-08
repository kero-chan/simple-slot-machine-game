import { ref } from 'vue'
import { CONFIG } from '../../config/constants'
import startBgUrl from '../../assets/start_game_bg.jpg'

export function useCanvas(canvasRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const canvasWidth = ref(0)
  const canvasHeight = ref(0)
  const scale = ref(1)
  const reelOffset = ref({ x: 0, y: 0 })
  const targetAspect = ref(null)

  const buttons = ref({
    spin: { x: 0, y: 0, radius: 50 },
    betPlus: { x: 0, y: 0, width: 60, height: 50 },
    betMinus: { x: 0, y: 0, width: 60, height: 50 },
    start: { x: 0, y: 0, width: 0, height: 0 }
  })

  // Load start image once to get the exact aspect ratio
  const ensureAspectLoaded = () => {
    if (targetAspect.value) return
    const img = new Image()
    img.onload = () => {
      targetAspect.value = img.width / img.height
      if (canvas.value) setupCanvas()
    }
    img.src = startBgUrl
  }

  const setupCanvas = () => {
    if (!canvasRef.value) return

    canvas.value = canvasRef.value
    ctx.value = canvas.value.getContext('2d')

    ensureAspectLoaded()
    const aspect = targetAspect.value ?? (CONFIG.canvas.baseWidth / CONFIG.canvas.baseHeight)

    const vh = window.innerHeight
    const vw = window.innerWidth
    const height = vh
    const width = Math.min(vw, Math.round(height * aspect))

    // Full height, width by aspect
    canvas.value.style.width = `${width}px`
    canvas.value.style.height = `${height}px`
    canvas.value.width = width
    canvas.value.height = height
    canvasWidth.value = width
    canvasHeight.value = height

    const scaleX = width / CONFIG.canvas.baseWidth
    const scaleY = height / CONFIG.canvas.baseHeight
    scale.value = Math.min(scaleX, scaleY)

    // Reel positioning
    const symbolSize = Math.floor(CONFIG.reels.symbolSize * scale.value)
    const spacing = Math.floor(CONFIG.reels.spacing * scale.value)
    const reelAreaWidth = symbolSize * CONFIG.reels.count + spacing * (CONFIG.reels.count - 1)

    reelOffset.value.x = (width - reelAreaWidth) / 2
    reelOffset.value.y = Math.floor(height * 0.25)

    // Button positions
    buttons.value.spin.x = Math.floor(width / 2)
    buttons.value.spin.y = height - Math.floor(100 * scale.value)
    buttons.value.spin.radius = Math.floor(50 * scale.value)

    buttons.value.betMinus.x = Math.floor(width / 2 - 100 * scale.value)
    buttons.value.betMinus.y = height - Math.floor(200 * scale.value)
    buttons.value.betMinus.width = Math.floor(60 * scale.value)
    buttons.value.betMinus.height = Math.floor(50 * scale.value)

    buttons.value.betPlus.x = Math.floor(width / 2 + 40 * scale.value)
    buttons.value.betPlus.y = height - Math.floor(200 * scale.value)
    buttons.value.betPlus.width = Math.floor(60 * scale.value)
    buttons.value.betPlus.height = Math.floor(50 * scale.value)

    // Start screen button placement (bottom center)
    const sbWidth = Math.floor(280 * scale.value)
    const sbHeight = Math.floor(64 * scale.value)
    buttons.value.start.x = Math.floor((width - sbWidth) / 2)
    buttons.value.start.y = height - Math.floor(24 * scale.value) - sbHeight
    buttons.value.start.width = sbWidth
    buttons.value.start.height = sbHeight
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
