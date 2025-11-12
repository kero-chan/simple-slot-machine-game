import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset, fillBufferRows } from '../../utils/gameHelpers'
import { useAudioEffects } from '../useAudioEffects'
import { useGameStore } from '../../stores/gameStore'

export function useGameLogic(gameState, gridState, render, showWinOverlay) {
  const gameStore = useGameStore()
  // Buffer offset for accessing game rows in expanded grid
  const BUFFER_OFFSET = getBufferOffset()

  // Visible rows: only evaluate rows 1..4 for wins and scatters (in game coordinates)
  // In grid coordinates, these are offset by BUFFER_OFFSET
  const VISIBLE_START_ROW = BUFFER_OFFSET + 1
  const VISIBLE_ROWS = 4
  const VISIBLE_END_ROW = VISIBLE_START_ROW + VISIBLE_ROWS - 1

  // Initialize audio effects
  const { playConsecutiveWinSound } = useAudioEffects()

  const showAlert = () => {
  }

  /**
   * Determine win intensity based on win combinations
   */
  const getWinIntensity = (wins) => {
    if (!wins || wins.length === 0) return 'small'

    const highValueSymbols = ['chu', 'zhong', 'fa']
    let maxIntensity = 'small'

    wins.forEach(win => {
      const { count, symbol } = win
      let intensity = 'small'

      if (count >= 5 && highValueSymbols.includes(symbol)) {
        intensity = 'mega' // 5+ high-value symbols
      } else if (count >= 5 || (count >= 4 && highValueSymbols.includes(symbol))) {
        intensity = 'big' // 5 of any symbol or 4+ high-value
      } else if (count >= 4) {
        intensity = 'medium' // 4 symbols
      }

      // Track the highest intensity
      const intensityLevels = { small: 1, medium: 2, big: 3, mega: 4 }
      if (intensityLevels[intensity] > intensityLevels[maxIntensity]) {
        maxIntensity = intensity
      }
    })

    return maxIntensity
  }

  const findWinningCombinations = () => {
    const wins = []

    const symbolsToCheck = Object.keys(CONFIG.paytable).filter(s => s !== 'liangtong')
    for (const symbol of symbolsToCheck) {
      const countsPerReel = []
      const positionsPerReel = []

      for (let col = 0; col < CONFIG.reels.count; col++) {
        const matches = []
        for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
          const cell = gridState.grid.value[col][row]

          // Remove "_gold" suffix if present to get base symbol
          const baseCell = cell && cell.endsWith('_gold') ? cell.slice(0, -5) : cell

          const isMatch = symbol === 'liangsuo'
            ? baseCell === 'liangsuo'
            : (baseCell === symbol || baseCell === 'liangsuo')
          if (isMatch) {
            matches.push([col, row])
          }
        }

        if (matches.length === 0) break
        countsPerReel.push(matches.length)
        positionsPerReel.push(matches)
      }

      const matchedReels = countsPerReel.length
      if (matchedReels >= 3) {
        const ways = countsPerReel.reduce((a, b) => a * b, 1)
        const positions = positionsPerReel.slice(0, matchedReels).flat()
        wins.push({ symbol, count: matchedReels, ways, positions })
      }
    }

    return wins
  }

  const countScatters = () => {
    let count = 0
    for (let col = 0; col < CONFIG.reels.count; col++) {
      for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
        const cell = gridState.grid.value[col][row]
        // Remove "_gold" suffix if present (though liangtong shouldn't be gold)
        const baseCell = cell && cell.endsWith('_gold') ? cell.slice(0, -5) : cell
        if (baseCell === 'liangtong') count++
      }
    }
    return count
  }

  const calculateWinAmount = (wins) => {
    let total = 0
    for (const win of wins) {
      const paytable = CONFIG.paytable[win.symbol]
      if (paytable && paytable[win.count]) {
        total += paytable[win.count] * win.ways
      }
    }
    return total
  }

  const animateSpin = () => {
    const startTime = Date.now()
    const baseDuration = CONFIG.animation.spinDuration
    const stagger = CONFIG.animation.reelStagger || 150
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET  // Must include buffer rows!
    const cols = CONFIG.reels.count

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)
    const FREEZE_THRESHOLD = 0.82
    const ALIGN_STEP_MAX = 0.35
    const MIN_ALIGN_STEP = 0.08
    const EPS = 1e-3

    return new Promise(resolve => {
      const animate = () => {
        const now = Date.now()
        let allStopped = true

        for (let col = 0; col < cols; col++) {
          const colStart = startTime + col * stagger
          if (now < colStart) {
            allStopped = false
            gridState.spinVelocities.value[col] = 0
            continue
          }

          const elapsed = Math.min(now - colStart, baseDuration)
          const t = Math.max(0, Math.min(elapsed / baseDuration, 1))
          const ease = easeOutQuint(t)

          // Spin phase: update fractional offset and advance topIndex as needed
          if (t < FREEZE_THRESHOLD) {
            const maxVel = 0.65
            const targetVel = (1 - ease) * maxVel
            const prevVel = gridState.spinVelocities.value[col] || 0
            const smoothedVel = prevVel * 0.8 + targetVel * 0.2

            gridState.spinVelocities.value[col] = smoothedVel
            gridState.spinOffsets.value[col] += smoothedVel

            while (gridState.spinOffsets.value[col] >= 1) {
              gridState.spinOffsets.value[col] -= 1
              const stripLen = gridState.reelStrips.value[col].length
              gridState.reelTopIndex.value[col] = (gridState.reelTopIndex.value[col] + 1) % stripLen
            }

            allStopped = false
            continue
          }

          // Alignment phase: glide DOWN to next boundary, rotate once, snap to 0
          const offset = gridState.spinOffsets.value[col]
          if (offset < EPS) {
            gridState.spinOffsets.value[col] = 0
            gridState.spinVelocities.value[col] = 0
            continue
          }

          const remaining = 1 - offset
          const step = Math.min(
            remaining,
            Math.max(MIN_ALIGN_STEP, ALIGN_STEP_MAX * (1 - ease))
          )

          gridState.spinOffsets.value[col] += step

          if (gridState.spinOffsets.value[col] >= 1 - EPS) {
            gridState.spinOffsets.value[col] = 0
            const stripLen = gridState.reelStrips.value[col].length
            gridState.reelTopIndex.value[col] = (gridState.reelTopIndex.value[col] + 1) % stripLen
            gridState.spinVelocities.value[col] = 0
          } else {
            gridState.spinVelocities.value[col] = step
            allStopped = false
          }
        }

        if (!allStopped) {
          requestAnimationFrame(animate)
        } else {
          // Commit final grid from reel strips for the 6 rows
          for (let col = 0; col < cols; col++) {
            const strip = gridState.reelStrips.value[col]
            const top = gridState.reelTopIndex.value[col]
            for (let row = 0; row < totalRows; row++) {
              const idx = (top + row) % strip.length
              gridState.grid.value[col][row] = strip[idx]
            }
            gridState.spinOffsets.value[col] = 0
            gridState.spinVelocities.value[col] = 0
          }

          resolve()
        }
      }
      animate()
    })
  }

  const highlightWinsAnimation = (wins) => {
    // Extended duration to allow for full celebration animation:
    // Phase 1: Highlight (500ms)
    // Phase 2: Celebration (1500ms)
    // Phase 3: Fade out (500ms)
    const duration = 2500 // ms
    const startTime = Date.now()
    gridState.highlightAnim.value = { start: startTime, duration }

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < duration) {
          gridState.highlightWins.value = wins
          requestAnimationFrame(animate)
        } else {
          gridState.highlightWins.value = null
          gridState.highlightAnim.value = { start: 0, duration: 0 }
          resolve()
        }
      }
      animate()
    })
  }

  const transformGoldTilesToGold = (wins) => {
    // Transform _gold tiles in winning combinations to actual "gold" symbol
    // and remove those positions from wins so they don't disappear
    const transformedPositions = new Set()

    wins.forEach(win => {
      // Filter out positions that will be transformed to gold
      win.positions = win.positions.filter(([col, row]) => {
        const currentSymbol = gridState.grid.value[col][row]
        // Check if this is a _gold variant (but not already "gold")
        if (currentSymbol && currentSymbol.endsWith('_gold') && currentSymbol !== 'gold') {
          // Transform to gold tile - this tile will STAY on the grid
          gridState.grid.value[col][row] = 'gold'
          transformedPositions.add(`${col},${row}`)
          return false // Remove from win positions so it won't disappear
        }
        return true // Keep in win positions - will disappear normally
      })
    })

    // Trigger reactivity for Vue to detect changes
    gridState.grid.value = [...gridState.grid.value]

    // Force a delay to ensure grid update is processed and rendered
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  const animateDisappear = (wins) => {
    const DISAPPEAR_MS = 300
    const startTime = Date.now()

    // Collect positions and mark them in state for renderer to consume
    const positions = []
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => positions.push([col, row]))
    })
    gridState.disappearPositions.value = new Set(
      positions.map(([c, r]) => `${c},${r}`)
    )
    // Start fade window so reels renderer can apply alpha over time
    gridState.disappearAnim.value = { start: startTime, duration: DISAPPEAR_MS }

    return new Promise(resolve => {
      const loop = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < DISAPPEAR_MS) {
          requestAnimationFrame(loop)
        } else {
          gridState.disappearPositions.value.clear()
          gridState.disappearAnim.value = { start: 0, duration: 0 }
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

    // Store removed positions for renderer to use in drop animation detection
    gridState.lastRemovedPositions.value = toRemove

    // CRITICAL: Save grid snapshot BEFORE cascade modifies it
    // This ensures drop animations have the correct "before" state
    gridState.previousGridSnapshot = gridState.grid.value.map(col => [...col])

    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET

    // PERFORM CASCADE
    for (let col = 0; col < CONFIG.reels.count; col++) {
      // Find all rows to remove in GAME ROWS only (not buffer)
      const rowsToRemove = []
      for (let row = BUFFER_OFFSET; row < totalRows; row++) {
        if (toRemove.has(`${col},${row}`)) {
          rowsToRemove.push(row)
        }
      }

      if (rowsToRemove.length === 0) continue

      const newColumn = []

      // Step 1: Collect non-removed GAME tiles only (NOT buffer)
      const keptGameTiles = []
      for (let row = totalRows - 1; row >= BUFFER_OFFSET; row--) {
        if (!toRemove.has(`${col},${row}`)) {
          const symbol = gridState.grid.value[col][row]
          keptGameTiles.unshift(symbol)
        }
      }

      // Step 2: Take tiles from bottom of buffer to fill game area
      const needFromBuffer = rowsToRemove.length
      const takeFromBuffer = []
      for (let i = BUFFER_OFFSET - needFromBuffer; i < BUFFER_OFFSET; i++) {
        if (i >= 0) {
          takeFromBuffer.push(gridState.grid.value[col][i])
        }
      }

      // Step 3: Rebuild buffer with new tiles at top, keep remaining buffer tiles at bottom
      for (let i = 0; i < needFromBuffer; i++) {
        // Allow gold generation for new tiles (they'll drop into visible area)
        newColumn.push(getRandomSymbol({ col, allowGold: true }))
      }
      // Keep buffer tiles that weren't moved to game
      for (let i = 0; i < BUFFER_OFFSET - needFromBuffer; i++) {
        newColumn.push(gridState.grid.value[col][i])
      }

      // Step 4: Add tiles that moved from buffer to game, then kept game tiles
      takeFromBuffer.forEach(tile => newColumn.push(tile))
      keptGameTiles.forEach(tile => newColumn.push(tile))

      // Update the grid column
      gridState.grid.value[col] = newColumn
    }

    gridState.grid.value = [...gridState.grid.value] // Trigger reactivity

    // Mark cascade completion time for renderer
    gridState.lastCascadeTime.value = Date.now()

    await animateCascade()
  }

  const animateCascade = () => {
    const startTime = Date.now()
    const MAX_WAIT = 5000 // 5 second safety timeout

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime

        // Wait for drop animations to complete
        // Also have a safety timeout in case something goes wrong
        const shouldWait = gridState.isDropAnimating.value

        if (shouldWait && elapsed < MAX_WAIT) {
          requestAnimationFrame(animate)
        } else {
          if (elapsed >= MAX_WAIT) {
            console.warn('⚠️ animateCascade: Hit max wait time, proceeding anyway')
          }
          render()
          resolve()
        }
      }
      animate()
    })
  }

  const checkWinsAndCascade = async () => {
    let totalWin = 0
    let hasWins = true
    let scattersAwarded = false
    let allWins = [] // Track all wins for overlay

    while (hasWins) {
      const wins = findWinningCombinations()

      if (wins.length === 0) {
        hasWins = false
        break
      }

      allWins.push(...wins) // Collect wins for intensity calculation

      const waysWinAmount = calculateWinAmount(wins)
      const multipliedWays = waysWinAmount * gameState.currentMultiplier.value * gameState.bet.value

      totalWin += multipliedWays
      gameStore.incrementConsecutiveWins()

      // Play consecutive wins sound effect
      playConsecutiveWinSound(gameState.consecutiveWins.value)

      await highlightWinsAnimation(wins)

      // Transform _gold tiles to gold after flip animation completes
      await transformGoldTilesToGold(wins)
      render() // Force render to update sprite textures

      // Wait for players to see the gold transformation before other tiles disappear
      await new Promise(resolve => setTimeout(resolve, 250))

      // Run disappear before cascading
      await animateDisappear(wins)

      await cascadeSymbols(wins)

      // Wait after all effects finish and reel is stable before checking for next wins
      // This gives players time to see the new stable reel state
      // before the next winning highlight begins
      await new Promise(resolve => setTimeout(resolve, 2000))

      // TEMP DISABLED: After cascade animation completes: transform one random golden into liangsuo (wild)
      // Delay this to happen AFTER drop animations finish
      // setTimeout(() => {
      //   convertOneGoldenAfterCascade()
      // }, CONFIG.animation.cascadeDuration + 50) // Wait for cascade + small buffer
    }

    if (totalWin > 0) {
      gameStore.setCurrentWin(totalWin)

      // Show win overlay with appropriate intensity
      const intensity = getWinIntensity(allWins)

      if (showWinOverlay) {
        showWinOverlay(intensity, totalWin)
      }
    } else {
      gameStore.resetConsecutiveWins()
    }
  }

  const spin = async () => {
    if (gameState.isSpinning.value) return

    if (gameState.credits.value < gameState.bet.value) {
      return
    }

    gameStore.deductBet()
    gameStore.startSpin()

    await animateSpin()
    await checkWinsAndCascade()

    gameStore.endSpin()
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
    decreaseBet
  }
}
