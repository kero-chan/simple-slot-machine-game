import { Graphics, Text, Container } from 'pixi.js'

export function useFooterBetControls(canvasState, gameState) {
    let minusButton = null
    let plusButton = null

    function createRingButton(symbol, scale, disabled) {
        const container = new Container()

        const ring = new Graphics()
        const r = 0.48 // Radius factor

        // Outer translucent ring
        ring.circle(0, 0, r)
        ring.stroke({
            color: disabled ? 0xb4b4b4 : 0xc8966e,
            alpha: disabled ? 0.5 : 0.8,
            width: Math.max(6, Math.floor(6 * scale))
        })

        // Inner ring
        ring.circle(0, 0, r - Math.floor(6 * scale) / 100)
        ring.stroke({
            color: disabled ? 0xa0a0a0 : 0xffdcaa,
            alpha: disabled ? 0.4 : 0.7,
            width: Math.max(3, Math.floor(3 * scale))
        })

        container.addChild(ring)

        // Symbol
        const text = new Text({
            text: symbol,
            style: {
                fontFamily: 'Arial',
                fontSize: Math.floor(28 * scale),
                fontWeight: 'bold',
                fill: disabled ? 0xc8c8c8 : 0xffffff,
                alpha: disabled ? 0.7 : 0.95
            }
        })
        text.anchor.set(0.5)
        container.addChild(text)

        // Soft shadow (positioned behind)
        const shadow = new Graphics()
        shadow.circle(0, Math.floor(4 * scale) / 100, r)
        shadow.fill({ color: 0x000000, alpha: 0.15 })
        container.addChildAt(shadow, 0)

        return { container, ring, text, shadow }
    }

    function updateRingButton(button, btn, symbol, scale, disabled) {
        const cx = btn.x + btn.width / 2
        const cy = btn.y + btn.height / 2
        const r = Math.floor(Math.min(btn.width, btn.height) * 0.48)

        button.container.position.set(cx, cy)
        button.container.scale.set(r)

        // Update ring
        button.ring.clear()
        button.ring.circle(0, 0, 1)
        button.ring.stroke({
            color: disabled ? 0xb4b4b4 : 0xc8966e,
            alpha: disabled ? 0.5 : 0.8,
            width: Math.max(6, Math.floor(6 * scale)) / r
        })

        button.ring.circle(0, 0, 1 - Math.floor(6 * scale) / r)
        button.ring.stroke({
            color: disabled ? 0xa0a0a0 : 0xffdcaa,
            alpha: disabled ? 0.4 : 0.7,
            width: Math.max(3, Math.floor(3 * scale)) / r
        })

        // Update text
        button.text.style.fontSize = Math.floor(28 * scale)
        button.text.style.fill = disabled ? 0xc8c8c8 : 0xffffff
        button.text.style.alpha = disabled ? 0.7 : 0.95

        // Update shadow
        button.shadow.clear()
        button.shadow.circle(0, Math.floor(4 * scale) / r, 1)
        button.shadow.fill({ color: 0x000000, alpha: 0.15 })
    }

    function draw(container, rect) {
        const scale = canvasState.scale.value
        const minusBtn = canvasState.buttons.value.betMinus
        const plusBtn = canvasState.buttons.value.betPlus
        const disabled = gameState.isSpinning.value

        // Create buttons if needed
        if (!minusButton) {
            minusButton = createRingButton('−', scale, disabled)
            container.addChild(minusButton.container)
        }

        if (!plusButton) {
            plusButton = createRingButton('+', scale, disabled)
            container.addChild(plusButton.container)
        }

        // Update buttons
        updateRingButton(minusButton, minusBtn, '−', scale, disabled)
        updateRingButton(plusButton, plusBtn, '+', scale, disabled)
    }

    return { draw }
}
