import { Container, Sprite } from 'pixi.js'
import { createBackdrop } from './backdrop'
import { getTextureForSymbol } from './textures'
import { applyTileVisuals } from './visuals'
import { createWinningEffects } from './winning/effects'
import { createWinningFrameManager } from './winning/winningComposer'
import { createFlipAnimationManager } from './winning/flipAnimation'
import { createDropAnimationManager } from './dropAnimation'
import { getBufferOffset } from '../../../utils/gameHelpers'

export function useReels(gameState, gridState) {
    const container = new Container()
    const tilesContainer = new Container()  // Separate container for tiles (will be masked)
    const framesContainer = new Container()  // Container for frames (not masked)

    const { ensureBackdrop } = createBackdrop(tilesContainer)
    const winningEffects = createWinningEffects()
    const winningFrames = createWinningFrameManager()
    const flipAnimations = createFlipAnimationManager()
    const dropAnimations = createDropAnimationManager()
    let previousSpinning = false // Track previous spinning state
    const flippedTiles = new Set() // Track tiles that have already been flipped
    let highlightsAppeared = false // Track if highlights have appeared this round
    let readyToFlip = false // Ready to trigger flips
    let savedWinningPositions = [] // Save winning positions when highlights appear
    let lastCascadeTime = 0 // Track when cascade last happened
    const CASCADE_RESET_WINDOW = 300 // Reset sprites within 300ms of cascade
    let previousGrid = null // Track previous grid state to detect tile movements

    // Add containers in order: background, tiles, frames
    container.addChild(tilesContainer)
    container.addChild(framesContainer)

    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    const BLEED = 2
    const TILE_SPACING = 5  // Spacing between tiles (all sides)

    // Buffer offset for grid row mapping (visual row 0 = grid row BUFFER_OFFSET)
    const BUFFER_OFFSET = getBufferOffset()

    const spriteCache = new Map() // `${col}:${row}`

    function draw(mainRect, tileSize, timestamp, canvasW) {
        ensureBackdrop(mainRect, canvasW)

        const tileW = typeof tileSize === 'number' ? tileSize : tileSize.w
        const tileH = typeof tileSize === 'number' ? tileSize : tileSize.h

        // Calculate tile size and positioning with small margins on sides
        const margin = 10  // Small margin on left and right
        const totalSpacingX = TILE_SPACING * (COLS - 1)  // Total horizontal spacing
        const availableWidth = canvasW - (margin * 2) - totalSpacingX
        const scaledTileW = availableWidth / COLS  // Each tile width
        const scaledTileH = scaledTileW * (tileH / tileW)  // Maintain aspect ratio
        const stepX = scaledTileW + TILE_SPACING  // Tile width + spacing
        const stepY = scaledTileH + TILE_SPACING  // Tile height + spacing
        const originX = margin  // Start from left margin

        const startY = mainRect.y - (1 - TOP_PARTIAL) * scaledTileH
        const spinning = !!gameState.isSpinning?.value

        // Update flip and drop animations every frame
        flipAnimations.update()
        dropAnimations.update()

        const hasHighlights = gridState.highlightWins?.value?.length > 0

        // Clear flip animations and tracking when spinning starts
        if (spinning && !previousSpinning) {
            flipAnimations.clear()
            dropAnimations.clear()
            flippedTiles.clear()
            highlightsAppeared = false
            readyToFlip = false
            savedWinningPositions = []
            lastCascadeTime = 0
            previousGrid = null
        }

        // Detect when cascade completes (grid just changed)
        const cascadeTime = gridState.lastCascadeTime || 0
        if (cascadeTime > lastCascadeTime) {
            // Detect which tiles moved and start drop animations
            // Use the stored removed positions from cascade
            const removedPositions = gridState.lastRemovedPositions || new Set()

            if (previousGrid && removedPositions.size > 0) {
                for (let col = 0; col < COLS; col++) {
                    const oldCol = previousGrid[col] || []
                    const newCol = gridState.grid.value[col] || []
                    const totalRows = oldCol.length

                    // Count how many tiles were removed from GAME area
                    let removedCount = 0
                    for (let gridRow = BUFFER_OFFSET; gridRow < totalRows; gridRow++) {
                        if (removedPositions.has(`${col},${gridRow}`)) {
                            removedCount++
                        }
                    }

                    if (removedCount === 0) continue

                    // Replicate cascade logic to track tile movements:
                    // 1. Collect kept GAME tiles (rows BUFFER_OFFSET to totalRows-1, excluding removed)
                    const keptGameTiles = [] // [{oldGridRow, symbol}]
                    for (let row = totalRows - 1; row >= BUFFER_OFFSET; row--) {
                        if (!removedPositions.has(`${col},${row}`)) {
                            keptGameTiles.unshift({ oldGridRow: row, symbol: oldCol[row] })
                        }
                    }

                    // 2. Tiles from bottom of buffer (these move into game area)
                    const takeFromBuffer = [] // [{oldGridRow, symbol}]
                    for (let i = BUFFER_OFFSET - removedCount; i < BUFFER_OFFSET; i++) {
                        if (i >= 0) {
                            takeFromBuffer.push({ oldGridRow: i, symbol: oldCol[i] })
                        }
                    }

                    // 3. Remaining buffer tiles (these shift but stay in buffer)
                    const remainingBuffer = [] // [{oldGridRow, symbol}]
                    for (let i = 0; i < BUFFER_OFFSET - removedCount; i++) {
                        remainingBuffer.push({ oldGridRow: i, symbol: oldCol[i] })
                    }

                    // Now map to new positions:
                    // [removedCount new tiles][remainingBuffer][takeFromBuffer][keptGameTiles]
                    let newGridRow = 0

                    // Skip new random tiles
                    newGridRow += removedCount

                    // Remaining buffer tiles
                    remainingBuffer.forEach((tile) => {
                        const oldGridRow = tile.oldGridRow
                        // These moved from oldGridRow to newGridRow
                        if (oldGridRow !== newGridRow) {
                            const oldVisualRow = oldGridRow - BUFFER_OFFSET
                            const newVisualRow = newGridRow - BUFFER_OFFSET

                            // Only animate if visible
                            if (newVisualRow >= -1 && newVisualRow <= ROWS_FULL + 1) {
                                const cellKey = `${col}:${newVisualRow}`
                                const sprite = spriteCache.get(cellKey)
                                if (sprite) {
                                    const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    dropAnimations.startDrop(cellKey, sprite, oldY, newY)
                                }
                            }
                        }
                        newGridRow++
                    })

                    // Buffer tiles moving into game
                    takeFromBuffer.forEach((tile) => {
                        const oldGridRow = tile.oldGridRow
                        const oldVisualRow = oldGridRow - BUFFER_OFFSET
                        const newVisualRow = newGridRow - BUFFER_OFFSET

                        // Always animate these (buffer to game)
                        if (newVisualRow >= -1 && newVisualRow <= ROWS_FULL + 1) {
                            const cellKey = `${col}:${newVisualRow}`
                            const sprite = spriteCache.get(cellKey)
                            if (sprite) {
                                const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                dropAnimations.startDrop(cellKey, sprite, oldY, newY)
                            }
                        }
                        newGridRow++
                    })

                    // Kept game tiles
                    keptGameTiles.forEach((tile) => {
                        const oldGridRow = tile.oldGridRow
                        if (oldGridRow !== newGridRow) {
                            const oldVisualRow = oldGridRow - BUFFER_OFFSET
                            const newVisualRow = newGridRow - BUFFER_OFFSET

                            if (newVisualRow >= -1 && newVisualRow <= ROWS_FULL + 1) {
                                const cellKey = `${col}:${newVisualRow}`
                                const sprite = spriteCache.get(cellKey)
                                if (sprite) {
                                    const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    dropAnimations.startDrop(cellKey, sprite, oldY, newY)
                                }
                            }
                        }
                        newGridRow++
                    })
                }
            }

            lastCascadeTime = cascadeTime
            flipAnimations.clear()
            flippedTiles.clear()
        }

        // Within cascade window, force reset all sprites
        const inCascadeWindow = lastCascadeTime > 0 && (Date.now() - lastCascadeTime) < CASCADE_RESET_WINDOW

        // Detect when highlights appear and save positions
        if (hasHighlights) {
            // Get current winning positions (convert grid rows to visual rows for cellKey)
            const currentPositions = (gridState.highlightWins?.value || []).flatMap(win =>
                win.positions.map(([col, gridRow]) => `${col}:${gridRow - BUFFER_OFFSET}`)
            )

            // Check if positions changed (new win in consecutive streak)
            const positionsChanged = currentPositions.length !== savedWinningPositions.length ||
                currentPositions.some(pos => !savedWinningPositions.includes(pos))

            if (positionsChanged) {
                highlightsAppeared = true

                // Save current grid before cascade happens (for drop animation comparison)
                previousGrid = gridState.grid.value.map(col => [...col])

                // Clear previous flip state for new highlights
                // This is crucial because after cascade, new tiles occupy the same positions
                flippedTiles.clear()
                flipAnimations.clear() // This clears completedFlips too

                // Save new winning positions
                savedWinningPositions = currentPositions

                // Mark ready to flip immediately when highlights appear
                readyToFlip = true
            }
        }

        // Don't clear completed flips when highlights disappear
        // Only clear when new highlights appear (handled above) or when spinning starts
        // This keeps tiles hidden during cascade until new tiles arrive

        previousSpinning = spinning

        const usedKeys = new Set()
        const tilesToFlip = [] // Collect winning tiles to flip after draw loop

        // Position particle container at mainRect origin
        winningEffects.container.x = 0
        winningEffects.container.y = mainRect.y

        // Particle effects disabled - using simple border only
        // Clear any active effects
        if (winningEffects.isActive()) {
            winningEffects.clear()
        }

        for (let col = 0; col < COLS; col++) {
            const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
            const velocityTiles = gridState.spinVelocities?.value?.[col] ?? 0
            const velocityPx = velocityTiles * tileH

            const reelStrip = gridState.reelStrips?.value?.[col] || []
            const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

            // Draw 0..5: top partial, 4 full rows, bottom partial
            // r is visual row (0-5), maps to grid row (r + BUFFER_OFFSET)
            for (let r = 0; r <= ROWS_FULL + 1; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * stepY + offsetTiles * stepY

                const gridRow = r + BUFFER_OFFSET // Convert visual row to grid row

                let symbol
                if (spinning) {
                    if (reelStrip.length === 0) continue
                    // During spin, we need to show the same strip positions that will be committed to the grid
                    // Visual row r corresponds to grid row (r + BUFFER_OFFSET)
                    // Grid row (r + BUFFER_OFFSET) will get strip position (reelTop + r + BUFFER_OFFSET)
                    // So during spin, we should also read from strip position (reelTop + r + BUFFER_OFFSET)
                    const idx = ((reelTop + r + BUFFER_OFFSET) % reelStrip.length + reelStrip.length) % reelStrip.length
                    symbol = reelStrip[idx]
                } else {
                    symbol = gridState.grid?.value?.[col]?.[gridRow]
                }

                const cellKey = `${col}:${r}` // Use visual row for cellKey

                // Texture function will automatically detect "_gold" suffix in symbol
                const tex = getTextureForSymbol(symbol)
                if (!tex) continue

                let sp = spriteCache.get(cellKey)
                let symbolChanged = false

                // Check if symbol changed (after cascade) - reset sprite state
                if (sp && sp.texture !== tex) {
                    symbolChanged = true
                    // Reset any flip animation state for this tile
                    if (flipAnimations.isAnimating(cellKey) || flipAnimations.hasCompleted(cellKey)) {
                        flipAnimations.reset(cellKey, sp)
                        flippedTiles.delete(cellKey)
                    }
                    // FORCE reset scale immediately when symbol changes
                    sp.scale.x = 1
                    sp.alpha = 1
                }

                const w = scaledTileW + BLEED * 2
                const h = scaledTileH + BLEED * 2

                // Check if this tile is in the winning positions (compare using grid rows)
                // Don't check spinning - we want to show highlights during win animation
                // Only check visual rows 1-4 (the 4 full visible rows where wins are calculated)
                const winning = (r >= 1 && r <= 4)
                    ? (gridState.highlightWins?.value || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === gridRow))
                    : false

                // For flip animation, check saved positions (uses visual row cellKey)
                const shouldFlip = savedWinningPositions.includes(cellKey)

                const isAnimating = flipAnimations.isAnimating(cellKey)
                const isInDelay = flipAnimations.isInDelay(cellKey)

                if (!sp) {
                    sp = new Sprite(tex)
                    sp.anchor.set(0.5, 0.5) // Center anchor for proper flip
                    spriteCache.set(cellKey, sp)
                } else {
                    sp.texture = tex
                }

                // Set anchor to center for flipping effect
                sp.anchor.set(0.5, 0.5)

                // Set size using scale to preserve animation scale changes
                const scaleX = w / sp.texture.width
                const scaleY = h / sp.texture.height

                // Check if this tile should be disappeared (game's disappear system uses grid rows)
                const disappearKey = `${col},${gridRow}`
                const shouldDisappear = gridState.disappearPositions?.value?.has(disappearKey)

                // Check if this tile has completed flipping
                const hasCompletedFlip = flipAnimations.hasCompleted(cellKey)

                // Handle scale based on animation state
                if (inCascadeWindow || symbolChanged || (!isAnimating && !hasCompletedFlip) || isInDelay) {
                    // Cascade window, symbol changed, or not animating: set normal scale
                    // Let the game's disappear system handle visibility
                    sp.scale.set(scaleX, scaleY)
                    sp.alpha = shouldDisappear ? 0 : 1
                } else if (hasCompletedFlip) {
                    // Tile has completed flipping: keep it at scale.x=0 until cascade
                    sp.scale.x = 0
                    sp.scale.y = scaleY
                    sp.alpha = shouldDisappear ? 0 : 1
                } else {
                    // During flip animation: only update Y scale, preserve animated X scale
                    sp.scale.y = scaleY
                    // Don't touch alpha - game will handle it
                }

                // Collect winning tiles to flip when ready (use saved positions)
                if (shouldFlip && readyToFlip && !isAnimating && !flippedTiles.has(cellKey)) {
                    tilesToFlip.push({ key: cellKey, sprite: sp, scaleX })
                    flippedTiles.add(cellKey) // Mark as flipped
                } else if (!shouldFlip && isAnimating) {
                    // Reset tile if it's no longer winning
                    flipAnimations.reset(cellKey, sp)
                    flippedTiles.delete(cellKey)
                }

                // Always apply tile visuals - this handles the tint
                applyTileVisuals(sp, 1, winning)

                // Position with center anchor
                sp.x = Math.round(xCell) - BLEED + w / 2

                // Use drop animation Y if tile is dropping, otherwise use normal Y
                const baseY = yCell - BLEED + h / 2
                sp.y = dropAnimations.getDropY(cellKey, baseY)

                // Update winning frame in separate container
                // Pass sprite's center position directly
                winningFrames.updateFrame(cellKey, sp, winning, sp.x, sp.y)

                if (!sp.parent) tilesContainer.addChild(sp)
                usedKeys.add(cellKey)
            }
        }

        // Cleanup unused tile sprites and frames
        for (const [key, sprite] of spriteCache.entries()) {
            if (!usedKeys.has(key)) {
                if (sprite.parent) sprite.parent.removeChild(sprite)
                sprite.destroy({ children: true, texture: false, baseTexture: false })
                spriteCache.delete(key)
            }
        }
        winningFrames.cleanup(usedKeys)

        // Trigger flip animations for winning tiles after spinning stopped
        if (tilesToFlip.length > 0) {
            for (const { key, sprite, scaleX } of tilesToFlip) {
                flipAnimations.startFlip(key, sprite, scaleX)
            }
            readyToFlip = false // Reset so we don't keep adding tiles
        }
    }

    // Add winning effects and frames to their containers
    container.addChild(winningEffects.container)
    framesContainer.addChild(winningFrames.container)

    // Expose API
    return {
        container,
        draw,
        winningEffects
    }
}
