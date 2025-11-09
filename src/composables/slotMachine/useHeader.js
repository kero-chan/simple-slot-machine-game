import { Graphics, Text } from 'pixi.js'

export function useHeader(canvasState, gameState, container) {
    let background = null
    let multiplierText = null

    function draw(rect) {
        const scale = canvasState.scale.value
        const { w, h } = rect

        // Create or update background
        if (!background) {
            background = new Graphics()
            container.addChild(background)
        }

        // Clear and redraw background with gradient
        background.clear()

        // Create gradient effect using multiple rectangles
        const steps = 20
        for (let i = 0; i < steps; i++) {
            const t = i / steps
            const color = interpolateColor(0xa75b2a, 0xc1763d, 0x8a4b23, t)
            const y = (h / steps) * i
            const height = Math.ceil(h / steps) + 1
            background.rect(0, y, w, height)
            background.fill({ color })
        }

        // Create or update multiplier text
        if (!multiplierText) {
            multiplierText = new Text({
                text: 'x1    x2    x3    x5',
                style: {
                    fontFamily: 'Arial',
                    fontSize: Math.floor(26 * scale),
                    fontWeight: 'bold',
                    fill: 0xffd04d,
                    align: 'left'
                }
            })
            multiplierText.position.set(Math.floor(20 * scale), 0)
            container.addChild(multiplierText)
        } else {
            // Update text style for new scale
            multiplierText.style.fontSize = Math.floor(26 * scale)
            multiplierText.position.set(Math.floor(20 * scale), 0)
        }

        // Center text vertically
        multiplierText.y = h / 2 - multiplierText.height / 2
    }

    return { draw }
}

// Helper to interpolate between three colors based on t (0 to 1)
function interpolateColor(color1, color2, color3, t) {
    if (t < 0.5) {
        return lerpColor(color1, color2, t * 2)
    } else {
        return lerpColor(color2, color3, (t - 0.5) * 2)
    }
}

function lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff
    const g1 = (c1 >> 8) & 0xff
    const b1 = c1 & 0xff

    const r2 = (c2 >> 16) & 0xff
    const g2 = (c2 >> 8) & 0xff
    const b2 = c2 & 0xff

    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    return (r << 16) | (g << 8) | b
}
