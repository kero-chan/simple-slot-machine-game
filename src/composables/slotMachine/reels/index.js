import { Container, Graphics, Sprite, Texture } from 'pixi.js'
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
    const BLEED = 2 // increase to remove gaps between tiles

    const spriteCache = new Map() // `${col}:${row}`
    let backdropSprite = null

    function ensureBackdrop(rect, canvasW) {
        backdrop.clear()

        // Background image for the reel area
        const src = ASSETS.loadedImages?.reels_bg || ASSETS.imagePaths?.reels_bg
        if (src) {
            const tex = src instanceof Texture ? src : Texture.from(src)
            if (!backdropSprite) {
                backdropSprite = new Sprite(tex)
                backdropSprite.anchor.set(0, 0)
                container.addChildAt(backdropSprite, 0)
            } else {
                backdropSprite.texture = tex
            }
            backdropSprite.x = 0
            backdropSprite.y = rect.y
            backdropSprite.width = canvasW
            backdropSprite.height = rect.h
        }

        // Clip main area cleanly
        mask.clear()
        mask.rect(0, rect.y, canvasW, rect.h + 1)
        mask.fill(0xffffff)
        container.mask = mask
    }

    // Gold selection state and limits
    const GOLD_ALLOWED_COLS = [1, 2, 3]       // allow showing gold in columns 2–4 (zero-based)
    const VISIBLE_ROWS = [1, 2, 3, 4]          // visible rows
    const HIDDEN_ROWS = [0, ROWS_FULL + 1]     // top and bottom partial rows
    let goldBaseTiles = new Set()

    // Utility: count current visible gold tiles
    function countVisibleGold() {
        let cnt = 0
        for (const key of goldBaseTiles) {
            const [cStr, rStr] = key.split(':')
            const col = Number(cStr), row = Number(rStr)
            if (VISIBLE_ROWS.includes(row)) cnt++
        }
        return cnt
    }

    // Utility: remove any gold from disallowed columns and trim visible gold to max=2
    function enforceGoldRules() {
        const keep = new Set()
        let visibleKept = 0
        for (const key of goldBaseTiles) {
            const [cStr, rStr] = key.split(':')
            const col = Number(cStr), row = Number(rStr)
            if (!GOLD_ALLOWED_COLS.includes(col)) continue
            if (VISIBLE_ROWS.includes(row)) {
                if (visibleKept >= 2) continue
                visibleKept++
            }
            keep.add(key)
        }
        goldBaseTiles = keep
    }

    // Pick visible additions to reach up to 2; hidden rows are optional and not capped here
    function pickGoldVisible(need = 0) {
        if (need <= 0) return new Set()
        const candidates = []
        for (const col of GOLD_ALLOWED_COLS) {
            for (const r of VISIBLE_ROWS) {
                const key = `${col}:${r}`
                if (!goldBaseTiles.has(key)) candidates.push(key)
            }
        }
        // Shuffle candidates
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const t = candidates[i]; candidates[i] = candidates[j]; candidates[j] = t
        }
        const chosen = new Set()
        for (let i = 0; i < candidates.length && chosen.size < need; i++) {
            chosen.add(candidates[i])
        }
        return chosen
    }

    // Optionally add some hidden golds (no cap specified; keep modest)
    function pickGoldHidden(maxAdd = 0) {
        if (maxAdd <= 0) return new Set()
        const candidates = []
        for (const col of GOLD_ALLOWED_COLS) {
            for (const r of HIDDEN_ROWS) {
                const key = `${col}:${r}`
                if (!goldBaseTiles.has(key)) candidates.push(key)
            }
        }
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const t = candidates[i]; candidates[i] = candidates[j]; candidates[j] = t
        }
        const chosen = new Set()
        for (let i = 0; i < candidates.length && chosen.size < maxAdd; i++) {
            chosen.add(candidates[i])
        }
        return chosen
    }

    // API to manage gold selection (persist across spins, enforce rules)
    function preselectGoldTiles() {
        enforceGoldRules()
        const visibleCnt = countVisibleGold()
        const needVisible = Math.max(0, 2 - visibleCnt)
        // Fill visible up to 2
        const addVisible = pickGoldVisible(needVisible)
        addVisible.forEach(k => goldBaseTiles.add(k))
        // Optionally add up to 1 hidden gold per preselect; adjust as desired
        const addHidden = pickGoldHidden(1)
        addHidden.forEach(k => goldBaseTiles.add(k))
        enforceGoldRules()
    }
    function preselectGoldCols() {
        preselectGoldTiles()
    }
    function setGoldBaseTiles(items) {
        const push = (col, row) => {
            if (!GOLD_ALLOWED_COLS.includes(col)) return
            const key = `${col}:${row}`
            if (VISIBLE_ROWS.includes(row)) {
                if (countVisibleGold() >= 2) return
            }
            goldBaseTiles.add(key)
        }
        if (Array.isArray(items)) {
            for (const it of items) {
                if (Array.isArray(it) && it.length === 2) {
                    const [c, r] = it.map(Number); push(c, r)
                } else if (typeof it === 'string') {
                    const [cs, rs] = it.split(':'); push(Number(cs), Number(rs))
                }
            }
        }
        enforceGoldRules()
    }
    function clearGoldBaseTiles() {
        goldBaseTiles.clear()
    }

    // Resolve Pixi Texture for a symbol key, preferring *_gold variant if requested
    function getTextureForSymbol(symbol, useGold = false) {
        const alias = useGold ? `${symbol}_gold` : symbol
        const src = ASSETS.loadedImages?.[alias] || ASSETS.imagePaths?.[alias]
        if (src) return src instanceof Texture ? src : Texture.from(src)
        if (useGold) {
            const normal = ASSETS.loadedImages?.[symbol] || ASSETS.imagePaths?.[symbol]
            return normal ? (normal instanceof Texture ? normal : Texture.from(normal)) : null
        }
        return null
    }

    // Basic tile visuals: alpha and optional highlight tint
    function applyTileVisuals(sprite, alpha = 1, highlight = false) {
        if (!sprite) return
        sprite.alpha = alpha
        sprite.tint = highlight ? 0xffffcc : 0xffffff
    }

    function draw(mainRect, tileSize, timestamp, canvasW) {
        ensureBackdrop(mainRect, canvasW)

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

                // Show gold even while spinning
                const goldVisible = true

                // Use gold for preselected tiles regardless of spin state
                const useGold = goldVisible && goldBaseTiles.has(`${col}:${r}`)
                const tex = getTextureForSymbol(symbol, useGold)
                if (!tex) continue

                const key = `${col}:${r}`
                let sp = spriteCache.get(key)

                // Edge-to-edge with slight overscan to hide transparent edges
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

                sp.x = Math.round(xCell) - BLEED
                sp.y = yCell - BLEED

                if (!sp.parent) container.addChild(sp)
                usedKeys.add(key)
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

    return {
        container,
        draw,
        // expose for renderer orchestration
        preselectGoldCols,
        setGoldBaseTiles,
        clearGoldBaseTiles
    }
}
