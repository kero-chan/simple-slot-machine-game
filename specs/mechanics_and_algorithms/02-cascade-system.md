# Cascade System (Tumbling Reels)

## Concept Overview

The **Cascade System** (also called Tumbling Reels or Avalanche) is the signature mechanic of Mahjong Ways. When a win occurs, winning symbols disappear, remaining symbols fall down due to "gravity," and new symbols drop from above to fill the gaps.

**Key Innovation:** This can create chain reactions where new wins trigger additional cascades, potentially continuing indefinitely.

---

## The Cascade Cycle

### Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│  STEP 1: INITIAL SPIN                   │
│  - Reels spin and land                  │
│  - Initial grid populated               │
│  - Cascade counter = 0                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  STEP 2: EVALUATE WINS                  │
│  - Check all symbol combinations        │
│  - Identify winning positions           │
│  - Calculate ways count                 │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
     NO WINS      WINS FOUND
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  STEP 3: HIGHLIGHT & CALC   │
        │  │  - Winning symbols glow     │
        │  │  - Calculate win amount     │
        │  │  - Apply multiplier         │
        │  │  - Add to total win         │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  STEP 4: REMOVE SYMBOLS     │
        │  │  - Winning symbols explode  │
        │  │  - Empty positions created  │
        │  │  - Increment cascade counter│
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  STEP 5: SYMBOLS DROP       │
        │  │  - Remaining symbols fall   │
        │  │  - Gravity physics applied  │
        │  │  - Symbols settle at bottom │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  STEP 6: FILL GAPS          │
        │  │  - New symbols drop from top│
        │  │  - Read from reel strip     │
        │  │  - Grid is complete again   │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  STEP 7: ADVANCE MULTIPLIER │
        │  │  - Increment cascade number │
        │  │  - Update multiplier value  │
        │  └──────────┬──────────────────┘
        │             │
        │             └──────┐
        │                    │
        └────────────────────┼─────► BACK TO STEP 2
                             │
                             ▼
               ┌─────────────────────────┐
               │  SPIN COMPLETE          │
               │  - Reset multiplier     │
               │  - Award total win      │
               │  - Ready for next spin  │
               └─────────────────────────┘
```

---

## Step-by-Step Detailed Explanation

### Step 1: Initial Spin

**What Happens:**

- Player initiates a spin (or auto-spin)
- Backend generates random starting positions for all 5 reels
- Symbols are read from reel strips based on these positions
- Grid is populated with 5 columns × 10 rows (4 visible + 6 buffer)

**Visual State:**

```
Buffer rows (above visible area):
Row 0: [symbols waiting to drop]
Row 1: [symbols waiting to drop]
Row 2: [symbols waiting to drop]
Row 3: [symbols waiting to drop]

Visible rows (player sees):
Row 4: [fa] [zhong] [bai] [wutong] [liangsuo]
Row 5: [zhong] [fa] [fa] [bawan] [wild]
Row 6: [bai] [wutong] [zhong] [fa] [liangtong]
Row 7: [wusuo] [liangsuo] [bawan] [zhong] [fa]

Buffer rows (below visible area):
Row 8: [symbols in reserve]
Row 9: [symbols in reserve]
```

**Initial State:**

- Cascade number: 0 (hasn't started yet)
- Multiplier: x1 (base game) or x2 (free spins)
- Total win: 0

---

### Step 2: Evaluate Wins

**What Happens:**

- System scans the visible rows (4-7) for winning combinations
- Checks every symbol type independently
- Uses Ways to Win algorithm to count winning paths
- Identifies exact positions of all winning symbols

**Example Evaluation:**

```
Visible Grid:
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:   fa       fa       bai      wutong   liangsuo
Row 5:   zhong    fa       fa       bawan    wild
Row 6:   bai      wutong   fa       fa       liangtong
Row 7:   wusuo    liangsuo bawan    zhong    fa

Detected Win:
Symbol "fa" appears on:
- Reel 1: row 4
- Reel 2: rows 4, 5
- Reel 3: rows 5, 6
- Reel 4: row 6

Result: 4-of-a-kind FA
Ways: 1 × 2 × 2 × 1 = 4 ways
```

**Decision Point:**

- **If wins found:** Proceed to Step 3
- **If no wins:** Skip to Spin Complete

---

### Step 3: Highlight & Calculate

**What Happens:**

- All winning symbols are marked/highlighted
- Win amount is calculated using the formula
- Current cascade multiplier is applied
- Win is added to the total

**Visual Effect:**

```
Winning symbols glow GOLD:

        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:  [FA✨]   [FA✨]    bai      wutong   liangsuo
Row 5:   zhong   [FA✨]   [FA✨]    bawan    wild
Row 6:   bai      wutong  [FA✨]   [FA✨]    liangtong
Row 7:   wusuo    liangsuo bawan    zhong    fa

✨ = Winning symbol (highlighted in gold)
```

**Calculation:**

```
Symbol: FA
Count: 4-of-a-kind
Ways: 4 ways
Paytable: FA 4-of-a-kind = 25x
Cascade #: 1 (first cascade)
Multiplier: x1 (base game, first cascade)
Bet: 100 total (5 per way)

Win = 25 × 4 × 1 × 5 = 500 credits

Total win so far: 500 credits
```

---

### Step 4: Remove Symbols

**What Happens:**

- Winning symbols are removed from the grid
- Positions become empty
- Visual: Explosion/disappear animation plays
- Cascade counter increments

**Grid After Removal:**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:   [ ]      [ ]      bai      wutong   liangsuo
Row 5:   zhong    [ ]      [ ]      bawan    wild
Row 6:   bai      wutong   [ ]      [ ]      liangtong
Row 7:   wusuo    liangsuo bawan    zhong    fa

[ ] = Empty position
Cascade number: 1 (incremented)
```

---

### Step 5: Symbols Drop (Gravity)

**What Happens:**

- Remaining symbols "fall" down to fill empty spaces
- Think of gravity pulling symbols downward
- Symbols settle at the bottom of their column
- Empty positions move to the top

**Dropping Process:**

**Before Drop:**

```
Column 1:
Row 4: [ ]     ← empty
Row 5: zhong
Row 6: bai
Row 7: wusuo
```

**After Drop:**

```
Column 1:
Row 4: [ ]     ← empty (moved to top)
Row 5: zhong   ← dropped from row 5
Row 6: bai     ← dropped from row 6
Row 7: wusuo   ← stayed at bottom
```

**Complete Grid After Drop:**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:   [ ]      [ ]      [ ]      [ ]      liangsuo
Row 5:   [ ]      [ ]      bai      wutong   wild
Row 6:   zhong    wutong   bawan    bawan    liangtong
Row 7:   bai      liangsuo zhong    zhong    fa

All symbols settled at bottom, empty spaces at top
```

---

### Step 6: Fill Gaps

**What Happens:**

- New symbols drop from "above" to fill empty positions
- These symbols come from the reel strip
- Reading continues from where the last spin left off
- Grid becomes complete again

**Critical Concept:**
The new symbols are NOT randomly generated. They are read from the predetermined reel strip, continuing from the position "above" where the original spin started.

**Example:**

```
Original spin started at position 47 on reel strip
After reading 4 symbols down, position was 50
Now need to fill 2 empty positions
Read backward: positions 46, 45

New symbols from strip:
Position 46: "bonus"
Position 45: "wutong"

These drop into the empty positions at top
```

**Grid After Filling:**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:   bonus    wild     fa       bawan    liangsuo
Row 5:   wutong   zhong    bai      wutong   wild
Row 6:   zhong    wutong   bawan    bawan    liangtong
Row 7:   bai      liangsuo zhong    zhong    fa

Grid is complete again - ready to evaluate for new wins!
```

---

### Step 7: Advance Multiplier

**What Happens:**

- Cascade number increases
- Multiplier value updates based on cascade number
- Prepares for next evaluation

**Multiplier Progression:**

**Base Game:**

```
Cascade 1: x1 multiplier
Cascade 2: x2 multiplier ← We're here now
Cascade 3: x3 multiplier
Cascade 4+: x5 multiplier (stays at x5)
```

**Free Spins:**

```
Cascade 1: x2 multiplier
Cascade 2: x4 multiplier
Cascade 3: x6 multiplier
Cascade 4+: x10 multiplier (stays at x10)
```

**Current State:**

- Cascade number: 2
- Multiplier: x2 (base game)
- Ready to evaluate grid again

---

### Loop Back to Step 2

The system now returns to Step 2 to evaluate the new grid for wins. If new wins are found, the cascade continues!

**Second Cascade Example:**

```
New Grid (from Step 6):
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:   bonus    wild     fa       bawan    liangsuo
Row 5:   wutong   zhong    bai      wutong   wild
Row 6:   zhong    wutong   bawan    bawan    liangtong
Row 7:   bai      liangsuo zhong    zhong    fa

Evaluation finds:
Symbol "zhong" on:
- Reel 1: row 6
- Reel 2: row 5
- Reel 3: row 7
- Reel 4: row 7

Result: 4-of-a-kind ZHONG
Ways: 1 × 1 × 1 × 1 = 1 way
Paytable: ZHONG 4-of-a-kind = 20x
Cascade: 2 (second cascade)
Multiplier: x2

Win = 20 × 1 × 2 × 5 = 200 credits

Total win so far: 500 + 200 = 700 credits

Process repeats: Remove → Drop → Fill → Advance → Evaluate...
```

---

## Chain Reaction Example

### Complete 3-Cascade Sequence

**Cascade 1:**

- Win: FA 4-of-a-kind, 4 ways
- Multiplier: x1
- Payout: 500 credits
- **Running total: 500**

**Cascade 2:**

- Win: ZHONG 4-of-a-kind, 1 way
- Multiplier: x2
- Payout: 200 credits
- **Running total: 700**

**Cascade 3:**

- Win: WUTONG 3-of-a-kind, 2 ways
- Multiplier: x3
- Payout: 180 credits
- **Running total: 880**

**Cascade 4:**

- No wins found
- **Chain ends**
- **Final payout: 880 credits**

---

## Golden Symbol Behavior During Cascades

### MW1 Specific: Golden is Visual Only

**Rule:** Golden symbols transform to regular after cascade completes.

**Example:**

```
Initial Grid:
Row 4: fa_gold  zhong  bai

After first cascade:
- fa_gold transforms to fa (loses golden glow)
- Only visual change, payout was already calculated
```

**Transformation Timing:**

- Golden symbols participate in win as normal
- After symbols drop and fill
- Before next win evaluation
- All golden variants become regular

---

## When Cascades Stop

### Termination Conditions

**1. No Wins Found**

```
Grid evaluated, no 3+ matching symbols found
→ Cascade sequence ends
→ Multiplier resets to base (x1 or x2)
→ Total win awarded to player
```

**2. Safety Limit Reached**

```
Cascade number reaches 100 (safety cap)
→ Cascade sequence forcibly ends
→ Prevents infinite loops
→ Awards accumulated win
```

**3. Spin Complete**

```
After cascade sequence ends:
→ Balance updated with total win
→ Free spins counter decremented (if in FS)
→ Grid ready for next spin
→ All state reset
```

---

## Multiplier Reset Timing

### Critical Rule: Multiplier Resets Between Spins

**Within a Spin:**

```
Spin starts → Cascade 1 (x1) → Cascade 2 (x2) → Cascade 3 (x3)
```

**Between Spins:**

```
Spin A ends with cascade 5 (x5 multiplier)
New Spin B starts → Cascade 1 (x1 again)

Multiplier does NOT carry over between spins!
```

---

## Animation Timing Considerations

### Recommended Timings

**Win Highlight:**

- Duration: 800-1000ms
- Effect: Gold glow on winning symbols
- Purpose: Let player see what won

**Symbol Removal:**

- Duration: 600-800ms
- Effect: Explosion/burst animation
- Purpose: Satisfying visual feedback

**Symbol Drop:**

- Duration: 400-600ms per "level"
- Effect: Smooth falling motion
- Purpose: Natural gravity feel

**Symbol Fill:**

- Duration: 400-600ms
- Effect: Drop from above
- Purpose: Show new symbols arriving

**Multiplier Update:**

- Duration: 300-500ms
- Effect: Number change with emphasis
- Purpose: Highlight increasing multiplier

**Total per Cascade:**

- Approximately 2.5-3.5 seconds
- Balance between excitement and pacing

---

## Edge Cases & Special Scenarios

### Case 1: Entire Grid Wins

**Scenario:** All symbols on grid form winning combinations

```
Result:
- All symbols removed
- Complete grid refill from reel strips
- Massive ways count
- Continues to next cascade
```

---

### Case 2: Multiple Symbol Types Win

**Scenario:** Symbol A and Symbol B both win

```
Process:
1. Identify ALL winning symbols (both A and B)
2. Calculate payout for A
3. Calculate payout for B
4. Sum both payouts
5. Remove ALL winning symbols at once
6. Drop and fill
7. Continue cascade
```

---

### Case 3: Scatter During Cascade

**Scenario:** Scatter symbols land during a cascade

```
Important:
- Scatter ONLY triggers free spins on INITIAL spin
- Scatters landing during cascades do NOT retrigger
- Exception: During free spins, scatters can retrigger
```

---

### Case 4: Win on Every Cascade

**Theoretical:** Could cascade continue forever?

```
Answer: No
- Reel strips have limited symbol distribution
- Statistical probability makes infinite cascades impossible
- Safety limit (100 cascades) provides hard cap
- In practice, 5-10 cascades is extremely rare
```

---

## Visual Flow Summary

```
┌──────────────────────────────────────────────┐
│   SINGLE CASCADE CYCLE (2-3 seconds)         │
├──────────────────────────────────────────────┤
│                                              │
│  1. Evaluate        [Check for wins]        │
│        ↓                                     │
│  2. Highlight       [Show what won] ✨      │
│        ↓                                     │
│  3. Calculate       [Compute payout]        │
│        ↓                                     │
│  4. Remove          [Symbols explode] 💥    │
│        ↓                                     │
│  5. Drop            [Gravity pulls down] ⬇️  │
│        ↓                                     │
│  6. Fill            [New symbols fall] ⬇️    │
│        ↓                                     │
│  7. Advance         [Multiplier +1]         │
│        ↓                                     │
│  8. Loop back       [Evaluate again]        │
│                                              │
└──────────────────────────────────────────────┘

Continues until no wins found, then:
→ Award total win
→ Reset multiplier
→ Ready for next spin
```

---

## Impact on Player Experience

### Engagement Factors

**1. Anticipation**

- Each cascade could trigger another
- Multiplier climbing creates excitement
- Tension builds with each refill

**2. Chain Reactions**

- Small wins can lead to big payouts
- Multiplier magnifies late-cascade wins
- "One more cascade!" feeling

**3. Visual Satisfaction**

- Symbols exploding and falling
- Multiple wins in single spin
- Multiplier number increasing

**4. Perceived Value**

- More action per spin
- Multiple payout events
- Better entertainment value

---

## Testing Scenarios

### Test 1: Basic Cascade

- Verify symbols remove correctly
- Check drop physics
- Confirm fill from reel strip
- Validate multiplier advancement

### Test 2: Multi-Cascade

- Test 3-5 consecutive cascades
- Verify multiplier progression
- Check total win accumulation
- Confirm proper termination

### Test 3: No Cascade

- Spin with no initial wins
- Verify immediate termination
- Check multiplier stays at base
- Confirm ready for next spin

### Test 4: Maximum Cascades

- Trigger many consecutive cascades
- Verify safety limit (100)
- Check forced termination
- Validate win is awarded

### Test 5: Golden Transformation

- Verify golden symbols in initial spin
- Check participation in wins
- Confirm transformation after cascade
- Validate no gameplay impact

---

## Summary

**The Cascade System:**

- Removes winning symbols after each win
- Drops remaining symbols via gravity
- Fills gaps with new symbols from reel strip
- Re-evaluates for new wins
- Continues until no wins found
- Advances multiplier with each cascade
- Creates exciting chain reaction gameplay

**Result:** More engaging than static spins, with potential for massive multi-cascade wins!
