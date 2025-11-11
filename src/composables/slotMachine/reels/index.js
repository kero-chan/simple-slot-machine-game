import { Container, Sprite } from 'pixi.js'
import { createBackdrop } from './backdrop'
import { getTextureForSymbol } from './textures'
import { applyTileVisuals } from './visuals'
import { createGoldManager } from './goldManager'
import { createWinningEffects } from './winning/effects'

export function useReels(gameState, gridState) {
    const container = new Container()
    const { ensureBackdrop } = createBackdrop(container)
    const winningEffects = createWinningEffects()

    const MARGIN_X = 10
    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    const BLEED = 2

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

        const stepX = tileW
        const originX = MARGIN_X
        const startY = mainRect.y - (1 - TOP_PARTIAL) * tileH
        const spinning = !!gameState.isSpinning?.value

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
            const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
            const velocityTiles = gridState.spinVelocities?.value?.[col] ?? 0
            const velocityPx = velocityTiles * tileH

            const reelStrip = gridState.reelStrips?.value?.[col] || []
            const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

            // Draw 0..5: top partial, 4 full rows, bottom partial
            for (let r = 0; r <= ROWS_FULL + 1; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * tileH + offsetTiles * tileH

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

                const w = tileW + BLEED * 2
                const h = tileH + BLEED * 2

                if (!sp) {
                    sp = new Sprite(tex)
                    sp.anchor.set(0, 0)
                    sp.width = w
                    sp.height = h
                    spriteCache.set(cellKey, sp)
                } else {
                    sp.texture = tex
                    sp.anchor.set(0, 0)
                    sp.width = w
                    sp.height = h
                }

                // Check if this tile is in the winning positions
                // Don't check spinning - we want to show highlights during win animation
                const winning = (r < ROWS_FULL)
                    ? (gridState.highlightWins?.value || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === r))
                    : false

                // Always apply tile visuals - this handles the winning frame overlay and tint
                applyTileVisuals(sp, 1, winning)

                sp.x = Math.round(xCell) - BLEED
                sp.y = yCell - BLEED

                if (!sp.parent) container.addChild(sp)
                usedKeys.add(cellKey)
            }
        }

        // Cleanup unused tile sprites
        for (const [key, sprite] of spriteCache.entries()) {
            if (!usedKeys.has(key)) {
                if (sprite.parent) sprite.parent.removeChild(sprite)
                sprite.destroy({ children: true, texture: false, baseTexture: false })
                spriteCache.delete(key)
            }
        }
    }

    // Add winning effects container to the scene
    container.addChild(winningEffects.container)

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
