# Symbol Weights & RTP

## Overview

**Symbol weights** are the foundation of slot machine mathematics. They determine how often each symbol appears on the reels, which directly controls the game's Return to Player (RTP) percentage and volatility profile.

**Key Principle:** Carefully balanced symbol frequencies create predictable, fair, and engaging gameplay.

---

## Understanding Symbol Weights

### What Are Symbol Weights?

**Definition:** The number of times a symbol appears on a reel strip.

**Example:**
```
Reel Strip Length: 100 positions

Symbol Weights for Reel 1:
wild:      2 positions  →  2% chance per spin
fa:        8 positions  →  8% chance per spin
zhong:     10 positions → 10% chance per spin
bawan:     14 positions → 14% chance per spin
liangtong: 18 positions → 18% chance per spin

Total: 100 positions (must equal strip length)
```

---

### Weight Distribution Concept

**Visual Representation:**

```
Reel Strip (100 positions):

[liangtong][fa][liangtong][zhong][bawan][zhong][liangtong]...

Position:  0    1    2         3        4       5      6
Symbol:    ↑    ↑    ↑         ↑        ↑       ↑      ↑
Weight:    18x  8x   18x       10x      14x     10x    18x

More weight = More frequent = Lower value
Less weight = Less frequent = Higher value
```

---

### Why Weights Matter

**RTP Control:**
```
High-value symbols (e.g., FA):
- Low weight (8 positions / 100)
- Appears 8% of time
- High payout (50x for 5-of-a-kind)
- Rare but valuable

Low-value symbols (e.g., LIANGTONG):
- High weight (18 positions / 100)
- Appears 18% of time
- Low payout (6x for 5-of-a-kind)
- Common but less valuable

Balance:
- Frequent small wins (engagement)
- Rare big wins (excitement)
- Combined = Target RTP (96.92%)
```

---

## Symbol Weight Configuration

### Complete Weight Table

**Reel 1 & Reel 5 (Outer Reels):**
```
Symbol       Weight    Percentage
─────────────────────────────────
liangtong      18        18.0%
liangsuo       18        18.0%
wutong         16        16.0%
wusuo          16        16.0%
bawan          14        14.0%
bai            12        12.0%
zhong          10        10.0%
fa              8         8.0%
bonus           3         3.0%
wild            2         2.0%
gold            1         1.0%
─────────────────────────────────
TOTAL         118       118.0%

Note: Needs adjustment to 100 positions
```

**Adjustment Process:**
```
Total weights: 118
Strip length: 100

Need to remove: 18 positions

Strategy:
1. Proportionally reduce most common symbols
2. Or randomly select 18 positions to remove
3. Maintain ratios as closely as possible

Adjusted weights:
liangtong: 18 → 15
liangsuo: 18 → 15
wutong: 16 → 14
wusuo: 16 → 14
bawan: 14 → 12
bai: 12 → 10
zhong: 10 → 8
fa: 8 → 6
bonus: 3 → 3
wild: 2 → 2
gold: 1 → 1

TOTAL: 100 ✓
```

---

**Reels 2, 3, 4 (Middle Reels with Golden Symbols):**
```
Symbol       Weight    Percentage
─────────────────────────────────
liangtong      15        15.0%
liangsuo       15        15.0%
wutong         14        14.0%
wusuo          14        14.0%
bawan          12        12.0%
bai            10        10.0%
zhong           7         7.0%
zhong_gold      1         1.0%
fa              5         5.0%
fa_gold         1         1.0%
bonus           3         3.0%
wild            1         1.0%
wild_gold       1         1.0%
gold            1         1.0%
─────────────────────────────────
TOTAL         100       100.0% ✓

Note: Golden variants split from base symbols
```

**Why Different Weights Per Reel?**
- Outer reels: No golden variants, balanced distribution
- Middle reels: Include golden variants, adjusted weights
- Creates natural symbol distribution variation
- Allows fine-tuning of specific symbol frequencies
- Enables different probability profiles per reel position

---

## Probability Calculations

### Single Symbol Probability

**Formula:**
```
P(Symbol on Reel) = Weight / Strip_Length

Example - FA on Reel 1:
P(FA) = 6 / 100 = 0.06 = 6%
```

---

### Multi-Reel Probability

**Independent Reel Model:**
```
P(Symbol on all reels) = P(Reel1) × P(Reel2) × P(Reel3) × P(Reel4) × P(Reel5)

Example - FA 5-of-a-kind (1 way):
P(FA on R1) = 6/100 = 0.06
P(FA on R2) = 6/100 = 0.06
P(FA on R3) = 6/100 = 0.06
P(FA on R4) = 6/100 = 0.06
P(FA on R5) = 6/100 = 0.06

P(FA 5-oak, 1 way) = 0.06^5
                    = 0.00000777
                    = 1 in 128,600 spins

Very rare!
```

---

### Ways Probability

**Accounting for Multiple Positions:**

```
For symbols appearing in multiple rows:

Expected Ways = Π (Weight_i / Strip_Length × Rows)

Where:
Π = Product operator
Rows = 4 (visible rows per reel)

Example - High frequency symbol (LIANGTONG):
R1: 15/100 × 4 = 0.60 positions on average
R2: 15/100 × 4 = 0.60
R3: 15/100 × 4 = 0.60
R4: 15/100 × 4 = 0.60
R5: 15/100 × 4 = 0.60

Expected ways for 5-oak ≈ 0.60^5 = 0.0778
Probability ≈ 7.78%

But need AT LEAST 1 on each reel, so:
Actual probability is lower (binomial distribution)
```

---

### Win Frequency Calculation

**Overall Win Probability:**

```
P(Win) = P(Any symbol forms 3+ match)

Approximation:
For each symbol:
  P(Symbol 3-oak) +
  P(Symbol 4-oak) +
  P(Symbol 5-oak)

Sum across all symbols
Subtract overlaps (complex combinatorics)

Target Win Frequency: ~25-35% of spins
(Varies by game, tested via simulation)
```

**Our Target:**
```
Base Game:
- ~30% spins have at least one win
- Average win: 8-12x bet
- Volatility: High

Free Spins:
- ~35% spins have at least one win
- Average win: 15-25x bet (enhanced multipliers)
- Volatility: Very High
```

---

## RTP Contribution by Symbol

### RTP Formula Breakdown

**For Each Symbol:**
```
RTP_Symbol = Σ (P(match) × Payout × Expected_Ways × Multiplier)

Where:
P(match) = Probability of forming that match length
Payout = Paytable value for that match
Expected_Ways = Average ways count for that match
Multiplier = Expected cascade multiplier
```

---

### Example: FA Symbol RTP Contribution

**FA Paytable:**
```
3-of-a-kind: 10x
4-of-a-kind: 25x
5-of-a-kind: 50x
```

**Probability Estimates (simplified):**
```
P(FA 3-oak) ≈ 0.05 (5%)
P(FA 4-oak) ≈ 0.01 (1%)
P(FA 5-oak) ≈ 0.0005 (0.05%)
```

**Expected Ways (simplified):**
```
FA 3-oak: ~2 ways average
FA 4-oak: ~1.5 ways average
FA 5-oak: ~1 way average
```

**Expected Multiplier:**
```
Base game average: 1.44x
(From multiplier progression analysis)
```

**Calculation:**
```
RTP(FA 3-oak) = 0.05 × 10 × 2 × 1.44 = 1.44%
RTP(FA 4-oak) = 0.01 × 25 × 1.5 × 1.44 = 0.54%
RTP(FA 5-oak) = 0.0005 × 50 × 1 × 1.44 = 0.036%

RTP(FA Total) ≈ 2.02%

FA contributes ~2% to total RTP
```

---

### RTP Distribution Across Symbols

**Estimated Breakdown:**

```
Symbol Category    RTP Contribution
──────────────────────────────────
High symbols:
  fa                   2.0%
  zhong                3.5%
  bai                  4.2%
  Subtotal:            9.7%

Medium symbols:
  bawan                6.8%
  wusuo                7.5%
  wutong               7.5%
  Subtotal:           21.8%

Low symbols:
  liangsuo             9.2%
  liangtong           10.5%
  Subtotal:           19.7%

Special symbols:
  wild                 5.0%
  bonus (scatter)      1.5%
  Subtotal:            6.5%

Cascades:
  Multiplier boost    15.0%

Free Spins:
  Feature value       24.0%
──────────────────────────────────
TOTAL RTP:          ~96.7%

Target: 96.92%
Adjustment needed: +0.22%
```

**Note:** These are approximations. Exact values determined by simulation.

---

## Balancing Volatility

### Volatility Concept

**Definition:** How much variance exists in win amounts.

**Low Volatility:**
```
Characteristics:
- Frequent small wins
- Rare big wins
- Steady gameplay
- Lower bankroll swings
- Appeals to casual players

Symbol Weight Strategy:
- Higher weights for all symbols
- More balanced paytable
- Lower max payouts
```

**High Volatility (Our Game):**
```
Characteristics:
- Infrequent wins
- Potential for huge wins
- Dramatic gameplay
- Large bankroll swings
- Appeals to thrill-seekers

Symbol Weight Strategy:
- Lower weights for high-value symbols
- Extreme paytable spread (1x to 50x)
- High max payout (25,000x bet)
- Cascade multiplier amplification
```

---

### Volatility Index

**Mathematical Measure:**

```
Volatility = Standard Deviation of Win Distribution

Calculation:
1. Simulate 1,000,000 spins
2. Record win amount for each spin
3. Calculate standard deviation

Example Results:
Mean Win: 96.92 credits (per 100 bet)
Std Dev: 450 credits

Volatility Index = 450 / 96.92 ≈ 4.64

Interpretation:
<2.0 = Low volatility
2.0-4.0 = Medium volatility
>4.0 = High volatility

Our game: HIGH volatility ✓
```

---

### Tuning Volatility

**Increase Volatility:**
```
Methods:
1. Reduce high-symbol weights
   - Makes big wins rarer
   - Increases payout when they hit

2. Increase paytable spread
   - Bigger difference between low/high symbols
   - 5-oak pays much more than 3-oak

3. Enhance multiplier progression
   - x5 → x10 cap increase
   - More dramatic cascade rewards

4. Add max win cap
   - 25,000x ceiling
   - Enables huge potential wins
```

**Decrease Volatility:**
```
Methods:
1. Increase high-symbol weights
   - More frequent big symbols
   - Steadier returns

2. Compress paytable
   - Reduce spread (e.g., 1x to 20x instead of 1x to 50x)
   - More uniform payouts

3. Reduce multiplier progression
   - x3 cap instead of x5
   - Less amplification

4. Lower max win cap
   - 5,000x instead of 25,000x
   - Smaller win ceiling
```

---

## Tuning for Target RTP

### Simulation-Based Tuning

**Process:**

```
┌─────────────────────────────────────────┐
│ 1. INITIAL CONFIGURATION                │
│    Set symbol weights (educated guess)  │
│    Define paytable                      │
│    Configure multipliers                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. RUN SIMULATION                       │
│    Simulate 10,000,000+ spins           │
│    Track wagered & returned             │
│    Calculate RTP                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. ANALYZE RESULTS                      │
│    RTP = (Returned / Wagered) × 100    │
│    Compare to target (96.92%)           │
│    Identify discrepancy                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. ADJUST WEIGHTS                       │
│    If RTP too high: Reduce high symbols │
│    If RTP too low: Increase high symbols│
│    Make small incremental changes       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 5. ITERATE                              │
│    Repeat steps 2-4 until convergence   │
│    Target: 96.92% ± 0.5%               │
│    Usually takes 5-15 iterations        │
└─────────────────────────────────────────┘
```

---

### Adjustment Examples

**Scenario 1: RTP Too High**
```
Simulation Result: 97.5% RTP
Target: 96.92%
Difference: +0.58% (too high)

Analysis:
- High symbols appearing too often
- OR paytable too generous

Adjustment Strategy:
Option A: Reduce high-symbol weights
  fa: 6 → 5 positions
  zhong: 8 → 7 positions
  bai: 10 → 9 positions

Option B: Adjust paytable
  fa 5-oak: 50x → 48x
  zhong 5-oak: 40x → 38x

Retest:
Run simulation with new weights
Expected result: Closer to 96.92%
```

**Scenario 2: RTP Too Low**
```
Simulation Result: 96.2% RTP
Target: 96.92%
Difference: -0.72% (too low)

Analysis:
- High symbols too rare
- OR paytable not generous enough
- OR cascade multipliers underperforming

Adjustment Strategy:
Option A: Increase high-symbol weights
  fa: 6 → 7 positions
  zhong: 8 → 9 positions

Option B: Increase paytable values
  fa 4-oak: 25x → 27x
  zhong 4-oak: 20x → 22x

Option C: Adjust multiplier progression
  Cascade 4: x5 → x6

Retest and iterate
```

---

### Fine-Tuning Process

**Iteration Example:**

```
Round 1:
RTP: 95.8% → Too low
Action: Increase fa weight (6→7), zhong weight (8→9)

Round 2:
RTP: 96.5% → Getting closer
Action: Increase bai weight (10→11)

Round 3:
RTP: 96.85% → Very close
Action: Slight paytable adjustment (fa 5-oak: 50→51)

Round 4:
RTP: 96.93% → Within tolerance!
Action: ACCEPT configuration ✓

Final Configuration:
fa: 7 positions
zhong: 9 positions
bai: 11 positions
fa 5-oak: 51x
Target achieved: 96.93% ≈ 96.92% ± 0.5%
```

---

## Validation Requirements

### Simulation Standards

**Minimum Requirements:**

```
Spin Count: 10,000,000 minimum
  - More is better (100M+ ideal)
  - Convergence improves with volume

Confidence Interval: 95%
  - RTP ± 0.5% with 95% confidence
  - Statistical significance required

Seed Variation:
  - Run with multiple random seeds
  - Verify consistency across seeds
  - No single seed dependency

Configuration Freeze:
  - Lock configuration after acceptance
  - Version control all settings
  - Document final weights
```

---

### Statistical Tests

**Test 1: RTP Convergence**
```
Measure RTP at intervals:
- After 100K spins
- After 1M spins
- After 10M spins
- After 100M spins

Expected:
RTP should converge toward target
Variance should decrease with volume

Example:
100K: 97.2% ± 2.5%
1M: 96.8% ± 0.8%
10M: 96.91% ± 0.25%
100M: 96.92% ± 0.08% ✓
```

**Test 2: Symbol Frequency Verification**
```
Count actual symbol appearances
Compare to configured weights

Example - FA (weight 7 / 100):
Expected: 7% of reel 1 positions
Actual: 7.02% after 10M spins ✓

Tolerance: ± 2%
All symbols must be within tolerance
```

**Test 3: Win Distribution Analysis**
```
Analyze win amount distribution:

Bucket wins:
0x: 70% (no win)
0.1x-1x: 15%
1x-10x: 10%
10x-100x: 4%
100x-1000x: 0.9%
1000x+: 0.1%

Verify matches expected distribution
High volatility = long tail distribution
```

**Test 4: Maximum Win Occurrence**
```
Track maximum wins:

After 10M spins:
- Highest single spin: 15,432x bet
- Number of 1000x+ wins: 523
- Number at max cap (25,000x): 0

Verify:
- Max win is achievable (not impossible)
- Not too common (maintains rarity)
- Distribution makes sense
```

---

## Cascade Impact on RTP

### Multiplier RTP Boost

**Cascade Contribution:**

```
Without cascades/multipliers:
Base RTP: ~80-85%

With cascades/multipliers:
Enhanced RTP: 96.92%

Cascade adds: ~12-17% to RTP

How?
1. Wins trigger cascades
2. Cascades can trigger more wins
3. Multipliers amplify later cascade wins
4. Chain reactions increase total payout

Expected cascade multiplier: 1.44x (base game)
Expected cascade multiplier: 2.88x (free spins)
```

---

### Cascade Probability

**Cascade Frequency:**

```
Based on simulation:

Spins with 0 cascades: ~70%
Spins with 1 cascade: ~20%
Spins with 2 cascades: ~7%
Spins with 3 cascades: ~2.5%
Spins with 4+ cascades: ~0.5%

Average cascades per spin: ~0.4

Winning spins only:
Average cascades per winning spin: ~1.3
```

---

## Free Spins Impact on RTP

### Feature RTP Contribution

**Free Spins Value:**

```
Free spins contribute: ~24% of total RTP

Breakdown:
- Trigger frequency: ~1 in 100 spins
- Average free spins awarded: 13
- Average free spins win: 60x bet
- Enhanced multipliers: 2x base game
- Retrigger potential: +15% value

RTP calculation:
(1/100) × 13 spins × Enhanced_Multiplier × Base_RTP
≈ 24% contribution

Critical for achieving 96.92% target!
```

---

### Scatter Weight Importance

**Balancing Scatter Frequency:**

```
Scatter weight: 3 positions / 100 per reel

Probability of 3+ scatters:
≈ 1 in 100 spins (approximate)

Too High (e.g., 5 positions):
- Triggers every ~50 spins
- RTP exceeds target
- Feature loses "special" feeling

Too Low (e.g., 1 position):
- Triggers every ~500 spins
- Long dry spells
- Player frustration
- RTP below target

Sweet Spot (3 positions):
- ~1 in 100 trigger rate
- Balanced RTP contribution
- Exciting when triggered
- Maintains engagement
```

---

## Version Control & Documentation

### Configuration Versioning

**Track All Changes:**

```json
{
  "config_version": "1.0",
  "created_date": "2025-11-17",
  "rtp_target": 96.92,
  "rtp_actual": 96.93,
  "simulation_spins": 50000000,

  "reel_weights": {
    "reel_1": {
      "fa": 7,
      "zhong": 9,
      "bai": 11,
      "bawan": 12,
      "wusuo": 14,
      "wutong": 14,
      "liangsuo": 15,
      "liangtong": 15,
      "bonus": 3,
      "wild": 2,
      "gold": 1
    },
    // ... reels 2-5
  },

  "paytable": { /* ... */ },
  "multipliers": { /* ... */ },

  "validation": {
    "simulation_date": "2025-11-17",
    "seed_count": 10,
    "confidence_interval": 0.95,
    "rtp_variance": 0.08,
    "approved_by": "math_team",
    "certificate_number": "GLI-2025-XXXXX"
  }
}
```

---

### Change Log

**Document All Adjustments:**

```
Version 0.1 (Initial):
- RTP: 95.8%
- Issue: Too low
- Change: Increased high symbol weights

Version 0.2:
- RTP: 96.5%
- Issue: Still slightly low
- Change: Adjusted paytable values

Version 0.3:
- RTP: 96.85%
- Issue: Close but not quite
- Change: Fine-tuned bai weight

Version 1.0 (FINAL):
- RTP: 96.93%
- Status: APPROVED ✓
- Certificate: GLI-2025-XXXXX
- Locked for production
```

---

## Common Pitfalls

### Mistake 1: Insufficient Simulation

**Problem:**
```
Running only 100,000 spins
RTP: 94.5%

Conclusion: "RTP is broken!"

Reality:
100K spins is too few
High volatility = high variance
Need 10M+ spins for convergence
```

**Solution:**
```
Run 10,000,000+ spins minimum
Track RTP convergence over time
Use multiple random seeds
Wait for statistical significance
```

---

### Mistake 2: Ignoring Cascade Impact

**Problem:**
```
Setting weights based only on initial symbol appearance
Forgetting cascades create new symbols
RTP calculation missing cascade contribution
```

**Solution:**
```
Account for cascade mechanics in simulation
Track multi-cascade scenarios
Include multiplier progression
Measure actual gameplay, not just first grid
```

---

### Mistake 3: Paytable Over-Tuning

**Problem:**
```
Making constant paytable adjustments
Changes become fractional (50.123x)
Difficult for players to understand
```

**Solution:**
```
Use whole numbers in paytable
Adjust weights instead of payouts
Keep paytable clean and simple
Player-friendly values (10x, 25x, 50x)
```

---

### Mistake 4: Not Version Controlling

**Problem:**
```
Making changes without documentation
Can't reproduce previous configurations
Audit trail missing
Regulatory non-compliance
```

**Solution:**
```
Version every configuration change
Document reasons for adjustments
Maintain complete change log
Store in version control system
```

---

## Summary

**Symbol Weights Fundamentals:**
- Control how often symbols appear (frequency)
- Directly impact RTP and volatility
- Different weights per reel allowed
- Must sum to strip length (typically 100)

**RTP Calculation:**
- Sum of all symbol contributions
- Includes cascade multiplier boost (~12-17%)
- Includes free spins feature value (~24%)
- Requires 10M+ spin simulation for accuracy
- Target: 96.92% ± 0.5%

**Volatility Control:**
- High volatility: Low weights for high symbols
- Extreme paytable spread (1x to 50x)
- Cascade amplification
- Max win potential (25,000x)

**Tuning Process:**
1. Initial configuration (educated guess)
2. Simulate 10M+ spins
3. Measure RTP
4. Adjust weights incrementally
5. Iterate until target achieved
6. Validate with statistical tests
7. Version and document
8. Certify with testing lab

**Validation:**
- Statistical randomness tests
- RTP convergence verification
- Symbol frequency confirmation
- Win distribution analysis
- Third-party certification

**Result:** Mathematically balanced, provably fair, and engaging gameplay that delivers consistent long-term returns while maintaining exciting volatility!
