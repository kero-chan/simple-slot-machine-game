# Security Architecture

## Overview

This document defines the **Security Architecture** for the Mahjong Ways slot machine game to ensure:

- **100% server-authoritative gameplay** - Frontend cannot influence outcomes
- **Cryptographically secure RNG** - Provably fair and auditable
- **Complete audit trail** - Every action logged and traceable
- **Anti-tampering protection** - No client-side manipulation possible

---

## Security Principles

### 1. Zero Trust Frontend

**Rule:** NEVER trust anything from the frontend.

```
❌ Frontend sends: "I got 3 scatters, give me free spins"
✅ Backend calculates: "Here's your grid, I detected 3 scatters, triggering free spins"

❌ Frontend sends: "I won 5000 credits"
✅ Backend calculates: "Based on the grid I generated, you won 250 credits"

❌ Frontend sends: "Use these reel positions: [10, 20, 30, 40, 50]"
✅ Backend generates: "I'm using positions [47, 23, 89, 12, 56] from my secure RNG"
```

### 2. Server-Side Authority

**All game logic runs on backend:**

- ✅ RNG (Random Number Generation)
- ✅ Reel position selection
- ✅ Grid generation
- ✅ Win calculation
- ✅ Cascade logic
- ✅ Multiplier application
- ✅ Balance updates
- ✅ Free spins trigger/awards

**Frontend is display-only:**

- ✅ Render the grid sent by backend
- ✅ Display animations
- ✅ Show win amounts calculated by backend
- ✅ Update UI based on backend responses
- ❌ Never calculate wins
- ❌ Never generate random numbers
- ❌ Never determine game outcomes

### 3. Cryptographic Security

**Use cryptographically secure RNG:**

```go
import "crypto/rand"  // ✅ CORRECT
import "math/rand"    // ❌ NEVER USE FOR GAMBLING
```

---

## Threat Model

### Attack Vectors We Must Defend Against

1. **Request Tampering**
   - Attacker modifies bet amount after spin
   - Attacker replays winning spins
   - Attacker modifies session tokens

2. **RNG Prediction**
   - Attacker predicts next random numbers
   - Attacker seeds RNG with known values

3. **Man-in-the-Middle**
   - Attacker intercepts/modifies API responses
   - Attacker steals session tokens

4. **Rate Abuse**
   - Attacker spins thousands of times per second
   - Attacker creates multiple accounts

5. **Balance Manipulation**
   - Attacker modifies balance in requests
   - Attacker exploits race conditions

6. **Free Spins Exploitation**
   - Attacker claims free spins without trigger
   - Attacker replays free spins

---

## Security Implementation

### 1. Cryptographically Secure RNG

#### Implementation

```go
package rng

import (
    "crypto/rand"
    "encoding/binary"
    "fmt"
)

// SecureRNG provides cryptographically secure random number generation
type SecureRNG struct {
    // Internal state for audit trail
    lastSeed []byte
}

// NewSecureRNG creates a new cryptographically secure RNG
func NewSecureRNG() *SecureRNG {
    return &SecureRNG{}
}

// GenerateInt generates a cryptographically secure random integer [0, max)
func (rng *SecureRNG) GenerateInt(max int) (int, error) {
    if max <= 0 {
        return 0, fmt.Errorf("max must be positive")
    }

    // Calculate number of bytes needed
    byteLen := 8 // uint64

    // Generate random bytes
    randomBytes := make([]byte, byteLen)
    _, err := rand.Read(randomBytes)
    if err != nil {
        return 0, fmt.Errorf("failed to generate random bytes: %w", err)
    }

    // Store seed for audit
    rng.lastSeed = make([]byte, len(randomBytes))
    copy(rng.lastSeed, randomBytes)

    // Convert to uint64
    randomUint64 := binary.BigEndian.Uint64(randomBytes)

    // Map to range [0, max) with uniform distribution
    return int(randomUint64 % uint64(max)), nil
}

// GetLastSeed returns the last seed for audit purposes
func (rng *SecureRNG) GetLastSeed() []byte {
    return rng.lastSeed
}

// GenerateReelPosition generates a random reel position with audit trail
func (rng *SecureRNG) GenerateReelPosition(reelLength int, spinID string, reelIndex int) (int, []byte, error) {
    pos, err := rng.GenerateInt(reelLength)
    if err != nil {
        return 0, nil, err
    }

    // Create seed with context for audit
    seed := rng.GetLastSeed()

    // Log to audit database
    LogRNGAudit(spinID, reelIndex, pos, seed)

    return pos, seed, nil
}

func LogRNGAudit(spinID string, reelIndex int, position int, seed []byte) {
    // Store in database for compliance
    db.Exec(`
        INSERT INTO rng_audit (spin_id, reel_index, position, seed, created_at)
        VALUES ($1, $2, $3, $4, NOW())
    `, spinID, reelIndex, position, seed)
}
```

#### Audit Database Schema

```sql
CREATE TABLE rng_audit (
    id BIGSERIAL PRIMARY KEY,
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,
    reel_index INTEGER NOT NULL CHECK (reel_index BETWEEN 0 AND 4),
    position INTEGER NOT NULL,
    seed BYTEA NOT NULL,  -- Cryptographic seed used
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_rng_spin_id (spin_id)
);
```

---

### 2. Request Signing & Validation

Every critical request must be signed to prevent tampering.

#### Request Signing

```go
package security

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/base64"
    "time"
)

type SignedRequest struct {
    SessionID string    `json:"session_id"`
    BetAmount float64   `json:"bet_amount"`
    Timestamp int64     `json:"timestamp"`
    Nonce     string    `json:"nonce"`
    Signature string    `json:"signature"`
}

func SignRequest(sessionID string, betAmount float64, secretKey string) SignedRequest {
    timestamp := time.Now().Unix()
    nonce := GenerateNonce()

    // Create signature payload
    payload := fmt.Sprintf("%s:%f:%d:%s", sessionID, betAmount, timestamp, nonce)

    // Create HMAC signature
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
    // Check timestamp (prevent replay attacks)
    now := time.Now().Unix()
    if now - req.Timestamp > 60 { // 60 second window
        return fmt.Errorf("request expired")
    }

    // Check nonce hasn't been used (prevent replay attacks)
    if NonceExists(req.Nonce) {
        return fmt.Errorf("nonce already used (replay attack)")
    }

    // Verify signature
    payload := fmt.Sprintf("%s:%f:%d:%s", req.SessionID, req.BetAmount, req.Timestamp, req.Nonce)
    h := hmac.New(sha256.New, []byte(secretKey))
    h.Write([]byte(payload))
    expectedSignature := base64.StdEncoding.EncodeToString(h.Sum(nil))

    if !hmac.Equal([]byte(expectedSignature), []byte(req.Signature)) {
        return fmt.Errorf("invalid signature")
    }

    // Store nonce to prevent reuse
    StoreNonce(req.Nonce, time.Duration(120)*time.Second)

    return nil
}
```

#### Nonce Management (Redis)

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

### 3. Spin Execution Security

#### Secure Spin Flow

```go
package game

import (
    "fmt"
    "your-project/security"
    "your-project/rng"
)

type SpinRequest struct {
    SessionID string  `json:"session_id"`
    BetAmount float64 `json:"bet_amount"`
    Timestamp int64   `json:"timestamp"`
    Nonce     string  `json:"nonce"`
    Signature string  `json:"signature"`
}

type SpinResponse struct {
    SpinID        string      `json:"spin_id"`
    SessionID     string      `json:"session_id"`
    BetAmount     float64     `json:"bet_amount"`
    BalanceBefore float64     `json:"balance_before"`
    BalanceAfter  float64     `json:"balance_after"`
    ReelPositions [5]int      `json:"reel_positions"`
    Grid          [][]string  `json:"grid"`
    Cascades      []Cascade   `json:"cascades"`
    TotalWin      float64     `json:"total_win"`
    ScatterCount  int         `json:"scatter_count"`
    Timestamp     int64       `json:"timestamp"`
    Checksum      string      `json:"checksum"` // Response integrity check
}

func (h *GameHandler) ExecuteSpin(req SpinRequest) (*SpinResponse, error) {
    // === SECURITY CHECKS ===

    // 1. Validate request signature
    if err := security.ValidateRequest(req, h.secretKey); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // 2. Validate session
    session, err := h.sessionManager.GetSession(req.SessionID)
    if err != nil {
        return nil, fmt.Errorf("invalid session: %w", err)
    }

    // 3. Check session not expired
    if session.IsExpired() {
        return nil, fmt.Errorf("session expired")
    }

    // 4. Get player with row lock (prevent race conditions)
    tx, err := h.db.Begin()
    if err != nil {
        return nil, err
    }
    defer tx.Rollback()

    var player Player
    err = tx.QueryRow(`
        SELECT id, balance FROM players WHERE id = $1 FOR UPDATE
    `, session.PlayerID).Scan(&player.ID, &player.Balance)
    if err != nil {
        return nil, err
    }

    // 5. Validate bet amount
    if req.BetAmount < h.config.MinBet || req.BetAmount > h.config.MaxBet {
        return nil, fmt.Errorf("invalid bet amount")
    }

    // 6. Check sufficient balance
    if player.Balance < req.BetAmount {
        return nil, fmt.Errorf("insufficient balance")
    }

    // === SPIN EXECUTION ===

    // Generate spin ID
    spinID := uuid.New().String()

    // Generate reel positions using secure RNG
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

    // Generate grid from reel positions
    grid := h.generateGrid(reelPositions)

    // Calculate wins (server-side)
    cascades := h.calculateCascades(grid, req.BetAmount, false)

    totalWin := 0.0
    for _, cascade := range cascades {
        totalWin += cascade.TotalWin
    }

    // Count scatters
    scatterCount := h.countScatters(grid)

    // Update balance (within transaction)
    balanceBefore := player.Balance
    balanceAfter := balanceBefore - req.BetAmount + totalWin

    _, err = tx.Exec(`
        UPDATE players SET balance = $1, updated_at = NOW() WHERE id = $2
    `, balanceAfter, player.ID)
    if err != nil {
        return nil, err
    }

    // Store spin in database
    _, err = tx.Exec(`
        INSERT INTO spins (
            id, session_id, player_id, bet_amount, balance_before, balance_after,
            grid, total_win, scatter_count, reel_positions, rng_seeds, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, spinID, session.ID, player.ID, req.BetAmount, balanceBefore, balanceAfter,
       grid, totalWin, scatterCount, reelPositions, rngSeeds)
    if err != nil {
        return nil, err
    }

    // Commit transaction
    if err := tx.Commit(); err != nil {
        return nil, err
    }

    // Create response
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

    // Generate response checksum for integrity
    response.Checksum = h.generateResponseChecksum(response)

    return response, nil
}

func (h *GameHandler) generateResponseChecksum(resp *SpinResponse) string {
    // Create checksum of critical fields
    data := fmt.Sprintf("%s:%s:%f:%f:%f",
        resp.SpinID, resp.SessionID, resp.BetAmount, resp.BalanceAfter, resp.TotalWin)

    hash := sha256.Sum256([]byte(data + h.secretKey))
    return base64.StdEncoding.EncodeToString(hash[:])
}
```

---

### 4. Database Security

#### Connection Security

```go
// Use SSL for database connections
dsn := fmt.Sprintf(
    "host=%s port=%d user=%s password=%s dbname=%s sslmode=require",
    host, port, user, password, dbname,
)

db, err := sql.Open("postgres", dsn)
```

#### Sensitive Data Encryption

```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive player data
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email_encrypted BYTEA,  -- Encrypted email
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
    balance DECIMAL(15, 2) NOT NULL,
    -- ... other fields
);

-- Encrypt email on insert
INSERT INTO players (username, email_encrypted, password_hash)
VALUES (
    'player1',
    pgp_sym_encrypt('player@example.com', 'encryption-key'),
    crypt('password', gen_salt('bf', 12))
);

-- Decrypt email on read
SELECT
    username,
    pgp_sym_decrypt(email_encrypted, 'encryption-key') as email
FROM players
WHERE id = $1;
```

---

### 5. Rate Limiting

#### Implementation

```go
package middleware

import (
    "github.com/go-redis/redis_rate/v10"
    "net/http"
    "time"
)

func RateLimitMiddleware(limiter *redis_rate.Limiter) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get player ID from context
            playerID := r.Context().Value("player_id").(string)

            // Different limits for different endpoints
            var limit redis_rate.Limit
            switch r.URL.Path {
            case "/api/v1/game/spin":
                // Max 10 spins per second per player
                limit = redis_rate.PerSecond(10)
            case "/api/v1/auth/login":
                // Max 5 login attempts per minute
                limit = redis_rate.PerMinute(5)
            default:
                // Default: 100 requests per minute
                limit = redis_rate.PerMinute(100)
            }

            // Check rate limit
            res, err := limiter.Allow(r.Context(), playerID, limit)
            if err != nil {
                http.Error(w, "Rate limit error", http.StatusInternalServerError)
                return
            }

            if res.Allowed == 0 {
                w.Header().Set("X-RateLimit-Limit", fmt.Sprint(res.Limit.Rate))
                w.Header().Set("X-RateLimit-Remaining", "0")
                w.Header().Set("X-RateLimit-Reset", fmt.Sprint(time.Now().Add(res.RetryAfter).Unix()))
                http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                return
            }

            // Set rate limit headers
            w.Header().Set("X-RateLimit-Limit", fmt.Sprint(res.Limit.Rate))
            w.Header().Set("X-RateLimit-Remaining", fmt.Sprint(res.Remaining))

            next.ServeHTTP(w, r)
        })
    }
}
```

---

### 6. Session Security

#### Secure Session Management

```go
package session

import (
    "github.com/golang-jwt/jwt/v5"
    "time"
)

type SessionClaims struct {
    PlayerID  string `json:"player_id"`
    Username  string `json:"username"`
    SessionID string `json:"session_id"`
    jwt.RegisteredClaims
}

func CreateSession(playerID, username string) (string, error) {
    sessionID := uuid.New().String()

    claims := SessionClaims{
        PlayerID:  playerID,
        Username:  username,
        SessionID: sessionID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "mahjong-ways-api",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signedToken, err := token.SignedString([]byte(jwtSecret))
    if err != nil {
        return "", err
    }

    // Store session in Redis with TTL
    err = redisClient.Set(ctx, "session:"+sessionID, playerID, 30*time.Minute).Err()
    if err != nil {
        return "", err
    }

    return signedToken, nil
}

func ValidateSession(tokenString string) (*SessionClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &SessionClaims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(jwtSecret), nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*SessionClaims); ok && token.Valid {
        // Check session still exists in Redis
        exists, _ := redisClient.Exists(ctx, "session:"+claims.SessionID).Result()
        if exists == 0 {
            return nil, fmt.Errorf("session expired")
        }

        return claims, nil
    }

    return nil, fmt.Errorf("invalid token")
}

func InvalidateSession(sessionID string) error {
    return redisClient.Del(ctx, "session:"+sessionID).Err()
}
```

---

### 7. Audit Logging

#### Complete Audit Trail

```sql
CREATE TABLE security_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    player_id UUID,
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    success BOOLEAN,
    error_message TEXT,
    risk_score INTEGER,  -- 0-100, higher = more suspicious
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_security_player (player_id, created_at),
    INDEX idx_security_event (event_type, created_at),
    INDEX idx_security_risk (risk_score DESC, created_at)
);
```

#### Logging Critical Events

```go
func LogSecurityEvent(eventType string, playerID string, success bool, data map[string]interface{}) {
    riskScore := calculateRiskScore(eventType, data)

    db.Exec(`
        INSERT INTO security_audit_log (
            event_type, player_id, session_id, ip_address, user_agent,
            request_data, success, risk_score, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, eventType, playerID, data["session_id"], data["ip"], data["user_agent"],
       data, success, riskScore)

    // Alert if high risk
    if riskScore > 80 {
        AlertSecurityTeam(eventType, playerID, data)
    }
}

func calculateRiskScore(eventType string, data map[string]interface{}) int {
    score := 0

    // Multiple failed logins
    if eventType == "login_failed" {
        recentFailures := countRecentFailures(data["player_id"].(string))
        score += recentFailures * 20
    }

    // Unusual bet amount
    if eventType == "spin" {
        betAmount := data["bet_amount"].(float64)
        if betAmount > 1000 {
            score += 30
        }
    }

    // Multiple sessions from different IPs
    if hasSuspiciousIPPattern(data["player_id"].(string)) {
        score += 40
    }

    return min(score, 100)
}
```

---

## Frontend Security Measures

### 1. Never Trust Frontend Calculations

```javascript
// ❌ WRONG - Frontend calculates win
async function executeSpin() {
  const grid = generateRandomGrid()  // ❌ Never do this!
  const win = calculateWin(grid)      // ❌ Never do this!
  const response = await api.submitSpin({ grid, win }) // ❌ Server shouldn't accept this!
}

// ✅ CORRECT - Server calculates everything
async function executeSpin() {
  // Frontend only sends bet amount
  const response = await api.executeSpin(sessionId, betAmount)

  // Backend returns complete result
  const { grid, cascades, total_win, balance_after } = response.data

  // Frontend just displays what backend calculated
  renderGrid(grid)
  playCascadeAnimations(cascades)
  updateBalance(balance_after)
  showWinAmount(total_win)
}
```

### 2. Verify Response Integrity

```javascript
// Verify backend response hasn't been tampered with
function verifyResponse(response) {
  const { spin_id, session_id, bet_amount, balance_after, total_win, checksum } = response

  // Frontend can't verify cryptographic checksum (no secret key)
  // But can do basic sanity checks

  if (balance_after < 0) {
    throw new Error('Invalid balance')
  }

  if (total_win < 0) {
    throw new Error('Invalid win amount')
  }

  if (bet_amount < CONFIG.minBet || bet_amount > CONFIG.maxBet) {
    throw new Error('Invalid bet amount')
  }

  // Log checksum for debugging (backend validates this)
  console.log('Response checksum:', checksum)
}
```

### 3. Secure Local Storage

```javascript
// ❌ NEVER store sensitive data in localStorage
localStorage.setItem('balance', balance)          // ❌ Can be modified
localStorage.setItem('rng_seed', seed)            // ❌ Exposes game logic
localStorage.setItem('reel_positions', positions) // ❌ Exposes game state

// ✅ ONLY store non-sensitive data
localStorage.setItem('jwt_token', token)  // ✅ OK (but use httpOnly cookies better)
localStorage.setItem('ui_theme', theme)   // ✅ OK (no security impact)
localStorage.setItem('sound_volume', vol) // ✅ OK (no security impact)
```

---

## Security Checklist

### Backend

- [ ] Use crypto/rand for all RNG (NEVER math/rand)
- [ ] All game logic server-side only
- [ ] Request signature validation
- [ ] Nonce-based replay protection
- [ ] Row-level locking for balance updates
- [ ] Database connection SSL
- [ ] Password hashing with bcrypt (cost 12+)
- [ ] JWT with short expiration (30 min)
- [ ] Rate limiting per player per endpoint
- [ ] Complete audit logging
- [ ] RNG seed logging for compliance
- [ ] Response checksum generation
- [ ] Session timeout (30 minutes idle)
- [ ] IP-based anomaly detection
- [ ] Failed login attempt tracking

### Frontend

- [ ] NEVER calculate game outcomes
- [ ] NEVER generate random numbers for gameplay
- [ ] NEVER trust local storage data
- [ ] Always use HTTPS
- [ ] Validate all backend responses
- [ ] Clear sensitive data on logout
- [ ] No hardcoded API keys
- [ ] Content Security Policy headers
- [ ] XSS protection

### Infrastructure

- [ ] HTTPS/TLS 1.3 only
- [ ] Database encryption at rest
- [ ] Redis password protection
- [ ] Firewall rules (whitelist approach)
- [ ] DDoS protection (CloudFlare/AWS Shield)
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Compliance certification (MGA/UKGC)

---

## Compliance & Certification

### Required Audits

1. **RNG Certification**
   - Independent lab testing (eCOGRA, GLI, iTech Labs)
   - Proves RNG is truly random and unpredictable
   - Required for gaming licenses

2. **RTP Validation**
   - Simulate 100M+ spins
   - Prove actual RTP matches advertised RTP
   - Document variance and distribution

3. **Security Audit**
   - Penetration testing
   - Code review
   - Infrastructure audit

4. **Compliance Documentation**
   - Complete audit trail
   - Data retention policies
   - Player protection measures
   - Responsible gambling features

---

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Invalidate all active sessions
   - Lock affected accounts
   - Disable compromised endpoints
   - Alert security team

2. **Investigation**
   - Review security audit logs
   - Identify attack vector
   - Assess damage
   - Preserve evidence

3. **Remediation**
   - Patch vulnerability
   - Update security measures
   - Notify affected players
   - Report to authorities (if required)

4. **Post-Mortem**
   - Document incident
   - Update security procedures
   - Implement additional monitoring
   - Train team on lessons learned

---

## Testing & Validation

### Security Testing

```bash
# 1. Test RNG randomness
go test -run TestRNGRandomness -count 1000000

# 2. Test replay attack prevention
go test -run TestReplayAttackPrevention

# 3. Test rate limiting
go test -run TestRateLimiting

# 4. Load testing with security focus
artillery run load-test-security.yml

# 5. Penetration testing
# Use professional tools: Burp Suite, OWASP ZAP
```

### Automated Security Scans

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

## Summary

**Key Principle:** Frontend is ONLY for display. ALL game logic, RNG, and calculations happen server-side.

**Security Stack:**

- Cryptographically secure RNG (crypto/rand)
- Request signing (HMAC-SHA256)
- Nonce-based replay protection
- Row-level database locking
- Complete audit trail
- Rate limiting
- Session security (JWT + Redis)
- Response integrity checksums

**Result:** Unhackable gameplay, provably fair, compliance-ready.
