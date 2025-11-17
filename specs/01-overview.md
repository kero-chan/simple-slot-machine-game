# Game Overview

## Executive Summary

**Game Title:** Mahjong Ways (麻将胡了)
**Original Developer:** PG Soft (Pocket Games Soft)
**Game Type:** 5-Reel × 4-Row Video Slot with Cascade Mechanics
**Version:** Mahjong Ways 1 (NOT Mahjong Ways 2)

## Core Specifications

| Specification | Value |
|--------------|-------|
| **RTP** (Return to Player) | 96.92% |
| **Maximum Win** | 25,000x bet |
| **Grid Layout** | 5 reels × 4 rows |
| **Ways to Win** | 1,024 ways |
| **Platforms** | HTML5 (browser-based) |
| **Game Type** | Cascading slot with progressive multipliers |
| **Volatility** | High |
| **Bet Range** | 0.60 to 1,000.00 per spin |

### Bet Structure

- **Fixed Lines:** 20 paylines (base calculation unit)
- **Bet Multiplier Range:** 1x to 10x
- **Coin Value Range:** 0.03 to 5.00

**Total Bet Calculation:**

```
Total Bet = 20 (lines) × Bet Multiplier × Coin Value
```

**Examples:**

- Minimum: 20 × 1 × 0.03 = **0.60 per spin**
- Medium: 20 × 5 × 1.00 = **100.00 per spin**
- Maximum: 20 × 10 × 5.00 = **1,000.00 per spin**

## Key Features

### Core Gameplay Features

1. **Cascading Wins with Progressive Multipliers**
   - Winning symbols explode and new symbols fall
   - Multipliers increase with each cascade: x1 → x2 → x3 → x5
   - Can chain indefinitely

2. **1,024 Ways to Win**
   - No traditional paylines
   - Adjacent reel matching from left to right
   - Multiple simultaneous winning combinations

3. **Free Spins Bonus**
   - Trigger: 3+ Scatter symbols
   - Award: 12 Free Spins (base)
   - Enhanced multipliers: x2 → x4 → x6 → x10
   - Retriggerable with additional scatters

4. **Golden Symbol Transformation**
   - Appears on reels 2, 3, 4 only
   - Visual enhancement (no gameplay impact in MW1)
   - Transforms to regular symbols after cascade

5. **Wild Substitution**
   - Substitutes for all symbols except Scatter
   - Appears on all reels
   - Can appear as Golden Wild

6. **Mystery Symbol**
   - High-value symbol with premium payouts
   - Golden ball with "?" symbol
   - Rare appearance

## Game Theme & Aesthetics

Mahjong Ways incorporates traditional Chinese Mahjong tile aesthetics:

- **Visual Style:** Authentic Mahjong tile symbols (发, 中, 萬, Bamboo, Circles)
- **Color Scheme:** Traditional red and gold with Chinese prosperity themes
- **Animations:** Celebratory effects for big wins
- **Audio:** Traditional Chinese background music and sound effects

## Technology Stack

### Backend (New Implementation)

- **Language:** Golang
- **Database:** PostgreSQL
- **Architecture:** RESTful API
- **Authentication:** JWT-based session management

### Frontend (Existing)

- **Technology:** HTML5 Canvas
- **Rendering:** JavaScript-based slot machine
- **Communication:** REST API calls to backend

### Infrastructure Requirements

- **Session Management:** Redis (recommended for game state caching)
- **Random Number Generation:** Cryptographically secure RNG
- **Audit Logging:** All spins, wins, and transactions
- **Compliance:** Gaming authority certification ready

## RTP Distribution

| Component | RTP Contribution | Percentage |
|-----------|------------------|------------|
| Base Game Wins | ~63.00% | ~65% |
| Free Spins Feature | ~33.92% | ~35% |
| **Total** | **96.92%** | **100%** |

## Volatility Profile

- **Classification:** High volatility
- **Hit Frequency:** ~25-30% (approximately 1 in 3-4 spins)
- **Big Win Potential:** 25,000x maximum
- **Variance:** High variance due to cascade multipliers

## Win Calculation Formula

```
Win = Symbol Payout × Ways Count × Cascade Multiplier × Bet Per Way
```

**Maximum Win Cap:** 25,000x total bet per spin (including all cascades)

## Compliance & Certification

- **RTP Tested:** 96.92% ± 0.5%
- **Standards:** International gaming standards compliant
- **MGA:** Malta Gaming Authority approved
- **UKGC:** UK Gambling Commission compliant
- **Fair Play:** Provably fair RNG system

## Development Priorities

### Phase 1: Backend Foundation

1. Database schema design
2. Core game engine (RNG, win calculation, cascade logic)
3. API endpoints
4. Session management

### Phase 2: Integration

1. Frontend API integration
2. Real-time game state updates
3. Transaction handling

### Phase 3: Testing & Validation

1. RTP simulation (10M+ spins)
2. Mathematical validation
3. Load testing
4. Security audit

### Phase 4: Deployment

1. Production environment setup
2. Monitoring and logging
3. Compliance documentation
4. Launch readiness
