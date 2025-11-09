import { ASSETS } from '../../config/assets'
import { CONFIG } from '../../config/constants'

export function useMainFrame(canvasState, gameState, gridState) {
    function roundedRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, Math.min(w, h) / 2)
        ctx.beginPath()
        ctx.moveTo(x + rr, y)
        ctx.arcTo(x + w, y, x + w, y + h, rr)
        ctx.arcTo(x + w, y + h, x, y + h, rr)
        ctx.arcTo(x, y + h, x, y, rr)
        ctx.arcTo(x, y, x + w, y, rr)
        ctx.closePath()
    }

    function drawSymbol(ctx, symbolKey, x, y, size) {
        const symbol = ASSETS.symbols[symbolKey]
        if (!symbol) return
        const img = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey]
        if (img && img.complete && img.naturalHeight !== 0) {
            // zero padding so tiles visually touch
            const padding = 0
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

    function computeGridMetrics(mainRect) {
        const cols = CONFIG.reels.count
        const totalRows = CONFIG.reels.rows // 6 rows in grid

        // Width-driven tile size with 10px margins and no horizontal gaps
        const marginX = 10
        const symbolSize = (mainRect.w - marginX * 2) / cols

        // No gaps between tiles
        const spacingX = 0
        const spacingY = 0

        // Board width centered within mainRect horizontally
        const boardW = cols * symbolSize + (cols - 1) * spacingX
        const originX = mainRect.x + marginX

        // Vertical positioning:
        // Show 30% of row 0 inside mainRect (i.e., 70% hidden above header)
        const topHiddenFraction = 0.7
        const originY = mainRect.y - topHiddenFraction * symbolSize

        // Board height for 6 rows (used for background if needed)
        const boardH = totalRows * symbolSize + (totalRows - 1) * spacingY

        return {
            symbolSize,
            spacingX,
            spacingY,
            cols,
            rows: totalRows,
            boardW,
            boardH,
            originX,
            originY
        }
    }

    function drawReels(ctx, mainRect) {
        const m = computeGridMetrics(mainRect)

        const highlightSet = new Set()
        if (gridState.highlightWins.value) {
            gridState.highlightWins.value.forEach(win => {
                win.positions.forEach(([col, row]) => {
                    highlightSet.add(`${col},${row}`)
                })
            })
        }

        for (let col = 0; col < m.cols; col++) {
            for (let row = 0; row < m.rows; row++) {
                const x = m.originX + col * (m.symbolSize + m.spacingX)
                const y = m.originY + row * (m.symbolSize + m.spacingY)

                const symbol = gridState.grid.value[col][row]
                drawSymbol(ctx, symbol, x, y, m.symbolSize)
            }
        }
    }

    function draw(ctx, w, h, mainRect) {
        // Full-canvas green backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, '#1f7a3f')
        grad.addColorStop(0.5, '#2e8f4b')
        grad.addColorStop(1, '#207940')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // No rounded wrapper; draw tiles only
        drawReels(ctx, mainRect)
    }

    return { draw }
}
