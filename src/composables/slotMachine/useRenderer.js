import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../config/assets'
import { useHeader } from './useHeader'
import { useFooter } from './footer'
import { useMainFrame } from './mainFrame'

export function useRenderer(canvasState, gameState, gridState) {
    const header = useHeader(canvasState, gameState)
    const footer = useFooter(canvasState, gameState)
    const mainFrame = useMainFrame(canvasState, gameState, gridState)

    let animationFrameId = null

    // Safe init: do nothing until canvas is ready
    const init = () => {
        if (!canvasState?.ctx || !canvasState?.canvasWidth || !canvasState?.canvasHeight) return
        // No-op: fields are reactive and set by setupCanvas()
    }

    const renderFrame = (timestamp = 0) => {
        // Defend against early calls (before setupCanvas)
        if (!canvasState?.ctx || !canvasState?.canvasWidth || !canvasState?.canvasHeight) {
            animationFrameId = requestAnimationFrame(renderFrame)
            return
        }
        const ctx = canvasState.ctx.value
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value
        if (!ctx || !w || !h) {
            animationFrameId = requestAnimationFrame(renderFrame)
            return
        }

        // Start screen branch
        if (gameState.showStartScreen.value) {
            drawStartScreen(ctx, w, h, canvasState)
            animationFrameId = requestAnimationFrame(renderFrame)
            return
        }

        // Layout
        const cols = 5
        const marginX = 10
        const tileSize = (w - marginX * 2) / cols

        const topVisible = 0.3 * tileSize
        const bottomVisible = 0.2 * tileSize
        const mainH = Math.round(4 * tileSize + topVisible + bottomVisible)

        const headerH = Math.round(h * 0.15)
        const headerRect = { x: 0, y: 0, w, h: headerH }
        const mainRect = { x: 0, y: headerRect.h, w, h: mainH }
        const footerH = Math.max(0, h - headerRect.h - mainRect.h)
        const footerRect = { x: 0, y: headerRect.h + mainRect.h, w, h: footerH }

        mainFrame.draw(ctx, w, h, mainRect, timestamp)
        header.draw(ctx, headerRect)
        footer.draw(ctx, footerRect, timestamp)

        animationFrameId = requestAnimationFrame(renderFrame)
    }

    const render = () => {
        renderFrame(performance.now())
    }

    return {
        init,
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
// Cache for lazy HTMLImage fallback
let cachedStartBg = null
let startBgLoading = false

// ----- Start screen rendering -----
function drawStartScreen(ctx, w, h, canvasState) {
    const bgAsset = ASSETS.loadedImages.start_background

    // Try to extract a CanvasImageSource from Pixi v8 Texture
    let source = null
    if (bgAsset && bgAsset.source && bgAsset.source.resource) {
        source = bgAsset.source.resource.source || null
    }

    // Fallback to cached HTMLImage if present
    if (!source && cachedStartBg) {
        source = cachedStartBg
    }

    // Lazy-load an HTMLImageElement if nothing is ready yet
    if (!source && !startBgLoading) {
        startBgLoading = true
        const url = ASSETS.imagePaths.start_background
        const img = new Image()
        img.onload = () => {
            cachedStartBg = img
            startBgLoading = false
        }
        img.onerror = () => {
            console.error('Failed to load start background:', url)
            startBgLoading = false
        }
        img.src = url
    }

    // Draw the image if we have a valid CanvasImageSource
    if (source) {
        try {
            ctx.drawImage(source, 0, 0, w, h)
        } catch (e) {
            // Fallback gradient if drawImage fails (e.g., still initializing)
            const grad = ctx.createLinearGradient(0, 0, 0, h)
            grad.addColorStop(0, '#7a1a1a')
            grad.addColorStop(1, '#3a0f0f')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
        }
    } else {
        // Initial frames: use gradient until image resolves
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

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}
