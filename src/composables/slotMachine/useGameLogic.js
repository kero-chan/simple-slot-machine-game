import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset, enforceBonusLimit, createEmptyGrid } from '../../utils/gameHelpers'
import { getTileBaseSymbol, isTileWildcard, isBonusTile, isTileGolden } from '../../utils/tileHelpers'
import { useAudioEffects } from '../useAudioEffects'
import { useGameStore } from '../../stores/gameStore'
import { useTimingStore } from '../../stores/timingStore'

/**
 * Game Logic - State machine based architecture
 * Each function performs a specific action and returns a promise
 * Flow orchestration is handled by useGameFlowController
 */
export function useGameLogic(gameState, gridState, render, showWinOverlayFn) {
  const gameStore = useGameStore()
  const timingStore = useTimingStore()

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

        if (matches.length === 0) {
          break
        }

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

    // IMPORTANT: Only return wins for ONE symbol type at a time
    // This prevents multiple different symbols being highlighted together
    if (allWinCombos.length > 0) {
      const firstSymbol = allWinCombos[0].symbol
      const singleSymbolWins = allWinCombos.filter(win => win.symbol === firstSymbol)

      return singleSymbolWins
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
    const baseDuration = timingStore.SPIN_BASE_DURATION
    const stagger = timingStore.SPIN_REEL_STAGGER
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
    const cols = CONFIG.reels.count
    const stripLength = CONFIG.reels.stripLength

    console.log('🎰 [SPIN START] totalRows:', totalRows, 'stripLength:', stripLength)

    // STEP 1: Pre-determine the final grid BEFORE animation starts
    // This ensures visual stability - what you see is what you get
    const finalGrid = createEmptyGrid()
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < totalRows; row++) {
        const allowBonus = row >= BUFFER_OFFSET // Only allow bonus in visible rows
        finalGrid[col][row] = getRandomSymbol({ col, allowGold: true, allowBonus })
      }
    }

    // Enforce bonus limit across visible rows
    enforceBonusLimit(finalGrid, BUFFER_OFFSET)

    console.log('🎯 [FINAL GRID PRE-DETERMINED] Visible rows (4-8):')
    for (let col = 0; col < cols; col++) {
      const visibleSymbols = []
      for (let row = BUFFER_OFFSET; row < BUFFER_OFFSET + 4; row++) {
        visibleSymbols.push(finalGrid[col][row])
      }
      console.log(`  Col ${col}:`, visibleSymbols)
    }

    // STEP 2: Build reel strips that will land on the pre-determined symbols
    // Each strip has random symbols for visual variety, with target symbols at the end
    for (let col = 0; col < cols; col++) {
      const strip = []

      // Add random spinning symbols (for visual effect during spin)
      const spinSymbolCount = stripLength - totalRows
      for (let i = 0; i < spinSymbolCount; i++) {
        strip.push(getRandomSymbol({ col, allowGold: true, allowBonus: false }))
      }

      // Add the final target symbols at the end of the strip
      for (let row = 0; row < totalRows; row++) {
        strip.push(finalGrid[col][row])
      }

      gridState.reelStrips[col] = strip

      // Log strip structure
      console.log(`📜 [STRIP ${col}] Length: ${strip.length}, Last ${totalRows} symbols (target):`, strip.slice(-totalRows))
    }

    // Trigger reactivity for arrays
    gridState.reelStrips = [...gridState.reelStrips]
    gridState.reelTopIndex = Array(cols).fill(0)
    gridState.spinOffsets = Array(cols).fill(0)
    gridState.spinVelocities = Array(cols).fill(0)

    // STEP 3: Update grid immediately with final results
    // This way, when animation ends, grid is already correct (no flickering)
    gridState.grid = [...finalGrid.map(col => [...col])]
    console.log('✅ [GRID SET] Grid updated with final results immediately')

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
          const t = Math.min(elapsed / baseDuration, 1)

          // Calculate target position (where we want to end up)
          const targetIndex = stripLength - totalRows // Position 90 for stripLength=100, totalRows=10

          // Time's up - stop this reel
          if (t >= 1) {
            // Snap to exact target position
            gridState.reelTopIndex[col] = targetIndex
            gridState.spinOffsets[col] = 0
            gridState.spinVelocities[col] = 0

            // Log what this column should show
            const strip = gridState.reelStrips[col]
            const visibleSymbols = []
            for (let row = 0; row < totalRows; row++) {
              const stripIdx = (targetIndex + row) % strip.length
              visibleSymbols.push(strip[stripIdx])
            }
            console.log(`🛑 [COL ${col} STOPPED] reelTopIndex=${targetIndex}, offset=${0}, showing:`, visibleSymbols.slice(BUFFER_OFFSET, BUFFER_OFFSET + 4))

            continue
          }

          // Calculate how far we need to travel total (from 0 to targetIndex)
          const totalDistance = targetIndex // 90 tiles

          // Current position
          const currentPosition = gridState.reelTopIndex[col] + gridState.spinOffsets[col]

          // Calculate remaining distance to target
          const remainingDistance = targetIndex - currentPosition

          // Calculate remaining time in milliseconds
          const remainingTimeMs = baseDuration * (1 - t)

          // Estimate frames remaining (assuming 60fps, so ~16.67ms per frame)
          const msPerFrame = 16.67
          const framesRemaining = Math.max(1, remainingTimeMs / msPerFrame)

          // Calculate velocity needed to reach target position over remaining frames
          // This ensures we arrive at exactly targetIndex when t=1
          const velocity = Math.max(0, remainingDistance / framesRemaining)

          // Log velocity calculation for debugging (only log occasionally to avoid spam)
          if (col === 0 && Math.floor(t * 100) % 10 === 0) {
            console.log(`⚡ [COL ${col} VELOCITY] t=${t.toFixed(3)}, currentPos=${currentPosition.toFixed(2)}, remainingDist=${remainingDistance.toFixed(2)}, framesLeft=${framesRemaining.toFixed(1)}, velocity=${velocity.toFixed(3)}`)
          }

          // Update spinning state
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
          // All reels stopped - grid is already set correctly, no updates needed
          console.log('🏁 [ALL STOPPED] Final grid state:')
          for (let col = 0; col < cols; col++) {
            const visibleSymbols = []
            for (let row = BUFFER_OFFSET; row < BUFFER_OFFSET + 4; row++) {
              visibleSymbols.push(gridState.grid[col][row])
            }
            console.log(`  Col ${col}:`, visibleSymbols)
          }
          resolve()
        }
      }
      animate()
    })
  }

  let highlightAnimationActive = false
  let stopHighlightRequested = false

  const highlightWinsAnimation = (wins) => {
    const duration = timingStore.HIGHLIGHT_ANIMATION_DURATION
    const startTime = Date.now()
    gridState.highlightAnim = { start: startTime, duration }
    highlightAnimationActive = true
    stopHighlightRequested = false

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime

        // Check if stop was requested
        if (stopHighlightRequested || elapsed >= duration) {
          gridState.highlightWins = null
          gridState.highlightAnim = { start: 0, duration: 0 }
          highlightAnimationActive = false
          stopHighlightRequested = false
          resolve()
          return
        }

        gridState.highlightWins = wins
        requestAnimationFrame(animate)
      }
      animate()
    })
  }

  const stopHighlightAnimation = () => {
    if (highlightAnimationActive) {
      stopHighlightRequested = true
    }
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
    return Promise.resolve()  // Instant - tiles already hidden
  }

  const animateDisappear = (wins) => {
    // After flip completes, wait a moment before cascading
    // This gives users time to see the tiles have disappeared
    const DISAPPEAR_MS = timingStore.DISAPPEAR_WAIT

    const positions = []
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => positions.push([col, row]))
    })
    gridState.disappearPositions = new Set(
      positions.map(([c, r]) => `${c},${r}`)
    )
    gridState.disappearAnim = { start: Date.now(), duration: DISAPPEAR_MS }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, DISAPPEAR_MS)
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
    const MAX_WAIT = timingStore.CASCADE_MAX_WAIT

    return new Promise(resolve => {
      const animate = () => {
        // Render to update isDropAnimating flag (set in draw loop)
        render()

        const elapsed = Date.now() - startTime
        const shouldWait = gridState.isDropAnimating

        if (shouldWait && elapsed < MAX_WAIT) {
          requestAnimationFrame(animate)
        } else {
          if (elapsed >= MAX_WAIT) {
            console.warn('⚠️ animateCascade: Hit max wait time')
          }
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
    stopHighlightAnimation,
    transformGoldTilesToWild,
    animateDisappear,
    cascadeSymbols,
    getWinIntensity,
    playConsecutiveWinSound,
    showWinOverlay: showWinOverlayFn
  }
}
