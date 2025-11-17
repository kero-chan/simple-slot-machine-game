# Win Calculation

## Overview

**Win calculation** is the process of determining how much a player wins from a spin. It combines symbol matching, ways counting, paytable lookup, and multiplier application into a final payout amount.

**Key Formula:**
```
Total Win = Σ (Symbol_Payout × Ways × Multiplier × Bet_Per_Way)

For each winning symbol combination in the cascade
```

---

## Step-by-Step Win Calculation

### Complete Algorithm Flow

```
┌─────────────────────────────────────────────┐
│ 1. EVALUATE GRID FOR WINNING SYMBOLS        │
│    Scan all symbols for adjacent matches    │
│    Left-to-right, minimum 3-of-a-kind       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. COUNT WAYS FOR EACH WINNING SYMBOL       │
│    Multiply matching positions per reel     │
│    Ways = n₁ × n₂ × n₃ × ...              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. LOOKUP PAYOUT FROM PAYTABLE              │
│    Based on: Symbol + Match Length          │
│    Example: FA 4-of-a-kind = 25x           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 4. APPLY CASCADE MULTIPLIER                 │
│    Base game: x1/x2/x3/x5                   │
│    Free spins: x2/x4/x6/x10                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. MULTIPLY BY BET PER WAY                  │
│    Bet_Per_Way = Total_Bet / 20            │
│    Win = Payout × Ways × Mult × BPW        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 6. SUM ALL WINNING SYMBOLS                  │
│    Total = Win_A + Win_B + Win_C + ...     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 7. APPLY MAXIMUM WIN CAP                    │
│    If total > 25,000x bet, cap it          │
│    Return final win amount                  │
└─────────────────────────────────────────────┘
```

---

## Step 1: Symbol Evaluation

### Identifying Winning Symbols

**Process:** Scan grid for symbols that form 3+ consecutive matches from left to right.

**Example Grid:**
```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    FA       FA       FA       FA      ZHONG
Row 2:  ZHONG    ZHONG    ZHONG     WILD    ZHONG
Row 3:    BAI      BAI      BAI      BAI     WILD
Row 4:  WILD     BAWAN    WUSUO    LIANGSUO LIANGTONG
```

**Scan Results:**

**Symbol: FA**
```
Check Reel 1: FA found at row 1 ✓
Check Reel 2: FA found at row 1 ✓
Check Reel 3: FA found at row 1 ✓
Check Reel 4: FA found at row 1 ✓
Check Reel 5: FA NOT found ✗

Result: FA appears on 4 consecutive reels
Match: 4-of-a-kind ✓
```

**Symbol: ZHONG**
```
Check Reel 1: ZHONG found at row 2 ✓
Check Reel 2: ZHONG found at row 2 ✓
Check Reel 3: ZHONG found at row 2 ✓
Check Reel 4: WILD substitutes for ZHONG at row 2 ✓
Check Reel 5: ZHONG found at rows 1 and 2 ✓

Result: ZHONG appears on all 5 reels
Match: 5-of-a-kind ✓
```

**Symbol: BAI**
```
Check Reel 1: BAI found at row 3 ✓
Check Reel 2: BAI found at row 3 ✓
Check Reel 3: BAI found at row 3 ✓
Check Reel 4: BAI found at row 3 ✓
Check Reel 5: WILD substitutes for BAI at row 3 ✓

Result: BAI appears on all 5 reels
Match: 5-of-a-kind ✓
```

**Winning Symbols Identified:**
- FA: 4-of-a-kind
- ZHONG: 5-of-a-kind
- BAI: 5-of-a-kind

---

### Wild Substitution Rules

**Wild Matching Logic:**

```
For each symbol evaluation:
1. Check if symbol exists on current reel
2. If not, check if WILD exists on current reel
3. If WILD exists, it substitutes for the symbol
4. Count WILD position as matching position

Example:
Reel 4: Looking for ZHONG
        ZHONG not found
        WILD found at row 2
        → WILD counts as ZHONG
        → Match continues
```

**Important:**
- Wild substitutes for any paying symbol
- Wild does NOT substitute for scatter or mystery
- Wild can create or extend matches
- Wild counts as the symbol it's substituting for

---

## Step 2: Ways Counting

### Ways Calculation Algorithm

**Formula:**
```
Ways = Positions_Reel_1 × Positions_Reel_2 × ... × Positions_Reel_N

Where:
N = Number of consecutive reels with matches (≥3)
Positions_Reel_i = Count of matching symbols on reel i
```

---

### Example: FA Ways Count

**From Grid Above:**
```
FA appears on reels 1-4 (4-of-a-kind)

Reel 1: FA at row 1 → 1 position
Reel 2: FA at row 1 → 1 position
Reel 3: FA at row 1 → 1 position
Reel 4: FA at row 1 → 1 position

Ways = 1 × 1 × 1 × 1 = 1 way
```

---

### Example: ZHONG Ways Count

**From Grid Above:**
```
ZHONG appears on reels 1-5 (5-of-a-kind)

Reel 1: ZHONG at row 2 → 1 position
Reel 2: ZHONG at row 2 → 1 position
Reel 3: ZHONG at row 2 → 1 position
Reel 4: WILD at row 2 (substitutes) → 1 position
Reel 5: ZHONG at rows 1, 2 → 2 positions

Ways = 1 × 1 × 1 × 1 × 2 = 2 ways
```

**The 2 ways are:**
```
Way 1: R1(row2) → R2(row2) → R3(row2) → R4(row2-WILD) → R5(row1)
Way 2: R1(row2) → R2(row2) → R3(row2) → R4(row2-WILD) → R5(row2)
```

---

### Example: BAI Ways Count

**From Grid Above:**
```
BAI appears on reels 1-5 (5-of-a-kind)

Reel 1: BAI at row 3 → 1 position
Reel 2: BAI at row 3 → 1 position
Reel 3: BAI at row 3 → 1 position
Reel 4: BAI at row 3 → 1 position
Reel 5: WILD at row 3 (substitutes) → 1 position

Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

---

### Complex Ways Example

**Scenario with Multiple Positions:**
```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    FA       FA       FA       FA       FA
Row 2:    FA       FA      WILD      FA      WILD
Row 3:    FA      WILD      FA      WILD      FA
Row 4:  ZHONG     WILD     ZHONG    ZHONG    ZHONG

FA matching positions:
Reel 1: rows 1, 2, 3 → 3 positions
Reel 2: rows 1, 2, 3 (3 WILDs count as FA) → 4 positions
Reel 3: rows 1, 2, 3 → 4 positions
Reel 4: rows 1, 2, 3 (3 WILDs count as FA) → 4 positions
Reel 5: rows 1, 2, 3 (2 WILDs count as FA) → 4 positions

Ways = 3 × 4 × 4 × 4 × 4 = 768 ways!
```

This is a MASSIVE win due to high ways count!

---

## Step 3: Paytable Lookup

### Paytable Structure

**From Game Configuration:**

```javascript
paytable = {
  fa:        { 3: 10, 4: 25, 5: 50 },
  zhong:     { 3: 8,  4: 20, 5: 40 },
  bai:       { 3: 6,  4: 15, 5: 30 },
  bawan:     { 3: 5,  4: 10, 5: 15 },
  wusuo:     { 3: 3,  4: 5,  5: 12 },
  wutong:    { 3: 3,  4: 5,  5: 12 },
  liangsuo:  { 3: 2,  4: 4,  5: 10 },
  liangtong: { 3: 1,  4: 3,  5: 6  },
  bonus:     { 3: 1,  4: 3,  5: 6  },  // Scatter
  wild:      { 3: 1,  4: 3,  5: 6  }   // Wild
}
```

### Lookup Process

**For each winning symbol:**

```
Symbol: FA
Match Length: 4-of-a-kind

Lookup: paytable["fa"][4]
Result: 25x

Symbol: ZHONG
Match Length: 5-of-a-kind

Lookup: paytable["zhong"][5]
Result: 40x

Symbol: BAI
Match Length: 5-of-a-kind

Lookup: paytable["bai"][5]
Result: 30x
```

---

### Paytable Values Meaning

**Multiplier Values (e.g., "25x"):**

```
"25x" means: 25 times the bet per way

NOT:
✗ 25 times total bet
✗ 25 absolute credits
✗ 25 times ways count

YES:
✓ 25 × Bet_Per_Way
✓ Then multiply by ways count
✓ Then multiply by cascade multiplier
```

---

## Step 4: Apply Cascade Multiplier

### Multiplier Selection

**Base Game Multipliers:**
```
Cascade 1: x1
Cascade 2: x2
Cascade 3: x3
Cascade 4+: x5
```

**Free Spins Multipliers:**
```
Cascade 1: x2
Cascade 2: x4
Cascade 3: x6
Cascade 4+: x10
```

**Example:**
```
Current spin is in free spins mode
This is the 3rd cascade

Multiplier = x6
```

---

### Multiplier Application

**Multiplier applies to ALL wins in the cascade:**

```
Cascade 3 (x6 multiplier):

Win A: Base payout × x6
Win B: Base payout × x6
Win C: Base payout × x6

All wins get the same multiplier for this cascade
```

---

## Step 5: Bet Per Way Calculation

### Understanding Bet Structure

**Total Bet vs Bet Per Way:**

```
Player bets: 100 credits total

Fixed ways denominator: 20

Bet Per Way = 100 / 20 = 5 credits

Why 20?
- Historical slot standard
- Simplifies calculations
- Easy for players to understand
- Consistent across all bets
```

**Examples:**
```
Total Bet: 100 → Bet Per Way: 5
Total Bet: 200 → Bet Per Way: 10
Total Bet: 50 → Bet Per Way: 2.5
Total Bet: 1000 → Bet Per Way: 50
```

---

### Final Win Calculation

**For each symbol, calculate:**

```
Symbol_Win = Paytable_Value × Ways_Count × Multiplier × Bet_Per_Way
```

**Example - FA Win:**
```
Symbol: FA
Paytable: 25x (4-of-a-kind)
Ways: 1
Multiplier: x6 (cascade 3, free spins)
Bet Per Way: 5 credits (100 total bet / 20)

Calculation:
FA_Win = 25 × 1 × 6 × 5
       = 25 × 30
       = 750 credits
```

**Example - ZHONG Win:**
```
Symbol: ZHONG
Paytable: 40x (5-of-a-kind)
Ways: 2
Multiplier: x6
Bet Per Way: 5

Calculation:
ZHONG_Win = 40 × 2 × 6 × 5
          = 40 × 60
          = 2,400 credits
```

**Example - BAI Win:**
```
Symbol: BAI
Paytable: 30x (5-of-a-kind)
Ways: 1
Multiplier: x6
Bet Per Way: 5

Calculation:
BAI_Win = 30 × 1 × 6 × 5
        = 30 × 30
        = 900 credits
```

---

## Step 6: Sum All Wins

### Total Cascade Win

**Add all individual symbol wins:**

```
Total Cascade Win = FA_Win + ZHONG_Win + BAI_Win
                  = 750 + 2,400 + 900
                  = 4,050 credits
```

**This is the win for ONE cascade.**

---

### Multi-Cascade Accumulation

**If cascades continue:**

```
Spin Result:

Cascade 1 (x2):
  - ZHONG 3-of-a-kind: 8 × 2 × 2 × 5 = 160 credits
  - Total: 160 credits

Cascade 2 (x4):
  - FA 4-of-a-kind: 25 × 4 × 4 × 5 = 2,000 credits
  - Total: 2,000 credits

Cascade 3 (x6):
  - FA 4-of-a-kind: 25 × 1 × 6 × 5 = 750 credits
  - ZHONG 5-of-a-kind: 40 × 2 × 6 × 5 = 2,400 credits
  - BAI 5-of-a-kind: 30 × 1 × 6 × 5 = 900 credits
  - Total: 4,050 credits

Cascade 4 (x10):
  - BAI 3-of-a-kind: 6 × 1 × 10 × 5 = 300 credits
  - Total: 300 credits

No more wins → Cascades end

TOTAL SPIN WIN = 160 + 2,000 + 4,050 + 300
               = 6,510 credits
```

---

## Step 7: Maximum Win Cap

### Cap Verification

**Maximum Win Rule:** 25,000x total bet

```
Total Bet: 100 credits
Maximum Win: 25,000 × 100 = 2,500,000 credits

Calculated Win: 6,510 credits

Check: 6,510 < 2,500,000?
Yes → No cap applied
Final Win: 6,510 credits
```

**If cap exceeded:**
```
Calculated Win: 3,200,000 credits
Maximum Allowed: 2,500,000 credits

Check: 3,200,000 > 2,500,000?
Yes → Apply cap
Final Win: 2,500,000 credits (capped)

Note: Player notified of maximum win achievement
      In free spins: Session ends immediately
```

---

## Complete Calculation Example

### Scenario Setup

**Game State:**
- Mode: Free Spins
- Current Cascade: 2 (multiplier x4)
- Total Bet: 200 credits
- Bet Per Way: 200 / 20 = 10 credits

**Grid Result:**
```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    FA       FA       FA       FA      ZHONG
Row 2:  BAWAN    BAWAN    BAWAN    BAWAN    BAWAN
Row 3:  WILD      BAI      BAI      BAI      BAI
Row 4:  ZHONG    ZHONG    WUSUO    LIANGSUO LIANGTONG
```

---

### Step-by-Step Calculation

**Step 1: Identify Wins**
```
FA: Reels 1-4 → 4-of-a-kind ✓
BAWAN: Reels 1-5 → 5-of-a-kind ✓
BAI: Reels 2-5 → Cannot start from Reel 1 ✗
     Check Reel 1: WILD at row 3 substitutes
     → Reels 1-5 → 5-of-a-kind ✓
```

**Winning Symbols:**
- FA: 4-of-a-kind
- BAWAN: 5-of-a-kind
- BAI: 5-of-a-kind

---

**Step 2: Count Ways**

**FA Ways:**
```
Reel 1: row 1 → 1 position
Reel 2: row 1 → 1 position
Reel 3: row 1 → 1 position
Reel 4: row 1 → 1 position

Ways = 1 × 1 × 1 × 1 = 1 way
```

**BAWAN Ways:**
```
Reel 1: row 2 → 1 position
Reel 2: row 2 → 1 position
Reel 3: row 2 → 1 position
Reel 4: row 2 → 1 position
Reel 5: row 2 → 1 position

Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

**BAI Ways:**
```
Reel 1: WILD at row 3 (substitutes) → 1 position
Reel 2: BAI at row 3 → 1 position
Reel 3: BAI at row 3 → 1 position
Reel 4: BAI at row 3 → 1 position
Reel 5: BAI at row 3 → 1 position

Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

---

**Step 3: Paytable Lookup**

```
FA 4-of-a-kind: paytable["fa"][4] = 25x
BAWAN 5-of-a-kind: paytable["bawan"][5] = 15x
BAI 5-of-a-kind: paytable["bai"][5] = 30x
```

---

**Step 4: Apply Multiplier**

```
Cascade 2 in Free Spins
Multiplier: x4
```

---

**Step 5: Calculate Each Win**

**FA Win:**
```
25 × 1 × 4 × 10 = 1,000 credits
```

**BAWAN Win:**
```
15 × 1 × 4 × 10 = 600 credits
```

**BAI Win:**
```
30 × 1 × 4 × 10 = 1,200 credits
```

---

**Step 6: Sum Total**

```
Total Cascade Win = 1,000 + 600 + 1,200
                  = 2,800 credits
```

---

**Step 7: Check Max Win**

```
Total Bet: 200 credits
Max Win: 25,000 × 200 = 5,000,000 credits
Calculated: 2,800 credits

2,800 < 5,000,000 → No cap
Final Win: 2,800 credits
```

---

## Edge Cases

### Case 1: Zero Ways

**Question:** Can a symbol have 0 ways?

**Answer:**
```
No.

If symbol appears on 3+ consecutive reels:
- Each reel must have ≥1 matching position
- Ways = Product of all positions
- Minimum ways = 1 × 1 × 1 = 1

If symbol doesn't form 3+ consecutive matches:
- Not counted as a win
- Not included in calculation
```

---

### Case 2: Wild-Only Combination

**Question:** All wilds form a match - what payout?

**Answer:**
```
Grid:
Reel 1: WILD
Reel 2: WILD
Reel 3: WILD

Paytable shows:
wild: { 3: 1, 4: 3, 5: 6 }

Pure wild 3-of-a-kind:
Payout = 1x (from paytable)
Ways = 1 (assuming 1 position each)
Multiplier = Current cascade multiplier
Bet Per Way = Total_Bet / 20

Win = 1 × 1 × Multiplier × Bet_Per_Way

Wilds have their own payout value
```

---

### Case 3: Same Symbol Multiple Lengths

**Question:** Symbol appears as both 3-oak and 4-oak paths?

**Answer:**
```
Only longest match counts!

Example:
FA appears on reels 1-4 (4-of-a-kind)

We DO NOT count:
- FA 3-of-a-kind (reels 1-3)

We ONLY count:
- FA 4-of-a-kind (reels 1-4)

Reasoning:
- Longer match has higher payout
- Prevents double-counting same symbols
- Standard slot machine behavior
```

---

### Case 4: Fractional Credits

**Question:** What if Bet Per Way creates fractional credits?

**Answer:**
```
Bet: 55 credits
Bet Per Way: 55 / 20 = 2.75 credits

Win calculation:
10 × 4 × 2 × 2.75 = 220 credits

Fractional wins are allowed!

Display: 220.00 credits
Storage: Use integer cents or decimal type
Rounding: Only on final display, never mid-calculation

Best Practice:
- Store as integer cents (220.00 = 22000 cents)
- OR use decimal type with sufficient precision
- Round only for final player-facing display
```

---

### Case 5: Scatter Symbol Wins

**Question:** Do scatters pay like regular symbols?

**Answer:**
```
Yes, scatters have dual function:

1. Trigger Function:
   3+ scatters → Trigger free spins

2. Symbol Payout:
   bonus: { 3: 1, 4: 3, 5: 6 }

   Scatters forming 3+ consecutive matches
   → Pay according to paytable
   → PLUS trigger free spins if applicable

Both rewards apply simultaneously!

Example:
4 scatters in base game:
- Pays: 3x × ways × multiplier × bet_per_way
- PLUS: Triggers 14 free spins
```

---

## Optimization Considerations

### Calculation Order

**Most Efficient Order:**

```
1. Single pass through grid
   → Identify all winning symbols simultaneously
   → Build list of wins

2. For each win in list:
   → Count ways (cached reel positions)
   → Lookup paytable (O(1) hash lookup)
   → Multiply components
   → Add to total

3. Single max win check at end

Avoid:
✗ Multiple grid scans
✗ Recalculating same values
✗ Unnecessary intermediate storage
```

---

### Caching Strategies

**What to cache during cascade evaluation:**

```
Cache for entire cascade sequence:
- Bet Per Way (calculate once)
- Paytable reference (load once)
- Current multiplier (track state)

Recompute each cascade:
- Grid state (changes with cascades)
- Symbol positions (changes with cascades)
- Ways count (depends on current grid)
- Individual wins (depends on grid)
```

---

## Testing & Validation

### Test Case 1: Simple Win
```
Input:
- Symbol: ZHONG 3-of-a-kind
- Ways: 1
- Multiplier: x1
- Bet: 100 (bet per way: 5)

Expected:
8 × 1 × 1 × 5 = 40 credits
```

### Test Case 2: High Ways
```
Input:
- Symbol: FA 5-of-a-kind
- Ways: 324 (3×4×3×3×3)
- Multiplier: x10
- Bet: 100 (bet per way: 5)

Expected:
50 × 324 × 10 × 5 = 810,000 credits
```

### Test Case 3: Multiple Symbols
```
Input:
- FA 3-of-a-kind, 2 ways, x2, bet 100
- ZHONG 4-of-a-kind, 4 ways, x2, bet 100

Expected:
FA: 10 × 2 × 2 × 5 = 200
ZHONG: 20 × 4 × 2 × 5 = 800
Total: 1,000 credits
```

### Test Case 4: Max Win Cap
```
Input:
- Calculated Win: 3,000,000
- Bet: 100
- Max: 25,000 × 100 = 2,500,000

Expected:
Final Win: 2,500,000 (capped)
```

---

## Summary

**Win Calculation Process:**
1. **Evaluate**: Scan grid for 3+ consecutive symbol matches
2. **Count Ways**: Multiply matching positions across reels
3. **Lookup**: Get paytable value for symbol + match length
4. **Multiply**: Apply cascade multiplier
5. **Scale**: Multiply by bet per way
6. **Sum**: Add all individual symbol wins
7. **Cap**: Apply 25,000x maximum if exceeded

**Formula:**
```
Total Win = Σ (Paytable[symbol][length] × Ways × Multiplier × Bet_Per_Way)
```

**Key Points:**
- Wild substitutes for any paying symbol
- Only longest match per symbol counts
- All wins in cascade use same multiplier
- Bet per way = Total bet / 20
- Maximum win = 25,000x total bet
- Fractional credits allowed
- Scatters pay AND trigger

**Result:** Fair, transparent, and mathematically precise payout calculation!
