# Multiplier Progression

## Overview

The **multiplier system** is what makes cascades increasingly valuable. Each successful cascade increases the multiplier, amplifying wins exponentially.

**Key Principle:** Cascades become more rewarding the longer they continue.

---

## Base Game Multipliers

### Progression Table

| Cascade Number | Multiplier | Increase from Previous |
|----------------|------------|----------------------|
| 1st cascade | **x1** | Base (no multiplier) |
| 2nd cascade | **x2** | +100% |
| 3rd cascade | **x3** | +50% |
| 4th cascade | **x5** | +67% |
| 5th+ cascades | **x5** | Stays at x5 |

**Pattern:** 1 → 2 → 3 → 5 → 5 → 5...

---

### Visual Representation

```
Cascade Sequence:

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Cascade 1│────>│Cascade 2│────>│Cascade 3│────>│Cascade 4│────>│Cascade 5│
│  x1     │     │  x2     │     │  x3     │     │  x5     │     │  x5     │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
   100%           200%            300%            500%            500%
```

**Plateau:** Multiplier caps at x5 and remains there for all subsequent cascades.

---

## Free Spins Multipliers (Enhanced)

### Progression Table

| Cascade Number | Multiplier | Increase from Base Game |
|----------------|------------|------------------------|
| 1st cascade | **x2** | +100% (vs x1 in base) |
| 2nd cascade | **x4** | +100% (vs x2 in base) |
| 3rd cascade | **x6** | +100% (vs x3 in base) |
| 4th+ cascades | **x10** | +100% (vs x5 in base) |

**Pattern:** 2 → 4 → 6 → 10 → 10 → 10...

**Enhancement:** DOUBLED at every stage compared to base game!

---

### Comparison Chart

```
Cascade #    Base Game    Free Spins    Advantage
────────────────────────────────────────────────
    1           x1           x2          2x better
    2           x2           x4          2x better
    3           x3           x6          2x better
    4+          x5           x10         2x better
────────────────────────────────────────────────

Free spins multipliers are EXACTLY DOUBLE base game!
```

---

## How Multipliers Apply

### Application in Win Calculation

**Formula:**
```
Win = Symbol_Payout × Ways_Count × Multiplier × Bet_Per_Way
```

**Example:**
```
Symbol: FA (4-of-a-kind)
Paytable Payout: 25x
Ways Count: 4 ways
Cascade Number: 3 (third cascade)
Multiplier: x3 (base game)
Bet Per Way: 5 credits

Calculation:
Win = 25 × 4 × 3 × 5
    = 25 × 4 × 15
    = 1,500 credits

Same win in cascade 1 would be:
Win = 25 × 4 × 1 × 5 = 500 credits

3x more valuable!
```

---

## Multiplier Lifecycle

### When Multiplier Increases

**Trigger:** After symbols are removed and new ones fill in

```
Cascade Flow:
1. Evaluate grid → Find wins
2. Calculate payout with CURRENT multiplier
3. Remove winning symbols
4. Drop and fill symbols
5. INCREMENT multiplier ← Happens here
6. Evaluate grid again with NEW multiplier
```

**Important:** Win is calculated BEFORE multiplier increases for next cascade.

---

### When Multiplier Resets

**Reset Conditions:**

**1. No Wins Found**
```
Cascade evaluates, no winning combinations
→ Cascade sequence ends
→ Multiplier resets to base (x1 or x2)
```

**2. Spin Completes**
```
All cascades finished
→ Total win awarded
→ Multiplier resets to x1 (base game) or x2 (free spins)
```

**3. Between Spins**
```
Spin A ends with 5 cascades (multiplier at x5)
New Spin B starts
→ Multiplier resets to x1
→ Does NOT carry over between spins!
```

---

## Impact on Payouts

### Progressive Value Increase

**Scenario:** Same win on different cascades

```
Symbol: ZHONG 3-of-a-kind
Payout: 8x
Ways: 2 ways
Bet per way: 5 credits

Cascade 1 (x1): 8 × 2 × 1 × 5 = 80 credits
Cascade 2 (x2): 8 × 2 × 2 × 5 = 160 credits
Cascade 3 (x3): 8 × 2 × 3 × 5 = 240 credits
Cascade 4 (x5): 8 × 2 × 5 × 5 = 400 credits

Same win worth 5x more on cascade 4!
```

---

### Free Spins Advantage

**Same scenario in free spins:**

```
Cascade 1 (x2): 8 × 2 × 2 × 5 = 160 credits
Cascade 2 (x4): 8 × 2 × 4 × 5 = 320 credits
Cascade 3 (x6): 8 × 2 × 6 × 5 = 480 credits
Cascade 4 (x10): 8 × 2 × 10 × 5 = 800 credits

10x more valuable than base game cascade 1!
```

---

## Maximum Win Scenarios

### Theoretical Maximum

**Best Case:**
- 5-of-a-kind highest symbol (FA: 50x)
- Maximum ways (1,024)
- Maximum multiplier (x10 in free spins)
- Large bet (100 credits, 5 per way)

```
Win = 50 × 1,024 × 10 × 5
    = 2,560,000 credits

However:
Maximum win cap = 25,000x total bet
= 25,000 × 100 = 2,500,000 credits

Win capped at 2,500,000 credits
```

---

## RTP Contribution

### Expected Multiplier Value

**Base Game Average:**

Assuming cascade distribution:
- 70% of winning spins: 1 cascade only
- 20% of winning spins: 2 cascades
- 8% of winning spins: 3 cascades
- 2% of winning spins: 4+ cascades

```
Expected Multiplier = (0.70 × 1) + (0.20 × 2) + (0.08 × 3) + (0.02 × 5)
                    = 0.70 + 0.40 + 0.24 + 0.10
                    = 1.44x average

Multipliers add ~44% to base game returns
```

**Free Spins Average:**
```
Expected Multiplier = (0.70 × 2) + (0.20 × 4) + (0.08 × 6) + (0.02 × 10)
                    = 1.40 + 0.80 + 0.48 + 0.20
                    = 2.88x average

Multipliers add ~188% to free spins returns
```

---

## Strategic Implications

### Player Perspective

**Why Long Cascades Are Exciting:**
- Each cascade increases next win value
- "Just one more cascade!" anticipation
- Exponential growth potential
- Massive wins possible on later cascades

**Risk/Reward:**
- Early cascades: Lower multiplier but more common
- Late cascades: Higher multiplier but less common
- Balance creates engaging volatility

---

### Game Design Perspective

**Balancing Multipliers:**

**Too High:**
- RTP exceeds target
- Volatility becomes extreme
- Large bankroll swings

**Too Low:**
- Cascades feel unrewarding
- Less player engagement
- Reduced excitement

**Sweet Spot:**
- x1 → x2 → x3 → x5 (base game)
- Provides meaningful progression
- Caps at reasonable maximum
- Enhances but doesn't dominate gameplay

---

## Visual Indicators

### Player Communication

**UI Elements:**

**Multiplier Display:**
```
┌──────────────────────┐
│   Current Cascade    │
│        x3            │  ← Large, prominent
│   ──────────────     │
│   Next: x5           │  ← Show what's coming
└──────────────────────┘
```

**Progression Bar:**
```
Cascades: [x1]──>[x2]──>[x3]──>[x5]
          [✓]   [✓]   [●]   [ ]

● = Current position
✓ = Completed
[ ] = Not yet reached
```

**Multiplier Change Animation:**
```
Frame 1: x2
Frame 2: x2 → x3 (transition)
Frame 3: x3 (emphasized, pulse effect)

Effect: Makes progression clear and exciting
```

---

## Edge Cases

### Case 1: Win with Ways = 0

**Question:** Can multiplier apply if no ways?

**Answer:**
```
No ways = No win
Multiplier not applied
Formula requires Ways_Count > 0
```

---

### Case 2: Multiple Symbols Win

**Question:** Does same multiplier apply to all wins in a cascade?

**Answer:**
```
Yes!

Example:
Cascade 3 (x3 multiplier)
Symbol A wins: Payout × x3
Symbol B wins: Payout × x3

ALL wins in that cascade use x3
```

---

### Case 3: Maximum Cascades Reached

**Question:** What happens at 100 cascades?

**Answer:**
```
Safety limit prevents infinite loops
Multiplier would still be x5 (base) or x10 (FS)
Sequence forcibly ends
Accumulated wins awarded

Practically: Never happens in real gameplay
```

---

## Testing Scenarios

### Test 1: Basic Progression
```
Expected:
Cascade 1: Multiplier = x1
Cascade 2: Multiplier = x2
Cascade 3: Multiplier = x3
Cascade 4: Multiplier = x5
Cascade 5: Multiplier = x5 (stays)
```

### Test 2: Free Spins Enhancement
```
Expected:
FS Cascade 1: x2 (not x1)
FS Cascade 2: x4 (not x2)
FS Cascade 3: x6 (not x3)
FS Cascade 4: x10 (not x5)
```

### Test 3: Reset Between Spins
```
Spin A: Ends with cascade 4 (x5 multiplier)
Spin B: Starts fresh (x1 multiplier)
Expected: Multiplier resets, doesn't carry over
```

### Test 4: Win Calculation
```
Input: Symbol payout 10x, 2 ways, cascade 3, bet 5
Expected: 10 × 2 × 3 × 5 = 300 credits
Verify: Multiplier applied correctly
```

---

## Summary

**Multiplier System:**
- Increases with each cascade
- Base game: x1 → x2 → x3 → x5
- Free spins: x2 → x4 → x6 → x10 (doubled!)
- Caps at maximum (x5 or x10)
- Resets between spins
- Applies to ALL wins in a cascade
- Critical for RTP and excitement

**Result:** Makes consecutive cascades exponentially more valuable, creating thrilling chain reaction gameplay!
