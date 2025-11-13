import { Container, Sprite } from 'pixi.js'
import { createBackdrop } from './backdrop'
import { getTextureForSymbol } from './textures'
import { applyTileVisuals } from './visuals'
import { createWinningEffects } from './winning/effects'
import { createWinningFrameManager } from './winning/winningComposer'
import { createDropAnimationManager } from './dropAnimation'
import { createBumpAnimationManager } from './tiles/bumpAnimation'
import { createPopAnimationManager } from './tiles/popAnimation'
import { createLightBurstManager } from './tiles/lightBurstEffect'
import { createAnticipationEffects } from './anticipationEffects'
import { createColumnHighlightManager } from './columnHighlight'
import { getBufferOffset } from '../../../utils/gameHelpers'
import { isBonusTile } from '../../../utils/tileHelpers'
import { useWinningStore, WINNING_STATES } from '../../../stores/winningStore'
import { useTimingStore } from '../../../stores/timingStore'

export function useReels(gameState, gridState) {
    const container = new Container()
    const tilesContainer = new Container()  // Separate container for tiles (will be masked)
    tilesContainer.sortableChildren = true  // Enable z-index sorting for pop-out effect
    const framesContainer = new Container()  // Container for frames (not masked)
    framesContainer.sortableChildren = true  // Enable z-index sorting for frames too

    const winningStore = useWinningStore()
    const timingStore = useTimingStore()
    const { ensureBackdrop } = createBackdrop(tilesContainer)
    const winningEffects = createWinningEffects()
    const winningFrames = createWinningFrameManager()
    const dropAnimations = createDropAnimationManager()
    const bumpAnimations = createBumpAnimationManager()
    const popAnimations = createPopAnimationManager()
    const lightBursts = createLightBurstManager()
    const anticipationEffects = createAnticipationEffects()
    const columnHighlights = createColumnHighlightManager()
    let previousSpinning = false // Track previous spinning state
    let lastCascadeTime = 0 // Track when cascade last happened
    let columnHighlightsInitialized = false // Track if column highlights are initialized

    // Add containers in order: background, light bursts, tiles, frames, column highlights
    container.addChild(tilesContainer)
    tilesContainer.addChild(lightBursts.container)  // Add light bursts behind tiles
    lightBursts.container.sortableChildren = true  // Enable z-index sorting
    container.addChild(framesContainer)
    container.addChild(columnHighlights.container)  // Add column highlights on top

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

        // Check if any reel is actually moving (has non-zero velocity)
        // This prevents the race condition where isSpinning is still true
        // but we've already applied finalGrid
        const anyVelocity = (gridState.spinVelocities || []).some(v => Math.abs(v) > 0.001)

        // Update drop, bump, and pop animations every frame
        dropAnimations.update()
        bumpAnimations.update()
        popAnimations.update()

        // Update drop animation state for game logic to wait on
        gridState.isDropAnimating = dropAnimations.hasActiveDrops()

        const hasHighlights = gridState.highlightWins?.length > 0

        // Initialize column highlights on first draw
        if (!columnHighlightsInitialized) {
            // Extend highlights to bottom but not above
            const extraHeight = stepY * 0.7  // Add more extension at bottom
            const columnHeight = ROWS_FULL * stepY + extraHeight
            const highlightX = originX
            const highlightY = mainRect.y  // Start at visible area top
            console.log(`🔧 Initializing column highlights: cols=${COLS}, width=${scaledTileW}, height=${columnHeight}, x=${highlightX}, y=${highlightY}, stepX=${stepX}`)
            columnHighlights.initialize(COLS, scaledTileW, columnHeight, highlightX, highlightY, stepX)
            columnHighlightsInitialized = true
            console.log('✅ Column highlights initialization complete')
        }

        // Update column highlights based on active slowdown column
        const activeSlowdownColumn = gridState.activeSlowdownColumn ?? -1
        columnHighlights.update(activeSlowdownColumn)

        // Clear animations when spinning starts
        if (spinning && !previousSpinning) {
            dropAnimations.clear()
            bumpAnimations.clear()
            popAnimations.clear()
            lightBursts.clear()
            columnHighlights.hideAll()
            lastCascadeTime = 0
            gridState.previousGridSnapshot = null
        }

        // Detect when cascade completes (grid just changed)
        const cascadeTime = gridState.lastCascadeTime || 0
        if (cascadeTime > lastCascadeTime) {
            // CRITICAL: Clear all completed animation states from previous cascade
            // When a new cascade starts, old completed states are no longer valid
            // This prevents sprites from changing to wrong symbols after grace period expires
            dropAnimations.clearCompleted()

            // Detect which tiles moved and start drop animations
            // Use the stored removed positions from cascade
            const removedPositions = gridState.lastRemovedPositions || new Set()

            if (gridState.previousGridSnapshot) {
            }

            if (gridState.previousGridSnapshot && removedPositions.size > 0) {
                for (let col = 0; col < COLS; col++) {
                    const oldCol = gridState.previousGridSnapshot[col] || []
                    const newCol = gridState.grid[col] || []
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
        }

        // Within cascade window, force reset all sprites
        const inCascadeWindow = lastCascadeTime > 0 && (Date.now() - lastCascadeTime) < timingStore.CASCADE_RESET_WINDOW

        previousSpinning = spinning

        const usedKeys = new Set()

        // Position particle container at mainRect origin
        winningEffects.container.x = 0
        winningEffects.container.y = mainRect.y

        // Particle effects disabled - using simple border only
        // Clear any active effects
        if (winningEffects.isActive()) {
            winningEffects.clear()
        }

        for (let col = 0; col < COLS; col++) {
            const offsetTiles = gridState.spinOffsets?.[col] ?? 0
            const velocityTiles = gridState.spinVelocities?.[col] ?? 0
            const velocityPx = velocityTiles * tileH

            const reelStrip = gridState.reelStrips?.[col] || []
            const reelTop = gridState.reelTopIndex?.[col] ?? 0

            // Draw ALL rows including full buffer: visual rows -4 to 5 (grid rows 0 to 9)
            // This ensures we have sprites for ALL positions so drop animations work correctly
            // Visual rows -4 to -1 are buffer (offscreen), 0-3 are fully visible, 4-5 are partial (bottom)
            for (let r = -BUFFER_OFFSET; r <= ROWS_FULL + 1; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * stepY + offsetTiles * stepY // Positive = spin downward (top to bottom)

                const gridRow = r + BUFFER_OFFSET // Convert visual row to grid row

                const cellKey = `${col}:${r}` // Use visual row for cellKey

                let symbol
                // Check if this sprite is being animated (drop animation)
                const animatingSymbol = dropAnimations.getAnimatingSymbol(cellKey)
                // Check if this sprite just completed its animation
                const completedSymbol = dropAnimations.getCompletedSymbol(cellKey)

                // Single source logic: strip during spin, grid when stopped
                const colVelocity = gridState.spinVelocities?.[col] ?? 0
                const thisColumnSpinning = Math.abs(colVelocity) > 0.001

                if (animatingSymbol) {
                    // During drop animation, use the symbol stored with the animation
                    symbol = animatingSymbol
                } else if (completedSymbol) {
                    // Just completed animation - preserve the symbol that was animating
                    symbol = completedSymbol
                } else if (thisColumnSpinning) {
                    // Spinning: read from strip (top-to-bottom direction)
                    if (reelStrip.length === 0) continue
                    // Subtract gridRow so symbols move downward as reelTop increases
                    const idx = ((reelTop - gridRow) % reelStrip.length + reelStrip.length) % reelStrip.length
                    symbol = reelStrip[idx]
                } else {
                    // Stopped: read from grid
                    symbol = gridState.grid?.[col]?.[gridRow]
                }

                // Texture function will automatically detect "_gold" suffix in symbol
                const tex = getTextureForSymbol(symbol)
                if (!tex) continue

                let sp = spriteCache.get(cellKey)
                let symbolChanged = false

                // Check if symbol changed (after cascade) - reset sprite state
                if (sp && sp.texture !== tex) {
                    symbolChanged = true
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
                // Adjusted for strip layout fix: visual rows 1-4 (the 4 visible rows, which map to grid rows 5-8)
                const winning = (r >= 1 && r <= 4)
                    ? (gridState.highlightWins || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === gridRow))
                    : false

                // Get winning state from store (game-level, not tile-level)
                const winningState = winningStore.getCellState(cellKey)
                const winningStateTime = winningStore.stateStartTime

                if (!sp) {
                    sp = new Sprite(tex)
                    sp.anchor.set(0.5, 0.5) // Center anchor for proper flip
                    spriteCache.set(cellKey, sp)
                } else if (sp.texture !== tex) {
                    // Only update texture if it changed to prevent unnecessary rendering artifacts
                    sp.texture = tex
                }

                // Set anchor to center for flipping effect
                sp.anchor.set(0.5, 0.5)

                // Set size using scale to preserve animation scale changes
                const scaleX = w / sp.texture.width
                const scaleY = h / sp.texture.height

                // Handle scale and alpha based on tile state
                const isBumping = bumpAnimations.isAnimating(cellKey)
                const isPopping = popAnimations.isAnimating(cellKey)
                const isCurrentlyDropping = dropAnimations.isDropping(cellKey)

                // Check if tile has an active winning state that should not be overridden
                const hasActiveWinningState = winningState && winningState !== WINNING_STATES.IDLE

                // PRIORITY 1: Drop animations override everything else
                // BUT: Don't override winning states (HIGHLIGHTED, FLIPPING, etc) even during cascade window
                if (isCurrentlyDropping || symbolChanged || (inCascadeWindow && !hasActiveWinningState)) {
                    // During drop, cascade window (without active winning state), or symbol change: normal scale
                    if (!isBumping && !isPopping) {
                        sp.scale.x = scaleX
                        sp.scale.y = scaleY
                    }
                    sp.alpha = 1
                }
                // PRIORITY 2: HIGHLIGHTED state - reset tile to normal (visible) before flip starts
                else if (winningState === WINNING_STATES.HIGHLIGHTED) {
                    // Reset to normal scale and full opacity
                    if (!isBumping && !isPopping) {
                        sp.scale.x = scaleX
                        sp.scale.y = scaleY
                    }
                    sp.alpha = 1
                }
                // PRIORITY 3: Winning state animations
                else if (winningState === WINNING_STATES.FLIPPING) {
                    // Calculate flip progress (0 to 1)
                    const elapsed = Date.now() - winningStateTime
                    const progress = Math.min(elapsed / timingStore.FLIP_DURATION, 1)

                    // Animate flip: scale.x from scaleX to 0
                    sp.scale.x = scaleX * (1 - progress)
                    if (!isBumping && !isPopping) sp.scale.y = scaleY
                    sp.alpha = 1
                } else if (winningState === WINNING_STATES.FLIPPED) {
                    // Keep flipped (hidden)
                    sp.scale.x = 0
                    if (!isBumping && !isPopping) sp.scale.y = scaleY
                    sp.alpha = 1
                } else if (winningState === WINNING_STATES.DISAPPEARING) {
                    // Fade out (only if not dropping)
                    sp.scale.x = 0  // Already flipped
                    if (!isBumping && !isPopping) sp.scale.y = scaleY
                    sp.alpha = 0
                } else {
                    // Default: normal scale
                    if (!isBumping && !isPopping) {
                        sp.scale.x = scaleX
                        sp.scale.y = scaleY
                    }
                    sp.alpha = 1
                }

                // Check if this is a bonus tile that should get special effects
                const isBonus = isBonusTile(symbol)
                const isVisibleRow = r >= 1 && r <= 4  // Adjusted for strip layout fix: visual rows 1-4 are visible
                const hasActiveDrops = gridState.isDropAnimating
                const shouldShowBonusEffects = isBonus && isVisibleRow && !spinning && !isCurrentlyDropping && !hasActiveDrops

                // Check for anticipation mode effects (gridRow already declared above)
                // Determine if THIS SPECIFIC column is currently spinning (not the global spinning state)
                // Only check this column's velocity, not the global spinning flag
                const columnIsSpinning = gridState.spinVelocities && gridState.spinVelocities[col] > 0.001

                // Get anticipation visual state, passing the spinning state
                const anticipationState = anticipationEffects.getTileVisualState(col, gridRow, symbol, columnIsSpinning)

                // Apply tile visuals with anticipation mode overrides
                // If anticipation mode is active:
                // - Bonus tiles in column 0 get highlighted (golden glow)
                // - Stopped tiles (non-bonus) get dark masked
                // - Spinning tiles remain normal
                let effectiveHighlight = winning
                let effectiveHasHighlights = hasHighlights

                if (anticipationEffects.isActive()) {
                    // Anticipation mode overrides normal win highlighting
                    effectiveHighlight = anticipationState.highlight
                    effectiveHasHighlights = anticipationState.shouldDim || anticipationState.highlight
                }

                // Always apply tile visuals - this handles the tint and dark mask
                applyTileVisuals(sp, 1, effectiveHighlight, effectiveHasHighlights)

                // Check if we should show anticipation burst for this tile
                // Must be defined before use in z-index calculation
                const shouldShowAnticipationBurst = anticipationEffects.isActive() && anticipationState.highlight

                // Trigger bump animation for bonus tiles when they appear in visible rows
                // Don't trigger during drop animations to prevent symbol issues
                if (shouldShowBonusEffects && !bumpAnimations.hasBumped(cellKey) && !bumpAnimations.isAnimating(cellKey)) {
                    bumpAnimations.startBump(cellKey, sp)
                }

                // Position with center anchor
                sp.x = Math.round(xCell) - BLEED + w / 2

                // Use drop animation Y if tile is dropping, otherwise use normal Y
                const baseY = yCell - BLEED + h / 2
                sp.y = dropAnimations.getDropY(cellKey, baseY)

                // Set z-index for pop-out effect on bonus tiles
                // Also elevate bonus tiles during anticipation mode
                const shouldElevate = shouldShowBonusEffects || shouldShowAnticipationBurst
                if (shouldElevate) {
                    sp.zIndex = 100  // Higher z-index makes bonus tiles appear above others
                } else {
                    sp.zIndex = 0    // Normal tiles at base level
                }

                // Update winning frame in separate container
                // Pass sprite's center position directly (bonus tiles don't get frames, only size/z-index effects)
                winningFrames.updateFrame(cellKey, sp, winning, sp.x, sp.y, false)

                // Update rotating light burst for bonus tiles
                // Also show burst for anticipation mode bonus tiles in first two columns
                const shouldShowBurst = shouldShowBonusEffects || shouldShowAnticipationBurst
                lightBursts.updateBurst(cellKey, sp, shouldShowBurst, timestamp)

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
        lightBursts.cleanup(usedKeys)
    }

    // Add winning effects and frames to their containers
    container.addChild(winningEffects.container)
    framesContainer.addChild(winningFrames.container)

    // Method to trigger pop animation on a specific tile
    function triggerPop(col, visualRow) {
        const cellKey = `${col}:${visualRow}`
        const sprite = spriteCache.get(cellKey)
        if (sprite) {
            popAnimations.startPop(cellKey, sprite)
        }
    }

    // Expose API
    return {
        container,
        draw,
        winningEffects,
        triggerPop,
        getSpriteCache: () => spriteCache // Expose sprite cache for pop animation
    }
}
