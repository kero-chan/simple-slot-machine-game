import { ref } from 'vue'
import { CONFIG } from '../../config/constants'
import startBgUrl from '../../assets/start_game_bg.jpg'

export function useCanvas(canvasRef) {
  const canvas = ref(null)
  const ctx = ref(null)
  const ownedCanvas = ref(null)

  const canvasWidth = ref(0)
  const canvasHeight = ref(0)
  const scale = ref(1)
  const reelOffset = ref({ x: 0, y: 0 })
  const targetAspect = ref(null)
  const targetImageWidth = ref(null)

  const buttons = ref({
    spin: { x: 0, y: 0, radius: 50 },
    betPlus: { x: 0, y: 0, width: 60, height: 50 },
    betMinus: { x: 0, y: 0, width: 60, height: 50 },
    start: { x: 0, y: 0, width: 0, height: 0 }
  })

  // Load start image once to get aspect ratio (optional)
  const ensureAspectLoaded = () => {
    if (targetAspect.value && targetImageWidth.value) return
    const img = new Image()
    img.onload = () => {
      targetAspect.value = img.width / img.height
      targetImageWidth.value = img.width
      if (canvas.value) setupCanvas()
    }
    img.src = startBgUrl
  }

  const setupCanvas = async () => {
    if (!canvasRef.value) return

    // Create or use an actual HTMLCanvasElement
    const hostEl = canvasRef.value
    let canvasEl
    if (hostEl instanceof HTMLCanvasElement) {
      canvasEl = hostEl
    } else {
      // Always recreate canvas to avoid ghost images on resize
      const newCanvas = document.createElement('canvas')
      newCanvas.style.display = 'block'
      newCanvas.style.touchAction = 'none'
      // Replace any previous children to ensure clean rendering target
      hostEl.innerHTML = ''
      hostEl.appendChild(newCanvas)
      ownedCanvas.value = newCanvas
      canvasEl = newCanvas
    }

    canvas.value = canvasEl
    ctx.value = canvasEl.getContext('2d')

    ensureAspectLoaded()

    // Visible viewport
    const vh = document.documentElement.clientHeight

    // Always use same logic: height = screen height, width = 9/16 * height (max 1000px)
    let height = vh
    let width = Math.floor(height * (9 / 16))
    
    // Cap maximum width at 1000px
    if (width > 1000) {
      width = 1000
    }

    const dpr = window.devicePixelRatio || 1
    canvasEl.width = Math.floor(width * dpr)
    canvasEl.height = Math.floor(height * dpr)
    canvasEl.style.width = `${width}px`
    canvasEl.style.height = `${height}px`

    ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0)

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
    buttons.value.spin.y = height - Math.floor(160 * scale.value)
    buttons.value.spin.radius = Math.floor(85 * scale.value)

    const controlSize = Math.floor(72 * scale.value)
    const gap = Math.floor(36 * scale.value)

    // Minus (left of spin)
    buttons.value.betMinus.width = controlSize
    buttons.value.betMinus.height = controlSize
    buttons.value.betMinus.x = buttons.value.spin.x - buttons.value.spin.radius - gap - controlSize
    buttons.value.betMinus.y = buttons.value.spin.y - Math.floor(controlSize / 2)

    // Plus (right of spin)
    buttons.value.betPlus.width = controlSize
    buttons.value.betPlus.height = controlSize
    buttons.value.betPlus.x = buttons.value.spin.x + buttons.value.spin.radius + gap
    buttons.value.betPlus.y = buttons.value.spin.y - Math.floor(controlSize / 2)

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
