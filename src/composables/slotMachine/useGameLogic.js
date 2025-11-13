import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset } from '../../utils/gameHelpers'
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

  // Calculate total rows dynamically
  const totalRows = CONFIG.reels.rows + CONFIG.reels.bufferRows // e.g., 6 + 4 = 10
  const bufferRows = CONFIG.reels.bufferRows // e.g., 4
  const fullyVisibleRows = CONFIG.reels.fullyVisibleRows // e.g., 4

  // Win check: Only check the fully visible rows
  // Start at bufferRows, end at bufferRows + fullyVisibleRows - 1
  // With bufferRows=4, fullyVisibleRows=4: rows 4-7
  const WIN_CHECK_START_ROW = bufferRows // e.g., 4
  const WIN_CHECK_END_ROW = bufferRows + fullyVisibleRows - 1 // e.g., 4 + 4 - 1 = 7

  // Bonus checking: Same as win checking
  const BONUS_CHECK_START_ROW = WIN_CHECK_START_ROW
  const BONUS_CHECK_END_ROW = WIN_CHECK_END_ROW

  const { playConsecutiveWinSound, playWinSound, playEffect } = useAudioEffects()

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

        // Check only the fully visible rows (excluding partially visible top and bottom)
        for (let row = WIN_CHECK_START_ROW; row <= WIN_CHECK_END_ROW; row++) {
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

    // Anticipation mode extra slowdown duration (configurable in timingStore)
    const anticipationExtraDuration = timingStore.ANTICIPATION_SLOWDOWN_DURATION

    // Build reel strips - START with current grid to prevent visual snap
    // Then add random symbols where the reel will land
    for (let col = 0; col < cols; col++) {
      const strip = []

      // CRITICAL: Start with current grid symbols for smooth transition
      // This ensures no visual change when spin button is clicked
      for (let row = 0; row < totalRows; row++) {
        strip.push(gridState.grid[col][row])
      }

      // Fill rest of strip with random symbols (this is where we'll land)
      const randomCount = stripLength - totalRows
      for (let i = 0; i < randomCount; i++) {
        // Allow bonus tiles in strip - we'll enforce limits at landing positions
        strip.push(getRandomSymbol({ col, allowGold: true, allowBonus: true }))
      }

      gridState.reelStrips[col] = strip
    }

    // CRITICAL: Enforce bonus limits in the landing area of each strip
    // This ensures reels land with valid bonus counts (max 1 per column)
    // so we don't need to modify tiles after the reel stops
    for (let col = 0; col < cols; col++) {
      const strip = gridState.reelStrips[col]

      // Check all potential landing positions in the strip
      // When reel lands at reelTop, grid row 'r' gets strip[reelTop + r]
      for (let reelTop = totalRows; reelTop < stripLength - totalRows; reelTop++) {
        const bonusPositions = []

        // Check the fully visible rows (calculated dynamically)
        for (let gridRow = WIN_CHECK_START_ROW; gridRow <= WIN_CHECK_END_ROW; gridRow++) {
          const stripIdx = reelTop + gridRow
          if (stripIdx < strip.length && isBonusTile(strip[stripIdx])) {
            bonusPositions.push({ idx: stripIdx, gridRow })
          }
        }

        // If more than 1 bonus in this window, replace extras
        if (bonusPositions.length > 1) {
          for (let i = 1; i < bonusPositions.length; i++) {
            const { idx, gridRow } = bonusPositions[i]
            const visualRow = gridRow - BUFFER_OFFSET
            strip[idx] = getRandomSymbol({ col, visualRow, allowGold: true, allowBonus: false })
          }
        }
      }
    }

    // Trigger reactivity for arrays
    gridState.reelStrips = [...gridState.reelStrips]

    // Always start from index 0 (showing current grid symbols)
    // Calculate random landing positions in the random symbol section
    const minLanding = totalRows + 10 // Skip past current symbols
    const maxLanding = stripLength - totalRows // Leave room at end
    const targetIndexes = Array(cols).fill(0).map(() =>
      Math.floor(minLanding + Math.random() * (maxLanding - minLanding))
    )

    // Initialize positions - start from 0 (current grid symbols)
    gridState.reelTopIndex = Array(cols).fill(0)
    gridState.spinOffsets = Array(cols).fill(0)
    gridState.spinVelocities = Array(cols).fill(10) // High initial velocity

    // Track which columns have been explicitly stopped
    const stoppedColumns = new Set()

    // Track which columns are in slowdown phase (for sound effects)
    const columnsInSlowdown = new Set()

    // Helper: Check if a column has bonus tiles in visible rows
    const hasBonusTilesInColumn = (col) => {
      for (let row = WIN_CHECK_START_ROW; row <= WIN_CHECK_END_ROW; row++) {
        const cell = gridState.grid[col][row]
        if (isBonusTile(cell)) {
          return true
        }
      }
      return false
    }

    return new Promise(resolve => {
      const animate = () => {
        const now = Date.now()
        let allStopped = true

        // Check for anticipation mode on every frame
        // Activate when column 0 (first column) has stopped with a bonus tile
        // This creates anticipation since 3 bonus tiles total trigger jackpot!
        // BUT: Skip anticipation mode during free spins (keep free spins fast and exciting!)
        if (!gameStore.anticipationMode && !gameStore.inFreeSpinMode &&
            stoppedColumns.has(0)) {
          if (hasBonusTilesInColumn(0)) {
            gameStore.activateAnticipationMode()
            console.log('🎰 ANTICIPATION MODE ACTIVATED! First reel has bonus tile')
          }
        }

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

          // Normal duration progress (0 to 1)
          const normalProgress = Math.min(elapsed / baseDuration, 1)

          // Check if this column should enter slowdown phase
          // Enter slowdown when reaching 85% of normal duration AND anticipation is active
          const shouldEnterSlowdown = gameStore.anticipationMode &&
                                       col >= 1 &&
                                       !columnsInSlowdown.has(col) &&
                                       normalProgress >= 0.85

          if (shouldEnterSlowdown) {
            columnsInSlowdown.add(col)
            console.log(`🎰 Column ${col} entering slowdown phase!`)
            // Play sound when this column starts slowing down
            playEffect("reach_bonus")
          }

          // Calculate effective duration
          // If in slowdown, extend duration by anticipationExtraDuration
          let effectiveDuration = baseDuration
          if (columnsInSlowdown.has(col)) {
            effectiveDuration = baseDuration + anticipationExtraDuration
          }

          const t = Math.min(elapsed / effectiveDuration, 1)

          // Get target position for this column (always start from 0)
          const startIndex = 0
          const targetIndex = targetIndexes[col]
          const totalDistance = targetIndex // Distance from 0 to target

          // Apply easing function for more realistic slowdown
          const easedT = 1 - Math.pow(1 - t, 3.5)

          // Calculate how far we should have traveled by now
          const distanceTraveled = totalDistance * easedT

          // Calculate current position
          const targetPosition = distanceTraveled

          // Stop condition: animation complete OR very close to target
          // Use a small threshold to smoothly transition to final position
          const distanceToTarget = targetIndex - targetPosition
          const isAtTarget = t >= 1 || distanceToTarget < 0.01

          if (isAtTarget) {
            // CRITICAL FIX: Don't change reelTop when stopping!
            // Keep reelTop at its current position to avoid visual jump
            // The renderer was showing strip[currentReelTop + row], so grid must match exactly
            // DON'T set reelTop to targetIndex - that causes a 1-tile shift!

            // Keep current reelTop and offset (don't change them)
            // gridState.reelTopIndex[col] stays the same
            // gridState.spinOffsets[col] stays the same

            // CRITICAL: Sync this column's grid BEFORE setting velocity to 0
            // This prevents jump when renderer switches from strip to grid
            syncColumnToGrid(col)

            // Note: Bonus limits are now enforced in the strip during spin setup
            // No need to modify grid after landing - tiles are already correct!

            // Now safe to set velocity to 0 (renderer will switch to grid)
            gridState.spinVelocities[col] = 0
            stoppedColumns.add(col)
            continue
          }

          // Convert target position to reelTopIndex and offset
          const newTopIndex = Math.floor(targetPosition)
          const newOffset = targetPosition - newTopIndex

          // Calculate velocity for this frame (for renderer to detect spinning)
          // Reduce velocity as we approach target for smoother deceleration
          const distanceRemaining = targetIndex - targetPosition
          const normalizedDistance = Math.min(distanceRemaining / 2, 1) // Normalize to 0-1
          const calculatedVelocity = normalizedDistance * 10 // Scale velocity based on distance
          const minVelocity = distanceRemaining > 0.5 ? 0.1 : 0.01 // Lower threshold near stop
          gridState.spinVelocities[col] = Math.max(minVelocity, calculatedVelocity)

          // Update position (with wrapping)
          gridState.reelTopIndex[col] = newTopIndex % gridState.reelStrips[col].length
          gridState.spinOffsets[col] = newOffset

          allStopped = false
        }

        if (!allStopped) {
          requestAnimationFrame(animate)
        } else {
          // All reels stopped - trigger reactivity
          // Note: Bonus limits are now enforced per-column as each reel stops
          gridState.grid = [...gridState.grid.map(col => [...col])]
          resolve()
        }
      }
      animate()
    })
  }

  const syncColumnToGrid = (col) => {
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
    const reelTop = gridState.reelTopIndex[col]
    const strip = gridState.reelStrips[col]

    // Copy this column's strip positions to grid
    for (let row = 0; row < totalRows; row++) {
      const stripIdx = (reelTop + row) % strip.length
      gridState.grid[col][row] = strip[stripIdx]
    }
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
          resolve()
        }
      }
      animate()
    })
  }

  const spin = async () => {
    const started = gameStore.startSpinCycle()
    if (!started) return

    playEffect("lot")
    playEffect("reel_spin")
    await animateSpin()
    gameStore.completeSpinAnimation()
  }

  const increaseBet = () => {
    gameStore.increaseBet()
  }

  const decreaseBet = () => {
    gameStore.decreaseBet()
  }

  /**
   * Check if 3 or more bonus tiles appear in the fully visible rows
   * Returns the count of bonus tiles found
   */
  const checkBonusTiles = () => {
    let bonusCount = 0

    // Only check the fully visible rows (excluding partially visible top and bottom)
    for (let col = 0; col < CONFIG.reels.count; col++) {
      for (let row = BONUS_CHECK_START_ROW; row <= BONUS_CHECK_END_ROW; row++) {
        const cell = gridState.grid[col][row]
        if (isBonusTile(cell)) {
          bonusCount++
        }
      }
    }

    return bonusCount
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
    playEffect,
    showWinOverlay: showWinOverlayFn,
    checkBonusTiles
  }
}
