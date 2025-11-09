export function useFooterBetControls(canvasState, gameState) {
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
    }

    function drawRingButton(ctx, btn, symbol, scale, disabled) {
        const cx = btn.x + btn.width / 2
        const cy = btn.y + btn.height / 2
        const r = Math.floor(Math.min(btn.width, btn.height) * 0.48)

        ctx.save()

        // Outer translucent ring
        ctx.lineWidth = Math.max(6, Math.floor(6 * scale))
        ctx.strokeStyle = disabled ? 'rgba(180,180,180,0.5)' : 'rgba(200,150,110,0.8)'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()

        // Inner ring
        ctx.lineWidth = Math.max(3, Math.floor(3 * scale))
        ctx.strokeStyle = disabled ? 'rgba(160,160,160,0.4)' : 'rgba(255,220,170,0.7)'
        ctx.beginPath()
        ctx.arc(cx, cy, r - Math.floor(6 * scale), 0, Math.PI * 2)
        ctx.stroke()

        // Symbol
        ctx.fillStyle = disabled ? 'rgba(200,200,200,0.7)' : 'rgba(255,255,255,0.95)'
        ctx.font = `bold ${Math.floor(28 * scale)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(symbol, cx, cy)

        // Soft shadow
        ctx.globalAlpha = 0.15
        ctx.beginPath()
        ctx.arc(cx, cy + Math.floor(4 * scale), r, 0, Math.PI * 2)
        ctx.fillStyle = '#000'
        ctx.fill()

        ctx.restore()
    }

    function draw(ctx, rect) {
        const scale = canvasState.scale.value
        const minusBtn = canvasState.buttons.value.betMinus
        const plusBtn = canvasState.buttons.value.betPlus
        const disabled = gameState.isSpinning.value

        drawRingButton(ctx, minusBtn, '−', scale, disabled)
        drawRingButton(ctx, plusBtn, '+', scale, disabled)
    }

    return { draw }
}
