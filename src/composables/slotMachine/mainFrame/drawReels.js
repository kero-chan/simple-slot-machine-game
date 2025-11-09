import { Container } from 'pixi.js'
import { computeGridMetrics } from './metrics'
import { Tile } from './drawTile'

// Cache Tile instances by col,row
const tilesCache = new Map()
let lastTimestamp = 0

// Pending disappear marks to be applied on next draw
const pendingDisappearPositions = new Set()

// Container for all tiles
let reelsContainer = null

// Expose a helper to mark tiles for disappearance using col,row pairs
export function markTilesToDisappear(positions) {
  for (const [col, row] of positions) {
    pendingDisappearPositions.add(`${col},${row}`)
  }
}

export function drawReels(container, mainRect, gridState, gameState) {
  const m = computeGridMetrics(mainRect)

  // Create reels container if needed
  if (!reelsContainer) {
    reelsContainer = new Container()
    container.addChild(reelsContainer)
  }

  const nowTs = performance.now()
  const baseAlpha = 1

  const deltaSec = lastTimestamp
    ? Math.min(0.05, Math.max(0.001, (nowTs - lastTimestamp) / 1000))
    : 0.016
  lastTimestamp = nowTs

  for (let col = 0; col < m.cols; col++) {
    const offsetTiles = (gridState.spinOffsets?.value?.[col] ?? 0)
    const velocityTiles = (gridState.spinVelocities?.value?.[col] ?? 0)
    const velocityPx = velocityTiles * m.symbolSize

    for (let row = 0; row < m.rows; row++) {
      const x = m.originX + col * (m.symbolSize + m.spacingX)
      const baseY = m.originY + row * (m.symbolSize + m.spacingY)
      const y = baseY + offsetTiles * m.symbolSize

      const spinning = gameState.isSpinning.value || offsetTiles > 0
      const symbol = spinning
        ? (() => {
            const strip = gridState.reelStrips.value[col]
            const top = gridState.reelTopIndex.value[col]
            const idx = (top + row) % strip.length
            return strip[idx]
          })()
        : gridState.grid.value[col][row]

      const isWinning = gridState.highlightWins.value
        ? gridState.highlightWins.value.some(win =>
            win.positions.some(([c, r]) => c === col && r === row)
          )
        : false

      const key = `${col},${row}`
      let tile = tilesCache.get(key)
      if (!tile) {
        tile = new Tile(x, y, m.symbolSize, symbol)
        tilesCache.set(key, tile)
        reelsContainer.addChild(tile.container)
      } else {
        tile.setPosition(x, y)
        tile.setSize(m.symbolSize)
        tile.setSymbol(symbol)
      }

      // Apply pending disappear marks (once)
      if (pendingDisappearPositions.has(key) && !tile.isDisappearing) {
        tile.startDisappear()
        pendingDisappearPositions.delete(key)
      }

      tile.setVelocityPx(velocityPx)
      tile.setWinning(isWinning)
      tile.update(deltaSec)

      // Optional: reset state after disappearance completes so new symbols render
      if (tile.isDisappearComplete()) {
        tile.isDisappearing = false
        tile.disappearProgress = 0
      }

      tile.draw(nowTs, baseAlpha)
    }
  }
}
