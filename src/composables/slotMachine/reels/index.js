import { Container, Sprite } from 'pixi.js'
import { createBackdrop } from './backdrop'
import { getTextureForSymbol } from './textures'
import { applyTileVisuals } from './visuals'
import { createGoldManager } from './goldManager'
import { createWinningEffects } from './winning/effects'
import { createWinningFrameManager } from './winning/winningComposer'
import { createFlipAnimationManager } from './winning/flipAnimation'

export function useReels(gameState, gridState) {
    const container = new Container()
    const tilesContainer = new Container()  // Separate container for tiles (will be masked)
    const framesContainer = new Container()  // Container for frames (not masked)

    const { ensureBackdrop } = createBackdrop(tilesContainer)
    const winningEffects = createWinningEffects()
    const winningFrames = createWinningFrameManager()
    const flipAnimations = createFlipAnimationManager()
    let previousSpinning = false // Track previous spinning state
    const flippedTiles = new Set() // Track tiles that have already been flipped
    let highlightsAppeared = false // Track if highlights have appeared this round
    let readyToFlip = false // Ready to trigger flips
    let savedWinningPositions = [] // Save winning positions when highlights appear

    // Add containers in order: background, tiles, frames
    container.addChild(tilesContainer)
    container.addChild(framesContainer)

    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    const BLEED = 2
    const TILE_SPACING = 5  // Spacing between tiles (all sides)

    const spriteCache = new Map() // `${col}:${row}`

    // Gold manager encapsulates selection and sync to gridState
    const GOLD_ALLOWED_COLS = [1, 2, 3]       // allow showing gold in columns 2–4 (zero-based)
    const VISIBLE_ROWS = [1, 2, 3, 4]          // visible rows
    const HIDDEN_ROWS = [0, ROWS_FULL + 1]     // top and bottom partial rows
    const gold = createGoldManager({
        gridState,
        allowedCols: GOLD_ALLOWED_COLS,
        visibleRows: VISIBLE_ROWS,
        hiddenRows: HIDDEN_ROWS,
        maxVisible: 2
    })

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

        // Update flip animations every frame
        flipAnimations.update()

        const hasHighlights = gridState.highlightWins?.value?.length > 0

        // Clear flip animations and tracking when spinning starts
        if (spinning && !previousSpinning) {
            console.log('🎰 Spinning started - clearing flip animations')
            flipAnimations.clear()
            flippedTiles.clear()
            highlightsAppeared = false
            readyToFlip = false
            savedWinningPositions = []
        }

        // Detect when highlights appear and save positions
        if (hasHighlights) {
            // Get current winning positions
            const currentPositions = (gridState.highlightWins?.value || []).flatMap(win =>
                win.positions.map(([col, row]) => `${col}:${row}`)
            )

            // Check if positions changed (new win in consecutive streak)
            const positionsChanged = currentPositions.length !== savedWinningPositions.length ||
                currentPositions.some(pos => !savedWinningPositions.includes(pos))

            if (positionsChanged) {
                console.log('✨ New highlights appeared!')
                highlightsAppeared = true

                // Clear previous flip state for new highlights
                flippedTiles.clear()
                flipAnimations.clear()

                // Save new winning positions
                savedWinningPositions = currentPositions
                console.log('💾 Saved winning positions:', savedWinningPositions)

                // Mark ready to flip immediately when highlights appear
                readyToFlip = true
                console.log('🎬 Ready to flip after highlights appeared!')
            }
        }

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
            for (let r = 0; r <= ROWS_FULL + 1; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * stepY + offsetTiles * stepY

                let symbol
                if (spinning) {
                    if (reelStrip.length === 0) continue
                    const idx = ((reelTop + r) % reelStrip.length + reelStrip.length) % reelStrip.length
                    symbol = reelStrip[idx]
                } else {
                    symbol = gridState.grid?.value?.[col]?.[r]
                }

                // Show gold even while spinning
                const goldVisible = true

                const cellKey = `${col}:${r}`
                const isAllowedCol = GOLD_ALLOWED_COLS.includes(col)
                const isVisibleRow = VISIBLE_ROWS.includes(r)
                const isSpecialSymbol = symbol === 'liangsuo' || symbol === 'liangtong'

                // Visuals driven by internal gold base selection (as requested)
                const isGoldenVisual = gold.goldBaseTiles.has(cellKey)

                // Only show gold on visible rows, allowed columns, and not special symbols
                const useGold = goldVisible
                    && isGoldenVisual
                    && isAllowedCol
                    && isVisibleRow
                    && !isSpecialSymbol

                const tex = getTextureForSymbol(symbol, useGold)
                if (!tex) continue

                let sp = spriteCache.get(cellKey)

                const w = scaledTileW + BLEED * 2
                const h = scaledTileH + BLEED * 2

                // Check if this tile is in the winning positions
                // Don't check spinning - we want to show highlights during win animation
                const winning = (r < ROWS_FULL)
                    ? (gridState.highlightWins?.value || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === r))
                    : false

                // For flip animation, check saved positions
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

                // Handle scale based on animation state
                if (!isAnimating || isInDelay) {
                    // Not animating OR in delay period: set normal scale
                    sp.scale.set(scaleX, scaleY)
                    sp.alpha = 1
                } else {
                    // During flip animation: only update Y scale, preserve animated X scale
                    sp.scale.y = scaleY
                }

                // Collect winning tiles to flip when ready (use saved positions)
                if (shouldFlip && readyToFlip && !isAnimating && !flippedTiles.has(cellKey)) {
                    console.log(`✅ Adding tile ${cellKey} to flip queue`)
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
                sp.y = yCell - BLEED + h / 2

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
            console.log(`🎬 Starting flip animations for ${tilesToFlip.length} winning tiles`)
            for (const { key, sprite, scaleX } of tilesToFlip) {
                flipAnimations.startFlip(key, sprite, scaleX)
            }
            readyToFlip = false // Reset so we don't keep adding tiles
        }
    }

    // Add winning effects and frames to their containers
    container.addChild(winningEffects.container)
    framesContainer.addChild(winningFrames.container)

    // Expose API consistent with previous version
    return {
        container,
        draw,
        preselectGoldCols: gold.preselectGoldCols,
        setGoldBaseTiles: gold.setGoldBaseTiles,
        clearGoldBaseTiles: gold.clearGoldBaseTiles,
        winningEffects
    }
}
