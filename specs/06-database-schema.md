# Database Schema (PostgreSQL)

## Overview

This document defines the PostgreSQL database schema for the Mahjong Ways slot machine game backend.

**Database:** PostgreSQL 15+
**Extensions:** uuid-ossp, pgcrypto

---

## Entity Relationship Diagram

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

## Table Definitions

### 1. players

Stores player account information.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 100000.00 NOT NULL,

    -- Statistics
    total_spins INTEGER DEFAULT 0,
    total_wagered DECIMAL(15, 2) DEFAULT 0.00,
    total_won DECIMAL(15, 2) DEFAULT 0.00,

    -- Status
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

Tracks individual game sessions.

```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- Session data
    bet_amount DECIMAL(10, 2) NOT NULL,
    starting_balance DECIMAL(15, 2) NOT NULL,
    ending_balance DECIMAL(15, 2),

    -- Statistics
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

Records every spin executed (base game and free spins).

```sql
CREATE TABLE spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- Spin data
    bet_amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,

    -- Grid state (JSON)
    grid JSONB NOT NULL,

    -- Win data
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

-- GIN index for JSONB grid queries
CREATE INDEX idx_spins_grid ON spins USING GIN(grid);
```

---

### 4. cascades

Records each cascade within a spin.

```sql
CREATE TABLE cascades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,

    -- Cascade data
    cascade_number INTEGER NOT NULL,
    multiplier INTEGER NOT NULL,
    total_cascade_win DECIMAL(15, 2) DEFAULT 0.00,

    -- Grid after cascade (JSON)
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

Records individual winning combinations within each cascade.

```sql
CREATE TABLE cascade_wins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cascade_id UUID NOT NULL REFERENCES cascades(id) ON DELETE CASCADE,

    -- Win data
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

Tracks free spins bonus sessions.

```sql
CREATE TABLE free_spins_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    triggered_by_spin_id UUID REFERENCES spins(id) ON DELETE SET NULL,

    -- Free spins data
    scatter_count INTEGER NOT NULL,
    total_spins_awarded INTEGER NOT NULL,
    spins_completed INTEGER DEFAULT 0,
    remaining_spins INTEGER NOT NULL,
    locked_bet_amount DECIMAL(10, 2) NOT NULL,

    -- Win tracking
    total_won DECIMAL(15, 2) DEFAULT 0.00,

    -- Status
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

Records individual spins within a free spins session (denormalized for analytics).

```sql
CREATE TABLE free_spins_spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    free_spins_session_id UUID NOT NULL REFERENCES free_spins_sessions(id) ON DELETE CASCADE,
    spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,

    -- Spin tracking
    spin_number INTEGER NOT NULL,
    win_amount DECIMAL(15, 2) DEFAULT 0.00,

    -- Retrigger tracking
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

Logs all balance changes for auditing.

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

    -- Transaction data
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,

    -- Related records
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

Comprehensive audit trail for compliance.

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

    -- Actor
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,

    -- Action
    action audit_action NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,

    -- Request data
    ip_address INET,
    user_agent TEXT,

    -- Details
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

Aggregated player statistics view.

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

View of recent big wins (wins > 100x bet).

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

Safe balance update function with transaction support.

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
    -- Lock the player row
    SELECT balance INTO v_balance_before
    FROM players
    WHERE id = p_player_id
    FOR UPDATE;

    -- Calculate new balance
    IF p_transaction_type IN ('deposit', 'win', 'bonus', 'refund') THEN
        v_balance_after := v_balance_before + p_amount;
    ELSIF p_transaction_type IN ('withdrawal', 'bet') THEN
        v_balance_after := v_balance_before - p_amount;

        -- Check for negative balance
        IF v_balance_after < 0 THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;

    -- Update player balance
    UPDATE players
    SET balance = v_balance_after,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_player_id;

    -- Log transaction
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

Automatically update player statistics on new spins.

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

Auto-update updated_at timestamps.

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

## Indexes for Performance

Additional indexes for common queries:

```sql
-- Composite indexes for common query patterns
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

## Data Retention Policy

### Archival Strategy

```sql
-- Archive old spins (older than 1 year)
CREATE TABLE spins_archive (
    LIKE spins INCLUDING ALL
);

-- Function to archive old data
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

-- Schedule with pg_cron (if available)
-- SELECT cron.schedule('archive-old-spins', '0 2 * * 0', 'SELECT archive_old_spins();');
```

---

## Backup & Recovery

### Daily Backup Script

```bash
#!/bin/bash
# backup_db.sh

DB_NAME="mahjong_ways"
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U postgres -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_${DATE}.backup" $DB_NAME

# Keep only last 30 days
find $BACKUP_DIR -name "${DB_NAME}_*.backup" -mtime +30 -delete
```

### Point-in-Time Recovery

```sql
-- Enable WAL archiving in postgresql.conf
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## Migration Files

### Initial Migration (001_initial_schema.up.sql)

```sql
-- Run all CREATE TABLE statements in order
-- Run all CREATE INDEX statements
-- Run all CREATE VIEW statements
-- Run all CREATE FUNCTION statements
-- Run all CREATE TRIGGER statements
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

## Security Considerations

1. **Encryption at Rest:** Enable PostgreSQL encryption
2. **Connection SSL:** Require SSL for all connections
3. **Row-Level Security:** Consider RLS for multi-tenant setups
4. **Password Security:** Use bcrypt with cost factor 12+
5. **Audit Logging:** Log all sensitive operations
6. **Backup Encryption:** Encrypt all backup files
7. **Access Control:** Use separate read/write database users

---

## Monitoring Queries

### Active Sessions

```sql
SELECT COUNT(*) as active_sessions
FROM game_sessions
WHERE ended_at IS NULL;
```

### Spins Per Minute

```sql
SELECT COUNT(*) as spins_last_minute
FROM spins
WHERE created_at > NOW() - INTERVAL '1 minute';
```

### Database Size

```sql
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'mahjong_ways';
```
