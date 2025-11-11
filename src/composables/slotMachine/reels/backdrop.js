import { Graphics } from 'pixi.js'

export function createBackdrop(container) {
    const mask = new Graphics()
    // Don't add mask to children, just use it for masking
    container.mask = mask

    function ensureBackdrop(rect, canvasW) {
        // Update mask to clip reels to the board area
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
    }

    return { ensureBackdrop }
}
