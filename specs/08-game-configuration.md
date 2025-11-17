# Game Configuration System

## Overview

This document defines the **Game Configuration System** for managing all tunable parameters in the Mahjong Ways slot machine game.

**Current State:** Configuration is hardcoded in frontend `constants.js`
**Target State:** Backend-managed configuration with frontend synchronization

---

## Configuration Categories

### 1. Backend Game Logic Configuration
**RTP-Critical** - Must be backend-controlled, auditable, versioned

- Paytable values
- Reel strip configurations
- Symbol spawn rates/weights
- Multiplier progressions
- Free spins awards
- Bet ranges
- Maximum win caps

### 2. Frontend UI Configuration
**Non-RTP** - Can remain frontend-controlled

- Animation durations
- Canvas dimensions
- Symbol sizes and spacing
- Sound settings
- UI layout

---

## Current Configuration (from constants.js)

### Existing Frontend Config

```javascript
// src/config/constants.js
export const CONFIG = {
  // Canvas/Display (FRONTEND ONLY)
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },

  // Reel Layout (BACKEND should provide)
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4,
    fullyVisibleRows: 4,
    stripLength: 100,           // ← BACKEND
    symbolSize: 70,             // Frontend display
    spacing: 8,                 // Frontend display
    winCheckStartRow: 5,        // ← BACKEND
    winCheckEndRow: 8,          // ← BACKEND
  },

  // Paytable (MUST BE BACKEND)
  paytable: {
    fa: { 3: 10, 4: 25, 5: 50 },
    zhong: { 3: 8, 4: 20, 5: 40 },
    bai: { 3: 6, 4: 15, 5: 30 },
    bawan: { 3: 5, 4: 10, 5: 15 },
    wusuo: { 3: 3, 4: 5, 5: 12 },
    wutong: { 3: 3, 4: 5, 5: 12 },
    liangsuo: { 3: 2, 4: 4, 5: 10 },
    liangtong: { 3: 1, 4: 3, 5: 6 },
    bonus: { 3: 1, 4: 3, 5: 6 },
    wild: { 3: 1, 4: 3, 5: 6 }
  },

  // Multipliers (MUST BE BACKEND)
  multipliers: [1, 2, 3, 5, 5, 5],           // Base game cascade multipliers
  freeSpinMultipliers: [2, 4, 6, 10, 10, 10], // Free spins cascade multipliers

  // Animation (FRONTEND ONLY)
  animation: {
    spinDuration: 1600,
    reelStagger: 150
  },

  // Game Rules (MUST BE BACKEND)
  game: {
    initialCredits: 100000,      // ← BACKEND (new player balance)
    minBet: 10,                   // ← BACKEND
    maxBet: 100,                  // ← BACKEND
    betStep: 2,                   // ← BACKEND
    bettingMultiplierRate: 0.1,   // ← BACKEND
    freeSpinsPerScatter: 12,      // ← BACKEND
    bonusScattersPerSpin: 2,      // ← BACKEND (spawn control)
    minBonusToTrigger: 3,         // ← BACKEND
    maxBonusPerColumn: 1          // ← BACKEND (spawn control)
  },

  // Spawn Rates (MUST BE BACKEND - RTP CRITICAL!)
  spawnRates: {
    bonusChance: 0.25,    // ← TESTING VALUE! Production: 0.03-0.05
    wildChance: 0.15,     // ← TESTING VALUE! Production: 0.02-0.03
    goldChance: 0.15      // ← TESTING VALUE! Production: 0.01-0.02
  }
}
```

---

## Backend Configuration Schema

### Database Schema

```sql
-- Configuration versions table
CREATE TABLE game_configurations (
    id SERIAL PRIMARY KEY,
    version_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "v1.0-production", "v1.1-test"
    description TEXT,

    -- Game Logic Config
    config_data JSONB NOT NULL,

    -- Metadata
    is_active BOOLEAN DEFAULT FALSE,
    is_test BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,

    -- RTP Validation
    target_rtp DECIMAL(5, 4) DEFAULT 96.92,  -- 96.92%
    validated_rtp DECIMAL(5, 4),              -- Actual RTP from simulation
    simulation_spins BIGINT,                  -- Number of spins tested
    validation_status VARCHAR(20),            -- 'pending', 'passed', 'failed'
    validated_at TIMESTAMP,

    CONSTRAINT unique_active_config EXCLUDE (is_active WITH =) WHERE (is_active = TRUE)
);

-- Paytable configuration
CREATE TABLE paytable_config (
    id SERIAL PRIMARY KEY,
    config_version_id INTEGER REFERENCES game_configurations(id) ON DELETE CASCADE,
    symbol_id VARCHAR(50) NOT NULL,
    payout_3 INTEGER,
    payout_4 INTEGER,
    payout_5 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reel strip configuration (from previous discussion)
CREATE TABLE reel_strip_config (
    id SERIAL PRIMARY KEY,
    config_version_id INTEGER REFERENCES game_configurations(id) ON DELETE CASCADE,
    reel_number INTEGER NOT NULL CHECK (reel_number BETWEEN 1 AND 5),
    strip_data JSONB NOT NULL,  -- Array of symbols
    strip_length INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration change audit log
CREATE TABLE config_audit_log (
    id SERIAL PRIMARY KEY,
    config_version_id INTEGER REFERENCES game_configurations(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'activated', 'deactivated', 'updated'
    changed_by VARCHAR(100) NOT NULL,
    old_config JSONB,
    new_config JSONB,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Configuration Data Structure

### Complete Backend Config JSON

```json
{
  "version": "1.0.0",
  "game_info": {
    "name": "Mahjong Ways",
    "variant": "MW1",
    "rtp_target": 96.92,
    "volatility": "high",
    "max_win_multiplier": 25000
  },

  "reels": {
    "count": 5,
    "visible_rows": 4,
    "buffer_rows": 6,
    "total_rows": 10,
    "strip_length": 100,
    "win_check_start_row": 5,
    "win_check_end_row": 8
  },

  "paytable": {
    "fa": { "3": 10, "4": 25, "5": 50 },
    "zhong": { "3": 8, "4": 20, "5": 40 },
    "bai": { "3": 6, "4": 15, "5": 30 },
    "bawan": { "3": 5, "4": 10, "5": 15 },
    "wusuo": { "3": 3, "4": 5, "5": 12 },
    "wutong": { "3": 3, "4": 5, "5": 12 },
    "liangsuo": { "3": 2, "4": 4, "5": 10 },
    "liangtong": { "3": 1, "4": 3, "5": 6 },
    "bonus": { "3": 1, "4": 3, "5": 6 },
    "wild": { "3": 1, "4": 3, "5": 6 },
    "gold": { "3": 10, "4": 100, "5": 500 }
  },

  "multipliers": {
    "base_game": [1, 2, 3, 5, 5, 5],
    "free_spins": [2, 4, 6, 10, 10, 10]
  },

  "betting": {
    "min_bet": 10,
    "max_bet": 1000,
    "bet_step": 10,
    "default_bet": 100,
    "bet_multiplier_rate": 0.1,
    "fixed_lines": 20
  },

  "free_spins": {
    "base_award": 12,
    "bonus_per_extra_scatter": 2,
    "min_scatters_to_trigger": 3,
    "can_retrigger": true,
    "max_retriggers": null
  },

  "symbol_weights": {
    "reel_1": {
      "wild": 2,
      "bonus": 3,
      "gold": 1,
      "fa": 8,
      "zhong": 10,
      "bai": 12,
      "bawan": 14,
      "wusuo": 16,
      "wutong": 16,
      "liangsuo": 18,
      "liangtong": 18
    },
    "reel_2": {
      "wild": 2,
      "wild_gold": 1,
      "bonus": 3,
      "gold": 1,
      "fa": 7,
      "fa_gold": 1,
      "zhong": 8,
      "zhong_gold": 1,
      "bai": 10,
      "bai_gold": 1,
      "bawan": 12,
      "bawan_gold": 1,
      "wusuo": 14,
      "wusuo_gold": 1,
      "wutong": 14,
      "wutong_gold": 1,
      "liangsuo": 16,
      "liangsuo_gold": 1,
      "liangtong": 16,
      "liangtong_gold": 1
    },
    "reel_3": {
      "comment": "Same as reel_2"
    },
    "reel_4": {
      "comment": "Same as reel_2"
    },
    "reel_5": {
      "comment": "Same as reel_1 (no golden variants)"
    }
  },

  "spawn_controls": {
    "bonus_max_per_column": 1,
    "bonus_max_per_spin": 2,
    "wild_max_per_column": null,
    "golden_only_reels": [2, 3, 4]
  },

  "player_defaults": {
    "initial_balance": 100000,
    "starting_bet": 100
  },

  "limits": {
    "max_win_cap": 25000,
    "max_cascades_per_spin": 100,
    "session_timeout_minutes": 30
  }
}
```

---

## Configuration API Endpoints

### Admin/Management Endpoints

#### GET /admin/config/active

Get currently active game configuration.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "version_name": "v1.0-production",
    "version_id": 1,
    "activated_at": "2025-11-01T00:00:00Z",
    "config": { /* full config JSON */ }
  }
}
```

#### GET /admin/config/list

List all configuration versions.

**Query Parameters:**
- `is_test` (boolean, optional) - Filter test configs
- `page` (int, default: 1)
- `limit` (int, default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "configs": [
      {
        "id": 1,
        "version_name": "v1.0-production",
        "is_active": true,
        "target_rtp": 96.92,
        "validated_rtp": 96.89,
        "validation_status": "passed",
        "created_at": "2025-11-01T00:00:00Z"
      },
      {
        "id": 2,
        "version_name": "v1.1-test",
        "is_active": false,
        "target_rtp": 96.92,
        "validated_rtp": null,
        "validation_status": "pending",
        "created_at": "2025-11-15T00:00:00Z"
      }
    ]
  }
}
```

#### POST /admin/config/create

Create a new configuration version.

**Request:**
```json
{
  "version_name": "v1.1-production",
  "description": "Updated paytable for higher fa symbol payout",
  "config_data": { /* full config JSON */ },
  "is_test": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "config_id": 3,
    "version_name": "v1.1-production",
    "validation_status": "pending",
    "message": "Configuration created. Please run RTP simulation before activation."
  }
}
```

#### POST /admin/config/:id/validate

Run RTP simulation to validate configuration.

**Request:**
```json
{
  "simulation_spins": 10000000,
  "parallel_threads": 8
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "config_id": 3,
    "simulation_spins": 10000000,
    "target_rtp": 96.92,
    "actual_rtp": 96.89,
    "deviation": -0.03,
    "validation_status": "passed",
    "metrics": {
      "hit_frequency": 27.3,
      "free_spins_trigger_rate": 3.8,
      "average_win": 0.85,
      "max_win_observed": 8500
    }
  }
}
```

#### POST /admin/config/:id/activate

Activate a configuration (makes it live).

**Request:**
```json
{
  "reason": "Activating v1.1 after successful RTP validation",
  "force": false  // Set true to bypass validation check
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "config_id": 3,
    "version_name": "v1.1-production",
    "activated_at": "2025-11-17T12:00:00Z",
    "previous_config_id": 1,
    "message": "Configuration v1.1-production is now active"
  }
}
```

#### GET /admin/config/:id/diff/:compare_id

Compare two configurations.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "config_a": "v1.0-production",
    "config_b": "v1.1-production",
    "differences": [
      {
        "path": "paytable.fa.5",
        "old_value": 50,
        "new_value": 55,
        "change": "+10%"
      },
      {
        "path": "symbol_weights.reel_1.fa",
        "old_value": 8,
        "new_value": 7,
        "change": "-12.5%"
      }
    ]
  }
}
```

---

### Public Game Config Endpoint

#### GET /game/config

Get game configuration for frontend (sanitized, no sensitive data).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "betting": {
      "min_bet": 10,
      "max_bet": 1000,
      "bet_step": 10,
      "default_bet": 100
    },
    "reels": {
      "count": 5,
      "visible_rows": 4
    },
    "paytable": { /* full paytable for display */ },
    "multipliers": {
      "base_game": [1, 2, 3, 5, 5, 5],
      "free_spins": [2, 4, 6, 10, 10, 10]
    },
    "free_spins": {
      "base_award": 12,
      "bonus_per_extra_scatter": 2,
      "min_scatters_to_trigger": 3
    }
    // NOTE: Does NOT include reel strips, symbol weights, or spawn rates
  }
}
```

---

## Backend Implementation

### Configuration Manager Service

```go
package config

import (
    "encoding/json"
    "sync"
)

type ConfigManager struct {
    mu            sync.RWMutex
    activeConfig  *GameConfig
    configID      int
}

type GameConfig struct {
    Version     string              `json:"version"`
    GameInfo    GameInfo            `json:"game_info"`
    Reels       ReelConfig          `json:"reels"`
    Paytable    map[string]Payouts  `json:"paytable"`
    Multipliers MultiplierConfig    `json:"multipliers"`
    Betting     BettingConfig       `json:"betting"`
    FreeSpins   FreeSpinsConfig     `json:"free_spins"`
    SymbolWeights map[string]map[string]int `json:"symbol_weights"`
    SpawnControls SpawnControlConfig `json:"spawn_controls"`
    PlayerDefaults PlayerDefaultsConfig `json:"player_defaults"`
    Limits      LimitsConfig        `json:"limits"`
}

type Payouts struct {
    Three int `json:"3"`
    Four  int `json:"4"`
    Five  int `json:"5"`
}

// Global config manager instance
var Manager *ConfigManager

func Initialize() error {
    Manager = &ConfigManager{}
    return Manager.LoadActiveConfig()
}

func (cm *ConfigManager) LoadActiveConfig() error {
    cm.mu.Lock()
    defer cm.mu.Unlock()

    // Load from database
    var configData string
    var configID int

    err := db.QueryRow(`
        SELECT id, config_data
        FROM game_configurations
        WHERE is_active = TRUE
        LIMIT 1
    `).Scan(&configID, &configData)

    if err != nil {
        return err
    }

    var config GameConfig
    if err := json.Unmarshal([]byte(configData), &config); err != nil {
        return err
    }

    cm.activeConfig = &config
    cm.configID = configID

    return nil
}

func (cm *ConfigManager) GetConfig() *GameConfig {
    cm.mu.RLock()
    defer cm.mu.RUnlock()
    return cm.activeConfig
}

func (cm *ConfigManager) GetPaytable() map[string]Payouts {
    cm.mu.RLock()
    defer cm.mu.RUnlock()
    return cm.activeConfig.Paytable
}

func (cm *ConfigManager) GetMultiplier(cascadeNum int, isFreeSpins bool) int {
    cm.mu.RLock()
    defer cm.mu.RUnlock()

    var multipliers []int
    if isFreeSpins {
        multipliers = cm.activeConfig.Multipliers.FreeSpins
    } else {
        multipliers = cm.activeConfig.Multipliers.BaseGame
    }

    idx := cascadeNum - 1
    if idx >= len(multipliers) {
        idx = len(multipliers) - 1
    }

    return multipliers[idx]
}

// Hot-reload configuration without restart
func (cm *ConfigManager) ReloadConfig() error {
    return cm.LoadActiveConfig()
}
```

### Usage in Game Logic

```go
package game

import "your-project/config"

func CalculateWin(symbol string, count int, ways int, cascadeNum int, isFreeSpins bool, bet float64) float64 {
    // Get paytable from config
    paytable := config.Manager.GetPaytable()

    payouts, exists := paytable[symbol]
    if !exists {
        return 0
    }

    var payout int
    switch count {
    case 3:
        payout = payouts.Three
    case 4:
        payout = payouts.Four
    case 5:
        payout = payouts.Five
    default:
        return 0
    }

    // Get multiplier from config
    multiplier := config.Manager.GetMultiplier(cascadeNum, isFreeSpins)

    betPerWay := bet / float64(config.Manager.GetConfig().Betting.FixedLines)

    win := float64(payout) * float64(ways) * float64(multiplier) * betPerWay

    // Check max win cap
    maxWin := bet * float64(config.Manager.GetConfig().Limits.MaxWinCap)
    if win > maxWin {
        win = maxWin
    }

    return win
}
```

---

## Frontend Configuration Sync

### Updated Frontend Config

```javascript
// src/config/constants.js

// Local frontend-only config (UI/Animation)
export const FRONTEND_CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    symbolSize: 70,
    spacing: 8
  },
  animation: {
    spinDuration: 1600,
    reelStagger: 150,
    cascadeExplosionDuration: 800,
    symbolDropDuration: 600,
    multiplierPopupDuration: 500
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 1.0
  }
}

// Backend config (loaded from API)
let GAME_CONFIG = null

export async function loadGameConfig() {
  const response = await fetch('/api/v1/game/config')
  const data = await response.json()
  GAME_CONFIG = data.data
  return GAME_CONFIG
}

export function getGameConfig() {
  return GAME_CONFIG
}

export function getPaytable() {
  return GAME_CONFIG?.paytable || {}
}

export function getMultipliers() {
  return GAME_CONFIG?.multipliers || {}
}

export function getBettingLimits() {
  return GAME_CONFIG?.betting || {}
}
```

### Usage in Frontend

```javascript
// src/composables/slotMachine/useGameLogic.js

import { loadGameConfig, getGameConfig, getPaytable } from '@/config/constants'
import { onMounted } from 'vue'

export function useGameLogic() {
  onMounted(async () => {
    // Load game config from backend on app start
    await loadGameConfig()

    // Now we have access to backend config
    const config = getGameConfig()
    console.log('Min bet:', config.betting.min_bet)
    console.log('Max bet:', config.betting.max_bet)

    const paytable = getPaytable()
    console.log('FA 5-of-a-kind payout:', paytable.fa[5])
  })

  // ... rest of game logic
}
```

---

## Configuration Migration Strategy

### Phase 1: Add Backend Config System
1. Create database tables
2. Implement config manager service
3. Create admin API endpoints
4. Add `/game/config` public endpoint

### Phase 2: Migrate Existing Config
1. Export current `constants.js` values to JSON
2. Create initial config version in database
3. Run RTP validation simulation
4. Activate config

### Phase 3: Update Frontend
1. Add config loader to frontend
2. Replace hardcoded values with backend config
3. Keep UI/animation config local
4. Test integration

### Phase 4: Production Deployment
1. Deploy backend with config system
2. Verify config loading
3. Monitor for issues
4. Enable admin access

---

## Configuration Best Practices

### DO:
✅ Version all configuration changes
✅ Always validate RTP before activating
✅ Log all config changes in audit log
✅ Test new configs in test environment first
✅ Keep paytable and spawn rates in backend
✅ Cache config in memory for performance

### DON'T:
❌ Change active config without validation
❌ Expose reel strips or symbol weights to frontend
❌ Allow config changes without audit trail
❌ Skip RTP simulation (even for "minor" changes)
❌ Deploy config changes during peak hours
❌ Store sensitive config in frontend code

---

## Testing Checklist

- [ ] Create initial config from constants.js
- [ ] Validate config loads correctly on backend startup
- [ ] Test config hot-reload without server restart
- [ ] Verify frontend receives config via API
- [ ] Test paytable updates reflect in game
- [ ] Verify multiplier changes work correctly
- [ ] Test betting limit changes
- [ ] Confirm RTP simulation produces expected results
- [ ] Test config rollback functionality
- [ ] Verify audit logging captures all changes

---

## Next Steps

1. Review and approve configuration schema
2. Implement database tables
3. Build config manager service
4. Create admin API endpoints
5. Migrate current constants.js to first config version
6. Update frontend to load config from backend
7. Test full integration
