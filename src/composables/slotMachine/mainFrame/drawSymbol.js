import { Sprite, Text } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function createSymbolSprite(symbolKey, x, y, size) {
  const symbol = ASSETS.symbols[symbolKey]
  if (!symbol) return null

  const texture = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey]
  if (texture) {
    const sprite = new Sprite(texture)

    // Small padding so background glow is visible around edges
    const padding = Math.floor(size * 0.06)
    const w = size - padding * 2
    const h = size - padding * 2

    sprite.position.set(x + padding, y + padding)
    sprite.width = w
    sprite.height = h

    return sprite
  } else {
    // Fallback text
    const text = new Text({
      text: '...',
      style: {
        fontFamily: 'Arial',
        fontSize: Math.floor(size * 0.3),
        fill: 0xcccccc,
        align: 'center'
      }
    })
    text.anchor.set(0.5)
    text.position.set(x + size / 2, y + size / 2)
    return text
  }
}

export function updateSymbolSprite(sprite, symbolKey, x, y, size) {
  if (!sprite) return

  const texture = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey]
  if (texture && sprite instanceof Sprite) {
    sprite.texture = texture

    const padding = Math.floor(size * 0.06)
    const w = size - padding * 2
    const h = size - padding * 2

    sprite.position.set(x + padding, y + padding)
    sprite.width = w
    sprite.height = h
  } else if (sprite instanceof Text) {
    sprite.position.set(x + size / 2, y + size / 2)
    sprite.style.fontSize = Math.floor(size * 0.3)
  }
}
