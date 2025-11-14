import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset } from '../../utils/gameHelpers'
import { getTileBaseSymbol, isTileWildcard, isBonusTile, isTileGolden } from '../../utils/tileHelpers'
import { useAudioEffects } from '../useAudioEffects'
import { useGameStore } from '../../stores/gameStore'
import { useTimingStore } from '../../stores/timingStore'
import { gsap } from 'gsap'

/**
 * Game Logic - State machine based architecture
 * Each function performs a specific action and returns a promise
 * Flow orchestration is handled by useGameFlowController
 */
export function useGameLogic(gameState, gridState, render, showWinOverlayFn, reelsAPI = null) {
  const gameStore = useGameStore()
  const timingStore = useTimingStore()

  // Reel controller for GSAP-driven animations (set after renderer initializes)
  let reels = reelsAPI

  // Buffer offset for accessing game rows in expanded grid
  const BUFFER_OFFSET = getBufferOffset()

  // Calculate total rows dynamically
  const totalRows = CONFIG.reels.rows + CONFIG.reels.bufferRows // e.g., 6 + 4 = 10
  const bufferRows = CONFIG.reels.bufferRows // e.g., 4
  const fullyVisibleRows = CONFIG.reels.fullyVisibleRows // e.g., 4

  // CENTRALIZED: Import winning check rows from single source of truth
  // These define which grid rows are checked for wins/bonuses
  const WIN_CHECK_START_ROW = CONFIG.reels.winCheckStartRow // 5
  const WIN_CHECK_END_ROW = CONFIG.reels.winCheckEndRow // 8

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
    /*
     * FULLY GSAP-DRIVEN REEL SCROLL SYSTEM
     *
     * This uses GSAP to directly animate reel container Y positions for smooth,
     * GPU-accelerated scrolling. All game logic (jackpot detection, anticipation mode)
     * is preserved using GSAP callbacks and timers.
     *
     * SATISFIES spec.txt:
     * - TOP_TO_BOTTOM spin direction (GSAP scrolls containers downward)
     * - No tile changes after spin stops (grid is synced at completion)
     * - No tile changes when hitting spin (strips built with current grid)
     */

    const baseDuration = timingStore.SPIN_BASE_DURATION / 1000 // Convert to seconds for GSAP
    const stagger = timingStore.SPIN_REEL_STAGGER / 1000 // Convert to seconds for GSAP
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
    const cols = CONFIG.reels.count
    const stripLength = CONFIG.reels.stripLength

    // Anticipation mode extra slowdown duration
    const anticipationExtraDuration = timingStore.ANTICIPATION_SLOWDOWN_DURATION / 1000

    // Check if we can use GSAP reel scroll (reels API available)
    const useGSAPScroll = reels && reels.startGSAPReelScroll

    if (!useGSAPScroll) {
      console.warn('⚠️ GSAP reel scroll not available, falling back to traditional animation')
      // Fall back to the original GSAP timeline approach below
    }

    // Build reel strips - place current grid at positions the renderer will read at reelTop=0
    // Renderer formula: strip[(reelTop - row) % 100], so at reelTop=0:
    //   row 0 reads strip[0], row 1 reads strip[99], row 2 reads strip[98], etc.
    for (let col = 0; col < cols; col++) {
      // Initialize strip with random symbols
      const strip = Array(stripLength).fill(null).map(() =>
        getRandomSymbol({ col, allowGold: true, allowBonus: true })
      )

      // CRITICAL: Place current grid symbols at positions renderer will read when reelTop=0
      // This ensures no visual change when spin button is clicked
      const reelTopAtStart = 0
      for (let row = 0; row < totalRows; row++) {
        const stripIdx = ((reelTopAtStart - row) % stripLength + stripLength) % stripLength
        strip[stripIdx] = gridState.grid[col][row]
      }

      gridState.reelStrips[col] = strip
    }

    // CRITICAL: Enforce bonus limits in the landing area of each strip
    // This ensures reels land with valid bonus counts (configurable max per column)
    // so we don't need to modify tiles after the reel stops
    const maxBonusPerColumn = CONFIG.game.maxBonusPerColumn || 2

    // Build protected positions set - these are the current grid symbols that must not change
    // when the spin starts (to satisfy spec rule #5: no tile changes after hitting spin)
    const protectedPositions = new Map()
    for (let col = 0; col < cols; col++) {
      const protectedSet = new Set()
      const reelTopAtStart = 0
      for (let row = 0; row < totalRows; row++) {
        const stripIdx = ((reelTopAtStart - row) % stripLength + stripLength) % stripLength
        protectedSet.add(stripIdx)
      }
      protectedPositions.set(col, protectedSet)
    }

    for (let col = 0; col < cols; col++) {
      const strip = gridState.reelStrips[col]
      const protectedSet = protectedPositions.get(col)

      // Check all potential landing positions in the strip
      // When reel lands at reelTop, grid row 'r' gets strip[reelTop - r] (top-to-bottom scrolling)
      for (let reelTop = 0; reelTop < stripLength; reelTop++) {
        const bonusPositions = []

        // Check the fully visible rows (calculated dynamically)
        for (let gridRow = WIN_CHECK_START_ROW; gridRow <= WIN_CHECK_END_ROW; gridRow++) {
          const stripIdx = ((reelTop - gridRow) % strip.length + strip.length) % strip.length
          if (isBonusTile(strip[stripIdx])) {
            bonusPositions.push({ idx: stripIdx, gridRow })
          }
        }

        // If more than max bonus in this window, replace extras
        // BUT skip protected positions (current grid at reelTop=0) to prevent visual change
        if (bonusPositions.length > maxBonusPerColumn) {
          for (let i = maxBonusPerColumn; i < bonusPositions.length; i++) {
            const { idx, gridRow } = bonusPositions[i]
            // Skip if this is a protected position (current grid symbol)
            if (protectedSet.has(idx)) continue

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

    // Initialize positions - start from 0 (current grid symbols are now at correct positions)
    gridState.reelTopIndex = Array(cols).fill(0)
    gridState.spinOffsets = Array(cols).fill(0)
    gridState.spinVelocities = Array(cols).fill(10) // High initial velocity
    gridState.activeSlowdownColumn = -1 // Reset active slowdown column

    // Track which columns have been explicitly stopped
    const stoppedColumns = new Set()

    // Track the FIRST column that stopped with a bonus tile (triggers anticipation)
    let firstBonusColumn = -1 // -1 means no bonus column detected yet

    // Track which column is currently in slowdown phase (only ONE at a time!)
    let currentSlowdownColumn = -1 // -1 means no column is slowing down
    let slowdownActivated = false // Track if we've played the sound for this column

    // Store GSAP tweens for each column so we can control them dynamically
    const columnTweens = new Map()

    // Helper: Count bonus tiles in a column's visible rows
    const countBonusTilesInColumn = (col) => {
      let count = 0
      for (let row = WIN_CHECK_START_ROW; row <= WIN_CHECK_END_ROW; row++) {
        const cell = gridState.grid[col][row]
        if (isBonusTile(cell)) {
          count++
        }
      }
      return count
    }

    // Helper: Count total bonus tiles across all stopped columns
    const countTotalBonusTiles = (stoppedCols) => {
      let total = 0
      for (const col of stoppedCols) {
        total += countBonusTilesInColumn(col)
      }
      return total
    }

    return new Promise(resolve => {
      // Create GSAP timeline for the spin animation
      const timeline = gsap.timeline({
        onComplete: () => {
          // All reels stopped - deactivate anticipation mode to remove dark mask
          if (gameStore.anticipationMode) {
            gameStore.deactivateAnticipationMode()
            console.log('🎯 Anticipation mode deactivated - removing dark mask')
          }

          // Reset active slowdown column
          gridState.activeSlowdownColumn = -1

          // Trigger reactivity
          gridState.grid = [...gridState.grid.map(col => [...col])]
          resolve()
        }
      })

      // Create animation objects for each column to tween
      const animObjects = []
      for (let col = 0; col < cols; col++) {
        const minLanding = totalRows + 10
        const maxLanding = stripLength - totalRows
        const targetIndex = Math.floor(minLanding + Math.random() * (maxLanding - minLanding))

        animObjects.push({
          col,
          position: 0, // Start position
          targetIndex, // Where we want to land
          isSlowingDown: false,
          hasSlowedDown: false
        })
      }

      // Create tweens for each column with SEQUENTIAL STOPS
      // Each column stops AFTER the previous one for clear visual sequence
      for (let col = 0; col < cols; col++) {
        const animObj = animObjects[col]

        // SEQUENTIAL STOP: Each column has progressively longer duration
        // This ensures columns stop one after another in clear sequence
        // Column 0 stops first, then 1, then 2, etc.
        const sequentialDuration = baseDuration + (col * stagger * 2) // Double the stagger for clear sequential stops

        // Create the tween with sequential duration
        const tween = gsap.to(animObj, {
          position: animObj.targetIndex,
          duration: sequentialDuration,
          ease: 'power2.out', // Smooth quadratic deceleration (better for sequential feel)
          delay: col * stagger,
          onStart: () => {
            console.log(`🎬 Column ${col} animation started (duration: ${sequentialDuration.toFixed(2)}s)`)
          },
          onUpdate: function() {
            // Check for jackpot on every frame (for all columns)
            if (!gameStore.inFreeSpinMode) {
              const totalBonusTiles = countTotalBonusTiles(stoppedColumns)

              // If we've reached minimum bonus tiles for jackpot, IMMEDIATELY stop all reels
              if (totalBonusTiles >= CONFIG.game.minBonusToTrigger) {
                console.log(`🎯 JACKPOT DETECTED! ${totalBonusTiles} bonus tiles - stopping all reels immediately!`)

                // Kill all tweens
                timeline.kill()

                // Stop ALL columns immediately
                for (let c = 0; c < cols; c++) {
                  if (gridState.spinVelocities[c] > 0) {
                    syncColumnToGrid(c)
                    gridState.spinVelocities[c] = 0
                    stoppedColumns.add(c)
                  }
                }

                // Deactivate anticipation mode
                if (gameStore.anticipationMode) {
                  gameStore.deactivateAnticipationMode()
                }

                // Reset state
                firstBonusColumn = -1
                currentSlowdownColumn = -1
                gridState.activeSlowdownColumn = -1

                // Trigger reactivity and exit
                gridState.grid = [...gridState.grid.map(col => [...col])]
                resolve()
                return
              }
              // Activate anticipation mode when exactly 2 bonus tiles
              else if (!gameStore.anticipationMode && firstBonusColumn === -1 && totalBonusTiles === 2) {
                firstBonusColumn = Math.min(...Array.from(stoppedColumns))
                gameStore.activateAnticipationMode()
                console.log(`🎰 ANTICIPATION MODE ACTIVATED! Found ${totalBonusTiles} bonus tiles`)

                // Slow down columns after the bonus column
                for (let c = firstBonusColumn + 1; c < cols; c++) {
                  const nextTween = columnTweens.get(c)
                  if (nextTween && nextTween.isActive()) {
                    const remainingProgress = 1 - nextTween.progress()
                    const newDuration = remainingProgress * anticipationExtraDuration

                    // Update duration dynamically
                    nextTween.duration(newDuration)
                    console.log(`🐌 Slowing down column ${c} to ${newDuration.toFixed(2)}s`)
                  }
                }
              }
            }

            // Handle anticipation mode column highlighting
            if (gameStore.anticipationMode && firstBonusColumn >= 0) {
              const stoppedAfterBonus = Array.from(stoppedColumns).filter(c => c > firstBonusColumn)
              const lastStoppedAfterBonus = stoppedAfterBonus.length > 0 ? Math.max(...stoppedAfterBonus) : firstBonusColumn
              const nextColumnToSlowdown = lastStoppedAfterBonus + 1

              // Update active slowdown column
              if (col === nextColumnToSlowdown && currentSlowdownColumn !== col) {
                currentSlowdownColumn = col
                gridState.activeSlowdownColumn = col
                console.log(`🎯 Column ${col} is now the ACTIVE SLOWDOWN COLUMN`)
                playEffect("reach_bonus")
              }

              // Keep other columns spinning if they're waiting
              if (col > firstBonusColumn && col !== nextColumnToSlowdown && !stoppedColumns.has(col)) {
                const spinSpeed = 0.5
                const currentTop = gridState.reelTopIndex[col]
                const currentOffset = gridState.spinOffsets[col]
                const stripLen = gridState.reelStrips[col].length

                let newPosition = currentTop + currentOffset + spinSpeed
                const newTopIndex = Math.floor(newPosition) % stripLen
                const newOffset = newPosition - Math.floor(newPosition)

                gridState.reelTopIndex[col] = newTopIndex
                gridState.spinOffsets[col] = newOffset
                gridState.spinVelocities[col] = spinSpeed
                return // Don't update position from tween
              }
            }

            // Update reel position based on tween progress
            const currentPosition = animObj.position
            const newTopIndex = Math.floor(currentPosition)
            const newOffset = currentPosition - newTopIndex

            // Calculate velocity to match power2.out deceleration
            // Velocity should decrease quadratically as we approach the target
            const distanceRemaining = animObj.targetIndex - currentPosition
            const totalDistance = animObj.targetIndex
            const progress = 1 - (distanceRemaining / totalDistance)

            // Quadratic velocity decay matching power2.out easing: (1 - t)^2
            const baseVelocity = 12
            const quadDecay = Math.pow(1 - progress, 2) // Matches power2.out curve
            const calculatedVelocity = baseVelocity * quadDecay
            const minVelocity = 0.05 // Minimum visible velocity

            gridState.reelTopIndex[col] = newTopIndex % gridState.reelStrips[col].length
            gridState.spinOffsets[col] = newOffset
            gridState.spinVelocities[col] = Math.max(minVelocity, calculatedVelocity)
          },
          onComplete: () => {
            // Column stopped - finalize position
            gridState.reelTopIndex[col] = animObj.targetIndex % gridState.reelStrips[col].length
            gridState.spinOffsets[col] = 0
            gridState.spinVelocities[col] = 0

            console.log(`✅ Column ${col} STOPPED at target ${animObj.targetIndex}`)

            // Sync this column's grid at target position
            syncColumnToGrid(col)
            stoppedColumns.add(col)

            // Clear current slowdown column if this was the active one
            if (currentSlowdownColumn === col) {
              currentSlowdownColumn = -1
              gridState.activeSlowdownColumn = -1
            }
          }
        })

        // Store the tween so we can modify it later
        columnTweens.set(col, tween)

        // Add to timeline
        timeline.add(tween, 0) // Add at time 0 (stagger is handled by delay in tween)
      }
    })
  }

  const syncColumnToGrid = (col) => {
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
    const reelTop = gridState.reelTopIndex[col]
    const strip = gridState.reelStrips[col]

    // Copy this column's strip positions to grid
    // CRITICAL: Must match renderer's reading direction (reelTop - row) for top-to-bottom scrolling
    for (let row = 0; row < totalRows; row++) {
      const stripIdx = ((reelTop - row) % strip.length + strip.length) % strip.length
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

      const maxBonusPerColumn = CONFIG.game.maxBonusPerColumn || 2
      for (let i = 0; i < needFromBuffer; i++) {
        const allowBonus = bonusCountInVisibleRows < maxBonusPerColumn
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

  // Method to set reels reference after renderer initializes
  function setReels(reelsRef) {
    reels = reelsRef
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
    checkBonusTiles,
    setReels // Expose method to set reels reference
  }
}
