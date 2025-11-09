import { Graphics, Sprite, Container } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function useSpinBtn(canvasState, gameState) {
    let buttonContainer = null
    let glowGraphics = null
    let shadowGraphics = null
    let frameSprite = null
    let arrowSprite = null
    let maskGraphics = null
    let angleRad = 0
    let lastTime = 0
    const rotationSpeedRadPerSec = Math.PI / 3 // ~60°/s

    function createButton() {
        buttonContainer = new Container()

        // Glow layer
        glowGraphics = new Graphics()
        buttonContainer.addChild(glowGraphics)

        // Shadow layer
        shadowGraphics = new Graphics()
        buttonContainer.addChild(shadowGraphics)

        // Frame and arrow container with mask
        const contentContainer = new Container()
        buttonContainer.addChild(contentContainer)

        // Circular mask
        maskGraphics = new Graphics()
        contentContainer.addChild(maskGraphics)

        // Frame sprite
        const frameTexture = ASSETS.loadedImages.spin_frame
        if (frameTexture) {
            frameSprite = new Sprite(frameTexture)
            frameSprite.anchor.set(0.5)
            contentContainer.addChild(frameSprite)
        }

        // Arrow sprite
        const arrowTexture = ASSETS.loadedImages.spin_arrow
        if (arrowTexture) {
            arrowSprite = new Sprite(arrowTexture)
            arrowSprite.anchor.set(0.5)
            contentContainer.addChild(arrowSprite)
        }

        // Apply mask to content
        contentContainer.mask = maskGraphics

        return buttonContainer
    }

    function draw(container, timestamp = 0) {
        const btn = canvasState.buttons.value.spin
        const scale = canvasState.scale.value

        if (!buttonContainer) {
            buttonContainer = createButton()
            container.addChild(buttonContainer)
        }

        // Position button
        buttonContainer.position.set(btn.x, btn.y)

        const radius = btn.radius
        const diameter = radius * 2

        // Advance rotation continuously
        if (!lastTime) lastTime = timestamp
        const dt = Math.max(0, timestamp - lastTime) / 1000
        angleRad = (angleRad + rotationSpeedRadPerSec * dt) % (Math.PI * 2)
        lastTime = timestamp

        // Update glow - create radial gradient effect
        if (glowGraphics) {
            glowGraphics.clear()
            const steps = 10
            for (let i = 0; i < steps; i++) {
                const t = i / steps
                const r = Math.floor(radius * (0.2 + 0.85 * t))
                const alpha = 0.25 * (1 - t)
                glowGraphics.circle(0, 0, r)
                glowGraphics.fill({ color: 0x00ffb4, alpha })
            }
        }

        // Update shadow
        if (shadowGraphics) {
            shadowGraphics.clear()
            shadowGraphics.circle(0, Math.floor(6 * scale), Math.floor(radius * 0.95))
            shadowGraphics.fill({ color: 0x000000, alpha: 0.35 })
        }

        // Update circular mask
        if (maskGraphics) {
            maskGraphics.clear()
            maskGraphics.circle(0, 0, radius)
            maskGraphics.fill({ color: 0xffffff })
        }

        // Update frame sprite
        if (frameSprite) {
            frameSprite.width = diameter
            frameSprite.height = diameter
        }

        // Update arrow sprite with rotation
        if (arrowSprite) {
            const arrowInsetRatio = 0.20
            const arrowSize = diameter * (1 - arrowInsetRatio * 2)
            arrowSprite.width = arrowSize
            arrowSprite.height = arrowSize
            arrowSprite.rotation = angleRad
        }
    }

    const isPointInside = (x, y) => {
        const btn = canvasState.buttons.value.spin
        const dx = x - btn.x
        const dy = y - btn.y
        return dx * dx + dy * dy <= btn.radius * btn.radius
    }

    return {
        draw,
        isPointInside
    }
}
