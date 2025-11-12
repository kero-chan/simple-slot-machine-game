import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset, enforceBonusLimit } from '../../utils/gameHelpers'
import { getTileBaseSymbol, isTileWildcard, isBonusTile, isTileGolden } from '../../utils/tileHelpers'
import { useAudioEffects } from '../useAudioEffects'
import { useGameStore } from '../../stores/gameStore'

/**
 * Game Logic - State machine based architecture
 * Each function performs a specific action and returns a promise
 * Flow orchestration is handled by useGameFlowController
 */
export function useGameLogic(gameState, gridState, render, showWinOverlayFn) {
  const gameStore = useGameStore()

  // Buffer offset for accessing game rows in expanded grid
  const BUFFER_OFFSET = getBufferOffset()
  const VISIBLE_START_ROW = BUFFER_OFFSET + 1
  const VISIBLE_ROWS = 4
  const VISIBLE_END_ROW = VISIBLE_START_ROW + VISIBLE_ROWS - 1

  const { playConsecutiveWinSound } = useAudioEffects()

  const getWinIntensity = (wins) => {
    if (!wins || wins.length === 0) return 'small'

    const highValueSymbols = ['chu', 'zhong', 'fa']
    let maxIntensity = 'small'

    wins.forEach(win => {
      const { count, symbol } = win
      let intensity = 'small'

      if (count >= 5 && highValueSymbols.includes(symbol)) {
        intensity = 'mega'
      } else if (count >= 5 || (count >= 4 && highValueSymbols.includes(symbol))) {
        intensity = 'big'
      } else if (count >= 4) {
        intensity = 'medium'
      }

      const intensityLevels = { small: 1, medium: 2, big: 3, mega: 4 }
      if (intensityLevels[intensity] > intensityLevels[maxIntensity]) {
        maxIntensity = intensity
      }
    })

    return maxIntensity
  }

  const findWinningCombinations = () => {
    const allWinCombos = []
    const symbolsToCheck = Object.keys(CONFIG.paytable).filter(s => s !== 'liangtong' && s !== 'wild')

    for (const symbol of symbolsToCheck) {
      const positionsPerReel = []

      for (let col = 0; col < CONFIG.reels.count; col++) {
        const matches = []

        for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
          const cell = gridState.grid[col][row]
          const baseSymbol = getTileBaseSymbol(cell)
          const isWild = isTileWildcard(cell)

          const isMatch = baseSymbol === symbol || isWild
          if (isMatch) {
            matches.push([col, row])
          }
        }

        if (matches.length === 0) break
        positionsPerReel.push(matches)
      }

      const matchedReels = positionsPerReel.length

      if (matchedReels >= 3) {
        const firstColumnMatches = positionsPerReel[0]
        const firstColHasSymbol = firstColumnMatches.some(([col, row]) => {
          const cell = gridState.grid[col][row]
          const baseSymbol = getTileBaseSymbol(cell)
          return baseSymbol === symbol
        })

        if (!firstColHasSymbol) {
          continue
        }

        const generateWayCombinations = (reelPositions, currentCombo = [], reelIndex = 0) => {
          if (reelIndex === reelPositions.length) {
            allWinCombos.push({
              symbol,
              count: reelPositions.length,
              positions: [...currentCombo]
            })
            return
          }

          for (const position of reelPositions[reelIndex]) {
            generateWayCombinations(reelPositions, [...currentCombo, position], reelIndex + 1)
          }
        }

        generateWayCombinations(positionsPerReel)
      }
    }

    return allWinCombos
  }

  const calculateWinAmount = (wins) => {
    let total = 0
    for (const win of wins) {
      const paytable = CONFIG.paytable[win.symbol]
      if (paytable && paytable[win.count]) {
        total += paytable[win.count]
      }
    }
    return total
  }

  const animateSpin = () => {
    const startTime = Date.now()
    const baseDuration = 2500 // Much longer spin duration
    const stagger = CONFIG.animation.reelStagger || 150
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
    const cols = CONFIG.reels.count

    // Regenerate fresh random strips
    gridState.regenerateReelStrips()

    return new Promise(resolve => {
      const animate = () => {
        const now = Date.now()
        let allStopped = true

        for (let col = 0; col < cols; col++) {
          const colStart = startTime + col * stagger
          if (now < colStart) {
            allStopped = false
            continue
          }

          const elapsed = now - colStart
          const t = elapsed / baseDuration

          // Calculate velocity with easing - smoother slowdown
          const ease = 1 - Math.pow(1 - t, 3) // easeOutCubic (smoother than quint/septic)
          const velocity = (1 - ease) * 1.4 // Fast spin speed

          // Time's up - snap to nearest clean boundary
          if (t >= 1) {
            // If more than halfway to next tile, complete the crossing (push down)
            // Otherwise, stay at current tile (snap back slightly)
            if (gridState.spinOffsets[col] > 0.5) {
              gridState.reelTopIndex[col] = (gridState.reelTopIndex[col] + 1) % gridState.reelStrips[col].length
            }

            // Snap to 0
            gridState.spinOffsets[col] = 0

            // Update grid for this column NOW
            const strip = gridState.reelStrips[col]
            const topIdx = gridState.reelTopIndex[col]
            for (let row = 0; row < totalRows; row++) {
              const stripIdx = (topIdx + row) % strip.length
              gridState.grid[col][row] = strip[stripIdx]
            }

            // Set velocity to 0 AFTER updating grid
            gridState.spinVelocities[col] = 0
            continue
          }

          // Normal spinning
          gridState.spinVelocities[col] = velocity
          gridState.spinOffsets[col] += velocity

          // Wrap when crossing tile boundary
          while (gridState.spinOffsets[col] >= 1) {
            gridState.spinOffsets[col] -= 1
            gridState.reelTopIndex[col] = (gridState.reelTopIndex[col] + 1) % gridState.reelStrips[col].length
          }

          allStopped = false
        }

        if (!allStopped) {
          requestAnimationFrame(animate)
        } else {
          // Copy final strip positions to grid
          for (let col = 0; col < cols; col++) {
            const strip = gridState.reelStrips[col]
            const topIdx = gridState.reelTopIndex[col]

            for (let row = 0; row < totalRows; row++) {
              const stripIdx = (topIdx + row) % strip.length
              gridState.grid[col][row] = strip[stripIdx]
            }
          }

          resolve()
        }
      }
      animate()
    })
  }

  const highlightWinsAnimation = (wins) => {
    const duration = 2500 // ms
    const startTime = Date.now()
    gridState.highlightAnim = { start: startTime, duration }

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < duration) {
          gridState.highlightWins = wins
          requestAnimationFrame(animate)
        } else {
          gridState.highlightWins = null
          gridState.highlightAnim = { start: 0, duration: 0 }
          resolve()
        }
      }
      animate()
    })
  }

  const transformGoldTilesToWild = (wins) => {
    const transformedPositions = new Set()
    let transformCount = 0

    wins.forEach(win => {
      win.positions = win.positions.filter(([col, row]) => {
        const currentTile = gridState.grid[col][row]
        const isGolden = isTileGolden(currentTile)
        const isWild = isTileWildcard(currentTile)

        if (isGolden && !isWild) {
          gridState.grid[col][row] = 'wild'
          transformedPositions.add(`${col},${row}`)
          transformCount++
          return false
        }
        return true
      })
    })

    gridState.grid = [...gridState.grid]
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  const animateDisappear = (wins) => {
    const DISAPPEAR_MS = 300
    const startTime = Date.now()

    const positions = []
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => positions.push([col, row]))
    })
    gridState.disappearPositions = new Set(
      positions.map(([c, r]) => `${c},${r}`)
    )
    gridState.disappearAnim = { start: startTime, duration: DISAPPEAR_MS }

    return new Promise(resolve => {
      const loop = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < DISAPPEAR_MS) {
          requestAnimationFrame(loop)
        } else {
          gridState.disappearPositions.clear()
          gridState.disappearAnim = { start: 0, duration: 0 }
          render()
          resolve()
        }
      }
      loop()
    })
  }

  const cascadeSymbols = async (wins) => {
    const toRemove = new Set()
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        toRemove.add(`${col},${row}`)
      })
    })

    gridState.lastRemovedPositions = toRemove
    gridState.previousGridSnapshot = gridState.grid.map(col => [...col])

    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET

    for (let col = 0; col < CONFIG.reels.count; col++) {
      const rowsToRemove = []
      for (let row = BUFFER_OFFSET; row < totalRows; row++) {
        if (toRemove.has(`${col},${row}`)) {
          rowsToRemove.push(row)
        }
      }

      if (rowsToRemove.length === 0) continue

      const newColumn = []
      const keptGameTiles = []
      for (let row = totalRows - 1; row >= BUFFER_OFFSET; row--) {
        if (!toRemove.has(`${col},${row}`)) {
          const symbol = gridState.grid[col][row]
          keptGameTiles.unshift(symbol)
        }
      }

      const needFromBuffer = rowsToRemove.length
      const takeFromBuffer = []
      for (let i = BUFFER_OFFSET - needFromBuffer; i < BUFFER_OFFSET; i++) {
        if (i >= 0) {
          takeFromBuffer.push(gridState.grid[col][i])
        }
      }

      let bonusCountInVisibleRows = 0
      for (const tile of keptGameTiles) {
        if (isBonusTile(tile)) bonusCountInVisibleRows++
      }
      for (const tile of takeFromBuffer) {
        if (isBonusTile(tile)) bonusCountInVisibleRows++
      }

      for (let i = 0; i < needFromBuffer; i++) {
        const allowBonus = bonusCountInVisibleRows < 1
        const newSymbol = getRandomSymbol({ col, allowGold: true, allowBonus })
        newColumn.push(newSymbol)
        if (isBonusTile(newSymbol)) {
          bonusCountInVisibleRows++
        }
      }

      for (let i = 0; i < BUFFER_OFFSET - needFromBuffer; i++) {
        newColumn.push(gridState.grid[col][i])
      }

      takeFromBuffer.forEach(tile => newColumn.push(tile))
      keptGameTiles.forEach(tile => newColumn.push(tile))

      gridState.grid[col] = newColumn
    }

    gridState.grid = [...gridState.grid]
    gridState.lastCascadeTime = Date.now()

    await animateCascade()
  }

  const animateCascade = () => {
    const startTime = Date.now()
    const MAX_WAIT = 5000

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const shouldWait = gridState.isDropAnimating

        if (shouldWait && elapsed < MAX_WAIT) {
          requestAnimationFrame(animate)
        } else {
          if (elapsed >= MAX_WAIT) {
            console.warn('⚠️ animateCascade: Hit max wait time')
          }
          render()
          resolve()
        }
      }
      animate()
    })
  }

  const spin = async () => {
    const started = gameStore.startSpinCycle()
    if (!started) return

    await animateSpin()
    gameStore.completeSpinAnimation()
  }

  const increaseBet = () => {
    gameStore.increaseBet()
  }

  const decreaseBet = () => {
    gameStore.decreaseBet()
  }

  return {
    spin,
    increaseBet,
    decreaseBet,
    animateSpin,
    findWinningCombinations,
    calculateWinAmount,
    highlightWinsAnimation,
    transformGoldTilesToWild,
    animateDisappear,
    cascadeSymbols,
    getWinIntensity,
    playConsecutiveWinSound,
    showWinOverlay: showWinOverlayFn
  }
}
