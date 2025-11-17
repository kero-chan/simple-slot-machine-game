# Symbols & Paytable

## Overview

This document defines all symbols used in the Mahjong Ways slot machine game, based on the **actual implementation** in the codebase.

**Symbol Naming:** Symbols use Chinese pinyin names (fa, zhong, bai, etc.)
**Golden Variants:** Symbols can have `_gold` suffix (visual only, no gameplay impact in MW1)

---

## Symbol Categories

1. **Special Symbols** (wild, bonus, gold)
2. **High-Value Symbols** (fa, zhong, bai, bawan)
3. **Low-Value Symbols** (wusuo, wutong, liangsuo, liangtong)

---

## Special Symbols

### Wild Symbol (wild)

**Symbol ID:** `wild`

**Visual:** Golden bowl/pot with treasure

**Asset Files:**

- Regular: (loaded separately, not in TILE_SLICES)
- Golden: `wild_gold` (appears on reels 2, 3, 4)

**Function:**

- Substitutes for ALL paying symbols
- Does NOT substitute for bonus (scatter)
- Does NOT substitute for gold (mystery)

**Payout:** No independent payout (substitution only)

**Paytable Entry:**

```javascript
wild: { 3: 1, 4: 3, 5: 6 }
```

*Note: These values apply when wild forms its own winning line*

**Appearance:** All reels (1-5)

**Golden Variant:** Can appear as `wild_gold` on reels 2, 3, 4

---

### Bonus Symbol (Scatter) (bonus)

**Symbol ID:** `bonus`

**Visual:** Red "发" (Fā) Mahjong tile / Special scatter icon

**Asset Files:**

- `bonus.png`

**Function:** Triggers Free Spins feature

**Trigger Rules:**

- 3+ Bonus symbols anywhere = Free Spins triggered
- Bonus symbols do NOT need to be adjacent
- Can appear on any reel position

**Free Spins Award:**

| Bonus Count | Free Spins Awarded |
|-------------|-------------------|
| 3 Bonus | 12 Free Spins |
| 4 Bonus | 14 Free Spins (12 + 2) |
| 5 Bonus | 16 Free Spins (12 + 4) |

**Formula:** `12 + (2 × (bonus_count - 3))`

**Paytable Entry:**

```javascript
bonus: { 3: 1, 4: 3, 5: 6 }
```

*Note: Bonus triggers free spins; line wins are secondary*

**Retrigger:**

- Landing 3+ Bonus DURING free spins awards additional spins
- Can be retriggered multiple times
- NO LIMIT on total free spins

---

### Gold Symbol (Mystery) (gold)

**Symbol ID:** `gold`

**Visual:** Golden ball / Mystery symbol

**Asset Files:**

- `gold.png`

**Function:**

- High-value mystery symbol
- Cannot be substituted by Wild
- Premium payouts

**Payout:** *Not defined in current paytable - needs specification*

**Estimated Payouts (based on original spec):**

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | 500x |
| 4 symbols | 100x |
| 3 symbols | 10x |

**Appearance:** All reels (rare)

**Note:** Current `CONFIG.paytable` does not include `gold`. Backend should implement these values.

---

## High-Value Symbols

### Symbol H1: fa (发)

**Symbol ID:** `fa`

**Visual:** Green Mahjong tile with "发" character

**Asset Files:**

- Regular: `fa.png`
- Golden: `fa_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Highest regular symbol

**Payouts:**

```javascript
fa: { 3: 10, 4: 25, 5: 50 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **50x** |
| 4 symbols | **25x** |
| 3 symbols | **10x** |

---

### Symbol H2: zhong (中)

**Symbol ID:** `zhong`

**Visual:** Red Mahjong tile with "中" character

**Asset Files:**

- Regular: `zhong.png`
- Golden: `zhong_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Premium high

**Payouts:**

```javascript
zhong: { 3: 8, 4: 20, 5: 40 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **40x** |
| 4 symbols | **20x** |
| 3 symbols | **8x** |

---

### Symbol H3: bai (白/百)

**Symbol ID:** `bai`

**Visual:** Purple/white square tile

**Asset Files:**

- Regular: `bai.png`
- Golden: `bai_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Premium mid

**Payouts:**

```javascript
bai: { 3: 6, 4: 15, 5: 30 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **30x** |
| 4 symbols | **15x** |
| 3 symbols | **6x** |

---

### Symbol H4: bawan (八萬)

**Symbol ID:** `bawan`

**Visual:** Mahjong tile showing "八萬" (8 in Characters suit)

**Asset Files:**

- Regular: `bawan.png`
- Golden: `bawan_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Medium high

**Payouts:**

```javascript
bawan: { 3: 5, 4: 10, 5: 15 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **15x** |
| 4 symbols | **10x** |
| 3 symbols | **5x** |

---

## Low-Value Symbols

### Symbol L1: wusuo (五索)

**Symbol ID:** `wusuo`

**Visual:** Tile with 5 bamboo sticks (Bamboo suit)

**Asset Files:**

- Regular: `wusuo.png`
- Golden: `wusuo_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Medium

**Payouts:**

```javascript
wusuo: { 3: 3, 4: 5, 5: 12 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **12x** |
| 4 symbols | **5x** |
| 3 symbols | **3x** |

---

### Symbol L2: wutong (五筒)

**Symbol ID:** `wutong`

**Visual:** Tile with 5 circular dots (Dots suit)

**Asset Files:**

- Regular: `wutong.png`
- Golden: `wutong_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Medium

**Payouts:**

```javascript
wutong: { 3: 3, 4: 5, 5: 12 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **12x** |
| 4 symbols | **5x** |
| 3 symbols | **3x** |

---

### Symbol L3: liangsuo (两索)

**Symbol ID:** `liangsuo`

**Visual:** Tile with 2 bamboo sticks

**Asset Files:**

- Regular: `liangsuo.png`
- Golden: `liangsuo_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Low

**Payouts:**

```javascript
liangsuo: { 3: 2, 4: 4, 5: 10 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **10x** |
| 4 symbols | **4x** |
| 3 symbols | **2x** |

---

### Symbol L4: liangtong (两筒)

**Symbol ID:** `liangtong`

**Visual:** Tile with 2 circular dots

**Asset Files:**

- Regular: `liangtong.png`
- Golden: `liangtong_gold.png` (reels 2, 3, 4 only)

**Value Tier:** Low

**Payouts:**

```javascript
liangtong: { 3: 1, 4: 3, 5: 6 }
```

| Symbol Count | Payout Multiplier |
|--------------|-------------------|
| 5 symbols | **6x** |
| 4 symbols | **3x** |
| 3 symbols | **1x** |

---

## Complete Paytable Summary

### Current Implementation (from `constants.js`)

```javascript
paytable: {
  fa:        { 3: 10, 4: 25, 5: 50 },
  zhong:     { 3: 8,  4: 20, 5: 40 },
  bai:       { 3: 6,  4: 15, 5: 30 },
  bawan:     { 3: 5,  4: 10, 5: 15 },
  wusuo:     { 3: 3,  4: 5,  5: 12 },
  wutong:    { 3: 3,  4: 5,  5: 12 },
  liangsuo:  { 3: 2,  4: 4,  5: 10 },
  liangtong: { 3: 1,  4: 3,  5: 6  },
  bonus:     { 3: 1,  4: 3,  5: 6  },
  wild:      { 3: 1,  4: 3,  5: 6  }
}
```

### Table Format

| Symbol | Type | 5-of-a-kind | 4-of-a-kind | 3-of-a-kind | Notes |
|--------|------|-------------|-------------|-------------|-------|
| **Special** |
| wild | Special | 6x | 3x | 1x | Substitutes all except bonus/gold |
| bonus | Special | 6x | 3x | 1x | Triggers Free Spins (3+) |
| gold | Special | 500x* | 100x* | 10x* | Mystery symbol (*proposed) |
| **High-Value** |
| fa | High | 50x | 25x | 10x | Green "发" |
| zhong | High | 40x | 20x | 8x | Red "中" |
| bai | High | 30x | 15x | 6x | White/Purple square |
| bawan | High | 15x | 10x | 5x | "八萬" |
| **Low-Value** |
| wusuo | Low | 12x | 5x | 3x | 5 bamboo sticks |
| wutong | Low | 12x | 5x | 3x | 5 dots |
| liangsuo | Low | 10x | 4x | 2x | 2 bamboo sticks |
| liangtong | Low | 6x | 3x | 1x | 2 dots |

**Note:** Gold symbol payouts are proposed and need to be added to backend configuration.

---

## Golden Symbol Variants

### Behavior (MW1)

**CRITICAL:** In Mahjong Ways 1, golden symbols are **VISUAL ONLY**.

- ❌ Do NOT convert to Wild (MW2 feature)
- ✅ Appear only on reels 2, 3, 4
- ✅ Same payout as regular symbol
- ✅ Transform to regular after cascade

### Symbol Format

**Backend/API:** Symbols use `_gold` suffix

```
"fa_gold", "zhong_gold", "bai_gold", etc.
```

**Frontend:** Tile objects with `isGolden` flag

```javascript
{
  symbol: "fa",
  isGolden: true
}
```

### Conversion Functions

**Backend → Frontend:**

```javascript
function parseSymbol(symbolString) {
  return {
    symbol: symbolString.replace('_gold', ''),
    isGolden: symbolString.endsWith('_gold')
  }
}
```

**Frontend → Backend:**

```javascript
function serializeSymbol(tileObject) {
  return tileObject.isGolden
    ? `${tileObject.symbol}_gold`
    : tileObject.symbol
}
```

---

## Win Calculation Examples

### Example 1: Simple 3-of-a-kind (fa)

**Reel Configuration:**

```
Reel 1: fa (1 position - row 1)
Reel 2: fa (2 positions - rows 1, 3)
Reel 3: fa (1 position - row 1)
```

**Calculation:**

```
Symbol: fa
Count: 3-of-a-kind
Ways = 1 × 2 × 1 = 2 ways
Payout = 10x (from paytable)
Cascade Multiplier = 1 (first cascade)
Bet Per Way = 100 / 20 = 5

Win = 10 × 2 × 1 × 5 = 100 credits
```

---

### Example 2: With Wild Substitution (zhong)

**Reel Configuration:**

```
Reel 1: zhong (1 position)
Reel 2: wild (1 position)
Reel 3: zhong (2 positions)
Reel 4: zhong (1 position)
```

**Calculation:**

```
Symbol: zhong (wild substitutes)
Count: 4-of-a-kind
Ways = 1 × 1 × 2 × 1 = 2 ways
Payout = 20x
Cascade Multiplier = 2 (second cascade)
Bet Per Way = 5

Win = 20 × 2 × 2 × 5 = 400 credits
```

---

### Example 3: Maximum Ways (1,024)

**Reel Configuration:**

```
All 5 reels have wutong in all 4 visible positions
```

**Calculation:**

```
Symbol: wutong
Count: 5-of-a-kind
Ways = 4 × 4 × 4 × 4 × 4 = 1,024 ways (MAXIMUM)
Payout = 12x
Cascade Multiplier = 10 (4th+ cascade in Free Spins)
Bet Per Way = 5

Win = 12 × 1,024 × 10 × 5 = 614,400 credits

Note: This would be capped at max win (25,000x bet = 2,500,000 credits for 100 bet)
```

---

## Backend Implementation

### Symbol Configuration

```go
package game

var Paytable = map[string]map[int]int{
    "fa":        {3: 10, 4: 25, 5: 50},
    "zhong":     {3: 8,  4: 20, 5: 40},
    "bai":       {3: 6,  4: 15, 5: 30},
    "bawan":     {3: 5,  4: 10, 5: 15},
    "wusuo":     {3: 3,  4: 5,  5: 12},
    "wutong":    {3: 3,  4: 5,  5: 12},
    "liangsuo":  {3: 2,  4: 4,  5: 10},
    "liangtong": {3: 1,  4: 3,  5: 6},
    "bonus":     {3: 1,  4: 3,  5: 6},
    "wild":      {3: 1,  4: 3,  5: 6},
    "gold":      {3: 10, 4: 100, 5: 500}, // Add mystery symbol
}

var SpecialSymbols = map[string]bool{
    "wild":  true,
    "bonus": true,
    "gold":  true,
}

func IsWildSubstitute(symbol string) bool {
    return symbol != "bonus" && symbol != "gold"
}

func GetBaseSymbol(symbol string) string {
    // Remove _gold suffix
    if strings.HasSuffix(symbol, "_gold") {
        return symbol[:len(symbol)-5]
    }
    return symbol
}

func IsGoldenVariant(symbol string) bool {
    return strings.HasSuffix(symbol, "_gold")
}
```

### Database Schema

```sql
CREATE TABLE symbols (
    id SERIAL PRIMARY KEY,
    symbol_id VARCHAR(50) UNIQUE NOT NULL,
    symbol_name VARCHAR(100) NOT NULL,
    symbol_type VARCHAR(20) NOT NULL, -- 'HIGH_VALUE', 'LOW_VALUE', 'SPECIAL'
    payout_3 INTEGER,
    payout_4 INTEGER,
    payout_5 INTEGER,
    can_be_wild_substitute BOOLEAN DEFAULT TRUE,
    is_scatter BOOLEAN DEFAULT FALSE,
    is_wild BOOLEAN DEFAULT FALSE,
    can_have_golden_variant BOOLEAN DEFAULT TRUE,
    asset_path VARCHAR(255)
);

-- Insert symbols
INSERT INTO symbols (symbol_id, symbol_name, symbol_type, payout_3, payout_4, payout_5, is_wild, is_scatter) VALUES
('wild', 'Wild', 'SPECIAL', 1, 3, 6, TRUE, FALSE),
('bonus', 'Bonus Scatter', 'SPECIAL', 1, 3, 6, FALSE, TRUE),
('gold', 'Gold Mystery', 'SPECIAL', 10, 100, 500, FALSE, FALSE),
('fa', 'Green Fa', 'HIGH_VALUE', 10, 25, 50, FALSE, FALSE),
('zhong', 'Red Zhong', 'HIGH_VALUE', 8, 20, 40, FALSE, FALSE),
('bai', 'White Bai', 'HIGH_VALUE', 6, 15, 30, FALSE, FALSE),
('bawan', 'Eight Wan', 'HIGH_VALUE', 5, 10, 15, FALSE, FALSE),
('wusuo', 'Five Bamboo', 'LOW_VALUE', 3, 5, 12, FALSE, FALSE),
('wutong', 'Five Dots', 'LOW_VALUE', 3, 5, 12, FALSE, FALSE),
('liangsuo', 'Two Bamboo', 'LOW_VALUE', 2, 4, 10, FALSE, FALSE),
('liangtong', 'Two Dots', 'LOW_VALUE', 1, 3, 6, FALSE, FALSE);
```

---

## Asset References

All symbol assets are located in:

```
src/assets/slotMachine/tiles/
```

### Asset Files

```
fa.png              // Green "发"
fa_gold.png
zhong.png           // Red "中"
zhong_gold.png
bai.png             // White/Purple square
bai_gold.png
bawan.png           // "八萬"
bawan_gold.png
wusuo.png           // 5 bamboo
wusuo_gold.png
wutong.png          // 5 dots
wutong_gold.png
liangsuo.png        // 2 bamboo
liangsuo_gold.png
liangtong.png       // 2 dots
liangtong_gold.png
gold.png            // Mystery symbol
bonus.png           // Scatter
star.png            // (Additional asset)
```

**Note:** Wild symbol assets may be loaded separately or composed from sprite sheets.

---

## Testing Checklist

- [ ] All symbols load correctly
- [ ] Paytable values match specification
- [ ] Wild substitution works for all symbols except bonus/gold
- [ ] Bonus triggers free spins at 3+ count
- [ ] Gold symbol has correct payouts
- [ ] Golden variants appear only on reels 2, 3, 4
- [ ] Golden variants convert to regular after cascade
- [ ] Win calculation matches expected values
- [ ] Maximum win cap enforced (25,000x)
