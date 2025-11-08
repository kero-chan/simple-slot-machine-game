import { CONFIG } from '../../config/constants'
import { getRandomSymbol } from '../../utils/gameHelpers'

export function useGameLogic(gameState, gridState, render) {
  const findWinningCombinations = () => {
    const wins = []

    for (let row = 0; row < CONFIG.reels.rows; row++) {
      let currentSymbol = gridState.grid.value[0][row]
      let count = 1
      let positions = [[0, row]]

      for (let col = 1; col < CONFIG.reels.count; col++) {
        const symbol = gridState.grid.value[col][row]

        if (symbol === currentSymbol || symbol === 'wild' || currentSymbol === 'wild') {
          count++
          positions.push([col, row])
          if (currentSymbol === 'wild' && symbol !== 'wild') {
            currentSymbol = symbol
          }
        } else {
          break
        }
      }

      if (count >= 3 && currentSymbol !== 'scatter') {
        wins.push({ symbol: currentSymbol, count, positions })
      }
    }

    return wins
  }

  const countScatters = () => {
    let count = 0
    for (let col = 0; col < CONFIG.reels.count; col++) {
      for (let row = 0; row < CONFIG.reels.rows; row++) {
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
        total += paytable[win.count]
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

          // Add golden symbols
          gridState.goldenSymbols.value.clear()
          for (let col = 1; col <= 3; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
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

    while (hasWins) {
      const wins = findWinningCombinations()
      if (wins.length === 0) {
        hasWins = false
        break
      }

      const winAmount = calculateWinAmount(wins)
      const multipliedWin = winAmount * gameState.currentMultiplier.value * gameState.bet.value

      totalWin += multipliedWin
      gameState.consecutiveWins.value++

      await highlightWinsAnimation(wins)
      convertGoldenToWilds(wins)

      const scatterCount = countScatters()
      if (scatterCount >= 3) {
        gameState.freeSpins.value += CONFIG.game.freeSpinsPerScatter +
                         (scatterCount - 3) * CONFIG.game.bonusScattersPerSpin
        gameState.inFreeSpinMode.value = true
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
