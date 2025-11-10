import { Container, Graphics, Text } from 'pixi.js'

export function useHeader(gameState) {
    const container = new Container()

    function build(rect) {
        container.removeChildren()
        const { x, y, w, h } = rect

        const bar = new Graphics()
        bar.rect(x, y, w, h)
        bar.fill(0x8a4b28)
        container.addChild(bar)

        const pillGap = Math.floor(w * 0.02)
        const pillWidth = Math.floor((w - pillGap * 4) / 3)
        const pillHeight = Math.floor(h * 0.35)
        const labels = ['CREDITS', 'BET', 'WIN']
        const vals = [
            Number(gameState.credits.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(gameState.bet.value).toFixed(2),
            Number(gameState.currentWin.value).toFixed(2)
        ]

        for (let i = 0; i < 3; i++) {
            const px = x + pillGap + i * (pillWidth + pillGap)
            const py = y + pillGap
            const pill = new Graphics()
            pill.roundRect(px, py, pillWidth, pillHeight, Math.floor(pillHeight / 3))
            pill.fill(0xb2784f)
            container.addChild(pill)

            const label = new Text(labels[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.25) })
            label.x = px + Math.floor(pillWidth * 0.06)
            label.y = py + Math.floor(pillHeight * 0.10)
            container.addChild(label)

            const valueText = new Text(vals[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.35), fontWeight: 'bold' })
            valueText.x = px + Math.floor(pillWidth * 0.06)
            valueText.y = py + Math.floor(pillHeight * 0.50)
            valueText.name = `pill-value-${i}`
            container.addChild(valueText)
        }
    }

    function updateValues() {
        const vals = [
            Number(gameState.credits.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            Number(gameState.bet.value).toFixed(2),
            Number(gameState.currentWin.value).toFixed(2)
        ]
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i]
            if (child instanceof Text && child.name && child.name.startsWith('pill-value-')) {
                const idx = Number(child.name.replace('pill-value-', ''))
                child.text = vals[idx]
            }
        }
    }

    return { container, build, updateValues }
}
