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

  const { playConsecutiveWinSound, playWinSound } = useAudioEffects()

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

    // STEP 2: Build reel strips that will land on the pre-determined symbols
    // Each strip has random symbols for visual variety, with target symbols at the end
    for (let col = 0; col < cols; col++) {
      const strip = []

      // IMPORTANT: Start with current grid symbols to prevent visual flicker
      // When spin starts, we switch from reading grid→strip, so first symbols must match
      for (let row = 0; row < totalRows; row++) {
        strip.push(gridState.grid[col][row])
      }

      // Add random spinning symbols (for visual effect during spin)
      const spinSymbolCount = stripLength - (totalRows * 2) // Account for both current and final
      for (let i = 0; i < spinSymbolCount; i++) {
        strip.push(getRandomSymbol({ col, allowGold: true, allowBonus: false }))
      }

      // Add the final target symbols at the end of the strip
      for (let row = 0; row < totalRows; row++) {
        strip.push(finalGrid[col][row])
      }

      gridState.reelStrips[col] = strip
    }

    // Trigger reactivity for arrays
    gridState.reelStrips = [...gridState.reelStrips]
    gridState.reelTopIndex = Array(cols).fill(0)
    gridState.spinOffsets = Array(cols).fill(0)
    gridState.spinVelocities = Array(cols).fill(0)

    // Update grid to finalGrid NOW so it matches strip when columns stop
    // This prevents strip/grid mismatches when render switches from strip to grid
    gridState.grid = [...finalGrid.map(col => [...col])]
    // Grid will be updated when animation completes

    // Track which columns have been explicitly stopped
    const stoppedColumns = new Set()

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

          // Skip columns that have been explicitly stopped
          if (stoppedColumns.has(col)) {
            continue
          }

          const elapsed = now - colStart
          const t = Math.min(elapsed / baseDuration, 1)

          // Calculate target position (where we want to end up)
          // Strip structure: [current(10), random(80), final(10)]
          // We want to land on the final symbols at the end
          const targetIndex = stripLength - totalRows // Last 10 symbols

          // Apply easing function for more realistic slowdown
          // Ease-out: starts fast, slows down smoothly at the end
          // Adjust the exponent to control slowdown: higher = slower stop
          // 2 = ease-out quadratic (gentle), 3 = cubic (medium), 4 = quartic (strong), 5 = quintic (very strong)
          const easedT = 1 - Math.pow(1 - t, 3.5)

          // Get current position before calculating new position
          const currentPosition = gridState.reelTopIndex[col] + gridState.spinOffsets[col]

          // Calculate the exact position we should be at based on eased progress
          const targetPosition = targetIndex * easedT

          // Calculate how close we are to the target
          const distanceRemaining = targetIndex - currentPosition

          // DEBUG: Log when we're close to stopping
          if (col === 0 && distanceRemaining < 2) {
            console.log(`Col ${col}: t=${t.toFixed(3)}, current=${currentPosition.toFixed(3)}, target=${targetIndex}, remaining=${distanceRemaining.toFixed(3)}, easedT=${easedT.toFixed(3)}, targetPos=${targetPosition.toFixed(3)}`)
          }

          // Stop condition: when very close, snap to exact target and stop
          if (distanceRemaining <= 0 || distanceRemaining < 0.01) {
            if (col === 0) console.log(`Col ${col}: STOPPED at position ${currentPosition.toFixed(3)}, snapping to ${targetIndex}`)
            // Snap to EXACT target position to ensure strip/grid alignment
            // This is critical: strip[targetIndex + gridRow] must equal finalGrid[col][gridRow]
            gridState.reelTopIndex[col] = targetIndex - 1
            gridState.spinOffsets[col] = 1
            gridState.spinVelocities[col] = 0
            stoppedColumns.add(col)
            continue
          }

          // Simple easing-based position (no complex convergence)
          let nextPosition = targetPosition

          // CRITICAL: Clamp nextPosition to valid range
          // 1. NEVER go backward (upward): nextPosition >= currentPosition
          // 2. NEVER overshoot (too far down): nextPosition <= targetIndex
          // This ensures tiles ONLY move in the correct direction and NEVER past target
          const beforeClamp = nextPosition
          nextPosition = Math.max(currentPosition, Math.min(nextPosition, targetIndex))

          if (col === 0 && distanceRemaining < 2 && beforeClamp !== nextPosition) {
            console.log(`Col ${col}: CLAMPED from ${beforeClamp.toFixed(3)} to ${nextPosition.toFixed(3)}`)
          }

          // Convert next position to reelTopIndex and offset
          const newTopIndex = Math.floor(nextPosition)
          const newOffset = nextPosition - newTopIndex

          // Calculate velocity for this frame (used by render loop to determine if spinning)
          const positionDelta = nextPosition - currentPosition
          const nearStop = (targetIndex - currentPosition) < 0.5
          gridState.spinVelocities[col] = nearStop ? 0 : positionDelta

          // Update position
          gridState.reelTopIndex[col] = newTopIndex % gridState.reelStrips[col].length
          gridState.spinOffsets[col] = newOffset

          allStopped = false
        }

        if (!allStopped) {
          requestAnimationFrame(animate)
        } else {
          // All reels stopped - animation complete
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
    playWinSound,
    showWinOverlay: showWinOverlayFn
  }
}
