import { CONFIG } from '../../config/constants'
import { getRandomSymbol, getBufferOffset, enforceBonusLimit } from '../../utils/gameHelpers'
import { useAudioEffects } from '../useAudioEffects'
import { useGameStore } from '../../stores/gameStore'

/**
 * Game Logic - State machine based architecture
 * Each function performs a specific action and returns a promise
 * Flow orchestration is handled by useGameFlowController
 */
export function useGameLogic(gameState, gridState, render, showWinOverlayFn) {
  const gameStore = useGameStore()

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
    const wins = []

    const symbolsToCheck = Object.keys(CONFIG.paytable).filter(s => s !== 'liangtong')
    for (const symbol of symbolsToCheck) {
      const countsPerReel = []
      const positionsPerReel = []

      for (let col = 0; col < CONFIG.reels.count; col++) {
        const matches = []
        for (let row = VISIBLE_START_ROW; row <= VISIBLE_END_ROW; row++) {
          const cell = gridState.grid.value[col][row]
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
    const totalRows = CONFIG.reels.rows + BUFFER_OFFSET
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

          enforceBonusLimit(gridState.grid.value)

          resolve()
        }
      }
      animate()
    })
  }

  const highlightWinsAnimation = (wins) => {
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
    const transformedPositions = new Set()

    wins.forEach(win => {
      win.positions = win.positions.filter(([col, row]) => {
        const currentSymbol = gridState.grid.value[col][row]
        if (currentSymbol && currentSymbol.endsWith('_gold') && currentSymbol !== 'gold') {
          gridState.grid.value[col][row] = 'gold'
          transformedPositions.add(`${col},${row}`)
          return false
        }
        return true
      })
    })

    gridState.grid.value = [...gridState.grid.value]
    return new Promise(resolve => setTimeout(resolve, 200))
  }

  const animateDisappear = (wins) => {
    const DISAPPEAR_MS = 300
    const startTime = Date.now()

    const positions = []
    wins.forEach(win => {
      win.positions.forEach(([col, row]) => positions.push([col, row]))
    })
    gridState.disappearPositions.value = new Set(
      positions.map(([c, r]) => `${c},${r}`)
    )
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

    gridState.lastRemovedPositions.value = toRemove
    gridState.previousGridSnapshot = gridState.grid.value.map(col => [...col])

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
          const symbol = gridState.grid.value[col][row]
          keptGameTiles.unshift(symbol)
        }
      }

      const needFromBuffer = rowsToRemove.length
      const takeFromBuffer = []
      for (let i = BUFFER_OFFSET - needFromBuffer; i < BUFFER_OFFSET; i++) {
        if (i >= 0) {
          takeFromBuffer.push(gridState.grid.value[col][i])
        }
      }

      let bonusCountInVisibleRows = 0
      for (const tile of keptGameTiles) {
        if (tile === 'bonus') bonusCountInVisibleRows++
      }
      for (const tile of takeFromBuffer) {
        if (tile === 'bonus') bonusCountInVisibleRows++
      }

      for (let i = 0; i < needFromBuffer; i++) {
        const allowBonus = bonusCountInVisibleRows < 1
        const newSymbol = getRandomSymbol({ col, allowGold: true, allowBonus })
        newColumn.push(newSymbol)
        if (newSymbol === 'bonus') {
          bonusCountInVisibleRows++
        }
      }

      for (let i = 0; i < BUFFER_OFFSET - needFromBuffer; i++) {
        newColumn.push(gridState.grid.value[col][i])
      }

      takeFromBuffer.forEach(tile => newColumn.push(tile))
      keptGameTiles.forEach(tile => newColumn.push(tile))

      gridState.grid.value[col] = newColumn
    }

    gridState.grid.value = [...gridState.grid.value]
    gridState.lastCascadeTime.value = Date.now()

    await animateCascade()
  }

  const animateCascade = () => {
    const startTime = Date.now()
    const MAX_WAIT = 5000

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const shouldWait = gridState.isDropAnimating.value

        if (shouldWait && elapsed < MAX_WAIT) {
          requestAnimationFrame(animate)
        } else {
          if (elapsed >= MAX_WAIT) {
            console.warn('⚠️ animateCascade: Hit max wait time')
          }
          render()
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
    transformGoldTilesToGold,
    animateDisappear,
    cascadeSymbols,
    getWinIntensity,
    playConsecutiveWinSound,
    showWinOverlay: showWinOverlayFn
  }
}
