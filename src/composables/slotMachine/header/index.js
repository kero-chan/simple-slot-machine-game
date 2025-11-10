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

        const title = new Text('x1    x2    x3    x5', {
            fill: 0xffd04d,
            fontSize: Math.floor(h * 0.45),
            fontWeight: 'bold'
        })
        title.anchor.set(0.5, 0.5)
        title.x = x + Math.floor(w / 2)
        title.y = y + Math.floor(h / 2)
        container.addChild(title)
    }

    function updateValues() {
        // No-op for now; header shows static multipliers label
    }

    return { container, build, updateValues }
}
