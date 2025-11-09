import { ref } from 'vue'
import { Application } from 'pixi.js'
import { CONFIG } from '../../config/constants'
import startBgUrl from '../../assets/start_game_bg.jpg'

export function useCanvas(canvasRef) {
  const app = ref(null)
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
      if (app.value) setupCanvas()
    }
    img.src = startBgUrl
  }

  const setupCanvas = async () => {
    if (!canvasRef.value) return

    ensureAspectLoaded()
    const aspect = targetAspect.value ?? (CONFIG.canvas.baseWidth / CONFIG.canvas.baseHeight)

    const vh = window.innerHeight
    const vw = window.innerWidth
    const height = vh
    const width = Math.min(vw, Math.round(height * aspect))

    // Create or resize PixiJS application
    if (!app.value) {
      app.value = new Application()
      await app.value.init({
        width,
        height,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      // Append the canvas to the container
      canvasRef.value.appendChild(app.value.canvas)
      app.value.canvas.style.touchAction = 'none'
    } else {
      // Resize existing application
      app.value.renderer.resize(width, height)
    }

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

    // Make spin button smaller
    buttons.value.spin.radius = Math.floor(85 * scale.value)

    // Arrange minus/plus left/right of the spin, same vertical center
    const controlSize = Math.floor(72 * scale.value) // ring diameter
    const gap = Math.floor(36 * scale.value)         // space between spin edge and ring

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
    app,
    canvasWidth,
    canvasHeight,
    scale,
    reelOffset,
    buttons,
    setupCanvas
  }
}
