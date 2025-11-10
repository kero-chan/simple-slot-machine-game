import { Container, Graphics, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { TILE_SLICES } from './tiles/config'

export function useReels(gameState, gridState) {
    const container = new Container()
    const backdrop = new Graphics()
    const mask = new Graphics()
    container.addChild(backdrop)
    container.addChild(mask)

    const MARGIN_X = 10
    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    // const BOTTOM_PARTIAL = 0.15
    // const PAD_X = 0
    // const PAD_Y = 0
    const BLEED = 2 // increase to remove gaps between tiles

    const rgb = (hex) => new Color(hex).toRgbArray()
    const spriteCache = new Map() // `${col}:${row}`
    let backdropSprite = null

    function ensureBackdrop(rect, canvasW) {
        // Clear the old Graphics fill
        backdrop.clear()

        // Prepare/update background sprite from bg.png
        const src = ASSETS.loadedImages?.reels_bg || ASSETS.imagePaths?.reels_bg
        if (src) {
            const tex = src instanceof Texture ? src : Texture.from(src)
            if (!backdropSprite) {
                backdropSprite = new Sprite(tex)
                backdropSprite.anchor.set(0, 0)
                // Keep it at the back
                container.addChildAt(backdropSprite, 0)
            } else {
                backdropSprite.texture = tex
            }
            backdropSprite.x = 0
            backdropSprite.y = rect.y
            backdropSprite.width = canvasW
            backdropSprite.height = rect.h
        }

        // Mask remains to clip the main area cleanly
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
        container.mask = mask
    }

    // Resolve a Pixi Texture for a given symbol key
    function getTextureForSymbol(symbol) {
        if (symbol in TILE_SLICES) {
            const tex = ASSETS.loadedImages?.[symbol]
            return tex instanceof Texture ? tex : null
        }
        const src = ASSETS.loadedImages?.[symbol] || ASSETS.imagePaths?.[symbol]
        if (!src) return null
        return src instanceof Texture ? src : Texture.from(src)
    }

    // Ensure visuals use Pixi blend modes
    function applyTileVisuals(sprite, alpha = 1, highlight = false) {
        if (!sprite) return
        sprite.alpha = alpha
        sprite.tint = highlight ? 0xffffcc : 0xffffff
    }

    function draw(mainRect, tileSize, timestamp, canvasW) {
        ensureBackdrop(mainRect, canvasW)

        // Accept both numeric and object tileSize
        const tileW = typeof tileSize === 'number' ? tileSize : tileSize.w
        const tileH = typeof tileSize === 'number' ? tileSize : tileSize.h

        const stepX = tileW
        const originX = MARGIN_X
        const startY = mainRect.y - (1 - TOP_PARTIAL) * tileH
        const spinning = !!gameState.isSpinning?.value

        const usedKeys = new Set()

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

                const tex = getTextureForSymbol(symbol)
                if (!tex) continue

                const key = `${col}:${r}`
                let sp = spriteCache.get(key)

                // Edge-to-edge
                // Slight overscan to eliminate gaps from transparent edges
                const w = tileW + BLEED * 2
                const h = tileH + BLEED * 2

                if (!sp) {
                    sp = new Sprite(tex)
                    sp.anchor.set(0, 0)
                    sp.width = w
                    sp.height = h
                    spriteCache.set(key, sp)
                } else {
                    sp.texture = tex
                    sp.anchor.set(0, 0)
                    sp.width = w
                    sp.height = h
                }

                const winning = (!spinning && r < ROWS_FULL)
                    ? (gridState.highlightWins?.value || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === r))
                    : false

                applyTileVisuals(sp, tileH, winning, velocityPx, timestamp)

                // Keep fractional Y to prevent rounding from shaving the bottom partial
                sp.x = Math.round(xCell) - BLEED
                sp.y = yCell - BLEED

                if (!sp.parent) container.addChild(sp)
                usedKeys.add(key)
            }
        }

        // Cleanup (unchanged)
        for (const [key, sprite] of spriteCache.entries()) {
            if (!usedKeys.has(key)) {
                if (sprite.parent) sprite.parent.removeChild(sprite)
                sprite.destroy({ children: true, texture: false, baseTexture: false })
                spriteCache.delete(key)
            }
        }
    }

    return { container, draw }
}
