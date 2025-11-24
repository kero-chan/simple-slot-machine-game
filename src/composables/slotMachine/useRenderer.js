import { Container } from 'pixi.js'
import { usePixiApp } from './pixiApp'
import { useHeader } from './header'
import { useReels } from './reels'
import { useFooter } from './footer'
import { ASSETS } from '../../config/assets'
import { CONFIG } from '../../config/constants'
import { useGlowOverlay } from './reels/tiles/glowingComposer'
import { createWinOverlay } from './overlay/winOverlay'
import { createBonusOverlay } from './overlay/bonusOverlay'
import { createJackpotVideoOverlay } from './overlay/jackpotVideoOverlay'
import { createBonusTilePopAnimation } from './overlay/bonusTilePopAnimation'
import { createJackpotResultOverlay } from './overlay/jackpotResultOverlay'
import { createWinningSparkles } from './reels/winning/winningSparkles'
import { useGameStore, GAME_STATES } from '../../stores/gameStore'
import { watch } from 'vue'

export function useRenderer(canvasState, gameState, gridState, controls) {
    // Composables
    const gameStore = useGameStore()
    const pixiApp = usePixiApp(canvasState)

    // Scene graph
    let app = null
    let root = null
    let header = null
    let reels = null
    let footer = null
    let glowOverlay = null
    let winningSparkles = null
    let winOverlay = null
    let bonusOverlay = null
    let bonusTilePopAnimation = null
    let jackpotVideoOverlay = null
    let jackpotResultOverlay = null

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
        const headerH = Math.round(h * 0.15)
        const visibleRowsSpan = ROWS_FULL + TOP_PARTIAL + 0.35  // Increased bottom visibility from 0.15 to 0.35
        
        // Keep proportions: calculate mainH to maintain header/main/footer ratio
        // Main area gets the space needed for visible rows
        const mainH = Math.ceil(h * 0.60) // ~60% for main area (adjust as needed)
        const footerH = Math.max(0, h - headerH - mainH)

        // Calculate tile size to fit within the fixed main area
        // Tile width from canvas width
        const tileW = (w - MARGIN_X * 2) / COLS
        
        // Tile height: scale from main area height to fit visible rows
        // Also respect the tile aspect ratio from constants
        const TILE_RATIO_H_OVER_W = CONFIG.reels.tileHeight / CONFIG.reels.tileWidth  // Actual tile image ratio from constants
        const tileHFromRatio = tileW * TILE_RATIO_H_OVER_W
        const tileHFromMainHeight = (mainH - 1) / visibleRowsSpan
        
        // Use the smaller of the two to ensure tiles fit both width and height constraints
        const tileH = Math.min(tileHFromRatio, tileHFromMainHeight)

        return {
            headerRect: { x: 0, y: 0, w, h: headerH },
            mainRect:   { x: 0, y: headerH, w, h: mainH },
            footerRect: { x: 0, y: headerH + mainH, w, h: footerH },
            tileSize:   { w: tileW, h: tileH }
        }
    }

    // PixiJS-only renderer: header, reels, footer
    async function ensureStage(w, h) {
        await pixiApp.ensure(w, h)
        app = pixiApp.getApp()
        if (!pixiApp.isReady()) {
            console.warn('[Renderer] PixiJS app not ready after ensure')
            return false
        }

        if (!root) {
            root = new Container()
            app.stage.sortableChildren = true
            app.stage.addChild(root)

            header = useHeader(gameState)
            reels = useReels(gameState, gridState)
            footer = useFooter(gameState)
            glowOverlay = useGlowOverlay(gameState, gridState)
            winningSparkles = createWinningSparkles()
            winOverlay = createWinOverlay(gameState)
            bonusOverlay = createBonusOverlay(gameState)
            bonusTilePopAnimation = createBonusTilePopAnimation(gridState, reels)
            jackpotVideoOverlay = createJackpotVideoOverlay()
            jackpotResultOverlay = createJackpotResultOverlay(gameState)
            if (controlHandlers && footer?.setHandlers) {
                footer.setHandlers(controlHandlers)
            }

            root.addChild(header.container)
            root.addChild(reels.container)
            root.addChild(glowOverlay.container)
            root.addChild(winningSparkles.container)
            root.addChild(footer.container)
            root.addChild(winOverlay.container)
            root.addChild(jackpotResultOverlay.container)
            root.addChild(bonusTilePopAnimation.container)
            root.addChild(jackpotVideoOverlay.container)
            root.addChild(bonusOverlay.container)

            // Watch for bonus overlay state
            watch(() => gameStore.gameFlowState, (newState) => {
                const w = canvasState.canvasWidth.value
                const h = canvasState.canvasHeight.value

                // Show tile pop animation first
                if (newState === GAME_STATES.POPPING_BONUS_TILES && bonusTilePopAnimation) {
                    const { mainRect, tileSize } = computeLayout(w, h)
                    bonusTilePopAnimation.show(w, h, mainRect, tileSize, () => {
                        gameStore.completeBonusTilePop()
                    })
                }

                // Show jackpot video after pop animation
                if (newState === GAME_STATES.SHOWING_JACKPOT_VIDEO && jackpotVideoOverlay) {
                    jackpotVideoOverlay.show(w, h, () => {
                        gameStore.completeJackpotVideo()
                    })
                }

                // Then show bonus overlay after video
                if (newState === GAME_STATES.SHOWING_BONUS_OVERLAY && bonusOverlay) {
                    const freeSpinsCount = gameStore.freeSpins
                    bonusOverlay.show(freeSpinsCount, w, h, () => {
                        gameStore.completeBonusOverlay()
                    })
                }
            })
        }

        // Initialize consecutive wins composed textures (removed from here - will be called after asset loading)
        return true
    }

    async function initializeComposedTextures() {
        if (header?.initializeComposedTextures && app) {
            header.initializeComposedTextures(app)
        }
    }

    function updateOnce(timestamp = 0) {
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value
        if (!w || !h) return
        
        // Check if size changed and need to resize PixiJS
        const resized = w !== lastW || h !== lastH
        if (resized) {
            // Resize PixiJS app to match new canvas dimensions
            pixiApp.ensure(w, h)
            lastW = w
            lastH = h
        }
        
        // If stage not ready, skip this frame (will be called again)
        if (!pixiApp.isReady()) return
        
        // Ensure stage is initialized (sync call after first init)
        if (!root) {
            // This shouldn't happen if init() was called properly
            console.warn('[Renderer] Root not initialized in updateOnce')
            return
        }

        const { headerRect, mainRect, footerRect, tileSize } = computeLayout(w, h)

        const showStart = !!gameState.showStartScreen.value
        if (header?.container) header.container.visible = !showStart
        if (reels?.container) reels.container.visible = !showStart
        if (glowOverlay?.container) glowOverlay.container.visible = !showStart
        if (winningSparkles?.container) winningSparkles.container.visible = !showStart
        if (footer?.container) footer.container.visible = !showStart
        // Win overlay visibility is controlled by its own show/hide methods

        if (!showStart) {
            // Game is visible - build and render everything

            // Build header/footer when play screen becomes visible (even without resize)
            if ((resized || header?.container.children.length === 0) && header) {
                header.build(headerRect)
            }
            if (header) header.updateValues()

            // Always draw reels so spin/cascade state is reflected
            if (reels) reels.draw(mainRect, tileSize, timestamp, w)
            if (glowOverlay) glowOverlay.draw(mainRect, tileSize, timestamp, w)
            if (winningSparkles) winningSparkles.draw(mainRect, tileSize, timestamp, w, gridState)

            if ((resized || footer?.container.children.length === 0) && footer) {
                footer.build(footerRect)
            }
            // Update footer every frame: arrow rotation + values refresh
            if (footer?.updateValues) footer.updateValues()
            if (footer?.update) footer.update(timestamp)

            // Update win overlay animation
            if (winOverlay) {
                winOverlay.update(timestamp)
                if (resized && winOverlay.container.visible) {
                    winOverlay.build(w, h)
                }
                // Update gameState flag based on overlay visibility
                if (gameState.showingWinOverlay.value && !winOverlay.isShowing()) {
                    gameStore.hideWinOverlay()
                }
            }

            // Update bonus overlay animation
            if (bonusOverlay) {
                bonusOverlay.update(timestamp)
                if (resized && bonusOverlay.container.visible) {
                    bonusOverlay.build(w, h)
                }
            }

            // Update bonus tile pop animation
            if (bonusTilePopAnimation) {
                bonusTilePopAnimation.update(timestamp)
                if (resized && bonusTilePopAnimation.container.visible) {
                    bonusTilePopAnimation.build(w, h)
                }
            }

            // Update jackpot video overlay
            if (jackpotVideoOverlay) {
                jackpotVideoOverlay.update(timestamp)
                if (resized && jackpotVideoOverlay.container.visible) {
                    jackpotVideoOverlay.build(w, h)
                }
            }

            // Update jackpot result overlay
            if (jackpotResultOverlay) {
                jackpotResultOverlay.update(timestamp)
                if (resized && jackpotResultOverlay.container.visible) {
                    jackpotResultOverlay.build(w, h)
                }
            }
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

    const init = async () => {
        // Initialize stage
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value
        
        if (w > 0 && h > 0) {
            const stageReady = await ensureStage(w, h)
        } else {
            console.warn(`[Renderer] Canvas size not ready yet: ${w}x${h}`)
            // Try to create stage anyway for later use
            await ensureStage(1, 1)
        }
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

    // Expose win overlay for game logic to trigger
    const showWinOverlay = (intensity, amount) => {
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value

        // Show different overlay based on whether we're in free spin mode (jackpot mode)
        if (gameStore.inFreeSpinMode && jackpotResultOverlay) {
            // Jackpot mode - show jackpot result overlay
            jackpotResultOverlay.show(amount, w, h)
            gameStore.showWinOverlay()
        } else if (winOverlay) {
            // Normal mode - show regular win overlay
            winOverlay.show(intensity, amount, w, h)
            gameStore.showWinOverlay()
        }
    }

    // Expose reels API for GSAP-driven animations
    const getReels = () => reels

    return { init, render, startAnimation, stopAnimation, setControls, showWinOverlay, initializeComposedTextures, getReels }
}
