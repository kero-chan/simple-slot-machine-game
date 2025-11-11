import { Graphics } from 'pixi.js'

export function createBackdrop(container) {
    const mask = new Graphics()
    const background = new Graphics()

    // Don't add mask to children, just use it for masking
    container.mask = mask
    container.addChild(background)

    function ensureBackdrop(rect, canvasW) {
        // Draw black background for reels area
        background.clear()
        background.rect(0, rect.y, canvasW, rect.h + 1)
        background.fill(0x000000)

        // Update mask to clip reels to the board area
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
    }

    return { ensureBackdrop }
}
