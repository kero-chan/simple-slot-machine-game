export function useFooterInfoDisplays(canvasState, gameState) {
    function drawPill(ctx, rx, ry, rw, rh, scale) {
        const r = Math.floor(rh / 2)
        ctx.save()

        // Beveled pill
        const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh)
        grad.addColorStop(0, 'rgba(80, 40, 20, 0.15)')
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)')
        ctx.fillStyle = grad

        ctx.beginPath()
        ctx.moveTo(rx + r, ry)
        ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r)
        ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r)
        ctx.arcTo(rx, ry + rh, rx, ry, r)
        ctx.arcTo(rx, ry, rx + rw, ry, r)
        ctx.closePath()
        ctx.fill()

        // Inner soft highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = Math.max(2, Math.floor(2 * scale))
        ctx.stroke()

        ctx.restore()
    }

    function formatNumber(n) {
        return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    function draw(ctx, rect) {
        const scale = canvasState.scale.value
        const { x, y, w } = rect

        // Layout: top row for pills
        const topMargin = Math.floor(8 * scale)
        const pillHeight = Math.floor(48 * scale)
        const rowY = y + topMargin

        const gap = Math.floor(12 * scale)
        const pillWidth = Math.floor((w - gap * 2) / 3)

        const labels = ['CREDITS', 'BET', 'WIN']
        const values = [
            formatNumber(gameState.credits.value),
            formatNumber(gameState.bet.value),
            formatNumber(gameState.currentWin.value)
        ]

        for (let i = 0; i < 3; i++) {
            const rx = x + i * (pillWidth + gap)
            const ry = rowY
            drawPill(ctx, rx, ry, pillWidth, pillHeight, scale)

            // Icon disk on left
            const iconR = Math.floor(pillHeight * 0.32)
            const iconCx = rx + Math.floor(iconR * 1.5)
            const iconCy = ry + Math.floor(pillHeight / 2)
            const iconGrad = ctx.createRadialGradient(iconCx, iconCy, 0, iconCx, iconCy, iconR)
            iconGrad.addColorStop(0, '#cfa26a')
            iconGrad.addColorStop(1, '#8d5b2b')
            ctx.fillStyle = iconGrad
            ctx.beginPath()
            ctx.arc(iconCx, iconCy, iconR, 0, Math.PI * 2)
            ctx.fill()

            // Label
            ctx.fillStyle = 'rgba(255, 228, 120, 0.95)'
            ctx.font = `bold ${Math.floor(14 * scale)}px Arial`
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            const textX = iconCx + Math.floor(iconR * 1.3)
            ctx.fillText(labels[i], textX, ry + Math.floor(pillHeight * 0.35))

            // Value in cyan
            ctx.fillStyle = '#9fe8ff'
            ctx.font = `bold ${Math.floor(22 * scale)}px Arial`
            ctx.fillText(values[i], textX, ry + Math.floor(pillHeight * 0.72))
        }
    }

    return { draw }
}
