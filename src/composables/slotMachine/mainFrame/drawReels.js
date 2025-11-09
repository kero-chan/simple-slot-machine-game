import { computeGridMetrics } from './metrics'
import { drawSymbol } from './drawSymbol'

export function drawReels(ctx, mainRect, gridState) {
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