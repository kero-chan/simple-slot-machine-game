import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { GlowFilter } from '@pixi/filter-glow'
import { BlurFilter } from '@pixi/filter-blur'
import { BLEND_MODES } from '@pixi/constants'
import { Color } from '@pixi/color'
import { ASSETS } from '../../../config/assets'
import { CONFIG } from '../../../config/constants'

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
    const BOTTOM_PARTIAL = 0.15
    const PAD_X = 0
    const PAD_Y = 0

    const rgb = (hex) => new Color(hex).toRgbArray()
    const spriteCache = new Map() // `${col}:${row}`

    function ensureBackdrop(rect, canvasW) {
        backdrop.clear()
        backdrop.rect(0, rect.y, canvasW, rect.h)
        backdrop.fill(0x2e8f4b)

        // Clip to the green area; add 1px guard to avoid float clipping
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
        container.mask = mask
    }

    // Keep visuals rigid — no scaling pulse; remove filters to avoid visual seams
    function applyTileVisuals(sp, size, winning, velocityPx, timestamp) {
        sp.alpha = velocityPx > 2 ? 0.95 : 1.0
        sp.tint = winning ? 0xfff1a0 : 0xffffff
        sp.blendMode = BLEND_MODES.NORMAL
        sp.filters = null
    }

    // Resolve a Pixi Texture for a given symbol key
    function getTextureForSymbol(symbol) {
        const src = ASSETS.loadedImages?.[symbol] || ASSETS.imagePaths?.[symbol]
        if (!src) return null
        if (src instanceof Texture) return src
        return Texture.from(src)
    }

    function draw(mainRect, tileSize, timestamp, canvasW) {
        ensureBackdrop(mainRect, canvasW)

        const stepX = tileSize
        const originX = MARGIN_X
        const startY = mainRect.y - (1 - TOP_PARTIAL) * tileSize
        const spinningGlobal = !!gameState.isSpinning?.value

        const usedKeys = new Set()

        for (let col = 0; col < COLS; col++) {
            const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
            const velocityTiles = gridState.spinVelocities?.value?.[col] ?? 0
            const velocityPx = velocityTiles * tileSize

            const reelStrip = gridState.reelStrips?.value?.[col] || []
            const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

            for (let r = 0; r <= ROWS_FULL; r++) {
                const xCell = originX + col * stepX
                const yCell = startY + r * tileSize + offsetTiles * tileSize

                let symbol
                const spinning = spinningGlobal || offsetTiles !== 0
                if (spinning || r === ROWS_FULL) {
                    if (reelStrip.length === 0) continue
                    const idx = ((reelTop + r) % reelStrip.length + reelStrip.length) % reelStrip.length
                    symbol = reelStrip[idx]
                } else {
                    symbol = gridState.grid?.value?.[col]?.[r]
                }

                const tex = getTextureForSymbol(symbol) // now defined above
                if (!tex) continue

                const key = `${col}:${r}`
                let sp = spriteCache.get(key)

                // Overscan by 1px each side to swallow transparent borders
                const bleed = 1
                const w = tileSize + bleed * 2
                const h = tileSize + bleed * 2

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

                applyTileVisuals(sp, tileSize, winning, velocityPx, timestamp)

                const isDisappear = gridState.disappearPositions?.value?.has(key)
                if (isDisappear) {
                    const anim = gridState.disappearAnim?.value
                    if (anim?.start && anim?.duration) {
                        const nowMs = Date.now()
                        const t = Math.min(1, (nowMs - anim.start) / anim.duration)
                        sp.alpha = Math.max(0, 1 - t)
                    } else {
                        sp.alpha = 0.2
                    }
                }

                // Position with −bleed to overlap seams; keep fractional Y for precise clipping
                sp.x = xCell - bleed
                sp.y = yCell - bleed

                if (!sp.parent) container.addChild(sp)
                usedKeys.add(key)
            }
        }

        // Cleanup
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
