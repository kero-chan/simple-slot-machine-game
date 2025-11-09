import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { GlowFilter } from '@pixi/filter-glow'
import { BlurFilter } from '@pixi/filter-blur'
import { BLEND_MODES } from '@pixi/constants'
import { Color } from '@pixi/color'
import { ASSETS } from '../../../config/assets'

export function useReels(gameState, gridState) {
    const container = new Container()
    const backdrop = new Graphics()
    container.addChild(backdrop)

    const MARGIN_X = 10
    const COLS = 5
    const ROWS_FULL = 4
    const TOP_PARTIAL = 0.30
    const BOTTOM_PARTIAL = 0.15

    const rgb = (hex) => new Color(hex).toRgbArray()
    const spriteCache = new Map() // `${col}:${row}`

    function ensureBackdrop(rect) {
        backdrop.clear()
        backdrop.rect(rect.x, rect.y, rect.w, rect.h)
        backdrop.fill(0x2e8f4b)
    }

    function applyTileVisuals(sp, size, winning, velocityPx, timestamp) {
        const spinning = velocityPx > 2
        sp.alpha = spinning ? 0.95 : 1.0

        if (winning) {
            const PULSE_SPEED = 0.25
            const PULSE_AMPLITUDE = 0.02
            const phase = (timestamp / 1000) * (Math.PI * 2 * PULSE_SPEED)
            const pulseScale = 1.0 + Math.sin(phase) * PULSE_AMPLITUDE
            sp.scale.set(pulseScale, pulseScale)
            sp.tint = 0xfff1a0
            sp.blendMode = BLEND_MODES.ADD
        } else {
            sp.scale.set(1, 1)
            sp.tint = 0xffffff
            sp.blendMode = BLEND_MODES.NORMAL
        }

        const glow = new GlowFilter({
            distance: Math.max(6, Math.floor(size * 0.08)),
            outerStrength: winning ? 2.0 : 1.2,
            innerStrength: 0.0,
            color: rgb(winning ? 0xfff1a0 : 0xffd700),
            quality: 0.35
        })
        const blur = new BlurFilter(Math.max(1, Math.floor(size * 0.015)))
        sp.filters = [glow, blur]
    }

    function getTextureForSymbol(symbol) {
        const src = ASSETS.loadedImages?.[symbol] || ASSETS.imagePaths?.[symbol]
        if (!src) return null
        if (src instanceof Texture) return src
        return Texture.from(src)
    }

    function draw(mainRect, tileSize, timestamp) {
        ensureBackdrop(mainRect)

        const originX = mainRect.x
        const startY = mainRect.y - Math.floor((1 - TOP_PARTIAL) * tileSize)
        const spinningGlobal = !!gameState.isSpinning?.value

        const usedKeys = new Set()

        for (let col = 0; col < COLS; col++) {
            const offsetTiles = gridState.spinOffsets?.value?.[col] ?? 0
            const velocityTiles = gridState.spinVelocities?.value?.[col] ?? 0
            const velocityPx = velocityTiles * tileSize

            const reelStrip = gridState.reelStrips?.value?.[col] || []
            const reelTop = gridState.reelTopIndex?.value?.[col] ?? 0

            for (let r = 0; r <= ROWS_FULL; r++) {
                const x = originX + col * tileSize
                const y = startY + r * tileSize + offsetTiles * tileSize

                let symbol
                const spinning = spinningGlobal || offsetTiles !== 0
                if (spinning || r === ROWS_FULL) {
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

                const pad = Math.floor(tileSize * 0.06)
                const w = tileSize - pad * 2
                const h = tileSize - pad * 2

                if (!sp) {
                    sp = new Sprite(tex)
                    sp.width = w
                    sp.height = h
                    spriteCache.set(key, sp)
                } else {
                    sp.texture = tex
                    sp.width = w
                    sp.height = h
                }

                const winning = (!spinning && r < ROWS_FULL)
                    ? (gridState.highlightWins?.value || []).some(win =>
                        win.positions.some(([c, rr]) => c === col && rr === r))
                    : false

                applyTileVisuals(sp, tileSize, winning, velocityPx, timestamp)

                // Fade-out for disappearing tiles (reuse existing key)
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

                sp.x = Math.floor(x + pad)
                sp.y = Math.floor(y + pad)

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
