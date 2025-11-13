import { Container } from 'pixi.js'
import { useAudioEffects } from '../../useAudioEffects'
import { getBufferOffset } from '../../../utils/gameHelpers'
import { CONFIG } from '../../../config/constants'

/**
 * Creates a bonus tile pop animation overlay
 * Pops each bonus tile one-by-one with sound effect before the jackpot video
 */
export function createBonusTilePopAnimation(gridState, reels) {
  const audioEffects = useAudioEffects()
  const container = new Container()
  container.visible = false
  container.zIndex = 1100 // Below video overlay but above game elements

  const BUFFER_OFFSET = getBufferOffset()

  // CENTRALIZED: Use winning check rows from CONFIG (single source of truth)
  const WIN_CHECK_START_ROW = CONFIG.reels.winCheckStartRow // 5
  const WIN_CHECK_END_ROW = CONFIG.reels.winCheckEndRow // 8

  let isPlaying = false
  let onCompleteCallback = null
  let currentTileIndex = 0
  let bonusTilePositions = []

  /**
   * Start the pop animation for all bonus tiles
   */
  function show(canvasWidth, canvasHeight, _mainRect, _tileSize, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('💥 Starting bonus tile pop animation...')

    // Find all bonus tile positions in the winning check rows
    bonusTilePositions = []
    for (let col = 0; col < CONFIG.reels.count; col++) {
      for (let row = WIN_CHECK_START_ROW; row <= WIN_CHECK_END_ROW; row++) {
        const cell = gridState.grid[col][row]
        if (cell === 'bonus') {
          bonusTilePositions.push({ col, row })
        }
      }
    }

    console.log(`Found ${bonusTilePositions.length} bonus tiles to pop`)

    if (bonusTilePositions.length === 0) {
      // No tiles to pop, complete immediately
      hide()
      return
    }

    // Reset state
    currentTileIndex = 0

    // Start the sequential pop animation
    startPopSequence()
  }

  /**
   * Pop tiles one by one
   */
  function startPopSequence() {
    if (currentTileIndex >= bonusTilePositions.length) {
      // All tiles popped, complete
      setTimeout(() => {
        hide()
      }, 500) // Wait for last pop animation to finish
      return
    }

    const tilePos = bonusTilePositions[currentTileIndex]
    const visualRow = tilePos.row - BUFFER_OFFSET

    console.log(`💥 Popping tile at col ${tilePos.col}, row ${tilePos.row} (visual row ${visualRow})`)

    // Play pop sound
    audioEffects.playEffect('lot')

    // Trigger pop animation on the actual tile sprite
    if (reels && reels.triggerPop) {
      reels.triggerPop(tilePos.col, visualRow)
    }

    // Move to next tile after delay
    currentTileIndex++
    setTimeout(() => {
      startPopSequence()
    }, 300) // 300ms between each pop
  }

  /**
   * Hide the animation
   */
  function hide() {
    container.visible = false
    isPlaying = false

    console.log('✅ Bonus tile pop animation completed')

    // Trigger completion callback
    if (onCompleteCallback) {
      onCompleteCallback()
      onCompleteCallback = null
    }
  }

  /**
   * Update (called each frame)
   */
  function update(timestamp) {
    // Animation is handled by requestAnimationFrame in updatePopEffects
  }

  /**
   * Build/rebuild for canvas resize
   */
  function build(canvasWidth, canvasHeight) {
    // Nothing to rebuild, positions are calculated on show
  }

  return {
    container,
    show,
    hide,
    update,
    build,
    isShowing: () => isPlaying || container.visible
  }
}
