# Frontend Integration Guide

## Overview

This document explains how the existing HTML5 Canvas frontend will integrate with the new Golang + PostgreSQL backend.

**Frontend Technology:** HTML5 Canvas (PixiJS-based)
**Backend Communication:** REST API
**Data Format:** JSON

---

## Current Frontend Architecture

### Technology Stack

- **Rendering:** PixiJS (WebGL/Canvas)
- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Language:** JavaScript

### Key Files

```
src/
├── composables/
│   └── slotMachine/
│       ├── useGameLogic.js          // Game state and logic
│       ├── reels/
│       │   ├── tiles/
│       │   │   ├── config.js        // Tile definitions
│       │   │   └── tilesComposer.js
│       │   └── reelsRenderer.js
│       └── header/
│           └── consecutiveWins/     // Multiplier display
├── config/
│   ├── assets.js                    // Asset loading
│   └── constants.js                 // Game constants
└── utils/
    ├── tileHelpers.js               // Tile utilities
    └── gameHelpers.js               // Game utilities
```

---

## Integration Strategy

### Migration Phases

#### Phase 1: Backend API Integration (Current Focus)

1. Create API client service
2. Replace frontend RNG with backend API calls
3. Update game logic to consume backend responses
4. Maintain existing UI/UX

#### Phase 2: State Management

1. Sync player balance with backend
2. Handle session management
3. Implement error handling and recovery

#### Phase 3: Enhanced Features

1. Game history integration
2. Free spins state synchronization
3. Real-time statistics

---

## API Client Implementation

### API Service Setup

Create `/src/services/api.js`:

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor (add JWT token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  async login(username, password) {
    return await apiClient.post('/auth/login', { username, password })
  },

  async register(username, password, email) {
    return await apiClient.post('/auth/register', { username, password, email })
  },

  // Player
  async getBalance() {
    return await apiClient.get('/player/balance')
  },

  async getProfile() {
    return await apiClient.get('/player/profile')
  },

  // Game Session
  async startSession(betAmount) {
    return await apiClient.post('/game/session/start', { bet_amount: betAmount })
  },

  async endSession(sessionId) {
    return await apiClient.post('/game/session/end', { session_id: sessionId })
  },

  // Spin
  async executeSpin(sessionId, betAmount) {
    return await apiClient.post('/game/spin', {
      session_id: sessionId,
      bet_amount: betAmount
    })
  },

  // Free Spins
  async getFreeSpinsStatus() {
    return await apiClient.get('/game/free-spins/status')
  },

  async executeFreeSpin(freeSpinsSessionId) {
    return await apiClient.post('/game/free-spins/spin', {
      free_spins_session_id: freeSpinsSessionId
    })
  },

  // History
  async getGameHistory(page = 1, limit = 20) {
    return await apiClient.get('/game/history', { params: { page, limit } })
  },

  async getSpinDetails(spinId) {
    return await apiClient.get(`/game/history/${spinId}`)
  },

  // Statistics
  async getPlayerStats(period = 'all') {
    return await apiClient.get('/game/stats', { params: { period } })
  }
}
```

---

## Frontend Game Logic Updates

### Update `useGameLogic.js`

Replace local RNG with backend API calls:

```javascript
import { ref, computed } from 'vue'
import api from '@/services/api'

export function useGameLogic() {
  // State
  const balance = ref(100000)
  const betAmount = ref(100)
  const sessionId = ref(null)
  const isSpinning = ref(false)
  const currentGrid = ref(null)
  const cascadeData = ref([])
  const totalWin = ref(0)
  const freeSpinsActive = ref(false)
  const freeSpinsRemaining = ref(0)
  const freeSpinsSessionId = ref(null)

  // Start game session
  async function startGameSession() {
    try {
      const response = await api.startSession(betAmount.value)
      sessionId.value = response.data.session_id
      balance.value = response.data.balance
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    }
  }

  // Execute spin
  async function executeSpin() {
    if (isSpinning.value) return
    if (balance.value < betAmount.value && !freeSpinsActive.value) {
      alert('Insufficient balance!')
      return
    }

    isSpinning.value = true
    totalWin.value = 0
    cascadeData.value = []

    try {
      let response

      if (freeSpinsActive.value) {
        // Execute free spin
        response = await api.executeFreeSpin(freeSpinsSessionId.value)
        freeSpinsRemaining.value = response.data.remaining_spins

        // Check if free spins ended
        if (freeSpinsRemaining.value === 0) {
          freeSpinsActive.value = false
          freeSpinsSessionId.value = null
        }

        // Handle retrigger
        if (response.data.retrigger) {
          freeSpinsRemaining.value = response.data.new_remaining_spins
          // Show retrigger animation
          showRetriggerAnimation(response.data.additional_spins)
        }
      } else {
        // Execute regular spin
        response = await api.executeSpin(sessionId.value, betAmount.value)

        // Check if free spins triggered
        if (response.data.free_spins_triggered) {
          freeSpinsActive.value = true
          freeSpinsSessionId.value = response.data.free_spins_session_id
          freeSpinsRemaining.value = response.data.free_spins_awarded
          // Show free spins trigger animation
          showFreeSpinsTriggerAnimation(response.data.scatter_count)
        }
      }

      // Update state
      currentGrid.value = response.data.grid
      cascadeData.value = response.data.cascades
      totalWin.value = response.data.total_win
      balance.value = response.data.balance_after

      // Trigger cascade animations
      await playCascadeAnimations(response.data.cascades)

    } catch (error) {
      console.error('Spin failed:', error)

      if (error.response?.data?.error?.code === 'INSUFFICIENT_BALANCE') {
        alert('Insufficient balance!')
      } else {
        alert('Spin failed. Please try again.')
      }
    } finally {
      isSpinning.value = false
    }
  }

  // Play cascade animations
  async function playCascadeAnimations(cascades) {
    for (const cascade of cascades) {
      // Show cascade number and multiplier
      showMultiplierDisplay(cascade.cascade_number, cascade.multiplier)

      // Highlight winning symbols
      await highlightWinningSymbols(cascade.wins)

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Remove winning symbols (explosion animation)
      await explodeWinningSymbols()

      // Drop symbols (if not last cascade)
      if (cascade.cascade_number < cascades.length) {
        await dropSymbols()

        // Update grid with new symbols
        currentGrid.value = cascade.grid_after
      }

      // Wait before next cascade
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Helper functions (implement based on your renderer)
  function showMultiplierDisplay(cascadeNum, multiplier) {
    // Update multiplier UI
    console.log(`Cascade ${cascadeNum}: ${multiplier}x`)
  }

  async function highlightWinningSymbols(wins) {
    // Highlight winning symbols on grid
  }

  async function explodeWinningSymbols() {
    // Explosion animation
  }

  async function dropSymbols() {
    // Drop/gravity animation
  }

  function showFreeSpinsTriggerAnimation(scatterCount) {
    // Show free spins trigger celebration
  }

  function showRetriggerAnimation(additionalSpins) {
    // Show retrigger celebration
  }

  return {
    // State
    balance,
    betAmount,
    sessionId,
    isSpinning,
    currentGrid,
    cascadeData,
    totalWin,
    freeSpinsActive,
    freeSpinsRemaining,

    // Methods
    startGameSession,
    executeSpin
  }
}
```

---

## Grid Format Conversion

The backend returns a grid in the format:

```json
{
  "grid": [
    ["fa", "zhong", "wutong", "liangtong", "bai", "wusuo"],
    ["zhong_gold", "fa", "wutong", "bawan", "liangsuo", "wild"],
    ["wutong", "bai", "fa_gold", "zhong", "wutong", "liangtong"],
    ["liangtong", "wusuo", "zhong", "fa", "liangsuo", "bawan"],
    ["fa", "wutong", "bai", "zhong", "wusuo", "liangtong"]
  ]
}
```

**Format:**

- 5 columns (reels)
- 6 rows (4 visible + 2 buffer)
- Column-major order (each array is a reel)

### Grid Mapping

```javascript
function mapBackendGridToFrontend(backendGrid) {
  // Backend sends column-major (5 reels, each with 6 symbols)
  // Frontend expects same format
  return backendGrid.map(column =>
    column.map(symbol => ({
      symbol: symbol.replace('_gold', ''), // Strip _gold suffix
      isGolden: symbol.endsWith('_gold')
    }))
  )
}

function mapFrontendGridToBackend(frontendGrid) {
  // Convert tile objects to strings
  return frontendGrid.map(column =>
    column.map(tile => {
      if (typeof tile === 'string') return tile
      return tile.isGolden ? `${tile.symbol}_gold` : tile.symbol
    })
  )
}
```

---

## Constants Update

Update `/src/config/constants.js` to remove local game logic:

```javascript
export const CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4,
    fullyVisibleRows: 4,
    symbolSize: 70,
    spacing: 8,
    winCheckStartRow: 5,
    winCheckEndRow: 8
  },
  // Remove paytable - now handled by backend
  // Remove multipliers - now handled by backend
  // Remove spawnRates - now handled by backend
  animation: {
    spinDuration: 1600,
    reelStagger: 150,
    cascadeExplosionDuration: 800,
    symbolDropDuration: 600
  },
  game: {
    minBet: 10,
    maxBet: 1000,
    betStep: 10
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1',
    timeout: 10000
  }
}
```

---

## Environment Variables

Create `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/v1

# Development flags
VITE_DEBUG_MODE=true
VITE_MOCK_API=false
```

For production (`.env.production`):

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/v1
VITE_DEBUG_MODE=false
VITE_MOCK_API=false
```

---

## Error Handling

### Frontend Error Handler

```javascript
// src/utils/errorHandler.js

export function handleApiError(error) {
  if (!error.response) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR'
    }
  }

  const { status, data } = error.response

  switch (status) {
    case 400:
      return {
        message: data.error?.message || 'Invalid request',
        code: data.error?.code || 'BAD_REQUEST'
      }

    case 401:
      return {
        message: 'Session expired. Please log in again.',
        code: 'UNAUTHORIZED'
      }

    case 403:
      return {
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN'
      }

    case 404:
      return {
        message: 'Resource not found.',
        code: 'NOT_FOUND'
      }

    case 429:
      return {
        message: 'Too many requests. Please wait and try again.',
        code: 'RATE_LIMIT_EXCEEDED'
      }

    case 500:
      return {
        message: 'Server error. Please try again later.',
        code: 'INTERNAL_ERROR'
      }

    default:
      return {
        message: 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR'
      }
  }
}
```

---

## Authentication Flow

### Login Component

```vue
<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { handleApiError } from '@/utils/errorHandler'

const router = useRouter()
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref(null)

async function handleLogin() {
  isLoading.value = true
  error.value = null

  try {
    const response = await api.login(username.value, password.value)

    // Store JWT token
    localStorage.setItem('jwt_token', response.data.token)

    // Store user info
    localStorage.setItem('user', JSON.stringify(response.data.user))

    // Redirect to game
    router.push('/game')
  } catch (err) {
    const errorInfo = handleApiError(err)
    error.value = errorInfo.message
  } finally {
    isLoading.value = false
  }
}
</script>
```

---

## State Persistence

### Local Storage Keys

```javascript
// Authentication
'jwt_token'           // JWT authentication token
'user'               // User profile JSON

// Game State
'game_session_id'    // Current game session
'free_spins_active'  // Boolean: free spins active
'free_spins_session' // Free spins session ID
```

### Session Recovery

```javascript
// On app mount, check for active session
import { onMounted } from 'vue'

onMounted(async () => {
  const token = localStorage.getItem('jwt_token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    // Verify token and get user data
    const profile = await api.getProfile()

    // Check for active free spins
    const freeSpinsStatus = await api.getFreeSpinsStatus()
    if (freeSpinsStatus.data.active) {
      freeSpinsActive.value = true
      freeSpinsSessionId.value = freeSpinsStatus.data.free_spins_session_id
      freeSpinsRemaining.value = freeSpinsStatus.data.remaining_spins
    }
  } catch (error) {
    // Token invalid, redirect to login
    localStorage.clear()
    router.push('/login')
  }
})
```

---

## Testing Integration

### Mock API Mode

For development without backend:

```javascript
// src/services/mockApi.js

export default {
  async executeSpin(sessionId, betAmount) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Return mock data
    return {
      success: true,
      data: {
        spin_id: 'mock-uuid',
        session_id: sessionId,
        bet_amount: betAmount,
        balance_before: 100000,
        balance_after: 100150,
        grid: [
          ['fa', 'zhong', 'wutong', 'liangtong', 'bai', 'wusuo'],
          ['zhong', 'fa', 'wutong', 'bawan', 'liangsuo', 'wild'],
          ['wutong', 'bai', 'fa', 'zhong', 'wutong', 'liangtong'],
          ['liangtong', 'wusuo', 'zhong', 'fa', 'liangsuo', 'bawan'],
          ['fa', 'wutong', 'bai', 'zhong', 'wusuo', 'liangtong']
        ],
        cascades: [
          {
            cascade_number: 1,
            multiplier: 1,
            wins: [
              {
                symbol: 'fa',
                count: 3,
                ways: 8,
                payout: 10,
                win_amount: 40
              }
            ],
            total_cascade_win: 40
          }
        ],
        total_win: 150,
        scatter_count: 0,
        free_spins_triggered: false,
        timestamp: new Date().toISOString()
      }
    }
  }
}
```

Enable mock mode:

```javascript
// src/services/api.js
import realApi from './apiClient'
import mockApi from './mockApi'

const useMockApi = import.meta.env.VITE_MOCK_API === 'true'

export default useMockApi ? mockApi : realApi
```

---

## Performance Optimization

### Request Batching

For multiple simultaneous requests:

```javascript
async function initializeGame() {
  // Parallel requests
  const [profile, balance, freeSpinsStatus] = await Promise.all([
    api.getProfile(),
    api.getBalance(),
    api.getFreeSpinsStatus()
  ])

  // Process results
  // ...
}
```

### Caching

```javascript
// Simple cache for player balance
let balanceCache = null
let balanceCacheTime = null
const CACHE_TTL = 5000 // 5 seconds

async function getBalanceWithCache() {
  const now = Date.now()

  if (balanceCache && balanceCacheTime && (now - balanceCacheTime) < CACHE_TTL) {
    return balanceCache
  }

  const response = await api.getBalance()
  balanceCache = response.data.balance
  balanceCacheTime = now

  return balanceCache
}
```

---

## Deployment Checklist

### Frontend

- [ ] Update API base URL in `.env.production`
- [ ] Remove all debug/mock code
- [ ] Test authentication flow
- [ ] Test spin execution
- [ ] Test free spins trigger and retrigger
- [ ] Test error handling
- [ ] Test session recovery
- [ ] Optimize bundle size
- [ ] Enable production build optimizations

### Integration Testing

- [ ] Test with real backend API
- [ ] Verify grid format compatibility
- [ ] Verify cascade animations match backend data
- [ ] Verify balance updates correctly
- [ ] Verify free spins state synchronization
- [ ] Test network error scenarios
- [ ] Test session timeout handling
- [ ] Load testing (concurrent users)

---

## Next Steps

1. Implement API service (`src/services/api.js`)
2. Update game logic composable (`useGameLogic.js`)
3. Add authentication components
4. Test with backend API
5. Handle edge cases and errors
6. Deploy and monitor
