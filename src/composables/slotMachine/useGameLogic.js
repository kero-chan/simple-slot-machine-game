import { CONFIG } from '../../config/constants'
import { getRandomSymbol } from '../../utils/gameHelpers'

export function useGameLogic(gameState, gridState, render) {
  // Visible rows: only evaluate rows 1..4 for wins and scatters
  const VISIBLE_START_ROW = 1
  const VISIBLE_ROWS = 4
  const VISIBLE_END_ROW = VISIBLE_START_ROW + VISIBLE_ROWS - 1

  const showAlert = (text) => {
    if (typeof window !== 'undefined' && window.alert) {
      console.log(text)
    }
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
    const duration = CONFIG.animation.spinDuration

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        if (progress < 1) {
          // Randomize symbols during spin
          for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
              if (Math.random() > 0.7) {
                gridState.grid.value[col][row] = getRandomSymbol()
              }
            }
          }
          gridState.grid.value = [...gridState.grid.value] // Trigger reactivity
          requestAnimationFrame(animate)
        } else {
          // Final grid
          for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
              gridState.grid.value[col][row] = getRandomSymbol()
            }
          }

          // Add golden symbols only within visible rows
          gridState.goldenSymbols.value.clear()
          for (let col = 1; col <= 3; col++) {
            for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
              if (Math.random() < 0.2 &&
                  gridState.grid.value[col][row] !== 'wild' &&
                  gridState.grid.value[col][row] !== 'scatter') {
                gridState.goldenSymbols.value.add(`${col},${row}`)
              }
            }
          }

          gridState.grid.value = [...gridState.grid.value] // Trigger reactivity
          resolve()
        }
      }
      animate()
    })
  }

  const highlightWinsAnimation = (wins) => {
    const duration = 500
    const startTime = Date.now()

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        if (elapsed < duration) {
          gridState.highlightWins.value = wins
          requestAnimationFrame(animate)
        } else {
          gridState.highlightWins.value = null
          resolve()
        }
      }
      animate()
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
        if (elapsed < duration) {
          render()
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

      // Alert this cascade hit
      showAlert(`Hit! ${wins.length} win(s). +${multipliedWays} credits (x${gameState.currentMultiplier.value}).`)

      await highlightWinsAnimation(wins)
      convertGoldenToWilds(wins)

      // Scatter payout and free spins: award once per spin
      if (!scattersAwarded) {
        const scatterCount = countScatters()
        if (scatterCount >= 3) {
          const scatterPaytable = CONFIG.paytable.scatter || {}
          const scatterBase = scatterPaytable[scatterCount] || 0
          const scatterWin = scatterBase * gameState.currentMultiplier.value * gameState.bet.value

          const awardedFreeSpins = CONFIG.game.freeSpinsPerScatter +
            (scatterCount - 3) * CONFIG.game.bonusScattersPerSpin

          totalWin += scatterWin
          gameState.freeSpins.value += awardedFreeSpins
          gameState.inFreeSpinMode.value = true

          // Alert scatter bonus
          showAlert(`Scatter! ${scatterCount} scatters. +${scatterWin} credits, +${awardedFreeSpins} free spins.`)
        }
        scattersAwarded = true
      }

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

    if (gameState.freeSpins.value > 0) {
      gameState.freeSpins.value--
    } else {
      if (gameState.credits.value < gameState.bet.value) {
        return
      }
      gameState.credits.value -= gameState.bet.value
      gameState.consecutiveWins.value = 0
      gameState.inFreeSpinMode.value = false
    }

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
