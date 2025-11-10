import { Container, Graphics, Sprite, Texture, Text } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function useStartScene(gameState) {
    const container = new Container()

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

        const btn = new Graphics()
        btn.roundRect(buttonX, buttonY, buttonW, buttonH, Math.floor(buttonH / 2))
        btn.fill(0xff4d4f)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'
        btn.on('pointerdown', () => {
            gameState.showStartScreen.value = false
        })
        container.addChild(btn)

        const btnText = new Text({ text: '开始', style: { fill: 0xffffff, fontSize: Math.floor(buttonH * 0.45), fontWeight: 'bold' } })
        btnText.anchor.set(0.5)
        btnText.x = buttonX + buttonW / 2
        btnText.y = buttonY + buttonH / 2
        container.addChild(btnText)
    }

    return { container, build }
}
