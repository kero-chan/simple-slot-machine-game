import { computeGridMetrics } from './metrics'
import { drawSymbol } from './drawSymbol'

export function drawReels(ctx, mainRect, gridState, gameState) {
  const m = computeGridMetrics(mainRect)

  const highlightSet = new Set()
  if (gridState.highlightWins.value) {
    gridState.highlightWins.value.forEach(win => {
      win.positions.forEach(([col, row]) => {
        highlightSet.add(`${col},${row}`)
      })
    })
  }

  const visualSymbolAt = (col, row) => {
    const spinning = gameState.isSpinning.value || (gridState.spinOffsets?.value?.[col] ?? 0) > 0
    if (spinning) {
      const strip = gridState.reelStrips.value[col]
      const top = gridState.reelTopIndex.value[col]
      const idx = (top + row) % strip.length
      return strip[idx]
    }
    return gridState.grid.value[col][row]
  }

  for (let col = 0; col < m.cols; col++) {
    const offsetTiles = (gridState.spinOffsets?.value?.[col] ?? 0)
    const velocityTiles = (gridState.spinVelocities?.value?.[col] ?? 0)
    const velocityPx = velocityTiles * m.symbolSize

    for (let row = 0; row < m.rows; row++) {
      const x = m.originX + col * (m.symbolSize + m.spacingX)
      const baseY = m.originY + row * (m.symbolSize + m.spacingY)
      const y = baseY + offsetTiles * m.symbolSize

      const symbol = visualSymbolAt(col, row)

      // Motion blur while moving down; trail extends upward
      if (gameState.isSpinning.value && velocityPx > 2) {
        ctx.save()
        const blurSteps = Math.min(Math.floor(velocityPx / 2), 12)
        for (let i = blurSteps; i >= 1; i--) {
          const alpha = 0.13 * (1 - i / (blurSteps + 1))
          ctx.globalAlpha = alpha
          const trailY = y - (i * velocityPx * 0.18)
          drawSymbol(ctx, symbol, x, trailY, m.symbolSize)
        }
        ctx.restore()
      }

      drawSymbol(ctx, symbol, x, y, m.symbolSize)
    }
  }
}
