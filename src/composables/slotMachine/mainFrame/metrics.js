import { CONFIG } from '../../../config/constants'

export function computeGridMetrics(mainRect) {
  const cols = CONFIG.reels.count
  const totalRows = CONFIG.reels.rows

  // Width-driven tile size with 10px margins; no gaps between tiles
  const marginX = 10
  const spacingX = 0
  const spacingY = 0
  const symbolSize = (mainRect.w - marginX * 2) / cols

  const boardW = cols * symbolSize + (cols - 1) * spacingX
  const originX = mainRect.x + marginX

  // Top row hidden by 70%; bottom peek controlled by mainRect height
  const topHiddenFraction = 0.7
  const originY = mainRect.y - topHiddenFraction * symbolSize

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
