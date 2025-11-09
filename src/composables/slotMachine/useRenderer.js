import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../config/assets'
import { useHeader } from './useHeader'
import { useFooter } from './footer'
import { useMainFrame } from './mainFrame'

export function useRenderer(canvasState, gameState, gridState) {
    const app = canvasState.app
    let header = null
    let footer = null
    let mainFrame = null
    let startScreenContainer = null

    // Main containers
    let headerContainer = null
    let mainFrameContainer = null
    let footerContainer = null

    const init = () => {
        if (!app.value) return

        // Create main containers
        headerContainer = new Container()
        mainFrameContainer = new Container()
        footerContainer = new Container()

        app.value.stage.addChild(headerContainer)
        app.value.stage.addChild(mainFrameContainer)
        app.value.stage.addChild(footerContainer)

        // Initialize sub-renderers
        header = useHeader(canvasState, gameState, headerContainer)
        footer = useFooter(canvasState, gameState, footerContainer)
        mainFrame = useMainFrame(canvasState, gameState, gridState, mainFrameContainer)

        // Setup ticker
        app.value.ticker.add(renderFrame)
    }

    const renderFrame = () => {
        if (!app.value) return

        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value

        // Start screen branch
        if (gameState.showStartScreen.value) {
            // Hide game containers
            if (headerContainer) headerContainer.visible = false
            if (mainFrameContainer) mainFrameContainer.visible = false
            if (footerContainer) footerContainer.visible = false

            drawStartScreen(w, h)
            return
        }

        // Show game containers
        if (headerContainer) headerContainer.visible = true
        if (mainFrameContainer) mainFrameContainer.visible = true
        if (footerContainer) footerContainer.visible = true

        // Hide start screen
        if (startScreenContainer) {
            startScreenContainer.visible = false
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

        // Position containers
        headerContainer.position.set(headerRect.x, headerRect.y)
        mainFrameContainer.position.set(mainRect.x, mainRect.y)
        footerContainer.position.set(footerRect.x, footerRect.y)

        // Update sub-renderers
        if (mainFrame) mainFrame.draw(w, h, mainRect)
        if (header) header.draw(headerRect)
        if (footer) footer.draw(footerRect)
    }

    const drawStartScreen = (w, h) => {
        if (!app.value) return

        // Create or update start screen container
        if (!startScreenContainer) {
            startScreenContainer = new Container()
            app.value.stage.addChild(startScreenContainer)

            // Background
            const bgTexture = ASSETS.loadedImages.start_background
            if (bgTexture) {
                const bgSprite = new Sprite(bgTexture)
                bgSprite.width = w
                bgSprite.height = h
                startScreenContainer.addChild(bgSprite)
            } else {
                // Fallback gradient background
                const bg = new Graphics()
                bg.rect(0, 0, w, h)
                bg.fill({ color: 0x7a1a1a })
                startScreenContainer.addChild(bg)
            }

            // Start button
            const sb = canvasState.buttons.value.start
            const buttonContainer = new Container()
            buttonContainer.position.set(sb.x, sb.y)

            const button = new Graphics()
            const radius = Math.floor(sb.height / 2)
            button.roundRect(0, 0, sb.width, sb.height, radius)
            button.fill({ color: 0xff4d4f })
            button.stroke({ color: 0xb02a2a, width: 4 })

            const buttonText = new Text({
                text: '开始',
                style: {
                    fontFamily: 'Arial',
                    fontSize: Math.floor(sb.height * 0.45),
                    fontWeight: 'bold',
                    fill: 0xffffff,
                    align: 'center'
                }
            })
            buttonText.anchor.set(0.5)
            buttonText.position.set(sb.width / 2, sb.height / 2)

            buttonContainer.addChild(button)
            buttonContainer.addChild(buttonText)
            startScreenContainer.addChild(buttonContainer)
        } else {
            startScreenContainer.visible = true

            // Update background size if needed
            const bgSprite = startScreenContainer.children[0]
            if (bgSprite && bgSprite instanceof Sprite) {
                bgSprite.width = w
                bgSprite.height = h
            }

            // Update button position
            const sb = canvasState.buttons.value.start
            const buttonContainer = startScreenContainer.children[1]
            if (buttonContainer) {
                buttonContainer.position.set(sb.x, sb.y)
            }
        }
    }

    return {
        init,
        render: renderFrame,
        startAnimation: () => {
            if (app.value) {
                app.value.ticker.start()
            }
        },
        stopAnimation: () => {
            if (app.value) {
                app.value.ticker.stop()
            }
        }
    }
}
