import { Container, Sprite } from 'pixi.js'
import { createBackdrop } from './backdrop'
import { getTextureForSymbol } from './textures'
import { applyTileVisuals } from './visuals'
import { createWinningEffects } from './winning/effects'
import { createWinningFrameManager } from './winning/winningComposer'
import { createFlipAnimationManager } from './winning/flipAnimation'
import { createDropAnimationManager } from './dropAnimation'
import { createBumpAnimationManager } from './tiles/bumpAnimation'
import { getBufferOffset } from '../../../utils/gameHelpers'
import { isBonusTile } from '../../../utils/tileHelpers'

export function useReels(gameState, gridState) {
    const container = new Container()
    const tilesContainer = new Container()  // Separate container for tiles (will be masked)
    const framesContainer = new Container()  // Container for frames (not masked)

    const { ensureBackdrop } = createBackdrop(tilesContainer)
    const winningEffects = createWinningEffects()
    const winningFrames = createWinningFrameManager()
    const flipAnimations = createFlipAnimationManager()
    const dropAnimations = createDropAnimationManager()
    const bumpAnimations = createBumpAnimationManager()
    let previousSpinning = false // Track previous spinning state
    const flippedTiles = new Set() // Track tiles that have already been flipped
    let highlightsAppeared = false // Track if highlights have appeared this round
    let readyToFlip = false // Ready to trigger flips
    let savedWinningPositions = [] // Save winning positions when highlights appear
    let lastCascadeTime = 0 // Track when cascade last happened
    const CASCADE_RESET_WINDOW = 300 // Reset sprites within 300ms of cascade

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

        // Update flip, drop, and bump animations every frame
        flipAnimations.update()
        dropAnimations.update()
        bumpAnimations.update()

        // Update drop animation state for game logic to wait on
        gridState.isDropAnimating.value = dropAnimations.hasActiveDrops()

        const hasHighlights = gridState.highlightWins?.value?.length > 0

        // Clear flip animations and tracking when spinning starts
        if (spinning && !previousSpinning) {
            flipAnimations.clear()
            dropAnimations.clear()
            bumpAnimations.clear()
            flippedTiles.clear()
            highlightsAppeared = false
            readyToFlip = false
            savedWinningPositions = []
            lastCascadeTime = 0
            gridState.previousGridSnapshot = null
        }

        // Detect when cascade completes (grid just changed)
        const cascadeTime = gridState.lastCascadeTime?.value || 0
        if (cascadeTime > lastCascadeTime) {
            // CRITICAL: Clear all completed animation states from previous cascade
            // When a new cascade starts, old completed states are no longer valid
            // This prevents sprites from changing to wrong symbols after grace period expires
            dropAnimations.clearCompleted()

            // Detect which tiles moved and start drop animations
            // Use the stored removed positions from cascade
            const removedPositions = gridState.lastRemovedPositions?.value || new Set()

            if (gridState.previousGridSnapshot) {
            }

            if (gridState.previousGridSnapshot && removedPositions.size > 0) {
                for (let col = 0; col < COLS; col++) {
                    const oldCol = gridState.previousGridSnapshot[col] || []
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
                    // NOTE: Grid row 3 (visual -1) is the top partial visible row and needs animation!

                    // Read symbols from NEW grid (after cascade)
                    // The NEW grid has the correct symbols at each position after cascade
                    // We just need to track which sprites animate from old positions to new positions

                    // 1. Collect kept GAME tiles
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

                            // Only animate if we have sprites rendered (visual rows -4 to 5)
                            if (newVisualRow >= -BUFFER_OFFSET && newVisualRow <= ROWS_FULL + 1) {
                                const cellKey = `${col}:${newVisualRow}`
                                const sprite = spriteCache.get(cellKey)
                                if (sprite) {
                                    const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    // Sprites use center anchor, so expectedX should be at center
                                    const expectedX = originX + col * stepX + scaledTileW / 2
                                    const xMatch = Math.abs(sprite.x - expectedX) < 2 ? '✓' : '❌'
                                    const gridSymbol = newCol[newGridRow]
                                    const symbolMatch = tile.symbol === gridSymbol ? '✓' : '❌MISMATCH'
                                    dropAnimations.startDrop(cellKey, sprite, oldY, newY, tile.symbol, getTextureForSymbol)
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

                        // Animate buffer→game drops (we now have sprites for all visual rows -4 to 5)
                        if (newVisualRow >= -BUFFER_OFFSET && newVisualRow <= ROWS_FULL + 1) {
                            const cellKey = `${col}:${newVisualRow}`
                            const sprite = spriteCache.get(cellKey)
                            if (sprite) {
                                const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                // Sprites use center anchor, so expectedX should be at center
                                const expectedX = originX + col * stepX + scaledTileW / 2
                                const xMatch = Math.abs(sprite.x - expectedX) < 2 ? '✓' : '❌'
                                const gridSymbol = newCol[newGridRow]
                                const symbolMatch = tile.symbol === gridSymbol ? '✓' : '❌MISMATCH'
                                dropAnimations.startDrop(cellKey, sprite, oldY, newY, tile.symbol, getTextureForSymbol)
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

                            if (newVisualRow >= -BUFFER_OFFSET && newVisualRow <= ROWS_FULL + 1) {
                                const cellKey = `${col}:${newVisualRow}`
                                const sprite = spriteCache.get(cellKey)
                                if (sprite) {
                                    const oldY = startY + oldVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    const newY = startY + newVisualRow * stepY - BLEED + (scaledTileH + BLEED * 2) / 2
                                    // Sprites use center anchor, so expectedX should be at center
                                    const expectedX = originX + col * stepX + scaledTileW / 2
                                    const xMatch = Math.abs(sprite.x - expectedX) < 2 ? '✓' : '❌'
                                    const gridSymbol = newCol[newGridRow]
                                    const symbolMatch = tile.symbol === gridSymbol ? '✓' : '❌MISMATCH'
                                    dropAnimations.startDrop(cellKey, sprite, oldY, newY, tile.symbol, getTextureForSymbol)

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

            // Draw ALL rows including full buffer: visual rows -4 to 5 (grid rows 0 to 9)
            // This ensures we have sprites for ALL positions so drop animations work correctly
            // Visual rows -4 to -1 are buffer (offscreen), 0-3 are fully visible, 4-5 are partial (bottom)
            for (let r = -BUFFER_OFFSET; r <= ROWS_FULL + 1; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * stepY + offsetTiles * stepY

                const gridRow = r + BUFFER_OFFSET // Convert visual row to grid row

                const cellKey = `${col}:${r}` // Use visual row for cellKey

                let symbol
                // Check if this sprite is being animated (drop animation)
                const animatingSymbol = dropAnimations.getAnimatingSymbol(cellKey)
                // Check if this sprite just completed its animation
                const completedSymbol = dropAnimations.getCompletedSymbol(cellKey)

                if (animatingSymbol) {
                    // During drop animation, use the symbol stored with the animation
                    // This prevents texture changes while the sprite is moving
                    symbol = animatingSymbol
                } else if (completedSymbol) {
                    // Just completed animation - preserve the symbol that was animating
                    // Don't read from grid yet because next cascade may have updated it
                    symbol = completedSymbol
                } else if (spinning) {
                    if (reelStrip.length === 0) continue
                    // During spin, we need to show the same strip positions that will be committed to the grid
                    // Visual row r corresponds to grid row (r + BUFFER_OFFSET)
                    // Grid row (r + BUFFER_OFFSET) will get strip position (reelTop + r + BUFFER_OFFSET)
                    // So during spin, we should also read from strip position (reelTop + r + BUFFER_OFFSET)
                    const idx = ((reelTop + r + BUFFER_OFFSET) % reelStrip.length + reelStrip.length) % reelStrip.length
                    symbol = reelStrip[idx]
                } else {
                    // Normal state: read from grid
                    symbol = gridState.grid?.value?.[col]?.[gridRow]
                }

                // Texture function will automatically detect "_gold" suffix in symbol
                const tex = getTextureForSymbol(symbol)
                if (!tex) continue

                let sp = spriteCache.get(cellKey)
                let symbolChanged = false

                // Log only during cascades (after winning is detected)
                const isDropAnimating = animatingSymbol !== null
                const inCascadeWindow = lastCascadeTime > 0 && (timestamp - lastCascadeTime < 2000)

                // Check if symbol changed (after cascade) - reset sprite state
                if (sp && sp.texture !== tex) {
                    symbolChanged = true
                    // Reset any flip animation state for this tile
                    if (flipAnimations.isAnimating(cellKey) || flipAnimations.hasCompleted(cellKey)) {
                        flipAnimations.reset(cellKey, sp)
                        flippedTiles.delete(cellKey)
                    }
                    // Reset bump animation if symbol changed
                    if (bumpAnimations.isAnimating(cellKey) || bumpAnimations.hasBumped(cellKey)) {
                        bumpAnimations.reset(cellKey)
                    }
                    // FORCE reset scale immediately when symbol changes
                    sp.scale.x = 1
                    sp.scale.y = 1
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
                    // Update texture - symbol is already correctly determined above
                    // (either from animation, completed state, or grid)
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
                const isBumping = bumpAnimations.isAnimating(cellKey)

                if (inCascadeWindow || symbolChanged || (!isAnimating && !hasCompletedFlip) || isInDelay) {
                    // Cascade window, symbol changed, or not animating: set normal scale
                    // Let the game's disappear system handle visibility
                    sp.scale.x = scaleX
                    if (!isBumping) sp.scale.y = scaleY  // Don't override bump animation
                    sp.alpha = shouldDisappear ? 0 : 1
                } else if (hasCompletedFlip) {
                    // Tile has completed flipping: keep it at scale.x=0 until cascade
                    sp.scale.x = 0
                    if (!isBumping) sp.scale.y = scaleY  // Don't override bump animation
                    sp.alpha = shouldDisappear ? 0 : 1
                } else {
                    // During flip animation: only update Y scale, preserve animated X scale
                    if (!isBumping) sp.scale.y = scaleY  // Don't override bump animation
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

                // Always apply tile visuals - this handles the tint and dark mask
                applyTileVisuals(sp, 1, winning, hasHighlights)

                // Trigger bump animation for bonus tiles when they appear in visible rows
                // Don't trigger during drop animations to prevent symbol issues
                const isBonus = isBonusTile(symbol)
                const isVisibleRow = r >= 1 && r <= 4
                const isCurrentlyDropping = dropAnimations.isDropping(cellKey)
                const hasActiveDrops = gridState.isDropAnimating?.value
                if (isBonus && isVisibleRow && !spinning && !isCurrentlyDropping && !hasActiveDrops && !bumpAnimations.hasBumped(cellKey) && !bumpAnimations.isAnimating(cellKey)) {
                    bumpAnimations.startBump(cellKey, sp)
                }

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
