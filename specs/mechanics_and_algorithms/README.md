# Game Mechanics & Algorithms

## Overview

This directory contains **conceptual documentation** explaining the core game mechanics and algorithms of Mahjong Ways slot machine.

**Purpose:** Pure mechanical and mathematical explanations without implementation code.

**Target Audience:**
- Game designers understanding the mechanics
- Mathematicians validating RTP models
- QA testers understanding expected behavior
- Stakeholders reviewing game design
- Developers learning the concepts before coding

---

## Documentation Structure

### 1. [Ways to Win System](./01-ways-to-win.md)
**The 1,024 Ways Calculation**

Deep dive into how the "Ways to Win" system works:
- Adjacency rules and left-to-right matching
- Mathematical calculation of ways
- How wilds interact with the system
- Maximum and minimum ways scenarios
- Edge cases and special situations

### 2. [Cascade Mechanics](./02-cascade-system.md)
**Tumbling Reels & Chain Reactions**

Complete explanation of the cascade/tumble system:
- Symbol removal and gravity physics
- Continuous win evaluation
- Multiplier progression during cascades
- When cascades stop
- Maximum cascade limits
- Visual flow and timing

### 3. [Reel Strip Architecture](./03-reel-strips.md)
**The Virtual Tape System**

How reel strips work fundamentally:
- Circular tape concept
- Symbol positioning and reading
- Initial spin position selection
- Reading during cascades
- Golden symbol placement rules
- Why strips are necessary for RTP

### 4. [Multiplier Progression](./04-multiplier-progression.md)
**Cascade Multiplier Logic**

Detailed multiplier mechanics:
- Base game progression (x1→x2→x3→x5)
- Free spins enhanced progression (x2→x4→x6→x10)
- When multipliers apply
- Multiplier reset conditions
- Impact on RTP
- Maximum win scenarios

### 5. [Free Spins Feature](./05-free-spins.md)
**Bonus Round Mechanics**

Free spins trigger and behavior:
- Scatter symbol trigger logic
- Free spins award calculation
- Bet locking mechanics
- Retrigger system
- Enhanced multipliers
- Free spins termination

### 6. [RNG & Fairness](./06-rng-and-fairness.md)
**Random Number Generation**

How randomness works:
- Cryptographic RNG requirements
- Position selection process
- Provably fair concepts
- Audit trail requirements
- Gaming compliance standards
- Why frontend RNG is never acceptable

### 7. [Win Calculation](./07-win-calculation.md)
**Payout Computation**

Step-by-step win calculation:
- Symbol matching rules
- Ways counting algorithm
- Paytable lookup
- Multiplier application
- Multiple simultaneous wins
- Maximum win caps

### 8. [Symbol Weights & RTP](./08-symbol-weights-rtp.md)
**Mathematical Balance**

How symbol frequencies control RTP:
- Weight distribution concept
- Probability calculations
- RTP contribution by symbol
- Balancing volatility
- Tuning for target RTP
- Simulation requirements

---

## Reading Guide

### For Game Designers
**Start with:**
1. Ways to Win System
2. Cascade Mechanics
3. Multiplier Progression
4. Free Spins Feature

### For Mathematicians
**Start with:**
1. Symbol Weights & RTP
2. RNG & Fairness
3. Win Calculation
4. Ways to Win System

### For Developers
**Read all in order:**
1. Start with Ways to Win
2. Progress through each document
3. Then refer to main specs for implementation details

### For QA Testers
**Focus on:**
1. Cascade Mechanics
2. Win Calculation
3. Free Spins Feature
4. Multiplier Progression

---

## Key Concepts Summary

### 1. Server Authority
**Critical Principle:** All game mechanics execute on the server. Frontend only displays results.

### 2. Deterministic Outcomes
**From Reel Strips:** Given the same starting reel positions, the outcome is always identical and reproducible.

### 3. Provably Fair
**RNG Auditing:** Every random decision is logged with cryptographic seeds for verification.

### 4. RTP Balance
**Mathematical Precision:** Symbol weights and paytable values precisely control long-term return to player.

### 5. Cascade Chain Reactions
**Core Innovation:** Wins trigger cascades, cascades can trigger more wins, creating multiplicative excitement.

---

## Terminology

**Reel:** One vertical column of symbols (5 reels total)
**Row:** One horizontal line of symbols (4 visible rows)
**Symbol:** Individual tile/icon on the grid
**Strip:** The circular tape of symbols for each reel
**Position:** Index location on a reel strip
**Way:** One valid winning combination path
**Cascade:** Symbol removal and refill after a win
**Multiplier:** Payout multiplication factor
**Scatter:** Bonus symbol that triggers free spins
**Wild:** Symbol that substitutes for other symbols
**Golden:** Visual variant of symbols (MW1: cosmetic only)

---

## Mathematical Notation

**Ways Calculation:**
```
W = n₁ × n₂ × n₃ × ... × nₖ

Where:
W = Total ways for this winning combination
nᵢ = Number of matching symbols on reel i
k = Number of consecutive reels with matches (≥3)
```

**Win Formula:**
```
Win = P × W × M × B

Where:
P = Paytable payout for symbol and count
W = Ways count
M = Cascade multiplier
B = Bet per way (Total Bet / 20)
```

**RTP Formula:**
```
RTP = (Total Returned / Total Wagered) × 100

Target: 96.92% ± 0.5%
```

---

## Design Principles

### 1. Transparency
Every mechanic is clearly defined and documented. No hidden rules.

### 2. Fairness
Random outcomes with no manipulation. Provably fair RNG.

### 3. Simplicity
Complex math underneath, but mechanics are easy to understand.

### 4. Excitement
Cascades and multipliers create engaging chain reactions.

### 5. Balance
High volatility with fair long-term returns.

---

## Validation Methods

### Mechanical Testing
- Test each mechanic in isolation
- Verify edge cases
- Confirm rule interactions
- Validate timing and sequencing

### Mathematical Testing
- Simulate millions of spins
- Verify RTP convergence
- Validate probability distributions
- Confirm paytable accuracy

### Fairness Testing
- Audit RNG randomness
- Verify unpredictability
- Confirm reproducibility
- Test for bias

---

## Change Log

- **v1.0** (2025-11-17) - Initial mechanics documentation
- Source: Consolidated from main specification documents

---

## Related Documentation

**For Implementation Details:**
- See main `/specs` folder for API, database, security specs

**For RTP Validation:**
- See `04-rtp-mathematics.md` in main specs

**For Backend Development:**
- See `05-backend-api.md` and `09-security-architecture.md`

**For Configuration:**
- See `08-game-configuration.md` for weights and settings
