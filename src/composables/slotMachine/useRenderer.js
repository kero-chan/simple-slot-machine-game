import { Container } from 'pixi.js'
import { usePixiApp } from './pixiApp'
import { useStartScene } from './scenes/startScene'
import { useHeader } from './header'
import { useReels } from './reels'
import { useFooter } from './footer'
import { CONFIG } from '../../config/constants'
import { ASSETS } from '../../config/assets'
import { composeTilesTextures } from './reels/tiles/tilesComposer'

export function useRenderer(canvasState, gameState, gridState, controls) {
    // Composables
    const pixiApp = usePixiApp(canvasState)

    // Scene graph
    let app = null
    let root = null
    let startScene = null
    let header = null
    let reels = null
    let footer = null

    // Track last layout for rebuilds
    let lastW = 0
    let lastH = 0

    // RAF handle
    let animationFrameId = null

    // Layout constants
    const MARGIN_X = 10
    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    const BOTTOM_PARTIAL = 0.15

    // Track control handlers for footer buttons
    let controlHandlers = controls || null
    let bambooComposed = false

    function computeLayout(w, h) {
        const headerH = Math.round(h * 0.18)

        // Tile width from canvas width; tile height from required ratio 157/184
        const tileW = (w - MARGIN_X * 2) / COLS
        const TILE_RATIO_H_OVER_W = 184 / 157
        const tileH = tileW * TILE_RATIO_H_OVER_W

        const visibleRowsSpan = ROWS_FULL + TOP_PARTIAL + 0.15
        // Ceil + 1px guard so the bottom 15% is never clipped
        const mainH = Math.ceil(tileH * visibleRowsSpan) + 1

        const footerH = Math.max(0, h - headerH - mainH)

        return {
            headerRect: { x: 0, y: 0, w, h: headerH },
            mainRect:   { x: 0, y: headerH, w, h: mainH },
            footerRect: { x: 0, y: headerH + mainH, w, h: footerH },
            tileSize:   { w: tileW, h: tileH }
        }
    }

    // PixiJS-only renderer: start screen, header, reels, footer
    function ensureStage(w, h) {
        pixiApp.ensure(w, h)
        app = pixiApp.getApp()
        if (!pixiApp.isReady()) return false

        if (!root) {
            root = new Container()
            app.stage.sortableChildren = true
            app.stage.addChild(root)

            startScene = useStartScene(gameState)
            header = useHeader(gameState)
            reels = useReels(gameState, gridState)
            footer = useFooter(gameState)
            if (controlHandlers && footer?.setHandlers) {
                footer.setHandlers(controlHandlers)
            }

            root.addChild(startScene.container)
            root.addChild(header.container)
            root.addChild(reels.container)
            root.addChild(footer.container)
        }

        // Compose all configured tiles from tiles_50 (idempotent)
        composeTilesTextures(app)
        
        // Initialize consecutive wins composed textures
        if (header?.initializeComposedTextures) {
            header.initializeComposedTextures(app)
        }
        return true
    }

    function updateOnce(timestamp = 0) {
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value
        if (!w || !h) return
        if (!ensureStage(w, h)) return

        const resized = w !== lastW || h !== lastH
        lastW = w
        lastH = h

        const { headerRect, mainRect, footerRect, tileSize } = computeLayout(w, h)

        const showStart = !!gameState.showStartScreen.value
        if (startScene?.container) startScene.container.visible = showStart
        if (header?.container) header.container.visible = !showStart
        if (reels?.container) reels.container.visible = !showStart
        if (footer?.container) footer.container.visible = !showStart

        if (showStart && startScene) {
            if (resized || startScene.container.children.length === 0) {
                startScene.build(w, h)
            }
        }

        if (!showStart) {
            // Build header/footer when play screen becomes visible (even without resize)
            if ((resized || header?.container.children.length === 0) && header) {
                header.build(headerRect)
            }
            if (header) header.updateValues()

            // Always draw reels so spin/cascade state is reflected
            if (reels) reels.draw(mainRect, tileSize, timestamp, w)

            if ((resized || footer?.container.children.length === 0) && footer) {
                footer.build(footerRect)
            }
            // Update footer every frame: arrow rotation + values refresh
            if (footer?.updateValues) footer.updateValues()
            if (footer?.update) footer.update(timestamp)
        }
    }

    const renderFrame = (timestamp = 0) => {
        updateOnce(timestamp)
        const appInstance = pixiApp.getApp()
        if (appInstance?.renderer) {
            appInstance.renderer.render(appInstance.stage)
        }
        animationFrameId = requestAnimationFrame(renderFrame)
    }

    const init = () => {
        // lazy; stage is created on first updateOnce after app init
    }

    const render = () => {
        const ts = performance.now()
        updateOnce(ts)
        const appInstance = pixiApp.getApp()
        if (appInstance?.renderer) {
            appInstance.renderer.render(appInstance.stage)
        }
    }

    const startAnimation = () => {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(renderFrame)
        }
    }

    const stopAnimation = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
        }
    }

    // Allow wiring control handlers after construction
    const setControls = (handlers) => {
        controlHandlers = handlers
        if (footer?.setHandlers) {
            footer.setHandlers(handlers)
        }
    }

    return { init, render, startAnimation, stopAnimation, setControls }
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
