import { CONFIG } from '../../config/constants'
import { getRandomSymbol } from '../../utils/gameHelpers'
import { useAudioEffects } from '../useAudioEffects'

export function useGameLogic(gameState, gridState, render, showWinOverlay) {
  // Visible rows: only evaluate rows 1..4 for wins and scatters
  const VISIBLE_START_ROW = 1
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
          const isMatch = symbol === 'liangsuo'
            ? cell === 'liangsuo'
            : (cell === symbol || cell === 'liangsuo')
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
        if (gridState.grid.value[col][row] === 'liangtong') count++
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
    const totalRows = CONFIG.reels.rows
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

  const convertGoldenToLiangsuo = (wins) => {
    const winPositions = new Set()
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        winPositions.add(`${col},${row}`)
      })
    })

    winPositions.forEach(pos => {
      if (gridState.goldenSymbols.value.has(pos)) {
        const [col, row] = pos.split(',').map(Number)
        gridState.grid.value[col][row] = 'liangsuo'
        gridState.goldenSymbols.value.delete(pos)
      }
    })

    gridState.grid.value = [...gridState.grid.value] // Trigger reactivity
  }

  const cascadeSymbols = async (wins) => {
    console.log('🔄 CASCADE: Starting cascade for wins:', wins.map(w => ({symbol: w.symbol, positions: w.positions})))

    const toRemove = new Set()
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        toRemove.add(`${col},${row}`)
      })
    })
    console.log('🗑️ CASCADE: Positions to remove:', Array.from(toRemove))

    // Log grid BEFORE cascade
    console.log('📊 CASCADE: Grid BEFORE cascade:')
    for (let col = 0; col < CONFIG.reels.count; col++) {
      console.log(`  Col ${col}:`, gridState.grid.value[col].join(', '))
    }

    for (let col = 0; col < CONFIG.reels.count; col++) {
      // Find all rows to remove in this column
      const rowsToRemove = []
      for (let row = 0; row < CONFIG.reels.rows; row++) {
        if (toRemove.has(`${col},${row}`)) {
          rowsToRemove.push(row)
        }
      }

      if (rowsToRemove.length === 0) continue

      console.log(`  Col ${col}: Removing ${rowsToRemove.length} tiles at rows [${rowsToRemove.join(', ')}]`)

      // Build new column: keep non-removed tiles in order, then add new tiles at top
      const newColumn = []

      // First, collect all tiles that are NOT being removed (from bottom to top)
      for (let row = CONFIG.reels.rows - 1; row >= 0; row--) {
        if (!toRemove.has(`${col},${row}`)) {
          newColumn.unshift(gridState.grid.value[col][row])
        }
      }

      // Then fill remaining slots at the top with new random symbols
      const newTilesNeeded = rowsToRemove.length
      const newTiles = []
      for (let i = 0; i < newTilesNeeded; i++) {
        const newSymbol = getRandomSymbol()
        newTiles.push(newSymbol)
        newColumn.unshift(newSymbol)
      }

      console.log(`  Col ${col}: Adding ${newTilesNeeded} new symbols at top: [${newTiles.join(', ')}]`)

      // Verify column has correct length
      if (newColumn.length !== CONFIG.reels.rows) {
        console.error(`❌ CASCADE ERROR: Col ${col} has ${newColumn.length} tiles, expected ${CONFIG.reels.rows}!`)
        console.error(`   Tiles: [${newColumn.join(', ')}]`)
      }

      // Update the grid column
      gridState.grid.value[col] = newColumn
    }

    gridState.grid.value = [...gridState.grid.value] // Trigger reactivity

    // Mark cascade completion time for renderer
    gridState.lastCascadeTime = Date.now()
    console.log('✅ CASCADE: Grid updated, marking cascade time:', gridState.lastCascadeTime)

    // Log grid AFTER cascade
    console.log('📊 CASCADE: Grid AFTER cascade:')
    for (let col = 0; col < CONFIG.reels.count; col++) {
      console.log(`  Col ${col}:`, gridState.grid.value[col].join(', '))
    }

    await animateCascade()
  }

  const animateCascade = () => {
    const duration = CONFIG.animation.cascadeDuration
    const startTime = Date.now()

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        // Removed duplicate render(); main renderer is already active
        if (elapsed < duration) {
          requestAnimationFrame(animate)
        } else {
          render()
          resolve()
        }
      }
      animate()
    })
  }

  function convertOneGoldenAfterCascade() {
    const candidates = Array.from(gridState.goldenSymbols.value || [])
      .map(p => p.split(',').map(Number))
      .filter(([col, row]) => {
        const cell = gridState.grid.value[col][row]
        return cell !== 'liangsuo' && cell !== 'liangtong' // exclude specials
      })
    if (candidates.length === 0) return
    const [col, row] = candidates[Math.floor(Math.random() * candidates.length)]
    gridState.grid.value[col][row] = 'liangsuo'
    gridState.goldenSymbols.value.delete(`${col},${row}`)
    gridState.grid.value = [...gridState.grid.value] // trigger reactivity
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
      gameState.consecutiveWins.value++

      // Play consecutive wins sound effect
      playConsecutiveWinSound(gameState.consecutiveWins.value)

      await highlightWinsAnimation(wins)

      // Run disappear before cascading
      await animateDisappear(wins)

      await cascadeSymbols(wins)

      // After cascade: transform one random golden into liangsuo (wild)
      convertOneGoldenAfterCascade()
    }

    if (totalWin > 0) {
      gameState.currentWin.value = totalWin
      gameState.credits.value += totalWin

      // Show win overlay with appropriate intensity
      const intensity = getWinIntensity(allWins)
      console.log(`🎉 ${intensity.toUpperCase()} WIN: ${totalWin} credits`)

      if (showWinOverlay) {
        showWinOverlay(intensity, totalWin)
      }
    } else {
      gameState.consecutiveWins.value = 0
    }
  }

  const spin = async () => {
    if (gameState.isSpinning.value) return

    if (gameState.credits.value < gameState.bet.value) {
      return
    }
    gameState.credits.value -= gameState.bet.value
    gameState.consecutiveWins.value = 0

    gameState.isSpinning.value = true
    gameState.currentWin.value = 0

    await animateSpin()
    await checkWinsAndCascade()

    gameState.isSpinning.value = false
  }

  const increaseBet = () => {
    if (!gameState.isSpinning.value && gameState.bet.value < CONFIG.game.maxBet) {
      gameState.bet.value += CONFIG.game.betStep
    }
  }

  const decreaseBet = () => {
    if (!gameState.isSpinning.value && gameState.bet.value > CONFIG.game.minBet) {
      gameState.bet.value -= CONFIG.game.betStep
    }
  }

  return {
    spin,
    increaseBet,
    decreaseBet
  }
}
