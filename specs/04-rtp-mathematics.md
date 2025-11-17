# RTP & Mathematics

## RTP Target

- **Target RTP:** 96.92% ± 0.5%
- **Acceptable Range:** 96.42% - 97.42%
- **Volatility:** High
- **Hit Frequency Target:** ~25-30% (approximately 1 in 3-4 spins)
- **Maximum Win:** 25,000x bet

## RTP Distribution

| Component | RTP Contribution | Percentage of Total |
|-----------|------------------|---------------------|
| Base Game | ~90-92% | ~65% |
| Free Spins Feature | ~4-6% | ~35% |
| **Total** | **96.92%** | **100%** |

## Symbol Weight Distribution

### Overview

Symbol weights control the frequency of each symbol appearing on the reels. These weights MUST be tuned through simulation to achieve the target RTP of 96.92%.

### Starting Baseline (Must Be Tuned!)

⚠️ **CRITICAL:** The values below are ESTIMATED. Your math team MUST run 10M+ spin simulations and adjust these weights to achieve 96.92% ± 0.5% RTP.

### Estimated Weights Per Reel

Assuming ~100-120 positions per reel strip:

#### Reel 1 (Leftmost)

```
wild:      2-3 positions  (~2-3%)
bonus:     2-3 positions  (~2-3%)
gold:      1-2 positions  (~1-2%)  // Mystery symbol
fa:        8-10 positions (~8-10%)
zhong:     10-12 positions (~10-12%)
bai:       12-14 positions (~12-14%)
bawan:     14-16 positions (~14-16%)
wusuo:     16-18 positions (~16-18%)
wutong:    16-18 positions (~16-18%)
liangsuo:  18-20 positions (~18-20%)
liangtong: 18-20 positions (~18-20%)
```

#### Reels 2, 3, 4 (Middle - Golden Symbols Possible)

```
wild:        2-3 positions  (~2-3%)
wild_gold:   1-2 positions  (~1-2%)  // Visual only
bonus:       2-3 positions  (~2-3%)
gold:        1-2 positions  (~1-2%)
fa:          8-10 positions (~8-10%)
fa_gold:     1-2 positions  (~1-2%)  // Visual variant
zhong:       8-10 positions (~8-10%)
zhong_gold:  1-2 positions  (~1-2%)
bai:         10-12 positions (~10-12%)
bai_gold:    1-2 positions  (~1-2%)
bawan:       12-14 positions (~12-14%)
bawan_gold:  1-2 positions  (~1-2%)
wusuo:       14-16 positions (~14-16%)
wusuo_gold:  1-2 positions  (~1-2%)
wutong:      14-16 positions (~14-16%)
wutong_gold: 1-2 positions  (~1-2%)
liangsuo:    16-18 positions (~16-18%)
liangsuo_gold: 1-2 positions (~1-2%)
liangtong:   16-18 positions (~16-18%)
liangtong_gold: 1-2 positions (~1-2%)
```

#### Reel 5 (Rightmost)

```
Same distribution as Reel 1 (no golden symbols)
```

### Golden Symbol Rules

- **Appearance:** Only on reels 2, 3, 4
- **Behavior:** VISUAL ONLY (MW1 does not convert golden to wild)
- **Payout:** Same as regular symbol
- **Purpose:** Visual enhancement, player engagement

## Free Spins Trigger Rate

### Target Trigger Rate

**Target:** 3-5% (1 in 20-33 spins)

### Calculation

Given scatter (bonus) probability per reel:

```
P(scatter on reel) = (scatter_positions / total_positions)

Example with 2.5 positions per reel out of 100:
P(scatter) = 2.5 / 100 = 0.025 (2.5%)
```

### Binomial Probability for 3+ Scatters

```
P(3+ scatters) = P(exactly 3) + P(exactly 4) + P(exactly 5)

P(exactly k scatters) = C(5,k) × p^k × (1-p)^(5-k)

Where:
- C(5,k) = combinations of 5 reels choosing k
- p = probability of scatter on single reel
- k = number of scatters (3, 4, or 5)
```

### Example Calculation

```
Assuming p = 0.025:

P(exactly 3) = C(5,3) × 0.025³ × 0.975²
             = 10 × 0.000015625 × 0.950625
             = 0.001485

P(exactly 4) = C(5,4) × 0.025⁴ × 0.975¹
             = 5 × 0.00000039 × 0.975
             = 0.0000019

P(exactly 5) = C(5,5) × 0.025⁵
             = 1 × 0.00000001
             = 0.00000001

Total trigger rate ≈ 0.0015 or 0.15% (Too low!)
```

### Adjustment Strategy

If trigger rate is too low: **Increase scatter positions**
If trigger rate is too high: **Decrease scatter positions**

**Note:** Current code shows `bonusChance: 0.25` (25%) which is for testing. Production should be ~3-5%.

## Cascade Multiplier Contribution

### Multiplier Progression

**Base Game:**

```
Cascade 1: x1
Cascade 2: x2
Cascade 3: x3
Cascade 4+: x5
```

**Free Spins:**

```
Cascade 1: x2  (100% increase)
Cascade 2: x4  (100% increase)
Cascade 3: x6  (100% increase)
Cascade 4+: x10 (100% increase)
```

### Expected Cascade Distribution

Estimated probabilities (must be validated through simulation):

```
1 cascade:   ~70% of winning spins
2 cascades:  ~20% of winning spins
3 cascades:  ~8% of winning spins
4+ cascades: ~2% of winning spins
```

### Average Multiplier Calculation

**Base Game:**

```
E(Multiplier) = (0.70 × 1) + (0.20 × 2) + (0.08 × 3) + (0.02 × 5)
              = 0.70 + 0.40 + 0.24 + 0.10
              = 1.44x average
```

**Free Spins:**

```
E(Multiplier) = (0.70 × 2) + (0.20 × 4) + (0.08 × 6) + (0.02 × 10)
              = 1.40 + 0.80 + 0.48 + 0.20
              = 2.88x average
```

### RTP Impact

- Multipliers increase wins by ~44% in base game
- Multipliers increase wins by ~188% in free spins
- Critical component for reaching 96.92% target RTP

## Win Calculation Formula

### Basic Win Formula

```
Win = Symbol_Payout × Ways_Count × Cascade_Multiplier × Bet_Per_Way

Where:
- Symbol_Payout = paytable value (e.g., 50x for 5-of-a-kind fa)
- Ways_Count = number of ways this combination occurs
- Cascade_Multiplier = current cascade multiplier (1, 2, 3, 5, or 10)
- Bet_Per_Way = Total_Bet / 20 (20 fixed lines)
```

### Maximum Win Calculation

```
Theoretical Maximum (before cap):
Symbol: gold (Mystery) - assume 500x for 5-of-a-kind
Ways: 1,024 (all positions match)
Multiplier: x10 (4+ cascades in free spins)

Win = 500 × 1,024 × 10 × Bet_Per_Way
    = 5,120,000x theoretical

Actual Maximum (with cap):
Win capped at 25,000x total bet
```

### Bet Per Way Calculation

```
Total Bet = Base Bet × Bet Multiplier
Bet Per Way = Total Bet / 20

Example:
Total Bet = 100 credits
Bet Per Way = 100 / 20 = 5 credits per way
```

## RTP Simulation Requirements

### Mandatory Testing Protocol

✅ **Minimum Spin Count:** 10,000,000 spins (10M)
✅ **Recommended:** 50,000,000+ spins for statistical confidence
✅ **Bet Amount:** Use standardized 1.00 bet for calculations
✅ **Random Seed:** Use multiple seeds to validate consistency
✅ **Documentation:** Record all results with timestamps

### RTP Calculation Formula

```
RTP% = (Total_Returned / Total_Wagered) × 100

Where:
- Total_Wagered = Number_of_Spins × Bet_Amount
- Total_Returned = Sum of all wins (base game + free spins + cascades)
```

### Required Metrics Per Test

For each 10M spin simulation, track:

1. **Overall RTP:** XX.XX%
2. **Base Game RTP:** XX.XX%
3. **Free Spins RTP:** XX.XX%
4. **Hit Frequency:** XX.XX%
5. **Free Spins Trigger Rate:** X.XX%
6. **Average Free Spins per Trigger:** XX.X spins
7. **Max Win Observed:** X,XXXx
8. **Standard Deviation:** ±X.XX%
9. **Total Base Game Wins:** X,XXX,XXX
10. **Total Free Spins Triggered:** XXX,XXX

### Cascade Distribution

Track distribution of cascades:

```
- Single cascade: XX%
- Double cascade: XX%
- Triple cascade: XX%
- 4+ cascades: XX%
```

### Symbol Hit Frequency

Track hit frequency per symbol:

```
Symbol: fa
- 3-of-a-kind: XX times (XX%)
- 4-of-a-kind: XX times (XX%)
- 5-of-a-kind: XX times (XX%)

[Repeat for all symbols]
```

### Multiplier Distribution

Track multiplier usage:

```
- x1: XX% of wins
- x2: XX% of wins
- x3: XX% of wins
- x5: XX% of wins
- x10: XX% of wins
```

## Validation Criteria

### Passing Criteria

🟢 **PASS** if:

- Actual RTP within 96.42% - 97.42%
- Standard deviation stabilizes after 10M+ spins
- Free spins contribution: 4-6% of total RTP
- Base game contribution: 90-92% of total RTP
- Hit frequency within 25-30%
- No mathematical errors detected
- Cascade logic validated

### Failing Criteria

🔴 **FAIL** if:

- RTP outside acceptable range (96.42% - 97.42%)
- Theoretical vs simulated variance >0.5%
- Logic errors in win calculation
- Statistical anomalies detected
- Free spins trigger rate outside 3-5%
- Maximum win cap not enforced

### Deviation Tolerance

```
At 10M spins:  ±0.3% acceptable
At 50M spins:  ±0.1% acceptable
At 100M spins: ±0.05% acceptable
```

## Implementation Workflow

### Phase 1: Development (Week 1-2)

1. Use estimated symbol weights as starting point
2. Build simulation engine in Golang
3. Implement cascade mechanics
4. Add free spins logic
5. Run initial 1M spin test

### Phase 2: Tuning (Week 3-4)

1. Analyze 1M spin results
2. Adjust symbol weights if RTP off-target
3. Run 10M spin test
4. Fine-tune free spins trigger rate
5. Validate cascade distribution
6. Document all adjustments

### Phase 3: Validation (Week 5)

1. Run 50M+ spin simulation
2. Generate complete metrics report
3. Review mathematical model
4. Address any issues found
5. Re-test if adjustments needed

### Phase 4: Final Certification (Week 6)

1. Validate final RTP is within target range
2. Document final reel strips
3. Lock configuration for production
4. Provide specs to development team
5. Prepare for integration testing

## Backend Implementation Notes

### RNG Requirements

**Cryptographically Secure Random Number Generator:**

```go
import "crypto/rand"

func GenerateSecureRandom(max int) int {
    // Use crypto/rand for secure RNG
    // Must be auditable and provably fair
}
```

### Reel Strip Storage

Store reel strips as arrays of symbols:

```go
type ReelStrip []string

var BaseGameReels = [5]ReelStrip{
    // Reel 1
    {"fa", "zhong", "wutong", "liangtong", ...},
    // Reel 2
    {"fa", "fa_gold", "zhong", "wild", ...},
    // Reel 3
    {...},
    // Reel 4
    {...},
    // Reel 5
    {...},
}
```

### Win Calculation Implementation

```go
func CalculateWin(grid [][]string, bet float64, cascadeNum int, isFreeSpins bool) float64 {
    multiplier := GetMultiplier(cascadeNum, isFreeSpins)
    betPerWay := bet / 20

    totalWin := 0.0

    // Evaluate all symbol types
    for symbol, payouts := range Paytable {
        ways, reelCount := CountWays(grid, symbol)
        if reelCount >= 3 {
            payout := payouts[reelCount]
            win := float64(payout) * float64(ways) * multiplier * betPerWay
            totalWin += win
        }
    }

    // Apply max win cap
    maxWin := bet * 25000
    if totalWin > maxWin {
        totalWin = maxWin
    }

    return totalWin
}
```

## Testing Checklist

Before deploying to production:

- [ ] RTP validated at 96.92% ± 0.5% over 10M+ spins
- [ ] Hit frequency within 25-30%
- [ ] Free spins trigger rate at 3-5%
- [ ] Maximum win cap enforced (25,000x)
- [ ] All cascade multipliers working correctly
- [ ] Wild substitution logic correct
- [ ] Scatter counting accurate
- [ ] Free spins retrigger working
- [ ] Golden symbols visual only (no gameplay impact)
- [ ] RNG is cryptographically secure
- [ ] All spins logged for auditing
- [ ] Performance tested under load
