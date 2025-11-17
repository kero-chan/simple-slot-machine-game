# Schema Database (PostgreSQL)

## Tổng Quan

Tài liệu này định nghĩa schema database PostgreSQL cho backend trò chơi slot machine Mahjong Ways.

**Database:** PostgreSQL 15+
**Extensions:** uuid-ossp, pgcrypto

---

## Sơ Đồ Quan Hệ Thực Thể

```
┌─────────────┐
│   players   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐         ┌──────────────────┐
│  game_sessions  │ 1 ──N── │  spins           │
└─────────────────┘         └──────────────────┘
                                     │ 1
                                     │
                                     │ N
                            ┌─────────┴──────────┐
                            │  cascades          │
                            └────────────────────┘
                            │  cascade_wins      │
                            └────────────────────┘

┌─────────────────┐
│  free_spins     │
│  _sessions      │
└─────────────────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│ free_spins      │
│ _spins          │
└─────────────────┘

┌─────────────────┐
│  transactions   │
└─────────────────┘

┌─────────────────┐
│  audit_logs     │
└─────────────────┘
```

---

## Định Nghĩa Bảng

### 1. players

Lưu trữ thông tin tài khoản người chơi.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 100000.00 NOT NULL,

    -- Thống kê
    total_spins INTEGER DEFAULT 0,
    total_wagered DECIMAL(15, 2) DEFAULT 0.00,
    total_won DECIMAL(15, 2) DEFAULT 0.00,

    -- Trạng thái
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT balance_non_negative CHECK (balance >= 0),
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_created_at ON players(created_at);
```

---

### 2. game_sessions

Theo dõi các phiên trò chơi riêng lẻ.

```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- Dữ liệu phiên
    bet_amount DECIMAL(10, 2) NOT NULL,
    starting_balance DECIMAL(15, 2) NOT NULL,
    ending_balance DECIMAL(15, 2),

    -- Thống kê
    total_spins INTEGER DEFAULT 0,
    total_wagered DECIMAL(15, 2) DEFAULT 0.00,
    total_won DECIMAL(15, 2) DEFAULT 0.00,
    net_change DECIMAL(15, 2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT bet_amount_positive CHECK (bet_amount > 0)
);

CREATE INDEX idx_sessions_player_id ON game_sessions(player_id);
CREATE INDEX idx_sessions_created_at ON game_sessions(created_at);
CREATE INDEX idx_sessions_ended_at ON game_sessions(ended_at);
```

---

### 3. spins

Ghi lại mọi lần quay được thực hiện (trò chơi cơ bản và free spins).

```sql
CREATE TABLE spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- Dữ liệu quay
    bet_amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,

    -- Trạng thái Grid (JSON)
    grid JSONB NOT NULL,

    -- Dữ liệu thắng
    total_win DECIMAL(15, 2) DEFAULT 0.00,
    scatter_count INTEGER DEFAULT 0,

    -- Free spins
    is_free_spin BOOLEAN DEFAULT FALSE,
    free_spins_session_id UUID REFERENCES free_spins_sessions(id),
    free_spins_triggered BOOLEAN DEFAULT FALSE,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT scatter_count_valid CHECK (scatter_count >= 0 AND scatter_count <= 5)
);

CREATE INDEX idx_spins_session_id ON spins(session_id);
CREATE INDEX idx_spins_player_id ON spins(player_id);
CREATE INDEX idx_spins_created_at ON spins(created_at);
CREATE INDEX idx_spins_is_free_spin ON spins(is_free_spin);
CREATE INDEX idx_spins_free_spins_session_id ON spins(free_spins_session_id);

-- GIN index cho truy vấn JSONB grid
CREATE INDEX idx_spins_grid ON spins USING GIN(grid);
```

---

### 4. cascades

Ghi lại mỗi cascade trong một lần quay.

```sql
CREATE TABLE cascades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,

    -- Dữ liệu cascade
    cascade_number INTEGER NOT NULL,
    multiplier INTEGER NOT NULL,
    total_cascade_win DECIMAL(15, 2) DEFAULT 0.00,

    -- Grid sau cascade (JSON)
    grid_after JSONB,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT cascade_number_positive CHECK (cascade_number > 0),
    CONSTRAINT multiplier_valid CHECK (multiplier IN (1, 2, 3, 4, 5, 6, 10))
);

CREATE INDEX idx_cascades_spin_id ON cascades(spin_id);
CREATE INDEX idx_cascades_cascade_number ON cascades(cascade_number);
```

---

### 5. cascade_wins

Ghi lại các tổ hợp thắng riêng lẻ trong mỗi cascade.

```sql
CREATE TABLE cascade_wins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cascade_id UUID NOT NULL REFERENCES cascades(id) ON DELETE CASCADE,

    -- Dữ liệu thắng
    symbol VARCHAR(50) NOT NULL,
    symbol_count INTEGER NOT NULL,
    ways_count INTEGER NOT NULL,
    payout_multiplier DECIMAL(10, 2) NOT NULL,
    win_amount DECIMAL(15, 2) NOT NULL,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT symbol_count_valid CHECK (symbol_count >= 3 AND symbol_count <= 5),
    CONSTRAINT ways_count_positive CHECK (ways_count > 0)
);

CREATE INDEX idx_cascade_wins_cascade_id ON cascade_wins(cascade_id);
CREATE INDEX idx_cascade_wins_symbol ON cascade_wins(symbol);
```

---

### 6. free_spins_sessions

Theo dõi các phiên bonus free spins.

```sql
CREATE TABLE free_spins_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    triggered_by_spin_id UUID REFERENCES spins(id) ON DELETE SET NULL,

    -- Dữ liệu Free spins
    scatter_count INTEGER NOT NULL,
    total_spins_awarded INTEGER NOT NULL,
    spins_completed INTEGER DEFAULT 0,
    remaining_spins INTEGER NOT NULL,
    locked_bet_amount DECIMAL(10, 2) NOT NULL,

    -- Theo dõi thắng
    total_won DECIMAL(15, 2) DEFAULT 0.00,

    -- Trạng thái
    is_active BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT scatter_count_min CHECK (scatter_count >= 3),
    CONSTRAINT remaining_spins_non_negative CHECK (remaining_spins >= 0)
);

CREATE INDEX idx_free_spins_sessions_player_id ON free_spins_sessions(player_id);
CREATE INDEX idx_free_spins_sessions_is_active ON free_spins_sessions(is_active);
CREATE INDEX idx_free_spins_sessions_created_at ON free_spins_sessions(created_at);
```

---

### 7. free_spins_spins

Ghi lại các vòng quay riêng lẻ trong phiên free spins (phi chuẩn hóa cho phân tích).

```sql
CREATE TABLE free_spins_spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    free_spins_session_id UUID NOT NULL REFERENCES free_spins_sessions(id) ON DELETE CASCADE,
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,

    -- Theo dõi quay
    spin_number INTEGER NOT NULL,
    win_amount DECIMAL(15, 2) DEFAULT 0.00,

    -- Theo dõi kích hoạt lại
    scatter_count INTEGER DEFAULT 0,
    retriggered BOOLEAN DEFAULT FALSE,
    additional_spins_awarded INTEGER DEFAULT 0,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT spin_number_positive CHECK (spin_number > 0)
);

CREATE INDEX idx_free_spins_spins_session_id ON free_spins_spins(free_spins_session_id);
CREATE INDEX idx_free_spins_spins_spin_id ON free_spins_spins(spin_id);
```

---

### 8. transactions

Ghi log tất cả thay đổi số dư để kiểm toán.

```sql
CREATE TYPE transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'bet',
    'win',
    'refund',
    'bonus',
    'adjustment'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- Dữ liệu giao dịch
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,

    -- Bản ghi liên quan
    spin_id UUID REFERENCES spins(id) ON DELETE SET NULL,
    session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,

    -- Metadata
    description TEXT,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT balance_after_correct CHECK (
        balance_after = balance_before + CASE
            WHEN type IN ('deposit', 'win', 'bonus', 'refund') THEN amount
            WHEN type IN ('withdrawal', 'bet') THEN -amount
            ELSE 0
        END
    )
);

CREATE INDEX idx_transactions_player_id ON transactions(player_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_spin_id ON transactions(spin_id);
CREATE INDEX idx_transactions_session_id ON transactions(session_id);
```

---

### 9. audit_logs

Theo dõi kiểm toán toàn diện để tuân thủ.

```sql
CREATE TYPE audit_action AS ENUM (
    'player_register',
    'player_login',
    'player_logout',
    'session_start',
    'session_end',
    'spin_execute',
    'free_spins_trigger',
    'balance_change',
    'settings_change'
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tác nhân
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,

    -- Hành động
    action audit_action NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,

    -- Dữ liệu request
    ip_address INET,
    user_agent TEXT,

    -- Chi tiết
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_player_id ON audit_logs(player_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

---

## Views

### player_statistics

View thống kê người chơi tổng hợp.

```sql
CREATE VIEW player_statistics AS
SELECT
    p.id AS player_id,
    p.username,
    p.balance,
    COUNT(DISTINCT s.id) AS total_spins,
    COALESCE(SUM(s.bet_amount), 0) AS total_wagered,
    COALESCE(SUM(s.total_win), 0) AS total_won,
    COALESCE(SUM(s.total_win - s.bet_amount), 0) AS net_profit,
    COALESCE(MAX(s.total_win), 0) AS biggest_win,
    COUNT(DISTINCT fs.id) AS free_spins_triggered,
    COALESCE(SUM(CASE WHEN s.is_free_spin THEN 1 ELSE 0 END), 0) AS total_free_spins_played,
    CASE
        WHEN SUM(s.bet_amount) > 0
        THEN (SUM(s.total_win) / SUM(s.bet_amount)) * 100
        ELSE 0
    END AS rtp_percentage,
    CASE
        WHEN COUNT(s.id) > 0
        THEN (COUNT(CASE WHEN s.total_win > 0 THEN 1 END)::FLOAT / COUNT(s.id)) * 100
        ELSE 0
    END AS hit_frequency_percentage
FROM players p
LEFT JOIN spins s ON s.player_id = p.id
LEFT JOIN free_spins_sessions fs ON fs.player_id = p.id
GROUP BY p.id, p.username, p.balance;
```

### recent_big_wins

View các lần thắng lớn gần đây (thắng > 100x cược).

```sql
CREATE VIEW recent_big_wins AS
SELECT
    s.id AS spin_id,
    p.username,
    s.bet_amount,
    s.total_win,
    (s.total_win / s.bet_amount) AS win_multiplier,
    s.is_free_spin,
    s.created_at
FROM spins s
JOIN players p ON p.id = s.player_id
WHERE s.total_win > s.bet_amount * 100
ORDER BY s.created_at DESC
LIMIT 100;
```

---

## Functions

### update_player_balance

Hàm cập nhật số dư an toàn với hỗ trợ giao dịch.

```sql
CREATE OR REPLACE FUNCTION update_player_balance(
    p_player_id UUID,
    p_amount DECIMAL(15, 2),
    p_transaction_type transaction_type,
    p_spin_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS DECIMAL(15, 2) AS $$
DECLARE
    v_balance_before DECIMAL(15, 2);
    v_balance_after DECIMAL(15, 2);
BEGIN
    -- Khóa hàng người chơi
    SELECT balance INTO v_balance_before
    FROM players
    WHERE id = p_player_id
    FOR UPDATE;

    -- Tính số dư mới
    IF p_transaction_type IN ('deposit', 'win', 'bonus', 'refund') THEN
        v_balance_after := v_balance_before + p_amount;
    ELSIF p_transaction_type IN ('withdrawal', 'bet') THEN
        v_balance_after := v_balance_before - p_amount;

        -- Kiểm tra số dư âm
        IF v_balance_after < 0 THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;

    -- Cập nhật số dư người chơi
    UPDATE players
    SET balance = v_balance_after,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_player_id;

    -- Ghi log giao dịch
    INSERT INTO transactions (
        player_id, type, amount, balance_before, balance_after,
        spin_id, session_id, description
    ) VALUES (
        p_player_id, p_transaction_type, p_amount, v_balance_before, v_balance_after,
        p_spin_id, p_session_id, p_description
    );

    RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### update_player_statistics

Tự động cập nhật thống kê người chơi khi có vòng quay mới.

```sql
CREATE OR REPLACE FUNCTION update_player_statistics_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET
        total_spins = total_spins + 1,
        total_wagered = total_wagered + NEW.bet_amount,
        total_won = total_won + NEW.total_win,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.player_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_statistics
AFTER INSERT ON spins
FOR EACH ROW
EXECUTE FUNCTION update_player_statistics_trigger();
```

### update_timestamps

Tự động cập nhật timestamps updated_at.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_players_timestamp
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Indexes Cho Hiệu Suất

Các index bổ sung cho các truy vấn phổ biến:

```sql
-- Composite indexes cho các mẫu truy vấn phổ biến
CREATE INDEX idx_spins_player_created ON spins(player_id, created_at DESC);
CREATE INDEX idx_spins_session_created ON spins(session_id, created_at);
CREATE INDEX idx_transactions_player_type_created ON transactions(player_id, type, created_at DESC);

-- Partial indexes
CREATE INDEX idx_active_free_spins_sessions ON free_spins_sessions(player_id)
WHERE is_active = TRUE;

CREATE INDEX idx_incomplete_sessions ON game_sessions(player_id)
WHERE ended_at IS NULL;
```

---

## Chính Sách Lưu Giữ Dữ Liệu

### Chiến Lược Lưu Trữ

```sql
-- Lưu trữ các vòng quay cũ (hơn 1 năm)
CREATE TABLE spins_archive (
    LIKE spins INCLUDING ALL
);

-- Hàm lưu trữ dữ liệu cũ
CREATE OR REPLACE FUNCTION archive_old_spins()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH archived AS (
        DELETE FROM spins
        WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
        RETURNING *
    )
    INSERT INTO spins_archive SELECT * FROM archived;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Lên lịch với pg_cron (nếu có)
-- SELECT cron.schedule('archive-old-spins', '0 2 * * 0', 'SELECT archive_old_spins();');
```

---

## Backup & Phục Hồi

### Script Backup Hàng Ngày

```bash
#!/bin/bash
# backup_db.sh

DB_NAME="mahjong_ways"
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U postgres -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_${DATE}.backup" $DB_NAME

# Chỉ giữ 30 ngày gần nhất
find $BACKUP_DIR -name "${DB_NAME}_*.backup" -mtime +30 -delete
```

### Phục Hồi Point-in-Time

```sql
-- Bật lưu trữ WAL trong postgresql.conf
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## Files Migration

### Migration Ban Đầu (001_initial_schema.up.sql)

```sql
-- Chạy tất cả các câu lệnh CREATE TABLE theo thứ tự
-- Chạy tất cả các câu lệnh CREATE INDEX
-- Chạy tất cả các câu lệnh CREATE VIEW
-- Chạy tất cả các câu lệnh CREATE FUNCTION
-- Chạy tất cả các câu lệnh CREATE TRIGGER
```

### Down Migration (001_initial_schema.down.sql)

```sql
DROP TRIGGER IF EXISTS trigger_update_player_statistics ON spins;
DROP TRIGGER IF EXISTS trigger_update_players_timestamp ON players;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_player_statistics_trigger();
DROP FUNCTION IF EXISTS update_player_balance(UUID, DECIMAL, transaction_type, UUID, UUID, TEXT);
DROP VIEW IF EXISTS recent_big_wins;
DROP VIEW IF EXISTS player_statistics;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS free_spins_spins;
DROP TABLE IF EXISTS free_spins_sessions;
DROP TABLE IF EXISTS cascade_wins;
DROP TABLE IF EXISTS cascades;
DROP TABLE IF EXISTS spins;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS players;
DROP TYPE IF EXISTS audit_action;
DROP TYPE IF EXISTS transaction_type;
```

---

## Cân Nhắc Bảo Mật

1. **Mã Hóa Tại Chỗ:** Bật mã hóa PostgreSQL
2. **SSL Kết Nối:** Yêu cầu SSL cho tất cả kết nối
3. **Row-Level Security:** Cân nhắc RLS cho thiết lập multi-tenant
4. **Bảo Mật Mật Khẩu:** Sử dụng bcrypt với hệ số chi phí 12+
5. **Ghi Log Kiểm Toán:** Ghi log tất cả các hoạt động nhạy cảm
6. **Mã Hóa Backup:** Mã hóa tất cả các file backup
7. **Kiểm Soát Truy Cập:** Sử dụng người dùng database đọc/ghi riêng biệt

---

## Truy Vấn Giám Sát

### Phiên Hoạt Động

```sql
SELECT COUNT(*) as active_sessions
FROM game_sessions
WHERE ended_at IS NULL;
```

### Vòng Quay Mỗi Phút

```sql
SELECT COUNT(*) as spins_last_minute
FROM spins
WHERE created_at > NOW() - INTERVAL '1 minute';
```

### Kích Thước Database

```sql
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'mahjong_ways';
```
