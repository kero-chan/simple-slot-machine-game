import { Graphics, Sprite, Texture, Assets } from 'pixi.js'
import { ASSETS as GAME_ASSETS } from '../../../config/assets'

export function createBackdrop(container) {
    const mask = new Graphics()
    const background = new Sprite()
    
    // Load background texture asynchronously
    const loadBackgroundTexture = async () => {
        try {
            const texture = await Assets.load(GAME_ASSETS.imagePaths.background_reel)
            background.texture = texture
            console.log('✅ Reel background loaded:', GAME_ASSETS.imagePaths.background_reel)
        } catch (error) {
            console.error('❌ Failed to load reel background:', error)
            // Fallback: draw black background
            const fallbackGraphics = new Graphics()
            fallbackGraphics.rect(0, 0, 1000, 1000)
            fallbackGraphics.fill(0x000000)
            background.texture = Texture.from(fallbackGraphics)
        }
    }
    
    // Start loading immediately
    loadBackgroundTexture()

    // Don't add mask to children, just use it for masking
    container.mask = mask
    container.addChild(background)

    function ensureBackdrop(rect, canvasW) {
        // Position and scale background image to fit reels area
        background.x = 0
        background.y = rect.y
        background.width = canvasW
        background.height = rect.h + 1

        // Update mask to clip reels to the board area
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
    }

    return { ensureBackdrop }
}
