import { Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function getTextureForSymbol(symbol, useGold = false) {
    // Map symbol name to tile asset key
    const tileKey = useGold ? `tile_${symbol}_gold` : `tile_${symbol}`

    // Try to get from loaded images first, then from image paths
    const src = ASSETS.loadedImages?.[tileKey] || ASSETS.imagePaths?.[tileKey]
    if (src) return src instanceof Texture ? src : Texture.from(src)

    // If gold version not found, fallback to normal version
    if (useGold) {
        const normalKey = `tile_${symbol}`
        const normal = ASSETS.loadedImages?.[normalKey] || ASSETS.imagePaths?.[normalKey]
        return normal ? (normal instanceof Texture ? normal : Texture.from(normal)) : null
    }

    return null
}
