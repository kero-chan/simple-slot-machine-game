# Mahjong Ways - Technical Specifications

## Overview

This directory contains the complete technical specifications for the Mahjong Ways slot machine game rebuild.

**Technology Stack:**

- **Backend:** Golang + PostgreSQL
- **Frontend:** HTML5 Canvas (existing)
- **Architecture:** RESTful API

## Specification Files

1. **[01-overview.md](./01-overview.md)**
   - Game overview and executive summary
   - Core specifications (RTP, volatility, bet range)
   - Key features summary

2. **[02-symbols-paytable.md](./02-symbols-paytable.md)**
   - Complete symbol definitions
   - Payout tables for all symbols
   - Special symbol behaviors

3. **[03-game-mechanics.md](./03-game-mechanics.md)**
   - 1,024 Ways to Win system
   - Cascade/Tumble mechanics
   - Multiplier progression
   - Free Spins feature
   - Wild substitution rules
   - Golden symbol transformation

4. **[04-rtp-mathematics.md](./04-rtp-mathematics.md)**
   - RTP target and validation
   - Symbol weight distributions
   - Mathematical models
   - Simulation requirements

5. **[05-backend-api.md](./05-backend-api.md)**
   - API endpoint specifications
   - Request/response formats
   - Game state management
   - Session handling

6. **[06-database-schema.md](./06-database-schema.md)**
   - PostgreSQL schema design
   - Table structures
   - Indexes and relationships
   - Data retention policies

7. **[07-frontend-integration.md](./07-frontend-integration.md)**
   - Frontend-backend communication
   - WebSocket vs REST considerations
   - UI/UX requirements
   - Animation triggers

8. **[08-game-configuration.md](./08-game-configuration.md)**
   - Backend configuration system
   - Paytable and spawn rate management
   - Configuration versioning and validation
   - RTP tuning without code changes
   - Admin API endpoints

9. **[09-security-architecture.md](./09-security-architecture.md)**
   - Cryptographically secure RNG
   - Server-authoritative gameplay
   - Request signing and validation
   - Anti-cheat and anti-tampering
   - Audit logging and compliance

## Version History

- **v1.1** (2025-11-17) - Added configuration and security specs
- **v1.0** (2025-11-17) - Initial organized specification
- Source: Original technical_specification.md

## Quick Start

1. Read [01-overview.md](./01-overview.md) for game understanding
2. Review [05-backend-api.md](./05-backend-api.md) for API design
3. Study [06-database-schema.md](./06-database-schema.md) for database setup
4. Implement backend following specifications
5. Integrate with existing frontend per [07-frontend-integration.md](./07-frontend-integration.md)

## Key Metrics

- **RTP:** 96.92% ± 0.5%
- **Volatility:** High
- **Max Win:** 25,000x bet
- **Grid:** 5 reels × 4 rows
- **Ways to Win:** 1,024
