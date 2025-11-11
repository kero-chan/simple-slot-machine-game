import { Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function getTextureForSymbol(symbol, useGold = false) {
    const alias = useGold ? `${symbol}_gold` : symbol
    const src = ASSETS.loadedImages?.[alias] || ASSETS.imagePaths?.[alias]
    if (src) return src instanceof Texture ? src : Texture.from(src)
    if (useGold) {
        const normal = ASSETS.loadedImages?.[symbol] || ASSETS.imagePaths?.[symbol]
        return normal ? (normal instanceof Texture ? normal : Texture.from(normal)) : null
    }
    return null
}
