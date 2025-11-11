export function createGoldManager({ gridState, allowedCols, visibleRows, hiddenRows, maxVisible = 2 }) {
    let goldBaseTiles = new Set()

    function countVisibleGold() {
        let cnt = 0
        for (const key of goldBaseTiles) {
            const [cStr, rStr] = key.split(':')
            const col = Number(cStr), row = Number(rStr)
            if (visibleRows.includes(row)) cnt++
        }
        return cnt
    }

    function enforceGoldRules() {
        const keep = new Set()
        let visibleKept = 0
        for (const key of goldBaseTiles) {
            const [cStr, rStr] = key.split(':')
            const col = Number(cStr), row = Number(rStr)
            if (!allowedCols.includes(col)) continue
            if (visibleRows.includes(row)) {
                if (visibleKept >= maxVisible) continue
                visibleKept++
            }
            keep.add(key)
        }
        goldBaseTiles = keep
    }

    function pickGoldVisible(need = 0) {
        if (need <= 0) return new Set()
        const candidates = []
        for (const col of allowedCols) {
            for (const r of visibleRows) {
                const key = `${col}:${r}`
                if (!goldBaseTiles.has(key)) candidates.push(key)
            }
        }
        // Shuffle
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

    function pickGoldHidden(maxAdd = 0) {
        if (maxAdd <= 0) return new Set()
        const candidates = []
        for (const col of allowedCols) {
            for (const r of hiddenRows) {
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

    function updateGoldenSymbolsState() {
        const set = new Set()
        for (const key of goldBaseTiles) {
            const [cStr, rStr] = key.split(':')
            const col = Number(cStr), row = Number(rStr)
            if (!allowedCols.includes(col)) continue
            if (!visibleRows.includes(row)) continue // only track visible for conversion
            set.add(`${col},${row}`)
        }
        gridState.goldenSymbols.value = set
    }

    function preselectGoldTiles() {
        enforceGoldRules()
        const visibleCnt = countVisibleGold()
        const needVisible = Math.max(0, maxVisible - visibleCnt)
        const addVisible = pickGoldVisible(needVisible)
        addVisible.forEach(k => goldBaseTiles.add(k))
        const addHidden = pickGoldHidden(1)
        addHidden.forEach(k => goldBaseTiles.add(k))
        enforceGoldRules()
        updateGoldenSymbolsState()
    }
    function preselectGoldCols() {
        preselectGoldTiles()
    }

    function setGoldBaseTiles(items) {
        const push = (col, row) => {
            if (!allowedCols.includes(col)) return
            const key = `${col}:${row}`
            if (visibleRows.includes(row)) {
                if (countVisibleGold() >= maxVisible) return
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
        updateGoldenSymbolsState()
    }

    function clearGoldBaseTiles() {
        goldBaseTiles.clear()
        gridState.goldenSymbols.value = new Set()
    }

    return {
        goldBaseTiles,
        preselectGoldCols,
        setGoldBaseTiles,
        clearGoldBaseTiles
    }
}
