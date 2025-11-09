import { ASSETS } from '../../config/assets'
import { useHeader } from './useHeader'
import { useFooter } from './footer'
import { useMainFrame } from './useMainFrame'

export function useRenderer(canvasState, gameState, gridState) {
    const header = useHeader(canvasState, gameState)
    const footer = useFooter(canvasState, gameState)
    const mainFrame = useMainFrame(canvasState, gameState, gridState)

    let animationFrameId = null

    const renderFrame = (timestamp = 0) => {
        if (!canvasState.ctx.value) return

        const ctx = canvasState.ctx.value
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value

        // Start screen branch
        if (gameState.showStartScreen.value) {
            drawStartScreen(ctx, w, h, canvasState)
            animationFrameId = requestAnimationFrame(renderFrame)
            return
        }

        // Layout derived from tile width and fixed header (15% of canvas height)
        const cols = 5
        const marginX = 10
        const tileSize = (w - marginX * 2) / cols

        // Peeks inside the main area
        const topVisible = 0.3 * tileSize    // 30% of row 0 visible
        const bottomVisible = 0.2 * tileSize // 20% of row 5 visible

        // Main frame shows 4 full rows plus the two peeks
        const mainH = Math.round(4 * tileSize + topVisible + bottomVisible)

        // Header fixed to 15% of canvas; footer gets the remainder
        const headerH = Math.round(h * 0.15)
        const headerRect = { x: 0, y: 0, w, h: headerH }

        const mainRect = { x: 0, y: headerRect.h, w, h: mainH }

        const footerH = Math.max(0, h - headerRect.h - mainRect.h)
        const footerRect = { x: 0, y: headerRect.h + mainRect.h, w, h: footerH }

        // Draw order remains: main → header → footer
        mainFrame.draw(ctx, w, h, mainRect)
        header.draw(ctx, headerRect)
        footer.draw(ctx, footerRect, timestamp)

        if (gameState.freeSpins.value > 0) {
            drawFreeSpinsInfo(ctx, canvasState, gameState)
        }

        animationFrameId = requestAnimationFrame(renderFrame)
    }

    const render = () => {
        renderFrame(performance.now())
    }

    return {
        render,
        startAnimation: () => {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(renderFrame)
            }
        },
        stopAnimation: () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
    }
}

// ----- Start screen rendering -----
const drawStartScreen = (ctx, w, h, canvasState) => {
    const img = ASSETS.loadedImages.start_background
    if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, 0, 0, w, h)
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, '#7a1a1a')
        grad.addColorStop(1, '#3a0f0f')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
    }

    // Start button (bottom-center)
    const sb = canvasState.buttons.value.start
    ctx.save()
    ctx.fillStyle = '#ff4d4f'
    ctx.strokeStyle = '#b02a2a'
    ctx.lineWidth = 4
    roundRect(ctx, sb.x, sb.y, sb.width, sb.height, Math.floor(sb.height / 2))
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(sb.height * 0.45)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('开始', sb.x + sb.width / 2, sb.y + sb.height / 2)
    ctx.restore()
}

// Rounded rect path helper used by start screen
const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

// ----- Free spins overlay -----
const drawFreeSpinsInfo = (ctx, canvasState, gameState) => {
    const w = canvasState.canvasWidth.value
    const boxWidth = 250 * canvasState.scale.value
    const boxHeight = 60 * canvasState.scale.value
    const x = (w - boxWidth) / 2
    const y = Math.floor(canvasState.canvasHeight.value * 0.15)

    ctx.fillStyle = 'rgba(255, 215, 0, 0.95)'
    ctx.fillRect(x, y, boxWidth, boxHeight)
    ctx.strokeStyle = '#FF4500'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, boxWidth, boxHeight)

    ctx.fillStyle = '#000'
    ctx.font = `bold ${Math.floor(20 * canvasState.scale.value)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`FREE SPINS: ${gameState.freeSpins.value}`, w / 2, y + boxHeight / 2)
}
