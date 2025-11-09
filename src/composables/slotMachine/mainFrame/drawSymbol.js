import { ASSETS } from '../../../config/assets'
export function drawSymbol(ctx, symbolKey, x, y, size) {
  const symbol = ASSETS.symbols[symbolKey]
  if (!symbol) return
  const img = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey]
  if (img && img.complete && img.naturalHeight !== 0) {
    // small padding so background glow is visible around edges
    const padding = Math.floor(size * 0.06)   // slightly smaller padding than before
    const w = size - padding * 2
    const h = size - padding * 2
    ctx.drawImage(img, x + padding, y + padding, w, h)
  } else {
    ctx.fillStyle = '#CCCCCC'
    ctx.font = `${Math.floor(size * 0.3)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('...', x + size / 2, y + size / 2)
  }
}
