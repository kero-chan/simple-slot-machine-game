# Reel Strip Architecture

## The Virtual Tape Concept

A **reel strip** is like a circular tape of symbols that represents one reel. Think of it as a physical slot machine reel that has been "unrolled" into a sequence of symbols.

**Key Insight:** The strip is **predefined** and **unchanging** - it's not randomly generated each spin. Instead, we randomly choose WHERE to start reading from the strip.

---

## Visual Concept

### Physical Slot Machine Analogy

```
Traditional Physical Reel:
    ┌─────────┐
    │    A    │
    │    B    │ ← Symbols painted on a cylinder
    │    C    │
    │    A    │
    └─────────┘
     (spins physically)
```

### Virtual Reel Strip

```
Unrolled Circular Tape (100 positions):

Position: 0    1    2    3    4    5    ... 98   99   0 (wraps)
Symbol:  [A]  [B]  [C]  [A]  [B]  [D]  ... [A]  [B]  [A]
          ↑                                           ↑
          └───────────────────────────────────────────┘
          Connects back (circular)
```

**Random Element:** We pick a random starting position (e.g., 47), then read forward.

---

## Why Reel Strips Are Essential

### 1. RTP Control

**Problem without strips:**
If symbols were purely random each spin, RTP would fluctuate wildly and be unpredictable.

**Solution with strips:**
By controlling the frequency of each symbol on the strip, we mathematically determine:
- How often each symbol appears
- Probability of wins
- Long-term payout percentage

**Example:**
```
Strip of 100 positions:
- FA: 8 positions → 8% chance per position
- WILD: 2 positions → 2% chance per position
- LIANGTONG: 20 positions → 20% chance per position

Over millions of spins, these exact percentages hold.
→ Predictable RTP
```

---

### 2. Cascade Continuity

**Problem without strips:**
During cascades, where do new symbols come from?

**Solution with strips:**
New symbols are read from the strip at positions "above" the original starting point.

**Example:**
```
Original spin starts at position 50
Reads positions: 50, 51, 52, 53, 54...

After cascade removes symbols, need new ones
Read from "above": 49, 48, 47...

This ensures:
✓ Cascades use same symbol distribution
✓ RTP remains consistent
✓ Symbols are reproducible/auditable
```

---

### 3. Provably Fair Gaming

**Requirement:**
Gaming regulations require that spins be reproducible for auditing.

**How strips enable this:**
```
Spin ID: ABC-123
Reel Positions: [47, 23, 89, 12, 56]
Reel Strips: Version 1.0

With this information:
→ Can recreate exact spin result
→ Can verify payout was correct
→ Auditors can validate fairness
```

---

## Reel Strip Structure

### Composition

Each reel strip contains:
- **Fixed length** (typically 100-120 positions)
- **Symbol distribution** based on weights
- **Circular structure** (position 99 wraps to position 0)

**Example Strip (Reel 1, 100 positions):**
```
Position: Symbol
0:  liangtong
1:  fa
2:  wutong
3:  zhong
4:  liangsuo
5:  bawan
6:  wusuo
7:  liangtong
8:  fa
9:  bai
10: wutong
11: zhong
12: bonus        ← Scatter
13: liangsuo
14: bawan
15: wusuo
16: liangtong
17: wild         ← Wild
18: fa
... continues to position 99
```

---

### Symbol Weight Distribution

**Configuration Example:**
```
Reel 1 Symbol Weights (Total = 100 positions):
wild:      2 positions  (2%)
bonus:     3 positions  (3%)
gold:      1 position   (1%)
fa:        8 positions  (8%)
zhong:     10 positions (10%)
bai:       12 positions (12%)
bawan:     14 positions (14%)
wusuo:     16 positions (16%)
wutong:    16 positions (16%)
liangsuo:  18 positions (18%)
liangtong: 18 positions (18%)

Total: 118 positions → Need to trim or fill to 100
```

**Adjustment:**
- If total > strip length: Sample/remove some symbols
- If total < strip length: Repeat some low-value symbols

---

## Reading from Reel Strips

### Initial Spin Process

**Step 1: Select Random Starting Position**
```
Strip Length: 100
Random Position: 47 (generated using crypto/rand)
```

**Step 2: Read Symbols Forward**
```
Need: 10 symbols (4 visible + 6 buffer rows)

Read from strip:
Position 47: "liangtong"
Position 48: "fa"
Position 49: "wutong"
Position 50: "zhong"
Position 51: "liangsuo"  ← Visible rows start
Position 52: "bawan"
Position 53: "wusuo"
Position 54: "liangtong"  ← Visible rows end
Position 55: "wild"
Position 56: "fa"
```

**Step 3: Populate Grid Column**
```
Column for Reel 1:
Row 0: "liangtong" (buffer)
Row 1: "fa"        (buffer)
Row 2: "wutong"    (buffer)
Row 3: "zhong"     (buffer)
Row 4: "liangsuo"  ← Visible
Row 5: "bawan"     ← Visible
Row 6: "wusuo"     ← Visible
Row 7: "liangtong" ← Visible
Row 8: "wild"      (buffer)
Row 9: "fa"        (buffer)
```

---

### Wrapping Around (Circular)

**What if reading goes past the end?**

```
Strip Length: 100
Starting Position: 95

Read 10 symbols:
Position 95: "zhong"
Position 96: "fa"
Position 97: "bai"
Position 98: "wutong"
Position 99: "liangsuo"
Position 0:  "liangtong"  ← Wrapped to start
Position 1:  "fa"
Position 2:  "wutong"
Position 3:  "zhong"
Position 4:  "liangsuo"

The strip is circular - no beginning or end!
```

---

## Cascade Reading Behavior

### Reading "Above" the Starting Position

When cascades occur and new symbols are needed, we read **backward** from the original starting position (simulating symbols "above" falling down).

**Concept:**
```
Original spin started at position 50
After cascade, need 2 new symbols

Read backward:
Position 49: "wutong"
Position 48: "fa"

These become the new symbols that "drop from above"
```

---

### Complete Cascade Example

**Initial State:**
```
Starting Position: 50
Grid filled with positions 50-59

Visible rows (positions 54-57):
Row 4: "liangtong" (pos 54)
Row 5: "wild"      (pos 55)
Row 6: "fa"        (pos 56)
Row 7: "bawan"     (pos 57)
```

**Cascade 1: Win on Rows 5-6**
```
Remove symbols at rows 5 and 6
Need to fill 2 empty positions

Read backward from original start (50):
Position 49: "wutong"
Position 48: "fa"

After drop and fill:
Row 4: "fa"        ← NEW from pos 48
Row 5: "wutong"    ← NEW from pos 49
Row 6: "liangtong" ← Dropped from row 4
Row 7: "bawan"     ← Stayed at bottom
```

**Cascade 2: Win on Row 6**
```
Remove symbol at row 6
Need to fill 1 empty position

Read backward from 48 (current top):
Position 47: "liangtong"

After drop and fill:
Row 4: "liangtong" ← NEW from pos 47
Row 5: "fa"        ← Dropped from row 4
Row 6: "wutong"    ← Dropped from row 5
Row 7: "bawan"     ← Stayed at bottom
```

**Pattern:**
Each cascade reads further "up" the reel strip, simulating a continuous stream of symbols falling from above.

---

## Different Strips Per Reel

### Why 5 Different Strips?

**Each reel has unique characteristics:**

**Reel 1 & 5 (Outer Reels):**
- No golden symbol variants
- Balanced symbol distribution
- Slightly higher low-value symbols

**Reels 2, 3, 4 (Middle Reels):**
- Can include golden variants (fa_gold, wild_gold, etc.)
- Adjusted distribution to account for golden versions
- Similar but not identical to outer reels

---

### Configuration Comparison

**Reel 1 (No Golden Symbols):**
```
wild:      2 positions
bonus:     3 positions
gold:      1 position
fa:        8 positions
zhong:     10 positions
... (all regular symbols)
```

**Reel 2 (With Golden Symbols):**
```
wild:       2 positions  (regular)
wild_gold:  1 position   (golden variant)
bonus:      3 positions
gold:       1 position
fa:         7 positions  (regular)
fa_gold:    1 position   (golden variant)
zhong:      8 positions  (regular)
zhong_gold: 1 position   (golden variant)
... (mix of regular and golden)
```

**Why different?**
- Golden symbols are cosmetic in MW1
- Still need to maintain same total symbol counts
- Ensures RTP remains balanced across all reels

---

## Strip Generation Process

### How Strips Are Created (Conceptual)

**Step 1: Define Weights**
```
Configuration specifies how many of each symbol:
fa: 8
zhong: 10
bai: 12
...
```

**Step 2: Create Symbol Pool**
```
Add symbols to pool based on weights:
[fa, fa, fa, fa, fa, fa, fa, fa,    ← 8 fa
 zhong, zhong, zhong, zhong, ...,   ← 10 zhong
 bai, bai, bai, ...,                ← 12 bai
 ...]
```

**Step 3: Shuffle**
```
Randomly shuffle the pool using cryptographic shuffle
[zhong, fa, bai, wutong, fa, zhong, ...]
```

**Step 4: Fill to Length**
```
If pool < 100: Add more low-value symbols
If pool > 100: Remove some symbols (proportionally)
Final length: Exactly 100 positions
```

**Step 5: Store**
```
Save to database with version number
This strip is now used for all spins
```

---

## Strip Versioning

### Why Version Strips?

**Configuration Changes:**
When paytable or RTP is adjusted, strips must be regenerated.

**Version Tracking:**
```
Version 1.0: Initial launch (RTP 96.92%)
Version 1.1: Adjusted fa symbol frequency (RTP 96.95%)
Version 2.0: Major rebalance (RTP 96.92% with different volatility)
```

**Usage:**
- Each spin logs which strip version was used
- Allows auditing historical spins
- Enables A/B testing different configurations

---

## Validation & Testing

### Strip Validation Checks

**1. Length Verification**
```
Check: All 5 strips have exactly 100 positions
Verify: No missing or extra positions
```

**2. Symbol Distribution**
```
Count each symbol type
Verify matches configured weights
Check percentages are within tolerance
```

**3. Special Symbol Limits**
```
Verify scatter count allows ~3-5% trigger rate
Check wild frequency supports desired hit rate
Confirm golden only on reels 2-4
```

**4. No Impossible Patterns**
```
Check for accidental symbol clusters
Verify no long stretches of same symbol
Ensure randomness in shuffle
```

---

### RTP Simulation

**Purpose:** Verify strips produce target RTP

**Process:**
```
1. Load all 5 reel strips
2. Run 10,000,000 simulated spins
3. For each spin:
   - Generate random positions
   - Read from strips
   - Calculate wins
   - Apply cascade logic
   - Track total wagered & returned
4. Calculate: (Total Returned / Total Wagered) × 100
5. Verify: Result is 96.92% ± 0.5%
```

**If RTP is off:**
- Adjust symbol weights
- Regenerate strips
- Test again
- Repeat until target achieved

---

## Visual Summary

```
┌────────────────────────────────────────────────┐
│         REEL STRIP SYSTEM                      │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  Reel Strip (Circular Tape)          │     │
│  │                                      │     │
│  │  [0][1][2][3]...[97][98][99]        │     │
│  │   ↑                        ↑         │     │
│  │   └────────connects────────┘         │     │
│  │                                      │     │
│  │  Random Start Position: 47          │     │
│  │                                      │     │
│  │  Read Forward:                      │     │
│  │  47→48→49→50→51...                  │     │
│  │                                      │     │
│  │  Read Backward (cascades):          │     │
│  │  46←45←44←43...                     │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  Benefits:                                     │
│  ✓ Predictable RTP                            │
│  ✓ Cascade continuity                         │
│  ✓ Provably fair                              │
│  ✓ Auditable outcomes                         │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Edge Cases

### Case 1: Strip Exhaustion During Cascades

**Question:** What if cascades read through entire strip?

**Answer:**
```
Strip length: 100
If 100+ cascades occur, wrapping happens:
Position 0 → 99 → 98 → ... → 0 (wraps)

Practically impossible due to:
- Win probability decreases
- Safety limit at 100 cascades
- Statistical unlikelihood
```

---

### Case 2: Identical Consecutive Symbols

**Question:** Can strip have same symbol twice in a row?

**Answer:**
```
Yes, this is allowed:
Position 45: "fa"
Position 46: "fa"
Position 47: "zhong"

This creates natural clustering
Affects ways count (can increase ways)
Still maintains RTP through overall distribution
```

---

### Case 3: Strip Update During Play

**Question:** What if strip configuration changes while players are active?

**Answer:**
```
Never change strips mid-session!

Safe Update Process:
1. Schedule maintenance window
2. Notify players
3. Complete all active spins with old strips
4. Update strips in database
5. New spins use new strips
6. Log strip version change for auditing
```

---

## Summary

**Reel Strips Are:**
- Predefined sequences of symbols (typically 100 positions)
- Circular/endless (position 99 wraps to position 0)
- Different for each of the 5 reels
- Used for both initial spins and cascade fills
- Essential for RTP control and fairness

**How They Work:**
- Random starting position selected each spin
- Symbols read forward from that position
- Cascades read backward (simulating "above")
- Same distribution ensures consistent RTP
- Auditable and reproducible

**Why They Matter:**
- Mathematical RTP control
- Provably fair gaming
- Cascade continuity
- Regulatory compliance
- Reproducible outcomes

**Result:** Fair, auditable, and mathematically precise gameplay!
