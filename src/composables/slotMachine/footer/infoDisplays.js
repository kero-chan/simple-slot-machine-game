import { Graphics, Text, Container } from 'pixi.js'

export function useFooterInfoDisplays(canvasState, gameState) {
    let displayContainer = null
    let pills = []

    function formatNumber(n) {
        return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    function draw(container, rect) {
        const scale = canvasState.scale.value
        const { w } = rect

        // Create display container if needed
        if (!displayContainer) {
            displayContainer = new Container()
            container.addChild(displayContainer)
        }

        // Layout: top row for pills
        const topMargin = Math.floor(8 * scale)
        const pillHeight = Math.floor(48 * scale)
        const rowY = topMargin

        const gap = Math.floor(12 * scale)
        const pillWidth = Math.floor((w - gap * 2) / 3)

        const labels = ['CREDITS', 'BET', 'WIN']
        const values = [
            formatNumber(gameState.credits.value),
            formatNumber(gameState.bet.value),
            formatNumber(gameState.currentWin.value)
        ]

        // Create or update pills
        for (let i = 0; i < 3; i++) {
            const rx = i * (pillWidth + gap)
            const ry = rowY

            if (!pills[i]) {
                pills[i] = createPill(rx, ry, pillWidth, pillHeight, labels[i], scale)
                displayContainer.addChild(pills[i].container)
            } else {
                updatePill(pills[i], rx, ry, pillWidth, pillHeight, scale)
            }

            // Update value text
            pills[i].valueText.text = values[i]
        }
    }

    function createPill(x, y, width, height, label, scale) {
        const container = new Container()
        container.position.set(x, y)

        // Pill background
        const background = new Graphics()
        const r = Math.floor(height / 2)

        // Create gradient effect
        const steps = 10
        for (let i = 0; i < steps; i++) {
            const t = i / steps
            const color = interpolateGradient(t)
            const py = (height / steps) * i
            const ph = Math.ceil(height / steps) + 1

            background.roundRect(0, py, width, ph, r)
            background.fill({ color, alpha: getGradientAlpha(t) })
        }

        // Inner soft highlight
        background.roundRect(0, 0, width, height, r)
        background.stroke({ color: 0xffffff, alpha: 0.12, width: Math.max(2, Math.floor(2 * scale)) })

        container.addChild(background)

        // Icon disk on left
        const iconR = Math.floor(height * 0.32)
        const iconCx = Math.floor(iconR * 1.5)
        const iconCy = Math.floor(height / 2)

        const icon = new Graphics()
        icon.circle(iconCx, iconCy, iconR)
        icon.fill({ color: 0xcfa26a })
        container.addChild(icon)

        // Label
        const labelText = new Text({
            text: label,
            style: {
                fontFamily: 'Arial',
                fontSize: Math.floor(14 * scale),
                fontWeight: 'bold',
                fill: 0xffe478,
                alpha: 0.95
            }
        })
        const textX = iconCx + Math.floor(iconR * 1.3)
        labelText.position.set(textX, Math.floor(height * 0.35))
        labelText.anchor.set(0, 0.5)
        container.addChild(labelText)

        // Value in cyan
        const valueText = new Text({
            text: '0.00',
            style: {
                fontFamily: 'Arial',
                fontSize: Math.floor(22 * scale),
                fontWeight: 'bold',
                fill: 0x9fe8ff
            }
        })
        valueText.position.set(textX, Math.floor(height * 0.72))
        valueText.anchor.set(0, 0.5)
        container.addChild(valueText)

        return { container, background, icon, labelText, valueText }
    }

    function updatePill(pill, x, y, width, height, scale) {
        pill.container.position.set(x, y)

        // Update background
        pill.background.clear()
        const r = Math.floor(height / 2)

        const steps = 10
        for (let i = 0; i < steps; i++) {
            const t = i / steps
            const color = interpolateGradient(t)
            const py = (height / steps) * i
            const ph = Math.ceil(height / steps) + 1

            pill.background.roundRect(0, py, width, ph, r)
            pill.background.fill({ color, alpha: getGradientAlpha(t) })
        }

        pill.background.roundRect(0, 0, width, height, r)
        pill.background.stroke({ color: 0xffffff, alpha: 0.12, width: Math.max(2, Math.floor(2 * scale)) })

        // Update icon
        const iconR = Math.floor(height * 0.32)
        const iconCx = Math.floor(iconR * 1.5)
        const iconCy = Math.floor(height / 2)

        pill.icon.clear()
        pill.icon.circle(iconCx, iconCy, iconR)
        pill.icon.fill({ color: 0xcfa26a })

        // Update text positions and sizes
        const textX = iconCx + Math.floor(iconR * 1.3)
        pill.labelText.style.fontSize = Math.floor(14 * scale)
        pill.labelText.position.set(textX, Math.floor(height * 0.35))

        pill.valueText.style.fontSize = Math.floor(22 * scale)
        pill.valueText.position.set(textX, Math.floor(height * 0.72))
    }

    function interpolateGradient(t) {
        if (t < 0.5) {
            return lerpColor(0x503014, 0xffffff, t * 2)
        } else {
            return lerpColor(0xffffff, 0x000000, (t - 0.5) * 2)
        }
    }

    function getGradientAlpha(t) {
        if (t < 0.35) return 0.15
        if (t < 0.5) return 0.06
        return 0.12
    }

    return { draw }
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
