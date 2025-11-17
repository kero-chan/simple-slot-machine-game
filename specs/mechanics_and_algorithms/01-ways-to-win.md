# Ways to Win System

## Concept Overview

Unlike traditional slot machines with fixed paylines, Mahjong Ways uses a **"Ways to Win"** system. This means there are no predetermined winning lines - instead, matching symbols on adjacent reels from left to right create wins.

**Maximum Possible Ways:** 4 × 4 × 4 × 4 × 4 = **1,024 ways**

---

## Core Principle: Adjacent Reel Matching

### The Fundamental Rule

**Symbols must appear on consecutive reels starting from the leftmost reel (Reel 1).**

```
Valid Win Pattern:
Reel 1: Symbol A ✓
Reel 2: Symbol A ✓
Reel 3: Symbol A ✓
= 3-of-a-kind WIN

Invalid Pattern:
Reel 1: Symbol B
Reel 2: Symbol A ✗ (doesn't match Reel 1)
Reel 3: Symbol A ✗
= NO WIN (must start from left)

Invalid Pattern:
Reel 1: Symbol A ✓
Reel 2: Symbol B ✗ (breaks chain)
Reel 3: Symbol A ✗
= NO WIN (must be consecutive)
```

---

## How Ways Are Counted

### Single Position Matching

**Scenario:** One symbol on each reel matches

```
Grid Layout:
        Reel 1   Reel 2   Reel 3
Row 1:    A        B        C
Row 2:    X        A        A    ← Only these match
Row 3:    B        X        B
Row 4:    C        C        X

Calculation:
Reel 1: 1 matching position (row 2)
Reel 2: 1 matching position (row 2)
Reel 3: 1 matching position (row 2)

Ways = 1 × 1 × 1 = 1 way
```

**Result:** 1 way to win with symbol A (3-of-a-kind)

---

### Multiple Positions Per Reel

**Scenario:** Multiple matching symbols on each reel

```
Grid Layout:
        Reel 1   Reel 2   Reel 3
Row 1:    A        A        B
Row 2:    X        A        A    ← Row 2 of Reel 3 matches
Row 3:    B        X        A    ← Row 3 of Reel 3 matches
Row 4:    C        C        X

Calculation:
Reel 1: 1 matching position (A at row 1)
Reel 2: 2 matching positions (A at rows 1 and 2)
Reel 3: 2 matching positions (A at rows 2 and 3)

Ways = 1 × 2 × 2 = 4 ways
```

**Result:** 4 different ways to win with symbol A

---

### Visualizing the Ways

For the above example, the 4 ways are:

```
Way 1: Reel1(Row1) → Reel2(Row1) → Reel3(Row2)
Way 2: Reel1(Row1) → Reel2(Row1) → Reel3(Row3)
Way 3: Reel1(Row1) → Reel2(Row2) → Reel3(Row2)
Way 4: Reel1(Row1) → Reel2(Row2) → Reel3(Row3)
```

Each way represents a unique path through the matching symbols.

---

## Minimum Win Requirements

### At Least 3-of-a-Kind

**Symbols must appear on at least 3 consecutive reels from the left.**

```
2-of-a-kind (NOT VALID):
Reel 1: A
Reel 2: A
= NO PAYOUT (need minimum 3)

3-of-a-kind (VALID):
Reel 1: A
Reel 2: A
Reel 3: A
= PAYOUT ✓

4-of-a-kind (BETTER):
Reel 1: A
Reel 2: A
Reel 3: A
Reel 4: A
= HIGHER PAYOUT ✓

5-of-a-kind (BEST):
Reel 1: A
Reel 2: A
Reel 3: A
Reel 4: A
Reel 5: A
= MAXIMUM PAYOUT ✓
```

---

## Wild Symbol Interaction

### Wild as Substitute

**Wild symbols substitute for any paying symbol** (except Scatter and Mystery).

**IMPORTANT:**
- Wild symbols CANNOT appear directly on reels
- Wilds ONLY appear when golden symbols transform after being part of a winning combination
- Wilds can ONLY appear on reels 2, 3, 4 (same restriction as golden symbols)

```
Example with Wild:
        Reel 1   Reel 2   Reel 3   Reel 4
Row 1:    A       WILD      A        A
Row 2:    B        B        B        X

Analysis:
- Reel 2's WILD (transformed from a golden symbol) substitutes for symbol A
- Creates 4-of-a-kind for symbol A
- Result: Pays as 4-of-a-kind A
```

---

### Wild Increases Ways

```
Grid Layout:
        Reel 1   Reel 2   Reel 3
Row 1:    A       WILD      A
Row 2:    B       WILD      B
Row 3:    C        C        A

Reel 1: A at row 1
Reel 2: WILD at rows 1 and 2 (both count as A)
Reel 3: A at rows 1 and 3

Ways for symbol A:
Reel 1: 1 position
Reel 2: 2 positions (both WILDs count)
Reel 3: 2 positions

Ways = 1 × 2 × 2 = 4 ways

Additional win for symbol B:
Reel 1: B at row 2
Reel 2: WILD at row 1 and 2 (counts as B)
Reel 3: B at row 2

Ways = 1 × 2 × 1 = 2 way

Total: 4 ways for A + 2 way for B = 6 ways total
```

---

## Maximum Ways Scenarios

### Perfect Alignment (1,024 Ways)

**All 4 rows on all 5 reels contain the same symbol:**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        A        A        A
Row 2:    A        A        A        A        A
Row 3:    A        A        A        A        A
Row 4:    A        A        A        A        A

Ways = 4 × 4 × 4 × 4 × 4 = 1,024 ways (MAXIMUM)

Payout = Symbol_A_5oak × 1,024 × Multiplier × Bet_Per_Way
```

**This is extremely rare but represents the theoretical maximum.**

---

### High Ways Scenarios

**Scenario: Many matching symbols across reels**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        B        A        A
Row 2:    A        A        A        A        X
Row 3:    B        A        A        A        A
Row 4:    A        A        A        X        A

Matching A symbols:
Reel 1: 3 positions (rows 1, 2, 4)
Reel 2: 4 positions (all rows)
Reel 3: 3 positions (rows 2, 3, 4)
Reel 4: 3 positions (rows 1, 2, 3)
Reel 5: 3 positions (rows 1, 3, 4)

Ways = 3 × 4 × 3 × 3 × 3 = 324 ways

This is a very good win!
```

---

## Multiple Simultaneous Wins

### Different Symbols Win at Once

**The system evaluates ALL symbols independently.**

```
Grid Layout:
        Reel 1   Reel 2   Reel 3
Row 1:    A        A        A     ← Symbol A wins
Row 2:    B        B        B     ← Symbol B wins
Row 3:    C        C        C     ← Symbol C wins
Row 4:    X        Y        Z

Results:
- Symbol A: 3-of-a-kind, 1 way
- Symbol B: 3-of-a-kind, 1 way
- Symbol C: 3-of-a-kind, 1 way

Total payout = Win_A + Win_B + Win_C
```

---

### Same Symbol, Different Lengths

**Only the longest match counts for each symbol.**

```
Grid Layout:
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        A        A        B
Row 2:    B        B        X        X        X

Analysis:
Symbol A appears on reels 1-4 (4 consecutive)
Symbol B appears on reels 1-2 (2 consecutive - NOT VALID)

Result:
- Symbol A pays as 4-of-a-kind ✓
- Symbol B does NOT pay (only 2-of-a-kind) ✗
```

---

## Edge Cases & Special Situations

### Case 1: Reel 1 Has No Match

**If Reel 1 (leftmost) doesn't have the symbol, there's NO win.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    X        A        A        A        A
Row 2:    B        B        B        B        B

Result:
- Symbol A: NO WIN (must start from Reel 1)
- Symbol B: 4-of-a-kind ✓ (starts from Reel 1)
```

---

### Case 2: Gap in Middle Reels

**Chain breaks at first non-matching reel.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        X        A        A

Result:
- Symbol A: 2-of-a-kind (reels 1-2 only)
- NO PAYOUT (minimum is 3-of-a-kind)
- Reels 4-5 don't count (gap at Reel 3)
```

---

### Case 3: Wild Fills Gap

**Wild CAN connect otherwise separated symbols.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A       WILD      A        A

Result:
- Wild substitutes as A on Reel 3
- Creates 5-of-a-kind for symbol A ✓
- Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

---

### Case 4: All Wilds

**Pure Wild combinations have NO PAYOUT.**

```
        Reel 1   Reel 2   Reel 3
Row 1:   WILD     WILD     WILD

Result:
- NO PAYOUT (Wild has no paytable entry)
- Wilds exist only for substitution purposes
- Pure Wild lines do not award any winnings

Note: This scenario is impossible since Wilds only appear on reels 2, 3, 4
      and cannot appear on Reel 1, so a pure Wild combination cannot occur
```

---

## Payout Calculation Integration

### Complete Formula

```
Total Win = Σ (Symbol_Payout × Ways_Count × Multiplier × Bet_Per_Way)

For each winning symbol:
1. Count ways (as described above)
2. Look up payout from paytable (based on symbol and count)
3. Multiply by current cascade multiplier
4. Multiply by bet per way
5. Add to total win
```

### Example Calculation

```
Scenario:
Symbol: FA (Green 发)
Count: 4-of-a-kind
Ways: 12 ways
Paytable: FA 4-of-a-kind = 25x
Cascade: 2nd cascade (multiplier = x2)
Bet: 100 total (100/20 = 5 per way)

Calculation:
Win = 25 × 12 × 2 × 5
    = 25 × 12 × 10
    = 3,000 credits
```

---

## Comparison to Paylines

### Traditional Paylines

```
Fixed Lines: e.g., 20 paylines
Line 1: Position[1,2] → Position[2,2] → Position[3,2]
Line 2: Position[1,1] → Position[2,1] → Position[3,1]
...

Only symbols on these exact positions count.
```

### Ways to Win

```
Flexible: Any position combination counts
All positions on adjacent reels contribute
Creates up to 1,024 possible winning paths

Much more dynamic and exciting!
```

---

## Strategy Implications

### For Players

1. **More Ways = Better**
   - Symbols appearing in multiple rows increase ways
   - More ways = higher total payout

2. **Wild Symbols Are Valuable**
   - Connect gaps
   - Multiply ways count
   - Increase win frequency

3. **Cascades Magnify Wins**
   - More cascades = higher multiplier
   - Ways system allows chain reactions

### For Game Design

1. **Symbol Distribution Matters**
   - Frequency affects ways count
   - Balance between low-value (common) and high-value (rare)

2. **Grid Size Impacts Volatility**
   - 4 rows = up to 1,024 ways
   - More rows = more ways = higher volatility

3. **RTP Control**
   - Ways count × Symbol frequency = Expected value
   - Carefully tuned for 96.92% target RTP

---

## Visual Summary

```
┌─────────────────────────────────────────┐
│         1,024 WAYS TO WIN               │
│                                         │
│  Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
│    A        A        A        A        A
│    A   ×    A    ×   A    ×   A    ×   A
│    A        A        A        A        A
│    A        A        A        A        A
│                                         │
│  Ways = 4 × 4 × 4 × 4 × 4 = 1,024      │
│                                         │
│  Requirements:                          │
│  ✓ Adjacent reels (left to right)      │
│  ✓ Minimum 3-of-a-kind                 │
│  ✓ Wild substitutes (except Scatter)   │
│  ✓ Multiple wins can happen together   │
└─────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Basic 3-of-a-kind

- Expected: 1 × 1 × 1 = 1 way
- Verify: Correct payout for 3-of-a-kind

### Test Case 2: Multiple Positions

- Expected: 2 × 3 × 1 = 6 ways
- Verify: Payout multiplied by 6

### Test Case 3: With Wild

- Expected: Wild counts as matching symbol
- Verify: Correct symbol count (3, 4, or 5)

### Test Case 4: Gap in Reels

- Expected: Chain breaks, counts only up to gap
- Verify: No payout if less than 3-of-a-kind

### Test Case 5: Maximum Ways

- Expected: All positions match = 1,024 ways
- Verify: Extremely high payout (capped at 25,000x bet)

---

## Summary

**Ways to Win provides:**

- Dynamic winning combinations (no fixed paylines)
- Up to 1,024 possible ways per spin
- Adjacent reel matching from left to right
- Minimum 3-of-a-kind requirement
- Wild substitution increases flexibility
- Multiple simultaneous wins possible

**Result:** More exciting, varied, and engaging than traditional paylines!
