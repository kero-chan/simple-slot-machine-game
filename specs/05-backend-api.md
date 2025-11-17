# Backend API Specification

## Overview

The backend provides a RESTful API for the slot machine game, handling game logic, session management, and player transactions.

**Technology Stack:**

- **Language:** Golang (Go 1.21+)
- **Framework:** Chi or Gin (recommended)
- **Database:** PostgreSQL 15+
- **Cache:** Redis (optional but recommended for session state)
- **Authentication:** JWT tokens

## Base URL

```
Production:  https://api.yourdomain.com/v1
Development: http://localhost:8080/v1
```

## Authentication

All game endpoints require JWT authentication.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### JWT Token Structure

```json
{
  "user_id": "uuid",
  "username": "string",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## API Endpoints

### 1. Authentication

#### POST /auth/login

Login and receive JWT token.

**Request:**

```json
{
  "username": "player1",
  "password": "hashed_password"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "player1",
      "balance": 100000.00
    }
  }
}
```

#### POST /auth/register

Register new player account.

**Request:**

```json
{
  "username": "player1",
  "password": "secure_password",
  "email": "player@example.com"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "player1",
      "balance": 100000.00
    }
  }
}
```

---

### 2. Player Account

#### GET /player/balance

Get current player balance.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "balance": 95420.50,
    "currency": "credits"
  }
}
```

#### GET /player/profile

Get player profile information.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "player1",
    "email": "player@example.com",
    "balance": 95420.50,
    "total_spins": 1523,
    "total_wagered": 152300.00,
    "total_won": 147720.50,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 3. Game Session

#### POST /game/session/start

Start a new game session.

**Request:**

```json
{
  "bet_amount": 100.00
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "player_id": "uuid",
    "balance": 100000.00,
    "bet_amount": 100.00,
    "created_at": "2025-11-17T10:00:00Z"
  }
}
```

#### POST /game/session/end

End current game session.

**Request:**

```json
{
  "session_id": "uuid"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "total_spins": 45,
    "total_wagered": 4500.00,
    "total_won": 4120.00,
    "net_change": -380.00,
    "final_balance": 99620.00,
    "ended_at": "2025-11-17T10:30:00Z"
  }
}
```

---

### 4. Spin

#### POST /game/spin

Execute a single spin.

**Request:**

```json
{
  "session_id": "uuid",
  "bet_amount": 100.00
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "spin_id": "uuid",
    "session_id": "uuid",
    "bet_amount": 100.00,
    "balance_before": 100000.00,
    "balance_after": 100150.00,
    "grid": [
      ["fa", "zhong", "wutong", "liangtong", "bai", "wusuo"],
      ["zhong_gold", "fa", "wutong", "bawan", "liangsuo", "wild"],
      ["wutong", "bai", "fa_gold", "zhong", "wutong", "liangtong"],
      ["liangtong", "wusuo", "zhong", "fa", "liangsuo", "bawan"],
      ["fa", "wutong", "bai", "zhong", "wusuo", "liangtong"]
    ],
    "cascades": [
      {
        "cascade_number": 1,
        "multiplier": 1,
        "wins": [
          {
            "symbol": "fa",
            "count": 3,
            "ways": 8,
            "payout": 10,
            "win_amount": 40.00
          }
        ],
        "total_cascade_win": 40.00
      },
      {
        "cascade_number": 2,
        "multiplier": 2,
        "wins": [
          {
            "symbol": "zhong",
            "count": 4,
            "ways": 12,
            "payout": 20,
            "win_amount": 120.00
          }
        ],
        "total_cascade_win": 120.00
      }
    ],
    "total_win": 250.00,
    "scatter_count": 0,
    "free_spins_triggered": false,
    "timestamp": "2025-11-17T10:05:23Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for bet amount",
    "details": {
      "required": 100.00,
      "available": 50.00
    }
  }
}
```

---

### 5. Free Spins

#### POST /game/free-spins/trigger

Triggered automatically when scatter count >= 3.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "free_spins_session_id": "uuid",
    "scatter_count": 3,
    "free_spins_awarded": 12,
    "locked_bet_amount": 100.00,
    "message": "Free Spins Triggered! 12 spins awarded."
  }
}
```

#### POST /game/free-spins/spin

Execute a free spin (no bet deduction).

**Request:**

```json
{
  "free_spins_session_id": "uuid"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "spin_id": "uuid",
    "free_spins_session_id": "uuid",
    "spin_number": 1,
    "remaining_spins": 11,
    "bet_amount": 100.00,
    "grid": [...],
    "cascades": [
      {
        "cascade_number": 1,
        "multiplier": 2,
        "wins": [...],
        "total_cascade_win": 80.00
      }
    ],
    "total_win": 80.00,
    "scatter_count": 3,
    "retrigger": true,
    "additional_spins": 12,
    "new_remaining_spins": 23,
    "timestamp": "2025-11-17T10:06:15Z"
  }
}
```

#### GET /game/free-spins/status

Get current free spins session status.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "active": true,
    "free_spins_session_id": "uuid",
    "total_spins_awarded": 24,
    "spins_completed": 10,
    "remaining_spins": 14,
    "locked_bet_amount": 100.00,
    "total_won": 1250.00
  }
}
```

---

### 6. Game History

#### GET /game/history

Get player's game history (paginated).

**Query Parameters:**

- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `start_date` (ISO 8601, optional)
- `end_date` (ISO 8601, optional)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "spins": [
      {
        "spin_id": "uuid",
        "timestamp": "2025-11-17T10:05:23Z",
        "bet_amount": 100.00,
        "total_win": 250.00,
        "net_change": 150.00,
        "is_free_spin": false
      },
      {
        "spin_id": "uuid",
        "timestamp": "2025-11-17T10:04:15Z",
        "bet_amount": 100.00,
        "total_win": 0.00,
        "net_change": -100.00,
        "is_free_spin": false
      }
    ]
  }
}
```

#### GET /game/history/:spin_id

Get detailed information about a specific spin.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "spin_id": "uuid",
    "session_id": "uuid",
    "timestamp": "2025-11-17T10:05:23Z",
    "bet_amount": 100.00,
    "balance_before": 100000.00,
    "balance_after": 100150.00,
    "grid": [...],
    "cascades": [...],
    "total_win": 250.00,
    "scatter_count": 0,
    "free_spins_triggered": false,
    "is_free_spin": false
  }
}
```

---

### 7. Statistics

#### GET /game/stats

Get player statistics.

**Query Parameters:**

- `period` (string: "today", "week", "month", "all", default: "all")

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": "all",
    "total_spins": 1523,
    "total_wagered": 152300.00,
    "total_won": 147720.50,
    "net_profit": -4579.50,
    "biggest_win": 12500.00,
    "free_spins_triggered": 42,
    "total_free_spins_played": 508,
    "rtp": 96.99,
    "hit_frequency": 27.3
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request data |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `INSUFFICIENT_BALANCE` | 400 | Player balance too low |
| `INVALID_BET_AMOUNT` | 400 | Bet outside allowed range |
| `SESSION_NOT_FOUND` | 404 | Game session not found |
| `SESSION_EXPIRED` | 400 | Game session expired |
| `FREE_SPINS_NOT_ACTIVE` | 400 | No active free spins session |
| `INTERNAL_ERROR` | 500 | Server error |
| `RNG_ERROR` | 500 | Random number generation failed |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## Request/Response Validation

### Bet Amount Validation

```go
func ValidateBetAmount(bet float64) error {
    if bet < CONFIG.MinBet {
        return ErrBetTooLow
    }
    if bet > CONFIG.MaxBet {
        return ErrBetTooHigh
    }
    if math.Mod(bet, CONFIG.BetStep) != 0 {
        return ErrInvalidBetStep
    }
    return nil
}
```

### Grid Validation

The grid should always be:

- 5 columns (reels)
- 6 rows (4 visible + 2 buffer rows)
- Each cell contains a valid symbol string

---

## Rate Limiting

### Limits

- **Spin endpoint:** 10 requests per second per user
- **Other endpoints:** 100 requests per minute per user

### Response Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1700000000
```

### Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## WebSocket Support (Optional)

For real-time updates, consider WebSocket connection:

### Connection

```
ws://localhost:8080/ws?token=<jwt_token>
```

### Message Types

**Client → Server:**

```json
{
  "type": "SPIN",
  "data": {
    "bet_amount": 100.00
  }
}
```

**Server → Client:**

```json
{
  "type": "SPIN_RESULT",
  "data": {
    "spin_id": "uuid",
    "grid": [...],
    "cascades": [...],
    "total_win": 250.00
  }
}
```

---

## Implementation Checklist

### Core Features

- [ ] JWT authentication system
- [ ] Player registration and login
- [ ] Balance management with transaction safety
- [ ] Session management
- [ ] Spin execution with RNG
- [ ] Cascade mechanics implementation
- [ ] Win calculation engine
- [ ] Free spins trigger and management
- [ ] Game history logging
- [ ] Statistics calculation

### Security

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] JWT token expiration and refresh
- [ ] Password hashing (bcrypt)
- [ ] Audit logging for all transactions

### Performance

- [ ] Database indexing
- [ ] Redis caching for session state
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Load testing

### Testing

- [ ] Unit tests for game logic
- [ ] Integration tests for API endpoints
- [ ] RTP validation tests (10M+ spins)
- [ ] Concurrent user testing
- [ ] Edge case testing

---

## Golang Package Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── auth.go
│   │   │   ├── game.go
│   │   │   ├── player.go
│   │   │   └── history.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── ratelimit.go
│   │   │   └── logging.go
│   │   └── routes.go
│   ├── game/
│   │   ├── engine.go       // Core game logic
│   │   ├── rng.go          // Random number generation
│   │   ├── cascade.go      // Cascade mechanics
│   │   ├── freespins.go    // Free spins logic
│   │   ├── paytable.go     // Paytable and win calc
│   │   └── config.go       // Game configuration
│   ├── models/
│   │   ├── player.go
│   │   ├── session.go
│   │   ├── spin.go
│   │   └── freespins.go
│   ├── db/
│   │   ├── postgres.go
│   │   ├── migrations/
│   │   └── queries.go
│   └── utils/
│       ├── jwt.go
│       ├── errors.go
│       └── validators.go
├── pkg/
│   └── rtp/
│       └── simulator.go    // RTP simulation tool
├── go.mod
└── go.sum
```

---

## Sample Golang Code Snippets

### Spin Handler

```go
func (h *GameHandler) HandleSpin(w http.ResponseWriter, r *http.Request) {
    var req SpinRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
        return
    }

    // Validate bet amount
    if err := ValidateBetAmount(req.BetAmount); err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_BET_AMOUNT", err.Error())
        return
    }

    // Get player from context (set by auth middleware)
    player := r.Context().Value("player").(*models.Player)

    // Check balance
    if player.Balance < req.BetAmount {
        respondError(w, http.StatusBadRequest, "INSUFFICIENT_BALANCE", "Insufficient balance")
        return
    }

    // Execute spin
    result, err := h.gameEngine.ExecuteSpin(player.ID, req.SessionID, req.BetAmount)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
        return
    }

    respondJSON(w, http.StatusOK, result)
}
```

### Win Calculation

```go
func (e *GameEngine) CalculateWin(grid [][]string, bet float64, cascadeNum int, isFreeSpins bool) float64 {
    multiplier := GetMultiplier(cascadeNum, isFreeSpins)
    betPerWay := bet / 20.0
    totalWin := 0.0

    for symbol, payouts := range Paytable {
        ways, count := CountWays(grid, symbol)
        if count >= 3 {
            payout := payouts[count]
            win := float64(payout) * float64(ways) * multiplier * betPerWay
            totalWin += win
        }
    }

    // Apply max win cap
    maxWin := bet * 25000.0
    if totalWin > maxWin {
        totalWin = maxWin
    }

    return totalWin
}
```
