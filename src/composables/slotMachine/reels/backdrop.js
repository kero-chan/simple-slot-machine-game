import { Graphics, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function createBackdrop(container) {
    let backdropSprite = null
    const mask = new Graphics()
    container.addChild(mask)

    function ensureBackdrop(rect, canvasW) {
        const src = ASSETS.loadedImages?.reels_bg || ASSETS.imagePaths?.reels_bg
        if (src) {
            const tex = src instanceof Texture ? src : Texture.from(src)
            if (!backdropSprite) {
                backdropSprite = new Sprite(tex)
                backdropSprite.anchor.set(0, 0)
                container.addChildAt(backdropSprite, 0)
            } else {
                backdropSprite.texture = tex
            }
            backdropSprite.x = 0
            backdropSprite.y = rect.y
            backdropSprite.width = canvasW
            backdropSprite.height = rect.h
        }

        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
        container.mask = mask
    }

    return { ensureBackdrop }
}
