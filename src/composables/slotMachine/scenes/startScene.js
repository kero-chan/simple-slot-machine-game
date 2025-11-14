import { Container, Graphics, Sprite, Texture, Text } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useBackgroundMusic } from '../../useBackgroundMusic'

export function useStartScene(gameState) {
    const container = new Container()
    const backgroundMusic = useBackgroundMusic()
    
    let progressBar = null
    let progressBarBg = null
    let progressText = null
    let startButton = null
    let startButtonText = null
    let isLoading = true

    function build(w, h) {
        container.removeChildren()

        const bgAsset = ASSETS.loadedImages.start_background || ASSETS.imagePaths?.start_background
        if (bgAsset) {
            const tex = bgAsset instanceof Texture ? bgAsset : Texture.from(bgAsset)
            const bg = new Sprite(tex)
            bg.width = w
            bg.height = h
            bg.x = 0
            bg.y = 0
            container.addChild(bg)
        }

        const buttonW = Math.floor(w * 0.5)
        const buttonH = Math.floor(h * 0.08)
        const buttonX = Math.floor((w - buttonW) / 2)
        const safeBottom = Math.floor(Math.min(h * 0.20, 140))
        const buttonY = h - safeBottom - buttonH

        // Progress bar background
        const progressBarW = Math.floor(w * 0.6)
        const progressBarH = Math.floor(h * 0.03)
        const progressBarX = Math.floor((w - progressBarW) / 2)
        const progressBarY = buttonY - progressBarH - Math.floor(h * 0.05)

        progressBarBg = new Graphics()
        progressBarBg.roundRect(progressBarX, progressBarY, progressBarW, progressBarH, progressBarH / 2)
        progressBarBg.fill({ color: 0x333333, alpha: 0.8 })
        container.addChild(progressBarBg)

        // Progress bar fill
        progressBar = new Graphics()
        container.addChild(progressBar)

        // Progress text
        progressText = new Text({ 
            text: 'Loading... 0%', 
            style: { 
                fill: 0xffffff, 
                fontSize: Math.floor(progressBarH * 0.8), 
                fontWeight: 'bold',
                align: 'center'
            } 
        })
        progressText.anchor.set(0.5)
        progressText.x = w / 2
        progressText.y = progressBarY - progressBarH - 10
        container.addChild(progressText)

        // Start button (initially hidden during loading)
        startButton = new Graphics()
        startButton.roundRect(buttonX, buttonY, buttonW, buttonH, Math.floor(buttonH / 2))
        startButton.fill(0xff4d4f)
        startButton.alpha = 0.5 // Dimmed during loading
        startButton.eventMode = 'none' // Disabled during loading
        startButton.cursor = 'pointer'
        container.addChild(startButton)

        startButtonText = new Text({ 
            text: '开始', 
            style: { 
                fill: 0xffffff, 
                fontSize: Math.floor(buttonH * 0.45), 
                fontWeight: 'bold' 
            } 
        })
        startButtonText.anchor.set(0.5)
        startButtonText.x = buttonX + buttonW / 2
        startButtonText.y = buttonY + buttonH / 2
        startButtonText.alpha = 0.5 // Dimmed during loading
        container.addChild(startButtonText)

        // Store dimensions for updateProgress
        progressBar._dimensions = { x: progressBarX, y: progressBarY, w: progressBarW, h: progressBarH }
    }

    function updateProgress(loaded, total) {
        if (!progressBar || !progressText || !progressBar._dimensions) {
            console.warn('[StartScene] Progress elements not ready yet')
            return
        }

        const percentage = total > 0 ? (loaded / total) : 0
        const { x, y, w, h } = progressBar._dimensions

        // Update progress bar fill
        progressBar.clear()
        const fillW = Math.floor(w * percentage)
        if (fillW > 0) {
            progressBar.roundRect(x, y, fillW, h, h / 2)
            progressBar.fill({ color: 0x4caf50, alpha: 1 })
        }

        // Update progress text
        const percentText = Math.floor(percentage * 100)
        progressText.text = `Loading... ${percentText}%`

        // When loading is complete
        if (loaded >= total && isLoading) {
            isLoading = false

            // Hide progress bar and text
            if (progressBarBg) {
                progressBarBg.visible = false
            }
            if (progressBar) progressBar.visible = false
            if (progressText) progressText.visible = false

            // Enable start button
            if (startButton) {
                startButton.alpha = 1
                startButton.eventMode = 'static'
                startButton.off('pointerdown') // Remove old listeners
                startButton.on('pointerdown', () => {
                    // Background music is started by StartScreen.vue
                    gameState.showStartScreen.value = false
                })
            }
            if (startButtonText) {
                startButtonText.alpha = 1
            }
        }
    }

    return { container, build, updateProgress }
}
