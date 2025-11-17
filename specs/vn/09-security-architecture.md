# Kiến Trúc Bảo Mật

## Tổng Quan

Tài liệu này định nghĩa **Kiến Trúc Bảo Mật** cho trò chơi slot machine Mahjong Ways để đảm bảo:

- **Gameplay 100% quyền hạn từ server** - Frontend không thể ảnh hưởng kết quả
- **RNG an toàn bằng mật mã** - Công bằng có thể chứng minh và có thể kiểm toán
- **Theo dõi kiểm toán hoàn chỉnh** - Mọi hành động được ghi log và truy vết được
- **Bảo vệ chống giả mạo** - Không thể thao tác phía client

---

## Các Nguyên Tắc Bảo Mật

### 1. Frontend Không Tin Cậy

**Quy tắc:** KHÔNG BAO GIỜ tin tưởng bất cứ thứ gì từ frontend.

```
❌ Frontend gửi: "Tôi có 3 scatters, cho tôi free spins"
✅ Backend tính toán: "Đây là grid của bạn, tôi phát hiện 3 scatters, kích hoạt free spins"

❌ Frontend gửi: "Tôi thắng 5000 credits"
✅ Backend tính toán: "Dựa trên grid tôi tạo ra, bạn thắng 250 credits"

❌ Frontend gửi: "Sử dụng các vị trí trục này: [10, 20, 30, 40, 50]"
✅ Backend tạo ra: "Tôi đang sử dụng vị trí [47, 23, 89, 12, 56] từ RNG an toàn của tôi"
```

### 2. Quyền Hạn Phía Server

**Tất cả logic trò chơi chạy trên backend:**

- ✅ RNG (Random Number Generation)
- ✅ Lựa chọn vị trí trục
- ✅ Tạo grid
- ✅ Tính toán thắng
- ✅ Logic cascade
- ✅ Áp dụng multiplier
- ✅ Cập nhật số dư
- ✅ Kích hoạt/thưởng Free spins

**Frontend chỉ để hiển thị:**

- ✅ Render grid do backend gửi
- ✅ Hiển thị hoạt ảnh
- ✅ Hiển thị số tiền thắng do backend tính
- ✅ Cập nhật UI dựa trên responses backend
- ❌ Không bao giờ tính toán thắng
- ❌ Không bao giờ tạo số ngẫu nhiên
- ❌ Không bao giờ xác định kết quả trò chơi

### 3. Bảo Mật Mật Mã

**Sử dụng RNG an toàn bằng mật mã:**

```go
import "crypto/rand"  // ✅ ĐÚNG
import "math/rand"    // ❌ KHÔNG BAO GIỜ SỬ DỤNG CHO CỜ BẠC
```

---

## Mô Hình Mối Đe Dọa

### Các Vector Tấn Công Chúng Ta Phải Bảo Vệ

1. **Giả Mạo Request**
   - Kẻ tấn công sửa đổi số tiền cược sau khi quay
   - Kẻ tấn công phát lại các vòng quay thắng
   - Kẻ tấn công sửa đổi token phiên

2. **Dự Đoán RNG**
   - Kẻ tấn công dự đoán các số ngẫu nhiên tiếp theo
   - Kẻ tấn công seed RNG với các giá trị đã biết

3. **Man-in-the-Middle**
   - Kẻ tấn công chặn/sửa đổi responses API
   - Kẻ tấn công đánh cắp token phiên

4. **Lạm Dụng Tốc Độ**
   - Kẻ tấn công quay hàng nghìn lần mỗi giây
   - Kẻ tấn công tạo nhiều tài khoản

5. **Thao Túng Số Dư**
   - Kẻ tấn công sửa đổi số dư trong requests
   - Kẻ tấn công khai thác race conditions

6. **Khai Thác Free Spins**
   - Kẻ tấn công nhận free spins mà không kích hoạt
   - Kẻ tấn công phát lại free spins

---

## Triển Khai Bảo Mật

### 1. RNG An Toàn Bằng Mật Mã

#### Triển Khai

```go
package rng

import (
    "crypto/rand"
    "encoding/binary"
    "fmt"
)

// SecureRNG cung cấp tạo số ngẫu nhiên an toàn bằng mật mã
type SecureRNG struct {
    // Trạng thái nội bộ cho theo dõi kiểm toán
    lastSeed []byte
}

// NewSecureRNG tạo RNG an toàn bằng mật mã mới
func NewSecureRNG() *SecureRNG {
    return &SecureRNG{}
}

// GenerateInt tạo số nguyên ngẫu nhiên an toàn bằng mật mã [0, max)
func (rng *SecureRNG) GenerateInt(max int) (int, error) {
    if max <= 0 {
        return 0, fmt.Errorf("max must be positive")
    }

    // Tính số byte cần thiết
    byteLen := 8 // uint64

    // Tạo byte ngẫu nhiên
    randomBytes := make([]byte, byteLen)
    _, err := rand.Read(randomBytes)
    if err != nil {
        return 0, fmt.Errorf("failed to generate random bytes: %w", err)
    }

    // Lưu seed để kiểm toán
    rng.lastSeed = make([]byte, len(randomBytes))
    copy(rng.lastSeed, randomBytes)

    // Chuyển đổi sang uint64
    randomUint64 := binary.BigEndian.Uint64(randomBytes)

    // Ánh xạ vào phạm vi [0, max) với phân bố đồng đều
    return int(randomUint64 % uint64(max)), nil
}

// GetLastSeed trả về seed cuối cùng cho mục đích kiểm toán
func (rng *SecureRNG) GetLastSeed() []byte {
    return rng.lastSeed
}

// GenerateReelPosition tạo vị trí trục ngẫu nhiên với theo dõi kiểm toán
func (rng *SecureRNG) GenerateReelPosition(reelLength int, spinID string, reelIndex int) (int, []byte, error) {
    pos, err := rng.GenerateInt(reelLength)
    if err != nil {
        return 0, nil, err
    }

    // Tạo seed với ngữ cảnh để kiểm toán
    seed := rng.GetLastSeed()

    // Ghi log vào database kiểm toán
    LogRNGAudit(spinID, reelIndex, pos, seed)

    return pos, seed, nil
}

func LogRNGAudit(spinID string, reelIndex int, position int, seed []byte) {
    // Lưu trong database để tuân thủ
    db.Exec(\`
        INSERT INTO rng_audit (spin_id, reel_index, position, seed, created_at)
        VALUES ($1, $2, $3, $4, NOW())
    \`, spinID, reelIndex, position, seed)
}
```

#### Schema Database Kiểm Toán

```sql
CREATE TABLE rng_audit (
    id BIGSERIAL PRIMARY KEY,
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,
    reel_index INTEGER NOT NULL CHECK (reel_index BETWEEN 0 AND 4),
    position INTEGER NOT NULL,
    seed BYTEA NOT NULL,  -- Seed mật mã được sử dụng
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_rng_spin_id (spin_id)
);
```

---

### 2. Ký & Xác Thực Request

Mọi request quan trọng phải được ký để ngăn chặn giả mạo.

#### Ký Request

```go
package security

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/base64"
    "time"
)

type SignedRequest struct {
    SessionID string    \`json:"session_id"\`
    BetAmount float64   \`json:"bet_amount"\`
    Timestamp int64     \`json:"timestamp"\`
    Nonce     string    \`json:"nonce"\`
    Signature string    \`json:"signature"\`
}

func SignRequest(sessionID string, betAmount float64, secretKey string) SignedRequest {
    timestamp := time.Now().Unix()
    nonce := GenerateNonce()

    // Tạo payload chữ ký
    payload := fmt.Sprintf("%s:%f:%d:%s", sessionID, betAmount, timestamp, nonce)

    // Tạo chữ ký HMAC
    h := hmac.New(sha256.New, []byte(secretKey))
    h.Write([]byte(payload))
    signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

    return SignedRequest{
        SessionID: sessionID,
        BetAmount: betAmount,
        Timestamp: timestamp,
        Nonce:     nonce,
        Signature: signature,
    }
}

func ValidateRequest(req SignedRequest, secretKey string) error {
    // Kiểm tra timestamp (ngăn chặn tấn công phát lại)
    now := time.Now().Unix()
    if now - req.Timestamp > 60 { // cửa sổ 60 giây
        return fmt.Errorf("request expired")
    }

    // Kiểm tra nonce chưa được sử dụng (ngăn chặn tấn công phát lại)
    if NonceExists(req.Nonce) {
        return fmt.Errorf("nonce already used (replay attack)")
    }

    // Xác minh chữ ký
    payload := fmt.Sprintf("%s:%f:%d:%s", req.SessionID, req.BetAmount, req.Timestamp, req.Nonce)
    h := hmac.New(sha256.New, []byte(secretKey))
    h.Write([]byte(payload))
    expectedSignature := base64.StdEncoding.EncodeToString(h.Sum(nil))

    if !hmac.Equal([]byte(expectedSignature), []byte(req.Signature)) {
        return fmt.Errorf("invalid signature")
    }

    // Lưu nonce để ngăn chặn sử dụng lại
    StoreNonce(req.Nonce, time.Duration(120)*time.Second)

    return nil
}
```

#### Quản Lý Nonce (Redis)

```go
package security

import (
    "github.com/go-redis/redis/v8"
    "time"
)

var redisClient *redis.Client

func StoreNonce(nonce string, ttl time.Duration) error {
    return redisClient.Set(ctx, "nonce:"+nonce, "1", ttl).Err()
}

func NonceExists(nonce string) bool {
    exists, _ := redisClient.Exists(ctx, "nonce:"+nonce).Result()
    return exists > 0
}

func GenerateNonce() string {
    b := make([]byte, 16)
    rand.Read(b)
    return base64.URLEncoding.EncodeToString(b)
}
```

---

### 3. Bảo Mật Thực Thi Quay

#### Luồng Quay An Toàn

```go
package game

import (
    "fmt"
    "your-project/security"
    "your-project/rng"
)

type SpinRequest struct {
    SessionID string  \`json:"session_id"\`
    BetAmount float64 \`json:"bet_amount"\`
    Timestamp int64   \`json:"timestamp"\`
    Nonce     string  \`json:"nonce"\`
    Signature string  \`json:"signature"\`
}

type SpinResponse struct {
    SpinID        string      \`json:"spin_id"\`
    SessionID     string      \`json:"session_id"\`
    BetAmount     float64     \`json:"bet_amount"\`
    BalanceBefore float64     \`json:"balance_before"\`
    BalanceAfter  float64     \`json:"balance_after"\`
    ReelPositions [5]int      \`json:"reel_positions"\`
    Grid          [][]string  \`json:"grid"\`
    Cascades      []Cascade   \`json:"cascades"\`
    TotalWin      float64     \`json:"total_win"\`
    ScatterCount  int         \`json:"scatter_count"\`
    Timestamp     int64       \`json:"timestamp"\`
    Checksum      string      \`json:"checksum"\` // Kiểm tra tính toàn vẹn response
}

func (h *GameHandler) ExecuteSpin(req SpinRequest) (*SpinResponse, error) {
    // === KIỂM TRA BẢO MẬT ===

    // 1. Xác thực chữ ký request
    if err := security.ValidateRequest(req, h.secretKey); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // 2. Xác thực phiên
    session, err := h.sessionManager.GetSession(req.SessionID)
    if err != nil {
        return nil, fmt.Errorf("invalid session: %w", err)
    }

    // 3. Kiểm tra phiên chưa hết hạn
    if session.IsExpired() {
        return nil, fmt.Errorf("session expired")
    }

    // 4. Lấy người chơi với row lock (ngăn chặn race conditions)
    tx, err := h.db.Begin()
    if err != nil {
        return nil, err
    }
    defer tx.Rollback()

    var player Player
    err = tx.QueryRow(\`
        SELECT id, balance FROM players WHERE id = $1 FOR UPDATE
    \`, session.PlayerID).Scan(&player.ID, &player.Balance)
    if err != nil {
        return nil, err
    }

    // 5. Xác thực số tiền cược
    if req.BetAmount < h.config.MinBet || req.BetAmount > h.config.MaxBet {
        return nil, fmt.Errorf("invalid bet amount")
    }

    // 6. Kiểm tra số dư đủ
    if player.Balance < req.BetAmount {
        return nil, fmt.Errorf("insufficient balance")
    }

    // === THỰC THI QUAY ===

    // Tạo spin ID
    spinID := uuid.New().String()

    // Tạo vị trí trục sử dụng RNG an toàn
    rng := rng.NewSecureRNG()
    var reelPositions [5]int
    var rngSeeds [5][]byte

    for i := 0; i < 5; i++ {
        pos, seed, err := rng.GenerateReelPosition(h.reelStrips[i].Length, spinID, i)
        if err != nil {
            return nil, fmt.Errorf("RNG error: %w", err)
        }
        reelPositions[i] = pos
        rngSeeds[i] = seed
    }

    // Tạo grid từ vị trí trục
    grid := h.generateGrid(reelPositions)

    // Tính toán thắng (phía server)
    cascades := h.calculateCascades(grid, req.BetAmount, false)

    totalWin := 0.0
    for _, cascade := range cascades {
        totalWin += cascade.TotalWin
    }

    // Đếm scatters
    scatterCount := h.countScatters(grid)

    // Cập nhật số dư (trong giao dịch)
    balanceBefore := player.Balance
    balanceAfter := balanceBefore - req.BetAmount + totalWin

    _, err = tx.Exec(\`
        UPDATE players SET balance = $1, updated_at = NOW() WHERE id = $2
    \`, balanceAfter, player.ID)
    if err != nil {
        return nil, err
    }

    // Lưu trữ quay trong database
    _, err = tx.Exec(\`
        INSERT INTO spins (
            id, session_id, player_id, bet_amount, balance_before, balance_after,
            grid, total_win, scatter_count, reel_positions, rng_seeds, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    \`, spinID, session.ID, player.ID, req.BetAmount, balanceBefore, balanceAfter,
       grid, totalWin, scatterCount, reelPositions, rngSeeds)
    if err != nil {
        return nil, err
    }

    // Commit giao dịch
    if err := tx.Commit(); err != nil {
        return nil, err
    }

    // Tạo response
    response := &SpinResponse{
        SpinID:        spinID,
        SessionID:     req.SessionID,
        BetAmount:     req.BetAmount,
        BalanceBefore: balanceBefore,
        BalanceAfter:  balanceAfter,
        ReelPositions: reelPositions,
        Grid:          grid,
        Cascades:      cascades,
        TotalWin:      totalWin,
        ScatterCount:  scatterCount,
        Timestamp:     time.Now().Unix(),
    }

    // Tạo checksum response cho tính toàn vẹn
    response.Checksum = h.generateResponseChecksum(response)

    return response, nil
}

func (h *GameHandler) generateResponseChecksum(resp *SpinResponse) string {
    // Tạo checksum của các trường quan trọng
    data := fmt.Sprintf("%s:%s:%f:%f:%f",
        resp.SpinID, resp.SessionID, resp.BetAmount, resp.BalanceAfter, resp.TotalWin)

    hash := sha256.Sum256([]byte(data + h.secretKey))
    return base64.StdEncoding.EncodeToString(hash[:])
}
```

---

## Các Biện Pháp Bảo Mật Frontend

### 1. Không Bao Giờ Tin Tưởng Tính Toán Frontend

```javascript
// ❌ SAI - Frontend tính toán thắng
async function executeSpin() {
  const grid = generateRandomGrid()  // ❌ Không bao giờ làm điều này!
  const win = calculateWin(grid)      // ❌ Không bao giờ làm điều này!
  const response = await api.submitSpin({ grid, win }) // ❌ Server không nên chấp nhận điều này!
}

// ✅ ĐÚNG - Server tính toán mọi thứ
async function executeSpin() {
  // Frontend chỉ gửi số tiền cược
  const response = await api.executeSpin(sessionId, betAmount)

  // Backend trả về kết quả hoàn chỉnh
  const { grid, cascades, total_win, balance_after } = response.data

  // Frontend chỉ hiển thị những gì backend tính toán
  renderGrid(grid)
  playCascadeAnimations(cascades)
  updateBalance(balance_after)
  showWinAmount(total_win)
}
```

### 2. Xác Minh Tính Toàn Vẹn Response

```javascript
// Xác minh response backend chưa bị giả mạo
function verifyResponse(response) {
  const { spin_id, session_id, bet_amount, balance_after, total_win, checksum } = response

  // Frontend không thể xác minh checksum mật mã (không có secret key)
  // Nhưng có thể thực hiện kiểm tra cơ bản

  if (balance_after < 0) {
    throw new Error('Invalid balance')
  }

  if (total_win < 0) {
    throw new Error('Invalid win amount')
  }

  if (bet_amount < CONFIG.minBet || bet_amount > CONFIG.maxBet) {
    throw new Error('Invalid bet amount')
  }

  // Ghi log checksum để debug (backend xác thực điều này)
  console.log('Response checksum:', checksum)
}
```

### 3. Local Storage An Toàn

```javascript
// ❌ KHÔNG BAO GIỜ lưu trữ dữ liệu nhạy cảm trong localStorage
localStorage.setItem('balance', balance)          // ❌ Có thể bị sửa đổi
localStorage.setItem('rng_seed', seed)            // ❌ Phơi bày logic trò chơi
localStorage.setItem('reel_positions', positions) // ❌ Phơi bày trạng thái trò chơi

// ✅ CHỈ lưu trữ dữ liệu không nhạy cảm
localStorage.setItem('jwt_token', token)  // ✅ OK (nhưng sử dụng httpOnly cookies tốt hơn)
localStorage.setItem('ui_theme', theme)   // ✅ OK (không ảnh hưởng bảo mật)
localStorage.setItem('sound_volume', vol) // ✅ OK (không ảnh hưởng bảo mật)
```

---

## Checklist Bảo Mật

### Backend

- [ ] Sử dụng crypto/rand cho tất cả RNG (KHÔNG BAO GIỜ math/rand)
- [ ] Tất cả logic trò chơi chỉ phía server
- [ ] Xác thực chữ ký request
- [ ] Bảo vệ phát lại dựa trên Nonce
- [ ] Row-level locking cho cập nhật số dư
- [ ] SSL kết nối database
- [ ] Hash mật khẩu với bcrypt (cost 12+)
- [ ] JWT với hết hạn ngắn (30 phút)
- [ ] Giới hạn tốc độ mỗi người chơi mỗi endpoint
- [ ] Ghi log kiểm toán hoàn chỉnh
- [ ] Ghi log RNG seed để tuân thủ
- [ ] Tạo checksum response
- [ ] Timeout phiên (30 phút không hoạt động)
- [ ] Phát hiện bất thường dựa trên IP
- [ ] Theo dõi nỗ lực đăng nhập thất bại

### Frontend

- [ ] KHÔNG BAO GIỜ tính toán kết quả trò chơi
- [ ] KHÔNG BAO GIỜ tạo số ngẫu nhiên cho gameplay
- [ ] KHÔNG BAO GIỜ tin tưởng dữ liệu local storage
- [ ] Luôn sử dụng HTTPS
- [ ] Xác thực tất cả responses backend
- [ ] Xóa dữ liệu nhạy cảm khi đăng xuất
- [ ] Không có API keys được hardcode
- [ ] Headers Content Security Policy
- [ ] Bảo vệ XSS

### Hạ Tầng

- [ ] Chỉ HTTPS/TLS 1.3
- [ ] Mã hóa database tại chỗ
- [ ] Bảo vệ mật khẩu Redis
- [ ] Quy tắc firewall (cách tiếp cận whitelist)
- [ ] Bảo vệ DDoS (CloudFlare/AWS Shield)
- [ ] Kiểm toán bảo mật định kỳ
- [ ] Kiểm tra thâm nhập
- [ ] Chứng nhận tuân thủ (MGA/UKGC)

---

## Tuân Thủ & Chứng Nhận

### Kiểm Toán Yêu Cầu

1. **Chứng Nhận RNG**
   - Kiểm tra phòng thí nghiệm độc lập (eCOGRA, GLI, iTech Labs)
   - Chứng minh RNG thực sự ngẫu nhiên và không thể dự đoán
   - Yêu cầu cho giấy phép gaming

2. **Xác Thực RTP**
   - Mô phỏng 100M+ vòng quay
   - Chứng minh RTP thực tế khớp với RTP được quảng cáo
   - Tài liệu hóa phương sai và phân bố

3. **Kiểm Toán Bảo Mật**
   - Kiểm tra thâm nhập
   - Xem xét code
   - Kiểm toán hạ tầng

4. **Tài Liệu Tuân Thủ**
   - Theo dõi kiểm toán hoàn chỉnh
   - Chính sách lưu giữ dữ liệu
   - Biện pháp bảo vệ người chơi
   - Tính năng chơi có trách nhiệm

---

## Kiểm Tra & Xác Thực

### Kiểm Tra Bảo Mật

```bash
# 1. Kiểm tra tính ngẫu nhiên RNG
go test -run TestRNGRandomness -count 1000000

# 2. Kiểm tra ngăn chặn tấn công phát lại
go test -run TestReplayAttackPrevention

# 3. Kiểm tra giới hạn tốc độ
go test -run TestRateLimiting

# 4. Kiểm tra tải với trọng tâm bảo mật
artillery run load-test-security.yml

# 5. Kiểm tra thâm nhập
# Sử dụng công cụ chuyên nghiệp: Burp Suite, OWASP ZAP
```

### Quét Bảo Mật Tự Động

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Gosec Security Scanner
        uses: securego/gosec@master

      - name: Run npm audit
        run: npm audit

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
```

---

## Tóm Tắt

**Nguyên Tắc Chính:** Frontend CHỈ để hiển thị. TẤT CẢ logic trò chơi, RNG và tính toán xảy ra phía server.

**Ngăn Xếp Bảo Mật:**

- RNG an toàn bằng mật mã (crypto/rand)
- Ký request (HMAC-SHA256)
- Bảo vệ phát lại dựa trên Nonce
- Row-level database locking
- Theo dõi kiểm toán hoàn chỉnh
- Giới hạn tốc độ
- Bảo mật phiên (JWT + Redis)
- Checksum tính toàn vẹn response

**Kết Quả:** Gameplay không thể hack, công bằng có thể chứng minh, sẵn sàng tuân thủ.
