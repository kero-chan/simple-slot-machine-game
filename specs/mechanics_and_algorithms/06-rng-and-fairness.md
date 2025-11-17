# RNG & Fairness

## Overview

**Random Number Generation (RNG)** is the foundation of fair slot machine gameplay. Every spin outcome must be truly random, unpredictable, and provably fair to meet gaming regulations and player trust requirements.

**Core Principle:** Server-authoritative RNG using cryptographically secure algorithms.

---

## Why RNG Matters

### Player Trust

**Fair Gaming Guarantee:**

```
Players must trust that:
✓ Outcomes are truly random
✓ Results cannot be predicted
✓ Game is not rigged
✓ Past spins don't influence future spins
✓ Casino cannot manipulate results
```

**Loss of Trust = Loss of Players**

---

### Regulatory Compliance

**Gaming Authorities Require:**

- Cryptographically secure RNG
- Unpredictable outcomes
- Reproducible results (for auditing)
- Statistical randomness verification
- Third-party certification
- Complete audit trail

**Non-Compliance = License Revocation**

---

### Mathematical Integrity

**RTP Validity:**

```
Without true RNG:
→ Symbol frequencies deviate from configured weights
→ RTP becomes unpredictable
→ Game balance breaks
→ Payouts become unfair

With true RNG:
→ Symbol frequencies match weights over time
→ RTP converges to target (96.92%)
→ Game remains balanced
→ Fair long-term returns
```

---

## Cryptographically Secure RNG

### What Makes RNG "Cryptographically Secure"?

**Requirements:**

1. **Unpredictability:** Cannot predict next value from previous values
2. **Non-Deterministic Seed:** Initial seed from truly random source (hardware entropy)
3. **Statistical Randomness:** Passes statistical tests for randomness
4. **Cryptographic Strength:** Resistant to cryptanalysis attacks

---

### Acceptable RNG Sources

**✅ CORRECT - Use These:**

**1. Operating System Crypto RNG**

```
Go Language:
import "crypto/rand"

func generateRandomInt(max int) int {
    nBig, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
    if err != nil {
        // Handle error - NEVER fallback to math/rand
        panic("RNG failure")
    }
    return int(nBig.Int64())
}

Source: crypto/rand uses OS entropy pool (/dev/urandom, CryptGenRandom, etc.)
Quality: Cryptographically secure ✓
```

**2. Hardware Random Number Generators (HRNG)**

```
Physical sources:
- CPU RDRAND instruction (Intel/AMD)
- TPM (Trusted Platform Module)
- Hardware entropy dongles

Usage: Supplement OS RNG for additional entropy
```

**3. Certified Third-Party RNG Services**

```
Examples:
- Gaming Laboratories International (GLI) certified RNG
- iTech Labs certified RNG
- RANDOM.ORG API (with caveats)

Usage: API calls to certified RNG providers
Benefit: Third-party auditing and certification
```

---

### Unacceptable RNG Sources

**❌ WRONG - NEVER Use These for Gambling:**

**1. Pseudorandom (PRNG) Libraries**

```
Go Language - FORBIDDEN:
import "math/rand"  // ❌ NOT CRYPTOGRAPHICALLY SECURE

Why forbidden:
- Predictable seed (often time-based)
- Deterministic sequence
- Statistically biased
- Vulnerable to prediction attacks
- NOT acceptable for gambling
```

**2. Frontend/Client-Side RNG**

```javascript
// JavaScript - NEVER for game logic
Math.random()  // ❌ Completely unacceptable

Why forbidden:
- Client can manipulate
- Predictable in browser
- No server verification
- Trivially hackable
- Regulatory violation
```

**3. Time-Based Seeds**

```
// Predictable seed - FORBIDDEN
seed := time.Now().UnixNano()  // ❌ Predictable

Why forbidden:
- Attacker can guess seed
- Outcomes become predictable
- Statistical patterns emerge
- Security vulnerability
```

**4. Simple Hash Functions**

```
// MD5, SHA1 of predictable data - FORBIDDEN
seed := md5.Sum([]byte(timestamp))  // ❌ Not secure

Why forbidden:
- Still deterministic
- Predictable if input known
- Not designed for randomness
- Weak cryptographic properties
```

---

## RNG in Slot Machine Context

### What RNG Decides

**Every Spin Requires Random Decisions:**

**1. Reel Starting Positions (Critical)**

```
For each of 5 reels:
Generate random position from 0 to 99

Example:
Reel 1: Random(0-99) → 47
Reel 2: Random(0-99) → 23
Reel 3: Random(0-99) → 89
Reel 4: Random(0-99) → 12
Reel 5: Random(0-99) → 56

These 5 numbers determine entire spin outcome!
```

**2. Nothing Else!**

```
RNG does NOT directly choose:
✗ Individual symbols
✗ Whether player wins
✗ Win amounts
✗ Cascade outcomes

All other outcomes are DETERMINISTIC:
→ Read from reel strips at chosen positions
→ Apply cascade mechanics
→ Calculate wins from paytable
→ Apply multipliers
```

**This is critical for provably fair gaming!**

---

### RNG Process Flow

```
┌─────────────────────────────────────────────┐
│ 1. PLAYER INITIATES SPIN                    │
│    Request: Spin with bet amount            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. SERVER GENERATES RNG SEED                │
│    Use crypto/rand for entropy              │
│    Create unique seed for this spin         │
│    Log seed to audit trail                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. GENERATE 5 RANDOM POSITIONS              │
│    For each reel (1-5):                     │
│      Position = CryptoRand(0, 99)           │
│    Result: [47, 23, 89, 12, 56]             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 4. READ SYMBOLS FROM REEL STRIPS            │
│    Deterministic lookup                     │
│    Use configured reel strips               │
│    Read 10 symbols per reel from position   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. EVALUATE WINS (DETERMINISTIC)            │
│    Check winning combinations               │
│    Apply cascade mechanics                  │
│    Calculate payouts                        │
│    Apply multipliers                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 6. RETURN RESULTS + AUDIT DATA              │
│    Grid, wins, balance                      │
│    Include: seed, positions, checksum       │
│    Log to audit trail                       │
└─────────────────────────────────────────────┘
```

---

## Provably Fair Gaming

### What is "Provably Fair"?

**Definition:** A system where players (or auditors) can independently verify that game outcomes were determined fairly and not manipulated.

**Key Components:**

1. **Transparent Algorithm:** Publicly documented how RNG affects outcomes
2. **Verifiable Results:** Players can recreate outcomes from seed data
3. **Tamper-Proof Logging:** Immutable audit trail
4. **Third-Party Auditing:** External verification of fairness

---

### Provably Fair Implementation

**Step 1: Generate and Log Seed**

```
Before spin execution:

1. Generate cryptographic seed
   Seed = crypto/rand (256-bit)
   Example: "a3f5c9d8e2b4f6a1c8e3d7f9b2a5c8e1"

2. Log seed to database (immutable)
   INSERT INTO rng_audit (
     spin_id,
     seed,
     timestamp,
     algorithm_version
   )

3. Use seed to initialize RNG state for this spin
```

**Step 2: Deterministic Position Generation**

```
From seed, generate 5 reel positions:

Position[i] = DeterministicRandom(seed, i) % 100

Where:
- DeterministicRandom = Seeded CSPRNG
- i = Reel index (0-4)
- % 100 = Map to reel strip range

Result: Same seed always produces same positions
```

**Step 3: Provide Verification Data**

```
Return to player (or store for audit):

{
  "spin_id": "ABC-123",
  "seed": "a3f5c9d8e2b4f6a1c8e3d7f9b2a5c8e1",
  "positions": [47, 23, 89, 12, 56],
  "reel_strip_version": "1.0",
  "algorithm_version": "1.0",
  "checksum": "SHA256 of above data"
}

Player (or auditor) can:
1. Use same seed
2. Run same algorithm
3. Verify same positions generated
4. Verify same outcome
```

**Step 4: Independent Verification**

```
Verification Process:

INPUT:
- Seed
- Reel strip configuration (version 1.0)
- Algorithm specification

PROCESS:
1. Generate positions from seed
2. Read symbols from reel strips
3. Apply game mechanics
4. Calculate wins

OUTPUT:
- Grid result
- Total win

COMPARE:
Verification output = Actual game output?
✓ Match = Provably fair
✗ Mismatch = Manipulation detected
```

---

### Audit Trail Requirements

**Complete Logging for Every Spin:**

```sql
CREATE TABLE rng_audit (
  id BIGSERIAL PRIMARY KEY,
  spin_id VARCHAR(50) UNIQUE NOT NULL,
  player_id BIGINT NOT NULL,

  -- RNG Data
  rng_seed VARCHAR(255) NOT NULL,
  reel_positions INTEGER[] NOT NULL,  -- [47, 23, 89, 12, 56]

  -- Configuration
  reel_strip_version VARCHAR(20) NOT NULL,
  game_config_version VARCHAR(20) NOT NULL,
  algorithm_version VARCHAR(20) NOT NULL,

  -- Verification
  checksum VARCHAR(64) NOT NULL,

  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_id VARCHAR(50) NOT NULL,

  -- Immutability
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make immutable (no updates/deletes allowed)
CREATE RULE no_update_rng_audit AS ON UPDATE TO rng_audit DO INSTEAD NOTHING;
CREATE RULE no_delete_rng_audit AS ON DELETE TO rng_audit DO INSTEAD NOTHING;
```

**What Gets Logged:**

- Unique spin identifier
- Player identifier
- RNG seed used
- Generated reel positions
- Reel strip version
- Game configuration version
- Algorithm version
- Checksum for verification
- Timestamp (with timezone)
- Server identifier

**Immutability Guarantees:**

- No updates allowed (rule prevents modification)
- No deletions allowed
- Insert-only table
- Creates permanent audit trail

---

## Statistical Verification

### RNG Testing Requirements

**Pre-Deployment Tests:**

**1. Statistical Randomness Tests**

```
Industry Standard Test Suites:

- NIST SP 800-22 Statistical Test Suite
- Diehard Tests
- TestU01 (BigCrush)

What they verify:
✓ Frequency distribution
✓ Runs of consecutive values
✓ Spectral analysis
✓ Autocorrelation
✓ Chi-square distribution
✓ Entropy measurements

Pass Criteria:
All tests must pass with p-value > 0.01
```

**2. Distribution Uniformity**

```
Test: Generate 1,000,000 random positions (0-99)

Expected: Each position appears ~10,000 times (±5%)

Example Results:
Position 0: 10,023 occurrences ✓
Position 1: 9,987 occurrences ✓
Position 2: 10,145 occurrences ✓
...
Position 99: 9,998 occurrences ✓

Chi-square test: p-value = 0.42 (PASS)
```

**3. Independence Tests**

```
Test: Verify outcomes are independent

Check: Position[n] does NOT predict Position[n+1]

Method:
- Generate 100,000 pairs
- Calculate correlation coefficient
- Should be near 0

Result: r = 0.0003 (PASS - no correlation)
```

**4. Long-Term RTP Convergence**

```
Test: Simulate 10,000,000 spins

Expected: RTP converges to 96.92% ± 0.5%

Process:
1. Use production reel strips
2. Use production paytable
3. Run full game mechanics
4. Track total wagered & returned

Result:
Total Wagered: 100,000,000,000 credits
Total Returned: 96,920,345,128 credits
RTP: 96.920% ✓

Within tolerance: Yes (target ± 0.5%)
```

---

### Ongoing Monitoring

**Production RNG Health Checks:**

**1. Daily Statistical Analysis**

```
Automated checks every 24 hours:

- Analyze past 24h of spins
- Verify position distribution
- Check RTP deviation
- Flag anomalies

Alert if:
- Position distribution skewed > 10%
- RTP outside ±5% of target
- Correlation detected
- Duplicate seeds found
```

**2. Weekly RTP Validation**

```
Rolling 7-day RTP calculation:

Week 1: 96.85% ✓ (within tolerance)
Week 2: 96.94% ✓
Week 3: 97.12% ⚠️ (slightly high, investigate)
Week 4: 96.89% ✓

Trend Analysis:
- Graph RTP over time
- Detect drift
- Early warning system
```

**3. Monthly Third-Party Audits**

```
Independent auditor:

1. Request random sample of spins (1000+)
2. Verify seed → position generation
3. Recalculate outcomes independently
4. Compare with logged results
5. Issue compliance certificate

Required by gaming licenses
```

---

## Security Considerations

### RNG Attack Vectors

**Attack 1: Seed Prediction**

```
Threat: Attacker tries to predict RNG seed

Mitigations:
✓ Use cryptographically secure seed source
✓ Never use predictable data (time, user ID)
✓ Sufficient entropy (256+ bits)
✓ Server-side only (never client)

Result: Computationally infeasible to predict
```

**Attack 2: State Observation**

```
Threat: Attacker observes RNG state or patterns

Mitigations:
✓ New seed every spin (no state reuse)
✓ Seed never exposed to client
✓ Position data only revealed after wager committed
✓ No RNG preview/peek functionality

Result: Past outcomes reveal nothing about future
```

**Attack 3: Client-Side Manipulation**

```
Threat: Player modifies client to send favorable outcomes

Mitigations:
✓ Server-authoritative (100% server-side RNG)
✓ Client cannot influence RNG
✓ Server validates all requests
✓ Checksum verification
✓ Request signing

Result: Client manipulation has zero effect on outcome
```

**Attack 4: Replay Attacks**

```
Threat: Attacker replays winning spin request

Mitigations:
✓ Nonce-based request validation (use-once tokens)
✓ Timestamp verification (reject old requests)
✓ Spin IDs tracked (prevent duplicates)
✓ Session state validation

Result: Cannot replay or reuse spin requests
```

**Attack 5: Timing Attacks**

```
Threat: Attacker times request to influence RNG

Mitigations:
✓ RNG seed independent of request timing
✓ Server controls when RNG executes
✓ Request queueing prevents timing manipulation
✓ Rate limiting prevents rapid attempts

Result: Timing of request doesn't affect outcome
```

---

### RNG Isolation

**Principle: RNG Must Be Isolated from External Influence**

```
┌──────────────────────────────────────────┐
│         EXTERNAL INPUTS                  │
│  (CANNOT influence RNG)                  │
│                                          │
│  - Player ID                             │
│  - Bet amount                            │
│  - Request timestamp                     │
│  - Session state                         │
│  - Previous spins                        │
│  - Win/loss history                      │
│  - Player balance                        │
│  - Time of day                           │
│  - Any client-provided data              │
└──────────────────┬───────────────────────┘
                   │
                   │  ❌ NO INFLUENCE
                   │
                   ▼
┌──────────────────────────────────────────┐
│      CRYPTOGRAPHIC RNG                   │
│  (Isolated, pure randomness)             │
│                                          │
│  Input: OS entropy pool ONLY             │
│  Process: CSPRNG algorithm               │
│  Output: Random seed/positions           │
└──────────────────┬───────────────────────┘
                   │
                   │  Pure random output
                   │
                   ▼
┌──────────────────────────────────────────┐
│      DETERMINISTIC GAME LOGIC            │
│  (Uses RNG output + game rules)          │
│                                          │
│  - Read from reel strips                 │
│  - Apply game mechanics                  │
│  - Calculate wins                        │
│  - Apply multipliers                     │
└──────────────────────────────────────────┘
```

---

## Implementation Best Practices

### Golang Example (Correct)

```go
package rng

import (
    "crypto/rand"
    "encoding/binary"
    "fmt"
)

// GenerateReelPositions generates 5 random reel positions
// Returns: [5]int with values 0-99 for each reel
func GenerateReelPositions(stripLength int) ([5]int, error) {
    var positions [5]int

    for i := 0; i < 5; i++ {
        pos, err := generateSecureRandomInt(stripLength)
        if err != nil {
            return positions, fmt.Errorf("RNG failure for reel %d: %w", i, err)
        }
        positions[i] = pos
    }

    return positions, nil
}

// generateSecureRandomInt returns cryptographically secure random int in range [0, max)
func generateSecureRandomInt(max int) (int, error) {
    if max <= 0 {
        return 0, fmt.Errorf("max must be positive")
    }

    // Use crypto/rand for cryptographically secure randomness
    var b [8]byte
    _, err := rand.Read(b[:])
    if err != nil {
        // CRITICAL: Never fallback to insecure RNG
        return 0, fmt.Errorf("crypto/rand failed: %w", err)
    }

    // Convert bytes to uint64
    randomValue := binary.BigEndian.Uint64(b[:])

    // Map to range [0, max) uniformly
    return int(randomValue % uint64(max)), nil
}

// IMPORTANT: This is a simplified example
// Production code should use crypto/rand.Int() for uniform distribution
```

---

### Testing RNG Implementation

```go
package rng_test

import (
    "testing"
    "your-project/rng"
)

func TestRNGUniformity(t *testing.T) {
    const iterations = 1000000
    const stripLength = 100
    const expectedPerBucket = iterations / stripLength
    const tolerance = 0.05 // 5% tolerance

    buckets := make([]int, stripLength)

    // Generate many random positions
    for i := 0; i < iterations; i++ {
        pos, err := rng.GenerateSecureRandomInt(stripLength)
        if err != nil {
            t.Fatalf("RNG error: %v", err)
        }
        buckets[pos]++
    }

    // Verify distribution uniformity
    for i, count := range buckets {
        deviation := float64(count-expectedPerBucket) / float64(expectedPerBucket)
        if deviation < -tolerance || deviation > tolerance {
            t.Errorf("Position %d: count=%d, expected~%d, deviation=%.2f%%",
                i, count, expectedPerBucket, deviation*100)
        }
    }
}

func TestRNGIndependence(t *testing.T) {
    const iterations = 10000
    const stripLength = 100

    var prev int
    correlations := 0

    for i := 0; i < iterations; i++ {
        pos, err := rng.GenerateSecureRandomInt(stripLength)
        if err != nil {
            t.Fatalf("RNG error: %v", err)
        }

        if i > 0 && pos == prev {
            correlations++
        }
        prev = pos
    }

    // Expect ~1% correlation by chance (100 possible values)
    expectedCorrelations := iterations / stripLength
    tolerance := float64(expectedCorrelations) * 0.5

    if float64(correlations) > float64(expectedCorrelations)+tolerance {
        t.Errorf("Too many correlations: %d (expected ~%d)",
            correlations, expectedCorrelations)
    }
}
```

---

## Regulatory Compliance

### Gaming License Requirements

**Different jurisdictions have specific RNG requirements:**

**Malta Gaming Authority (MGA):**

- Third-party RNG certification required
- Monthly statistical reports
- Audit trail retention: 5 years
- RTP verification: ±1%

**UK Gambling Commission (UKGC):**

- Approved RNG testing labs (GLI, iTech Labs, etc.)
- Quarterly audits
- Player-facing RTP disclosure
- Technical compliance documentation

**Gibraltar Gambling Commission:**

- ISO 27001 compliance
- Independent RNG certification
- Annual statistical verification
- Provably fair demonstration

**Curaçao eGaming:**

- RNG testing lab certification
- Monthly RTP reporting
- Audit log requirements
- Technical standard compliance

---

### Certification Process

**Steps to Get RNG Certified:**

```
1. Implementation
   - Develop RNG system
   - Implement audit trail
   - Create verification tools

2. Internal Testing
   - Run statistical tests
   - Simulate millions of spins
   - Verify RTP convergence
   - Document results

3. Select Testing Lab
   - Choose accredited lab (GLI, iTech, BMM, etc.)
   - Submit documentation
   - Provide source code access

4. Lab Testing
   - Statistical analysis
   - Code review
   - Penetration testing
   - Documentation audit
   - Duration: 4-12 weeks

5. Certification
   - Receive compliance certificate
   - Valid for 12-24 months
   - Required for license
   - Annual renewal

6. Ongoing Compliance
   - Monthly reports
   - Regular audits
   - Update certifications for changes
   - Maintain audit trail
```

---

## Summary

**RNG Fundamentals:**

- Cryptographically secure RNG is mandatory (crypto/rand)
- Never use pseudorandom libraries (math/rand)
- Server-side only - zero client influence
- RNG determines reel positions, nothing else
- All other outcomes are deterministic

**Provably Fair:**

- Seed-based generation
- Complete audit trail
- Independently verifiable
- Immutable logging
- Checksum validation

**Security:**

- Isolated from external influence
- Protected against prediction attacks
- Nonce-based replay protection
- Server-authoritative control
- Complete tamper protection

**Compliance:**

- Statistical randomness tests
- Third-party certification
- Regulatory audit trail
- RTP verification
- Monthly reporting

**Result:** Fair, secure, transparent, and compliant random number generation that players can trust and regulators can verify!
