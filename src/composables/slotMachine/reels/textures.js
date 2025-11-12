import { Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { getTileBaseSymbol, isTileGolden } from '../../../utils/tileHelpers'

export function getTextureForSymbol(symbol, useGold = false) {
    const baseSymbol = getTileBaseSymbol(symbol)
    const isGold = useGold || isTileGolden(symbol)

    // Map symbol name to tile asset key
    const tileKey = isGold ? `tile_${baseSymbol}_gold` : `tile_${baseSymbol}`

    // Try to get from loaded images first, then from image paths
    const src = ASSETS.loadedImages?.[tileKey] || ASSETS.imagePaths?.[tileKey]
    if (src) return src instanceof Texture ? src : Texture.from(src)

    // If gold version not found, fallback to normal version
    if (isGold) {
        const normalKey = `tile_${baseSymbol}`
        const normal = ASSETS.loadedImages?.[normalKey] || ASSETS.imagePaths?.[normalKey]
        return normal ? (normal instanceof Texture ? normal : Texture.from(normal)) : null
    }

    return null
}
