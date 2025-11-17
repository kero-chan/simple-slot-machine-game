# Đặc Tả API Backend

## Tổng Quan

Backend cung cấp API RESTful cho trò chơi slot machine, xử lý logic trò chơi, quản lý phiên và giao dịch người chơi.

**Công Nghệ:**

- **Ngôn Ngữ:** Golang (Go 1.21+)
- **Framework:** Chi hoặc Gin (khuyến nghị)
- **Database:** PostgreSQL 15+
- **Cache:** Redis (tùy chọn nhưng khuyến nghị cho trạng thái phiên)
- **Xác Thực:** JWT tokens

## Base URL

```
Production:  https://api.yourdomain.com/v1
Development: http://localhost:8080/v1
```

## Xác Thực

Tất cả các endpoint trò chơi yêu cầu xác thực JWT.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Cấu Trúc JWT Token

```json
{
  "user_id": "uuid",
  "username": "string",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## Các Endpoint API

### 1. Xác Thực

#### POST /auth/login

Đăng nhập và nhận JWT token.

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

Đăng ký tài khoản người chơi mới.

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

### 2. Tài Khoản Người Chơi

#### GET /player/balance

Lấy số dư hiện tại của người chơi.

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

Lấy thông tin hồ sơ người chơi.

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

### 3. Phiên Trò Chơi

#### POST /game/session/start

Bắt đầu phiên trò chơi mới.

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

Kết thúc phiên trò chơi hiện tại.

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

### 4. Quay

#### POST /game/spin

Thực hiện một lần quay đơn.

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

Được kích hoạt tự động khi số lượng scatter >= 3.

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

Thực hiện free spin (không khấu trừ cược).

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

Lấy trạng thái phiên free spins hiện tại.

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

### 6. Lịch Sử Trò Chơi

#### GET /game/history

Lấy lịch sử trò chơi của người chơi (phân trang).

**Query Parameters:**

- `page` (int, mặc định: 1)
- `limit` (int, mặc định: 20, tối đa: 100)
- `start_date` (ISO 8601, tùy chọn)
- `end_date` (ISO 8601, tùy chọn)

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

Lấy thông tin chi tiết về một lần quay cụ thể.

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

### 7. Thống Kê

#### GET /game/stats

Lấy thống kê người chơi.

**Query Parameters:**

- `period` (string: "today", "week", "month", "all", mặc định: "all")

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

## Xử Lý Lỗi

### Response Lỗi Tiêu Chuẩn

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo lỗi dễ đọc cho người dùng",
    "details": {}
  }
}
```

### Mã Lỗi

| Mã | HTTP Status | Mô Tả |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Dữ liệu request không đúng định dạng |
| `UNAUTHORIZED` | 401 | Thiếu hoặc JWT token không hợp lệ |
| `FORBIDDEN` | 403 | Người dùng thiếu quyền |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên |
| `INSUFFICIENT_BALANCE` | 400 | Số dư người chơi quá thấp |
| `INVALID_BET_AMOUNT` | 400 | Cược ngoài phạm vi cho phép |
| `SESSION_NOT_FOUND` | 404 | Không tìm thấy phiên trò chơi |
| `SESSION_EXPIRED` | 400 | Phiên trò chơi đã hết hạn |
| `FREE_SPINS_NOT_ACTIVE` | 400 | Không có phiên free spins đang hoạt động |
| `INTERNAL_ERROR` | 500 | Lỗi server |
| `RNG_ERROR` | 500 | Tạo số ngẫu nhiên thất bại |
| `DATABASE_ERROR` | 500 | Hoạt động database thất bại |

---

## Xác Thực Request/Response

### Xác Thực Số Tiền Cược

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

### Xác Thực Grid

Grid phải luôn là:

- 5 cột (trục)
- 6 hàng (4 hiển thị + 2 hàng buffer)
- Mỗi ô chứa một chuỗi biểu tượng hợp lệ

---

## Giới Hạn Tốc Độ

### Giới Hạn

- **Endpoint Spin:** 10 requests mỗi giây mỗi người dùng
- **Các endpoint khác:** 100 requests mỗi phút mỗi người dùng

### Response Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1700000000
```

### Response Vượt Giới Hạn Tốc Độ (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Quá nhiều requests. Vui lòng thử lại sau.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## Hỗ Trợ WebSocket (Tùy Chọn)

Để cập nhật thời gian thực, xem xét kết nối WebSocket:

### Kết Nối

```
ws://localhost:8080/ws?token=<jwt_token>
```

### Các Loại Message

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

## Checklist Triển Khai

### Tính Năng Cốt Lõi

- [ ] Hệ thống xác thực JWT
- [ ] Đăng ký và đăng nhập người chơi
- [ ] Quản lý số dư với an toàn giao dịch
- [ ] Quản lý phiên
- [ ] Thực thi quay với RNG
- [ ] Triển khai cơ chế cascade
- [ ] Engine tính toán thắng
- [ ] Kích hoạt và quản lý Free spins
- [ ] Ghi log lịch sử trò chơi
- [ ] Tính toán thống kê

### Bảo Mật

- [ ] Xác thực đầu vào trên tất cả endpoints
- [ ] Phòng chống SQL injection (sử dụng parameterized queries)
- [ ] Giới hạn tốc độ
- [ ] Cấu hình CORS
- [ ] Hết hạn và làm mới JWT token
- [ ] Hash mật khẩu (bcrypt)
- [ ] Ghi log kiểm toán cho tất cả giao dịch

### Hiệu Suất

- [ ] Đánh index database
- [ ] Cache Redis cho trạng thái phiên
- [ ] Connection pooling
- [ ] Tối ưu hóa truy vấn
- [ ] Kiểm tra tải

### Kiểm Tra

- [ ] Unit tests cho logic trò chơi
- [ ] Integration tests cho API endpoints
- [ ] Kiểm tra xác thực RTP (10M+ vòng quay)
- [ ] Kiểm tra người dùng đồng thời
- [ ] Kiểm tra edge cases

---

## Cấu Trúc Package Golang

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
│   │   ├── engine.go       // Logic trò chơi cốt lõi
│   │   ├── rng.go          // Tạo số ngẫu nhiên
│   │   ├── cascade.go      // Cơ chế cascade
│   │   ├── freespins.go    // Logic free spins
│   │   ├── paytable.go     // Paytable và tính toán thắng
│   │   └── config.go       // Cấu hình trò chơi
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
│       └── simulator.go    // Công cụ mô phỏng RTP
├── go.mod
└── go.sum
```

---

## Mẫu Code Golang

### Spin Handler

```go
func (h *GameHandler) HandleSpin(w http.ResponseWriter, r *http.Request) {
    var req SpinRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
        return
    }

    // Xác thực số tiền cược
    if err := ValidateBetAmount(req.BetAmount); err != nil {
        respondError(w, http.StatusBadRequest, "INVALID_BET_AMOUNT", err.Error())
        return
    }

    // Lấy người chơi từ context (được đặt bởi auth middleware)
    player := r.Context().Value("player").(*models.Player)

    // Kiểm tra số dư
    if player.Balance < req.BetAmount {
        respondError(w, http.StatusBadRequest, "INSUFFICIENT_BALANCE", "Insufficient balance")
        return
    }

    // Thực hiện quay
    result, err := h.gameEngine.ExecuteSpin(player.ID, req.SessionID, req.BetAmount)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
        return
    }

    respondJSON(w, http.StatusOK, result)
}
```

### Tính Toán Thắng

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

    // Áp dụng giới hạn thắng tối đa
    maxWin := bet * 25000.0
    if totalWin > maxWin {
        totalWin = maxWin
    }

    return totalWin
}
```
