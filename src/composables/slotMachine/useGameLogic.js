import { CONFIG } from '../../config/constants'
import { getRandomSymbol } from '../../utils/gameHelpers'

export function useGameLogic(gameState, gridState, render) {
  // Visible rows: only evaluate rows 1..4 for wins and scatters
  const VISIBLE_START_ROW = 1
  const VISIBLE_ROWS = 4
  const VISIBLE_END_ROW = VISIBLE_START_ROW + VISIBLE_ROWS - 1

  const showAlert = () => {
  }

  const findWinningCombinations = () => {
    const wins = []

    const symbolsToCheck = Object.keys(CONFIG.paytable).filter(s => s !== 'scatter')
    for (const symbol of symbolsToCheck) {
      const countsPerReel = []
      const positionsPerReel = []

      for (let col = 0; col < CONFIG.reels.count; col++) {
        const matches = []
        for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
          const cell = gridState.grid.value[col][row]
          const isMatch = symbol === 'wild'
            ? cell === 'wild'
            : (cell === symbol || cell === 'wild')
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
        if (gridState.grid.value[col][row] === 'scatter') count++
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
    const duration = 800 // ms (0.3s in + 0.5s out)
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

  const convertGoldenToWilds = (wins) => {
    const winPositions = new Set()
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        winPositions.add(`${col},${row}`)
      })
    })

    winPositions.forEach(pos => {
      if (gridState.goldenSymbols.value.has(pos)) {
        const [col, row] = pos.split(',').map(Number)
        gridState.grid.value[col][row] = 'wild'
        gridState.goldenSymbols.value.delete(pos)
      }
    })

    gridState.grid.value = [...gridState.grid.value] // Trigger reactivity
  }

  const cascadeSymbols = async (wins) => {
    const toRemove = new Set()
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => {
        toRemove.add(`${col},${row}`)
      })
    })

    for (let col = 0; col < CONFIG.reels.count; col++) {
      const removed = []
      for (let row = CONFIG.reels.rows - 1; row >= 0; row--) {
        if (toRemove.has(`${col},${row}`)) removed.push(row)
      }

      for (let i = removed.length - 1; i >= 0; i--) {
        const rowToRemove = removed[i]
        for (let row = rowToRemove; row > 0; row--) {
          gridState.grid.value[col][row] = gridState.grid.value[col][row - 1]
        }
        gridState.grid.value[col][0] = getRandomSymbol()
      }
    }

    gridState.grid.value = [...gridState.grid.value] // Trigger reactivity
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

  const checkWinsAndCascade = async () => {
    let totalWin = 0
    let hasWins = true
    let scattersAwarded = false

    while (hasWins) {
      const wins = findWinningCombinations()
      if (wins.length === 0) {
        hasWins = false
        break
      }

      const waysWinAmount = calculateWinAmount(wins)
      const multipliedWays = waysWinAmount * gameState.currentMultiplier.value * gameState.bet.value

      totalWin += multipliedWays
      gameState.consecutiveWins.value++

      await highlightWinsAnimation(wins)
      convertGoldenToWilds(wins)

      // Run disappear before cascading
      await animateDisappear(wins)

      await cascadeSymbols(wins)
    }

    if (totalWin > 0) {
      gameState.currentWin.value = totalWin
      gameState.credits.value += totalWin
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
