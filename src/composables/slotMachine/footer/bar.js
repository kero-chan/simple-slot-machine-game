import { Graphics } from 'pixi.js'

export function useFooterBar(canvasState) {
    let background = null

    function draw(container, rect) {
        const scale = canvasState.scale.value
        const { w, h } = rect

        // Create or update background
        if (!background) {
            background = new Graphics()
            container.addChild(background)
        }

        background.clear()

        // Wood base gradient using multiple rectangles
        const steps = 20
        const colors = [0xa25f2a, 0xb8733a, 0x8e4f22, 0x6c3a19]
        const stops = [0, 0.35, 0.7, 1]

        for (let i = 0; i < steps; i++) {
            const t = i / steps
            const color = interpolateGradient(colors, stops, t)
            const y = (h / steps) * i
            const height = Math.ceil(h / steps) + 1
            background.rect(0, y, w, height)
            background.fill({ color })
        }

        // Subtle grooves
        const grooveSpacing = Math.floor(14 * scale)
        background.stroke({ color: 0xffffff, alpha: 0.05, width: Math.max(1, Math.floor(1 * scale)) })
        for (let gy = grooveSpacing; gy < h; gy += grooveSpacing) {
            background.moveTo(Math.floor(10 * scale), gy)
            background.quadraticCurveTo(w / 2, gy + Math.floor(3 * scale), w - Math.floor(10 * scale), gy)
        }

        // Top highlight strip
        background.rect(0, Math.floor(6 * scale), w, Math.floor(10 * scale))
        background.fill({ color: 0xffffff, alpha: 0.08 })

        // Bottom shadow depth
        background.rect(0, h - Math.floor(8 * scale), w, Math.floor(8 * scale))
        background.fill({ color: 0x000000, alpha: 0.25 })
    }

    return { draw }
}

function interpolateGradient(colors, stops, t) {
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i] && t <= stops[i + 1]) {
            const localT = (t - stops[i]) / (stops[i + 1] - stops[i])
            return lerpColor(colors[i], colors[i + 1], localT)
        }
    }
    return colors[colors.length - 1]
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
