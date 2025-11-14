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

    // Anticipation mode: exact time each column takes to slow down and stop
    const anticipationSlowdownPerColumn = timingStore.ANTICIPATION_SLOWDOWN_PER_COLUMN / 1000 // Convert to seconds

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
          let replaced = 0
          let requiredReplacements = bonusPositions.length - maxBonusPerColumn

          // Try to replace non-protected positions first
          for (let i = bonusPositions.length - 1; i >= 0 && replaced < requiredReplacements; i--) {
            const { idx, gridRow } = bonusPositions[i]
            // Skip if this is a protected position (current grid symbol)
            if (protectedSet.has(idx)) continue

            const visualRow = gridRow - BUFFER_OFFSET
            strip[idx] = getRandomSymbol({ col, visualRow, allowGold: true, allowBonus: false })
            replaced++
          }

          // If we couldn't replace enough (due to protected positions), this landing is invalid
          // This shouldn't happen if our target landing positions avoid reelTop=0
          if (replaced < requiredReplacements) {
            console.warn(`⚠️ Column ${col} at reelTop ${reelTop}: Could only replace ${replaced}/${requiredReplacements} bonus tiles (${bonusPositions.length - replaced} remain, max: ${maxBonusPerColumn})`)
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
    gridState.spinVelocities = Array(cols).fill(18) // High initial velocity (matches spin speed)
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

    /*
     * ===== BONUS TILE CHECKING DURING SPIN =====
     *
     * IMPORTANT: These functions ONLY check stopped columns that have been synced to grid
     *
     * Flow:
     * 1. Column stops → syncColumnToGrid() syncs strip to grid
     * 2. onComplete callback → counts bonus tiles in STOPPED columns
     * 3. If 2 bonus tiles found → activate anticipation mode (slow down remaining reels)
     * 4. After ALL reels stop → game flow controller calls checkBonusTiles() for jackpot
     *
     * This ensures we NEVER check tiles while reels are spinning!
     */

    // Helper: Count bonus tiles in a column's visible rows (only for STOPPED columns!)
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

    // Helper: Count total bonus tiles across all STOPPED columns
    const countTotalBonusTiles = (stoppedCols) => {
      let total = 0
      for (const col of stoppedCols) {
        total += countBonusTilesInColumn(col)
      }
      return total
    }

    return new Promise(resolve => {
      // Flag to track if we've already resolved (prevent double resolution)
      let hasResolved = false

      // Helper function to complete the spin and continue game flow
      const completeSpin = () => {
        if (hasResolved) return
        hasResolved = true

        console.log('🏁 All columns stopped - completing spin animation')

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

      // Create GSAP timeline for the spin animation
      const timeline = gsap.timeline({
        onComplete: () => {
          // Check if all columns have truly stopped (including slowdown tweens)
          // If anticipation mode is active, some columns may still be in slowdown
          if (!gameStore.anticipationMode) {
            completeSpin()
          }
          // If anticipation mode is active, the slowdown onComplete will call completeSpin
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

      /**
       * Helper function to create a slowdown tween for a column
       * This function calls itself recursively for the next column, creating a cascade effect
       */
      const createSlowdownTween = (targetCol) => {
        // Validate column exists and is still animating
        if (targetCol >= cols) return

        const targetTween = columnTweens.get(targetCol)
        const targetAnimObj = animObjects[targetCol]

        if (!targetTween || !targetTween.isActive() || !targetAnimObj) {
          console.warn(`⚠️ Cannot create slowdown for column ${targetCol} - tween not active`)
          return
        }

        // Kill the current tween
        targetTween.kill()

        // Get current position
        const currentPosition = targetAnimObj.position

        // CRITICAL: Ensure there's enough distance to animate during slowdown
        // We need at least 15-20 units of travel to make the slowdown visible
        const minDistanceForSlowdown = 15
        const currentDistance = targetAnimObj.targetIndex - currentPosition

        let newTarget = targetAnimObj.targetIndex
        if (currentDistance < minDistanceForSlowdown) {
          // Extend the target to ensure visible slowdown animation
          newTarget = Math.floor(currentPosition + minDistanceForSlowdown)
          // Make sure we don't exceed strip length
          if (newTarget >= stripLength) {
            newTarget = stripLength - 1
          }

          // VALIDATE: Ensure the extended target doesn't violate maxBonusPerColumn
          // Count bonus tiles that would be visible at this new target
          const strip = gridState.reelStrips[targetCol]
          let bonusCountAtNewTarget = 0
          for (let gridRow = WIN_CHECK_START_ROW; gridRow <= WIN_CHECK_END_ROW; gridRow++) {
            const stripIdx = ((newTarget - gridRow) % strip.length + strip.length) % strip.length
            if (isBonusTile(strip[stripIdx])) {
              bonusCountAtNewTarget++
            }
          }

          const maxBonusPerColumn = CONFIG.game.maxBonusPerColumn || 2
          if (bonusCountAtNewTarget > maxBonusPerColumn) {
            console.warn(`⚠️ Column ${targetCol}: Extended target ${newTarget} would have ${bonusCountAtNewTarget} bonus tiles (max: ${maxBonusPerColumn}). Using original target ${targetAnimObj.targetIndex} instead.`)
            newTarget = targetAnimObj.targetIndex
          } else {
            console.log(`📏 Column ${targetCol}: Extending target from ${targetAnimObj.targetIndex} to ${newTarget} (current: ${currentPosition.toFixed(1)}, distance was only ${currentDistance.toFixed(1)}). Bonus tiles at new target: ${bonusCountAtNewTarget}`)
            targetAnimObj.targetIndex = newTarget
          }
        }

        console.log(`🎯 Column ${targetCol}: Switching to ANTICIPATION SLOWDOWN from position ${currentPosition.toFixed(1)} to ${newTarget}`)

        // Create NEW tween that takes EXACTLY the configured slowdown time
        const newTween = gsap.to(targetAnimObj, {
          position: newTarget,
          duration: anticipationSlowdownPerColumn, // EXACT time (e.g., 5 seconds)
          ease: 'power4.out', // Very slow deceleration curve
          onUpdate: function() {
            // Update reel position
            const currentPosition = targetAnimObj.position
            const newTopIndex = Math.floor(currentPosition)
            const newOffset = currentPosition - newTopIndex

            const distanceRemaining = targetAnimObj.targetIndex - currentPosition
            const totalDistance = targetAnimObj.targetIndex
            const progress = 1 - (distanceRemaining / totalDistance)

            const baseVelocity = 18 // Match normal spin velocity
            const quadDecay = Math.pow(1 - progress, 2)
            const calculatedVelocity = baseVelocity * quadDecay
            const minVelocity = 0.05

            gridState.reelTopIndex[targetCol] = newTopIndex % gridState.reelStrips[targetCol].length
            gridState.spinOffsets[targetCol] = newOffset
            gridState.spinVelocities[targetCol] = Math.max(minVelocity, calculatedVelocity)
          },
          onComplete: () => {
            console.log(`✅ Column ${targetCol} SLOWDOWN COMPLETE at target ${targetAnimObj.targetIndex}`)

            // Finalize position
            gridState.reelTopIndex[targetCol] = targetAnimObj.targetIndex % gridState.reelStrips[targetCol].length
            gridState.spinOffsets[targetCol] = 0
            gridState.spinVelocities[targetCol] = 0

            // Sync to grid and mark as stopped
            syncColumnToGrid(targetCol)
            stoppedColumns.add(targetCol)

            // Clear slowdown highlight
            if (currentSlowdownColumn === targetCol) {
              currentSlowdownColumn = -1
              gridState.activeSlowdownColumn = -1
            }

            // CHECK IF JACKPOT TRIGGERED: Per spec.txt line 25
            // "if during the above animations, constants.minBonusToTrigger is reached,
            // stop all other spinning column, do the jackpot detection"
            if (!gameStore.inFreeSpinMode && gameStore.anticipationMode) {
              const totalBonusTiles = countTotalBonusTiles(stoppedColumns)
              console.log(`🎲 Column ${targetCol} slowdown complete. Total bonus tiles: ${totalBonusTiles}`)

              if (totalBonusTiles >= CONFIG.game.minBonusToTrigger) {
                console.log(`🎰 JACKPOT TRIGGERED during slowdown! Total: ${totalBonusTiles} >= ${CONFIG.game.minBonusToTrigger}`)

                // IMMEDIATELY stop all remaining columns
                for (let col = targetCol + 1; col < cols; col++) {
                  const remainingTween = columnTweens.get(col)
                  if (remainingTween && remainingTween.isActive()) {
                    remainingTween.kill()

                    // Snap to current position (wherever it is in the perpetual spin)
                    const remainingAnimObj = animObjects[col]
                    const currentPos = Math.floor(remainingAnimObj.position)

                    gridState.reelTopIndex[col] = currentPos % gridState.reelStrips[col].length
                    gridState.spinOffsets[col] = 0
                    gridState.spinVelocities[col] = 0

                    // Sync to grid at current position
                    syncColumnToGrid(col)
                    stoppedColumns.add(col)

                    console.log(`⏹️ Force-stopped column ${col} at position ${currentPos} (was in perpetual spin)`)
                  }
                }

                // Complete the spin immediately
                console.log(`🎬 All columns force-stopped - calling completeSpin()`)
                completeSpin()
                return // Exit early, don't cascade to next column
              }
            }

            // RECURSIVE CASCADE: Trigger next column slowdown if in anticipation mode
            // Only if jackpot NOT triggered
            if (gameStore.anticipationMode && targetCol >= firstBonusColumn) {
              const nextCol = targetCol + 1
              if (nextCol < cols) {
                console.log(`🔄 Cascading slowdown to column ${nextCol}`)
                createSlowdownTween(nextCol) // RECURSIVE CALL
              } else {
                // This was the last column - complete the spin
                console.log(`🎬 Last column slowdown complete - calling completeSpin()`)
                completeSpin()
              }
            }
          }
        })

        // Store the new tween
        columnTweens.set(targetCol, newTween)

        // Highlight this column and play sound effect
        currentSlowdownColumn = targetCol
        gridState.activeSlowdownColumn = targetCol
        playEffect("reach_bonus")

        console.log(`🐌 Column ${targetCol}: Starting ${anticipationSlowdownPerColumn}s ANTICIPATION slowdown`)
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
            // Note: Bonus tile checking and column highlighting moved to onComplete!

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
            const baseVelocity = 18 // Increased from 12 for faster normal spin
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

            // CRITICAL: Sync this column's grid at target position BEFORE checking bonus tiles
            syncColumnToGrid(col)
            stoppedColumns.add(col)

            // ===== BONUS TILE CHECK: Only after column has stopped and synced to grid =====
            if (!gameStore.inFreeSpinMode) {
              // Debug: Check how many bonus tiles THIS column has
              const bonusInThisColumn = countBonusTilesInColumn(col)
              const totalBonusTiles = countTotalBonusTiles(stoppedColumns)
              console.log(`🎲 Column ${col} stopped. Bonus in this column: ${bonusInThisColumn}, Total in all stopped columns: ${totalBonusTiles}`)

              // Warn if this column violates maxBonusPerColumn
              if (bonusInThisColumn > CONFIG.game.maxBonusPerColumn) {
                console.error(`❌ Column ${col} has ${bonusInThisColumn} bonus tiles, exceeds max ${CONFIG.game.maxBonusPerColumn}!`)
              }

              // Activate anticipation mode when we're one bonus tile away from jackpot (only if not already active)
              // This creates anticipation before hitting the jackpot trigger
              const anticipationThreshold = CONFIG.game.minBonusToTrigger - 1
              if (!gameStore.anticipationMode && firstBonusColumn === -1 && totalBonusTiles === anticipationThreshold) {
                firstBonusColumn = col // Track which column triggered anticipation
                gameStore.activateAnticipationMode()
                console.log(`🎰 ANTICIPATION MODE ACTIVATED! Found ${totalBonusTiles} bonus tiles (threshold: ${anticipationThreshold})`)

                // CRITICAL: Prevent remaining columns from stopping at their normal times
                // They should keep spinning until it's their turn to slow down
                for (let i = col + 2; i < cols; i++) {
                  const remainingTween = columnTweens.get(i)
                  const remainingAnimObj = animObjects[i]

                  if (remainingTween && remainingTween.isActive() && remainingAnimObj) {
                    // Kill the original tween
                    remainingTween.kill()

                    // Create a "perpetual spin" tween - maintains TOP_TO_BOTTOM scrolling
                    // Calculate speed to match normal spin: ~18 velocity means ~35 strip positions per second
                    const currentPos = remainingAnimObj.position
                    const perpetualDistance = 5000 // Large distance to ensure perpetual motion
                    const perpetualDuration = perpetualDistance / 35 // Match normal spin speed (~35 positions/sec)

                    const perpetualTween = gsap.to(remainingAnimObj, {
                      position: currentPos + perpetualDistance, // Move forward through strip (TOP_TO_BOTTOM)
                      duration: perpetualDuration, // Maintain normal spin speed
                      ease: 'none', // Constant speed
                      onUpdate: function() {
                        const currentPosition = remainingAnimObj.position
                        const newTopIndex = Math.floor(currentPosition)
                        const newOffset = currentPosition - newTopIndex

                        gridState.reelTopIndex[i] = newTopIndex % gridState.reelStrips[i].length
                        gridState.spinOffsets[i] = newOffset
                        gridState.spinVelocities[i] = 18 // Match normal spin velocity
                      }
                    })

                    columnTweens.set(i, perpetualTween)
                    console.log(`♾️ Column ${i}: Converted to perpetual spin (will slow down when ready)`)
                  }
                }

                // SEQUENTIAL SLOWDOWN: Trigger the cascade starting with the NEXT column
                // Only trigger once when anticipation mode is first activated
                const nextColumn = col + 1
                if (nextColumn < cols) {
                  console.log(`🎬 Triggering initial anticipation cascade at column ${nextColumn}`)
                  createSlowdownTween(nextColumn)
                }
              }
            }

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
