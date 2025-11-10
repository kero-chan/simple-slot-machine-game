export function useHeader(canvasState, gameState) {
  function draw(ctx, rect) {
    if (!ctx) return
    const { w, h } = rect
    const scale = canvasState.scale.value

    // Background gradient
    ctx.save()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#a75b2a')
    grad.addColorStop(0.5, '#c1763d')
    grad.addColorStop(1, '#8a4b23')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.restore()

    // Multipliers text
    ctx.save()
    ctx.fillStyle = '#ffd04d'
    ctx.font = `bold ${Math.floor(26 * scale)}px Arial`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const text = 'x1    x2    x3    x5'
    ctx.fillText(text, Math.floor(20 * scale), h / 2)
    ctx.restore()
  }

  return { draw }
}
