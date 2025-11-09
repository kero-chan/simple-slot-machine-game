export function useFooterBar(canvasState) {
    function draw(ctx, rect) {
        const scale = canvasState.scale.value
        const { x, y, w, h } = rect

        // Wood base gradient
        const base = ctx.createLinearGradient(0, y, 0, y + h)
        base.addColorStop(0, '#a25f2a')
        base.addColorStop(0.35, '#b8733a')
        base.addColorStop(0.7, '#8e4f22')
        base.addColorStop(1, '#6c3a19')
        ctx.fillStyle = base
        ctx.fillRect(x, y, w, h)

        // Subtle grooves
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = Math.max(1, Math.floor(1 * scale))
        const grooveSpacing = Math.floor(14 * scale)
        for (let gy = y + grooveSpacing; gy < y + h; gy += grooveSpacing) {
            ctx.beginPath()
            ctx.moveTo(x + Math.floor(10 * scale), gy)
            ctx.quadraticCurveTo(x + w / 2, gy + Math.floor(3 * scale), x + w - Math.floor(10 * scale), gy)
            ctx.stroke()
        }

        // Top highlight strip
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(x, y + Math.floor(6 * scale), w, Math.floor(10 * scale))

        // Bottom shadow depth
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.fillRect(x, y + h - Math.floor(8 * scale), w, Math.floor(8 * scale))
    }

    return { draw }
}
