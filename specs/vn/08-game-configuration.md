# Hệ Thống Cấu Hình Trò Chơi

## Tổng Quan

Tài liệu này định nghĩa **Hệ Thống Cấu Hình Trò Chơi** để quản lý tất cả các tham số có thể điều chỉnh trong trò chơi slot machine Mahjong Ways.

**Trạng Thái Hiện Tại:** Cấu hình được hardcoded trong frontend \`constants.js\`
**Trạng Thái Mục Tiêu:** Cấu hình được quản lý bởi backend với đồng bộ hóa frontend

---

## Các Danh Mục Cấu Hình

### 1. Cấu Hình Logic Trò Chơi Backend
**Quan Trọng Cho RTP** - Phải được kiểm soát bởi backend, có thể kiểm toán, được phiên bản hóa

- Giá trị paytable
- Cấu hình reel strip
- Tỷ lệ/trọng số spawn biểu tượng
- Tiến trình multiplier
- Giải thưởng free spins
- Phạm vi cược
- Giới hạn thắng tối đa

### 2. Cấu Hình UI Frontend
**Không Ảnh Hưởng RTP** - Có thể vẫn được kiểm soát bởi frontend

- Thời lượng hoạt ảnh
- Kích thước canvas
- Kích thước và khoảng cách biểu tượng
- Cài đặt âm thanh
- Bố cục UI

---

## Cấu Hình Hiện Tại (từ constants.js)

### Cấu Hình Frontend Hiện Có

```javascript
// src/config/constants.js
export const CONFIG = {
  // Canvas/Display (CHỈ FRONTEND)
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },

  // Bố cục Trục (BACKEND nên cung cấp)
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4,
    fullyVisibleRows: 4,
    stripLength: 100,           // ← BACKEND
    symbolSize: 70,             // Hiển thị Frontend
    spacing: 8,                 // Hiển thị Frontend
    winCheckStartRow: 5,        // ← BACKEND
    winCheckEndRow: 8,          // ← BACKEND
  },

  // Paytable (PHẢI LÀ BACKEND)
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

  // Multipliers (PHẢI LÀ BACKEND)
  multipliers: [1, 2, 3, 5, 5, 5],           // Multiplier cascade trò chơi cơ bản
  freeSpinMultipliers: [2, 4, 6, 10, 10, 10], // Multiplier cascade Free spins

  // Animation (CHỈ FRONTEND)
  animation: {
    spinDuration: 1600,
    reelStagger: 150
  },

  // Quy tắc Trò chơi (PHẢI LÀ BACKEND)
  game: {
    initialCredits: 100000,      // ← BACKEND (số dư người chơi mới)
    minBet: 10,                   // ← BACKEND
    maxBet: 100,                  // ← BACKEND
    betStep: 2,                   // ← BACKEND
    bettingMultiplierRate: 0.1,   // ← BACKEND
    freeSpinsPerScatter: 12,      // ← BACKEND
    bonusScattersPerSpin: 2,      // ← BACKEND (kiểm soát spawn)
    minBonusToTrigger: 3,         // ← BACKEND
    maxBonusPerColumn: 1          // ← BACKEND (kiểm soát spawn)
  },

  // Tỷ lệ Spawn (PHẢI LÀ BACKEND - QUAN TRỌNG CHO RTP!)
  spawnRates: {
    bonusChance: 0.25,    // ← GIÁ TRỊ KIỂM TRA! Production: 0.03-0.05
    wildChance: 0.15,     // ← GIÁ TRỊ KIỂM TRA! Production: 0.02-0.03
    goldChance: 0.15      // ← GIÁ TRỊ KIỂM TRA! Production: 0.01-0.02
  }
}
```

---

## Schema Cấu Hình Backend

### Schema Database

```sql
-- Bảng phiên bản cấu hình
CREATE TABLE game_configurations (
    id SERIAL PRIMARY KEY,
    version_name VARCHAR(100) NOT NULL UNIQUE, -- ví dụ: "v1.0-production", "v1.1-test"
    description TEXT,

    -- Cấu hình Logic Trò chơi
    config_data JSONB NOT NULL,

    -- Metadata
    is_active BOOLEAN DEFAULT FALSE,
    is_test BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,

    -- Xác thực RTP
    target_rtp DECIMAL(5, 4) DEFAULT 96.92,  -- 96.92%
    validated_rtp DECIMAL(5, 4),              -- RTP thực tế từ mô phỏng
    simulation_spins BIGINT,                  -- Số vòng quay được kiểm tra
    validation_status VARCHAR(20),            -- 'pending', 'passed', 'failed'
    validated_at TIMESTAMP,

    CONSTRAINT unique_active_config EXCLUDE (is_active WITH =) WHERE (is_active = TRUE)
);

-- Cấu hình paytable
CREATE TABLE paytable_config (
    id SERIAL PRIMARY KEY,
    config_version_id INTEGER REFERENCES game_configurations(id) ON DELETE CASCADE,
    symbol_id VARCHAR(50) NOT NULL,
    payout_3 INTEGER,
    payout_4 INTEGER,
    payout_5 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cấu hình reel strip
CREATE TABLE reel_strip_config (
    id SERIAL PRIMARY KEY,
    config_version_id INTEGER REFERENCES game_configurations(id) ON DELETE CASCADE,
    reel_number INTEGER NOT NULL CHECK (reel_number BETWEEN 1 AND 5),
    strip_data JSONB NOT NULL,  -- Mảng biểu tượng
    strip_length INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log kiểm toán thay đổi cấu hình
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

## Cấu Trúc Dữ Liệu Cấu Hình

### Config JSON Backend Hoàn Chỉnh

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

## Các Endpoint API Cấu Hình

### Endpoints Admin/Quản Lý

#### GET /admin/config/active

Lấy cấu hình trò chơi đang hoạt động hiện tại.

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

#### POST /admin/config/create

Tạo phiên bản cấu hình mới.

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

---

### Endpoint Cấu Hình Trò Chơi Công Khai

#### GET /game/config

Lấy cấu hình trò chơi cho frontend (đã được làm sạch, không có dữ liệu nhạy cảm).

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
    "paytable": { /* paytable đầy đủ để hiển thị */ },
    "multipliers": {
      "base_game": [1, 2, 3, 5, 5, 5],
      "free_spins": [2, 4, 6, 10, 10, 10]
    },
    "free_spins": {
      "base_award": 12,
      "bonus_per_extra_scatter": 2,
      "min_scatters_to_trigger": 3
    }
    // LƯU Ý: KHÔNG bao gồm reel strips, trọng số biểu tượng, hoặc tỷ lệ spawn
  }
}
```

---

## Triển Khai Backend

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
    Version     string              \`json:"version"\`
    GameInfo    GameInfo            \`json:"game_info"\`
    Reels       ReelConfig          \`json:"reels"\`
    Paytable    map[string]Payouts  \`json:"paytable"\`
    Multipliers MultiplierConfig    \`json:"multipliers"\`
    Betting     BettingConfig       \`json:"betting"\`
    FreeSpins   FreeSpinsConfig     \`json:"free_spins"\`
    SymbolWeights map[string]map[string]int \`json:"symbol_weights"\`
    SpawnControls SpawnControlConfig \`json:"spawn_controls"\`
    PlayerDefaults PlayerDefaultsConfig \`json:"player_defaults"\`
    Limits      LimitsConfig        \`json:"limits"\`
}

type Payouts struct {
    Three int \`json:"3"\`
    Four  int \`json:"4"\`
    Five  int \`json:"5"\`
}

// Instance toàn cục config manager
var Manager *ConfigManager

func Initialize() error {
    Manager = &ConfigManager{}
    return Manager.LoadActiveConfig()
}

func (cm *ConfigManager) LoadActiveConfig() error {
    cm.mu.Lock()
    defer cm.mu.Unlock()

    // Tải từ database
    var configData string
    var configID int

    err := db.QueryRow(\`
        SELECT id, config_data
        FROM game_configurations
        WHERE is_active = TRUE
        LIMIT 1
    \`).Scan(&configID, &configData)

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

// Hot-reload cấu hình mà không cần restart
func (cm *ConfigManager) ReloadConfig() error {
    return cm.LoadActiveConfig()
}
```

---

## Đồng Bộ Hóa Cấu Hình Frontend

### Cấu Hình Frontend Đã Cập Nhật

```javascript
// src/config/constants.js

// Cấu hình cục bộ chỉ frontend (UI/Animation)
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

// Cấu hình backend (tải từ API)
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

---

## Checklist Kiểm Tra

- [ ] Tạo cấu hình ban đầu từ constants.js
- [ ] Xác thực cấu hình tải chính xác khi khởi động backend
- [ ] Kiểm tra hot-reload cấu hình mà không cần restart server
- [ ] Xác minh frontend nhận cấu hình qua API
- [ ] Kiểm tra cập nhật paytable phản ánh trong trò chơi
- [ ] Xác minh thay đổi multiplier hoạt động chính xác
- [ ] Kiểm tra thay đổi giới hạn cược
- [ ] Xác nhận mô phỏng RTP tạo ra kết quả mong đợi
- [ ] Kiểm tra chức năng rollback cấu hình
- [ ] Xác minh ghi log kiểm toán bắt giữ tất cả thay đổi
