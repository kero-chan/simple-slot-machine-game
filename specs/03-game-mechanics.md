# Game Mechanics

## Table of Contents

1. [1,024 Ways to Win System](#1024-ways-to-win-system)
2. [Cascade/Tumble Mechanics](#cascadetumble-mechanics)
3. [Multiplier Progression](#multiplier-progression)
4. [Free Spins Feature](#free-spins-feature)
5. [Wild Substitution](#wild-substitution)
6. [Golden Symbol Transformation](#golden-symbol-transformation)
7. [Game Flow](#game-flow)

---

## 1,024 Ways to Win System

### Overview

Mahjong Ways uses "Ways to Win" instead of traditional paylines. Winning symbols must appear on **adjacent reels starting from the leftmost reel**.

### Calculation Method

**Formula:**

```
Ways = (Symbols on Reel 1) × (Symbols on Reel 2) × (Symbols on Reel 3) × ...
```

**Maximum Ways:**

```
5 reels × 4 rows = 4^5 = 1,024 maximum possible ways
```

### Adjacency Rules

✅ **Valid:**

- Symbols MUST be on consecutive reels from left to right
- Multiple winning combinations can occur simultaneously
- Wild symbols count as matching

❌ **Invalid:**

- Gaps in reel sequence break the winning combination
- Right-to-left combinations do not count
- Non-adjacent reels do not count

### Example Calculations

#### Example 1: Basic 3-of-a-kind

```
Reel 1: 1 matching symbol (row 2)
Reel 2: 3 matching symbols (rows 1, 2, 4)
Reel 3: 2 matching symbols (rows 2, 3)

Ways = 1 × 3 × 2 = 6 ways
Win = Symbol Payout (3-of-a-kind) × 6 ways × Bet Per Way
```

#### Example 2: Full 5-of-a-kind

```
Reel 1: 2 matching symbols
Reel 2: 4 matching symbols
Reel 3: 1 matching symbol
Reel 4: 3 matching symbols
Reel 5: 2 matching symbols

Ways = 2 × 4 × 1 × 3 × 2 = 48 ways
Win = Symbol Payout (5-of-a-kind) × 48 ways × Bet Per Way
```

#### Example 3: Maximum Ways (1,024)

```
All 5 reels have the same matching symbol in all 4 rows

Ways = 4 × 4 × 4 × 4 × 4 = 1,024 ways (MAXIMUM)
Win = Symbol Payout × 1,024 ways × Bet Per Way
```

### Implementation Logic

```
Algorithm: Calculate Ways to Win

1. For each symbol type:
   2. count[reel] = 0 for all reels
   3. For reel = 1 to 5:
      4. Count matching symbols (including Wilds) in reel
      5. If count > 0:
         6. count[reel] = matching symbols
      7. Else:
         8. Break (no match, stop at previous reel)

   9. If stopped at reel >= 3: (minimum 3-of-a-kind)
      10. ways = count[1] × count[2] × count[3] × ... × count[last_reel]
      11. payout = paytable[symbol][reels_matched]
      12. win = payout × ways × bet_per_way × multiplier
```

---

## Cascade/Tumble Mechanics

### Sequence Flow

The cascade system is the core mechanic that allows multiple wins from a single spin.

#### Step 1: Initial Spin

1. Reels spin and land with random symbols
2. System evaluates all winning combinations
3. Multiplier starts at base value (x1 for base game, x2 for free spins)

#### Step 2: Win Evaluation

1. All winning symbols are identified
2. Winning symbols are highlighted with **GOLD** effect
3. Win amounts are calculated and displayed
4. Total win accumulated

#### Step 3: Symbol Removal (Cascade)

1. Winning symbols explode with animation
2. Empty positions created on reels
3. Remaining symbols drop down (gravity effect)
4. New symbols fall from top to fill gaps

#### Step 4: Multiplier Progression

- Multiplier increases after each successful cascade
- See [Multiplier Progression](#multiplier-progression) section below

#### Step 5: Re-evaluation

1. New symbol arrangement is evaluated for wins
2. **If wins exist:** Return to Step 2 (repeat cascade)
3. **If no wins:** Cascade sequence ends, multiplier resets

### Key Behaviors

- ✅ Multiplier increases ONLY on successful cascades
- ✅ Multiplier applies to ALL wins in that cascade
- ✅ Process can continue indefinitely if wins keep forming
- ❌ Multiplier resets to base when no new wins form
- ❌ Multiplier does NOT carry between spins

### Implementation Pseudocode

```
Function: ProcessCascade(grid, is_free_spins)

1. cascade_count = 0
2. total_win = 0
3. multiplier = GetInitialMultiplier(is_free_spins) // x1 or x2

4. While true:
   5. wins = EvaluateWins(grid)
   6. If wins is empty:
      7. Break (no more cascades)

   8. cascade_count++
   9. current_win = CalculateWinAmount(wins, multiplier)
   10. total_win += current_win

   11. RemoveWinningSymbols(grid, wins)
   12. DropSymbols(grid)
   13. FillEmptyPositions(grid)

   14. multiplier = GetMultiplier(cascade_count, is_free_spins)

15. Return total_win
```

---

## Multiplier Progression

### Base Game Multipliers

| Cascade Number | Multiplier | Notes |
|----------------|------------|-------|
| 1st cascade | **x1** | No multiplier on first win |
| 2nd cascade | **x2** | |
| 3rd cascade | **x3** | |
| 4th+ cascades | **x5** | Stays at x5 for all subsequent cascades |

### Free Spins Multipliers (Enhanced)

| Cascade Number | Multiplier | Increase vs Base |
|----------------|------------|------------------|
| 1st cascade | **x2** | +100% (x2 vs x1) |
| 2nd cascade | **x4** | +100% (x4 vs x2) |
| 3rd cascade | **x6** | +100% (x6 vs x3) |
| 4th+ cascades | **x10** | +100% (x10 vs x5) |

### Comparison Table

```
┌───────────┬─────────────┬──────────────┬────────────┐
│ Cascade   │ Base Game   │ Free Spins   │ Difference │
├───────────┼─────────────┼──────────────┼────────────┤
│ 1st       │ x1          │ x2           │ +100%      │
│ 2nd       │ x2          │ x4           │ +100%      │
│ 3rd       │ x3          │ x6           │ +100%      │
│ 4th+      │ x5          │ x10          │ +100%      │
└───────────┴─────────────┴──────────────┴────────────┘
```

### Implementation

```go
func GetMultiplier(cascadeCount int, isFreeSpins bool) int {
    if isFreeSpins {
        switch cascadeCount {
        case 1:
            return 2
        case 2:
            return 4
        case 3:
            return 6
        default: // 4+
            return 10
        }
    } else {
        switch cascadeCount {
        case 1:
            return 1
        case 2:
            return 2
        case 3:
            return 3
        default: // 4+
            return 5
        }
    }
}
```

---

## Free Spins Feature

### Trigger Requirements

- Land **3 or MORE** Scatter symbols anywhere on the reels
- Scatters can appear on ANY reel position
- Scatters do NOT need to be adjacent

### Free Spins Award Table

| Scatter Count | Free Spins Awarded | Calculation |
|---------------|-------------------|-------------|
| 3 Scatters | 12 Free Spins | Base award |
| 4 Scatters | 14 Free Spins | 12 + (2 × 1) |
| 5 Scatters | 16 Free Spins | 12 + (2 × 2) |

**Formula:**

```
Free Spins = 12 + (2 × (scatter_count - 3))
```

### Retrigger Mechanism

- ✅ Landing 3+ Scatters DURING free spins awards additional spins
- ✅ Same formula applies
- ✅ Can be retriggered multiple times
- ✅ **NO LIMIT** on total free spins accumulated

**Example:**

```
Trigger: 3 Scatters = 12 Free Spins
During spin 5: 4 Scatters = +14 Free Spins
Remaining: 7 (original) + 14 (new) = 21 Free Spins
```

### Free Spins Behaviors

1. **Bet Settings Locked**
   - Bet amount is locked at the triggering spin value
   - Cannot adjust bet during free spins
   - All wins calculated using locked bet

2. **Enhanced Multipliers**
   - See [Multiplier Progression](#multiplier-progression) above
   - x2 → x4 → x6 → x10 (vs base game x1 → x2 → x3 → x5)

3. **All Other Mechanics Identical**
   - 1,024 ways calculation unchanged
   - Cascade mechanics function the same
   - Wild substitution works normally
   - Golden symbols still active on reels 2-3-4

### Maximum Win Potential

**Theoretical Maximum (before cap):**

```
Symbol: Mystery (500x)
Ways: 1,024 (all positions match)
Multiplier: x10 (4+ cascades in free spins)

Win = 500 × 1,024 × 10 = 5,120,000x theoretical
```

**Actual Maximum (with cap):**

```
Maximum Win Cap: 25,000x total bet per spin
```

### Implementation

```go
type FreeSpinsState struct {
    TotalSpins      int
    RemainingSpins  int
    LockedBetAmount float64
    Triggered       bool
}

func TriggerFreeSpins(scatterCount int, currentBet float64) FreeSpinsState {
    baseSpins := 12
    bonusSpins := (scatterCount - 3) * 2
    totalSpins := baseSpins + bonusSpins

    return FreeSpinsState{
        TotalSpins:      totalSpins,
        RemainingSpins:  totalSpins,
        LockedBetAmount: currentBet,
        Triggered:       true,
    }
}

func RetriggerFreeSpins(state *FreeSpinsState, scatterCount int) {
    baseSpins := 12
    bonusSpins := (scatterCount - 3) * 2
    additionalSpins := baseSpins + bonusSpins

    state.RemainingSpins += additionalSpins
    state.TotalSpins += additionalSpins
}
```

---

## Wild Substitution

### Wild Symbol Properties

✅ **Can Substitute:**

- ALL regular paying symbols (high-value and low-value)

❌ **Cannot Substitute:**

- Scatter symbol (free spins trigger)
- Mystery symbol

### Substitution Rules

1. **Reel Appearance:**
   - Wild CANNOT appear directly on reels
   - Wild ONLY appears from golden symbol transformation
   - Wild can ONLY appear on reels 2, 3, 4 (same restriction as golden symbols)

2. **Golden Wild Transformation:**
   - When a golden symbol (on reels 2, 3, or 4) is part of a winning combination
   - After the cascade, that golden symbol transforms into a Wild
   - The transformed Wild persists for subsequent cascades in the same spin
   - This is the ONLY way Wilds can appear

3. **Substitution Priority:**
   - Wild fills in for missing symbols in potential winning ways
   - System calculates highest possible win using Wild
   - Wild counted as whichever symbol creates maximum payout

4. **No Independent Payout:**
   - Wild has NO payout value (no paytable entry)
   - Only functions as substitute
   - Does NOT pay out even when forming its own winning line

### Wild in Combinations

**Pure Wild Lines:**

- If all symbols in a winning line are Wild
- NO PAYOUT (Wilds have no paytable entry)
- Wilds exist only for substitution, not independent wins

**Multiple Wilds:**

- Multiple Wilds significantly increase ways count when substituting
- Each Wild position multiplies the ways calculation
- Only pays when substituting for regular symbols

### Examples

#### Example 1: Simple Wild Substitution

```
Reel 1: HIGH_FA
Reel 2: WILD
Reel 3: HIGH_FA
Reel 4: HIGH_FA
Reel 5: HIGH_FA

Result: 5-of-a-kind HIGH_FA (100x payout)
```

#### Example 2: Wild Increases Ways

```
Reel 1: HIGH_FA (1 position)
Reel 2: WILD (2 positions)
Reel 3: HIGH_FA (1 position)

Ways = 1 × 2 × 1 = 2 ways
Payout = 15x (3-of-a-kind)
```

#### Example 3: Wild Chooses Best Symbol

```
Reel 1: HIGH_FA (row 1), HIGH_ZHONG (row 2)
Reel 2: WILD (row 1)
Reel 3: HIGH_FA (row 1), HIGH_ZHONG (row 2)

Two separate wins:
1. HIGH_FA: 1 × 1 × 1 = 1 way (15x payout)
2. HIGH_ZHONG: 1 × 1 × 1 = 1 way (10x payout)

Wild matches both symbols independently
```

### Implementation

```go
func IsWildSubstitute(symbolType string) bool {
    return symbolType != "SCATTER" && symbolType != "MYSTERY"
}

func CountMatchingSymbols(reel []Symbol, targetSymbol string) int {
    count := 0
    for _, symbol := range reel {
        if symbol.Type == targetSymbol ||
           (symbol.Type == "WILD" && IsWildSubstitute(targetSymbol)) {
            count++
        }
    }
    return count
}
```

---

## Golden Symbol Transformation

### Overview

**CRITICAL NOTE:** In Mahjong Ways 1, Golden symbols have a special transformation mechanic. They transform into Wild symbols after being part of a winning combination.

### Golden Symbol Behavior

#### Appearance Rules

- ❌ **Never on Reel 1**
- ✅ **Only on Reels 2, 3, 4**
- ❌ **Never on Reel 5**

#### Eligible Symbols

- Regular paying symbols can appear as Golden (e.g., fa_gold, zhong_gold, etc.)
- Golden symbols have the same payout as their regular counterparts

#### Visual Indicators

- Golden glow/frame around symbol
- Shimmering animation
- Distinct from regular symbol appearance

### Transformation Mechanic

#### Phase 1: Initial Appearance

1. Golden symbol lands on reels 2, 3, or 4
2. Functions as regular symbol for win evaluation
3. Has same payout value as regular symbol
4. Participates in cascade mechanics normally

#### Phase 2: Post-Cascade Transformation

**When a golden symbol is part of a winning combination:**

1. After the cascade completes (symbols removed, new symbols drop)
2. The golden symbol position transforms into a Wild symbol
3. Golden glow/frame removed, replaced with Wild symbol
4. **The Wild persists for subsequent cascades in the same spin**
5. This is the ONLY way Wild symbols can appear in the game

**When a golden symbol is NOT part of a winning combination:**

1. Golden symbol remains as golden
2. Does not transform
3. Can potentially transform in a future cascade if it becomes part of a win

### Purpose

- Creates strategic gameplay through Wild generation
- Rewards consecutive cascades with more Wilds
- Increases win potential in multi-cascade sequences
- Golden symbols are valuable because they can become Wilds

### Implementation

```go
type Symbol struct {
    Type     string // "WILD", "HIGH_FA", etc.
    IsGolden bool   // Visual state only
    Reel     int
    Row      int
}

func CanBeGolden(reel int) bool {
    return reel >= 2 && reel <= 4
}

func TransformGoldenSymbolsToWilds(grid [][]Symbol, winningPositions []Position) {
    // Transform golden symbols that were part of winning combinations
    for _, pos := range winningPositions {
        symbol := grid[pos.Reel][pos.Row]
        if symbol.IsGolden && (pos.Reel >= 2 && pos.Reel <= 4) {
            // Transform golden symbol to Wild
            grid[pos.Reel][pos.Row] = Symbol{
                Type:     "WILD",
                IsGolden: false,
                Reel:     pos.Reel,
                Row:      pos.Row,
            }
        }
    }
}

// Call TransformGoldenSymbolsToWilds after cascade completes with winning positions
```

---

## Game Flow

### Complete Spin Cycle

```
┌─────────────────────────────────────┐
│  1. Player initiates spin           │
│     - Deduct bet from balance       │
│     - Check if in free spins mode   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Generate random reel positions  │
│     - Use RNG for each reel         │
│     - Apply symbol weights          │
│     - Populate 5×4 grid             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Check for Scatter trigger       │
│     - Count Scatter symbols         │
│     - If 3+: Trigger Free Spins     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Cascade Loop (Cascade #1)       │
│     ┌────────────────────────────┐  │
│     │ a) Evaluate wins           │  │
│     │ b) Calculate payout        │  │
│     │ c) Apply multiplier        │  │
│     │ d) Add to total win        │  │
│     └────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Has Winning Symbols?            │
│     ┌─────NO──────┐   ┌─────YES────┐
│     │  End Cascade│   │Continue    │
│     │  Go to 8    │   │Go to 6     │
│     └─────────────┘   └────────────┘
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Remove winning symbols          │
│     - Explosion animation           │
│     - Clear positions               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. Drop and fill symbols           │
│     - Gravity drop existing         │
│     - Fill from top                 │
│     - Transform golden symbols      │
│     - Increase multiplier           │
│     - Return to step 4              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  8. Finalize Spin                   │
│     - Add win to balance            │
│     - Reset multiplier              │
│     - Log transaction               │
│     - Update game state             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  9. Check game state                │
│     - If Free Spins: Decrement      │
│     - If FS ended: Return to base   │
│     - Ready for next spin           │
└─────────────────────────────────────┘
```

### State Management

```go
type GameState struct {
    // Player
    PlayerID    string
    Balance     float64

    // Current Spin
    BetAmount   float64
    Grid        [][]Symbol
    TotalWin    float64

    // Cascade
    CascadeCount    int
    Multiplier      int

    // Free Spins
    FreeSpinsState  *FreeSpinsState

    // Metadata
    SpinID      string
    Timestamp   time.Time
}
```
