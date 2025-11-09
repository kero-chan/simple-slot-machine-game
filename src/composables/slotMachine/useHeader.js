export function useHeader(canvasState, gameState) {
    function draw(ctx, rect) {
        const scale = canvasState.scale.value
        const { x, y, w, h } = rect

        const grad = ctx.createLinearGradient(0, y, 0, y + h)
        grad.addColorStop(0, '#a75b2a')
        grad.addColorStop(0.5, '#c1763d')
        grad.addColorStop(1, '#8a4b23')
        ctx.fillStyle = grad
        ctx.fillRect(x, y, w, h)

        // Placeholder multipliers centered vertically in header rect
        ctx.fillStyle = '#ffd04d'
        ctx.font = `bold ${Math.floor(26 * scale)}px Arial`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const padX = Math.floor(20 * scale)
        ctx.fillText('x1    x2    x3    x5', x + padX, y + h / 2)
    }

    return { draw }
}
