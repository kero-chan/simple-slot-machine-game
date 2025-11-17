# Hướng Dẫn Tích Hợp Frontend

## Tổng Quan

Tài liệu này giải thích cách frontend HTML5 Canvas hiện có sẽ tích hợp với backend Golang + PostgreSQL mới.

**Công Nghệ Frontend:** HTML5 Canvas (dựa trên PixiJS)
**Giao Tiếp Backend:** REST API
**Định Dạng Dữ Liệu:** JSON

---

## Kiến Trúc Frontend Hiện Tại

### Technology Stack

- **Rendering:** PixiJS (WebGL/Canvas)
- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Language:** JavaScript

### Các File Chính

```
src/
├── composables/
│   └── slotMachine/
│       ├── useGameLogic.js          // Trạng thái và logic trò chơi
│       ├── reels/
│       │   ├── tiles/
│       │   │   ├── config.js        // Định nghĩa tile
│       │   │   └── tilesComposer.js
│       │   └── reelsRenderer.js
│       └── header/
│           └── consecutiveWins/     // Hiển thị multiplier
├── config/
│   ├── assets.js                    // Tải assets
│   └── constants.js                 // Hằng số trò chơi
└── utils/
    ├── tileHelpers.js               // Tiện ích tile
    └── gameHelpers.js               // Tiện ích trò chơi
```

---

## Chiến Lược Tích Hợp

### Các Giai Đoạn Di Chuyển

#### Giai Đoạn 1: Tích Hợp API Backend (Trọng Tâm Hiện Tại)

1. Tạo dịch vụ API client
2. Thay thế RNG frontend bằng API calls backend
3. Cập nhật logic trò chơi để tiêu thụ responses backend
4. Duy trì UI/UX hiện có

#### Giai Đoạn 2: Quản Lý Trạng Thái

1. Đồng bộ số dư người chơi với backend
2. Xử lý quản lý phiên
3. Triển khai xử lý lỗi và khôi phục

#### Giai Đoạn 3: Tính Năng Nâng Cao

1. Tích hợp lịch sử trò chơi
2. Đồng bộ hóa trạng thái Free spins
3. Thống kê thời gian thực

---

## Triển Khai API Client

### Thiết Lập API Service

Tạo `/src/services/api.js`:

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1'

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor (thêm JWT token)
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

// Response interceptor (xử lý lỗi)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, chuyển hướng đến login
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
    return await apiClient.get(\`/game/history/\${spinId}\`)
  },

  // Statistics
  async getPlayerStats(period = 'all') {
    return await apiClient.get('/game/stats', { params: { period } })
  }
}
```

---

## Cập Nhật Logic Trò Chơi Frontend

### Cập Nhật `useGameLogic.js`

Thay thế RNG cục bộ bằng API calls backend:

```javascript
import { ref, computed } from 'vue'
import api from '@/services/api'

export function useGameLogic() {
  // Trạng thái
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

  // Bắt đầu phiên trò chơi
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

  // Thực hiện quay
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
        // Thực hiện free spin
        response = await api.executeFreeSpin(freeSpinsSessionId.value)
        freeSpinsRemaining.value = response.data.remaining_spins

        // Kiểm tra nếu free spins kết thúc
        if (freeSpinsRemaining.value === 0) {
          freeSpinsActive.value = false
          freeSpinsSessionId.value = null
        }

        // Xử lý kích hoạt lại
        if (response.data.retrigger) {
          freeSpinsRemaining.value = response.data.new_remaining_spins
          // Hiển thị hoạt ảnh kích hoạt lại
          showRetriggerAnimation(response.data.additional_spins)
        }
      } else {
        // Thực hiện quay thông thường
        response = await api.executeSpin(sessionId.value, betAmount.value)

        // Kiểm tra nếu free spins được kích hoạt
        if (response.data.free_spins_triggered) {
          freeSpinsActive.value = true
          freeSpinsSessionId.value = response.data.free_spins_session_id
          freeSpinsRemaining.value = response.data.free_spins_awarded
          // Hiển thị hoạt ảnh kích hoạt free spins
          showFreeSpinsTriggerAnimation(response.data.scatter_count)
        }
      }

      // Cập nhật trạng thái
      currentGrid.value = response.data.grid
      cascadeData.value = response.data.cascades
      totalWin.value = response.data.total_win
      balance.value = response.data.balance_after

      // Kích hoạt hoạt ảnh cascade
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

  // Chơi hoạt ảnh cascade
  async function playCascadeAnimations(cascades) {
    for (const cascade of cascades) {
      // Hiển thị số cascade và multiplier
      showMultiplierDisplay(cascade.cascade_number, cascade.multiplier)

      // Làm nổi bật biểu tượng thắng
      await highlightWinningSymbols(cascade.wins)

      // Đợi hoạt ảnh
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Xóa biểu tượng thắng (hoạt ảnh nổ)
      await explodeWinningSymbols()

      // Rơi biểu tượng (nếu không phải cascade cuối)
      if (cascade.cascade_number < cascades.length) {
        await dropSymbols()

        // Cập nhật grid với biểu tượng mới
        currentGrid.value = cascade.grid_after
      }

      // Đợi trước cascade tiếp theo
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Các hàm helper (triển khai dựa trên renderer của bạn)
  function showMultiplierDisplay(cascadeNum, multiplier) {
    // Cập nhật UI multiplier
    console.log(\`Cascade \${cascadeNum}: \${multiplier}x\`)
  }

  async function highlightWinningSymbols(wins) {
    // Làm nổi bật biểu tượng thắng trên grid
  }

  async function explodeWinningSymbols() {
    // Hoạt ảnh nổ
  }

  async function dropSymbols() {
    // Hoạt ảnh rơi/trọng lực
  }

  function showFreeSpinsTriggerAnimation(scatterCount) {
    // Hiển thị ăn mừng kích hoạt free spins
  }

  function showRetriggerAnimation(additionalSpins) {
    // Hiển thị ăn mừng kích hoạt lại
  }

  return {
    // Trạng thái
    balance,
    betAmount,
    sessionId,
    isSpinning,
    currentGrid,
    cascadeData,
    totalWin,
    freeSpinsActive,
    freeSpinsRemaining,

    // Phương thức
    startGameSession,
    executeSpin
  }
}
```

---

## Chuyển Đổi Định Dạng Grid

Backend trả về grid theo định dạng:

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

**Định dạng:**

- 5 cột (trục)
- 6 hàng (4 hiển thị + 2 buffer)
- Thứ tự theo cột chính (mỗi mảng là một trục)

### Ánh Xạ Grid

```javascript
function mapBackendGridToFrontend(backendGrid) {
  // Backend gửi theo cột chính (5 trục, mỗi trục có 6 biểu tượng)
  // Frontend mong đợi cùng định dạng
  return backendGrid.map(column =>
    column.map(symbol => ({
      symbol: symbol.replace('_gold', ''), // Xóa hậu tố _gold
      isGolden: symbol.endsWith('_gold')
    }))
  )
}

function mapFrontendGridToBackend(frontendGrid) {
  // Chuyển đổi đối tượng tile sang chuỗi
  return frontendGrid.map(column =>
    column.map(tile => {
      if (typeof tile === 'string') return tile
      return tile.isGolden ? \`\${tile.symbol}_gold\` : tile.symbol
    })
  )
}
```

---

## Cập Nhật Constants

Cập nhật `/src/config/constants.js` để xóa logic trò chơi cục bộ:

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
  // Xóa paytable - giờ được xử lý bởi backend
  // Xóa multipliers - giờ được xử lý bởi backend
  // Xóa spawnRates - giờ được xử lý bởi backend
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

## Biến Môi Trường

Tạo file `.env`:

```bash
# Cấu hình API
VITE_API_BASE_URL=http://localhost:8080/v1

# Cờ phát triển
VITE_DEBUG_MODE=true
VITE_MOCK_API=false
```

Cho production (`.env.production`):

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/v1
VITE_DEBUG_MODE=false
VITE_MOCK_API=false
```

---

## Xử Lý Lỗi

### Trình Xử Lý Lỗi Frontend

```javascript
// src/utils/errorHandler.js

export function handleApiError(error) {
  if (!error.response) {
    // Lỗi mạng
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

## Checklist Triển Khai

### Frontend

- [ ] Cập nhật API base URL trong \`.env.production\`
- [ ] Xóa tất cả code debug/mock
- [ ] Kiểm tra luồng xác thực
- [ ] Kiểm tra thực thi quay
- [ ] Kiểm tra kích hoạt và kích hoạt lại free spins
- [ ] Kiểm tra xử lý lỗi
- [ ] Kiểm tra khôi phục phiên
- [ ] Tối ưu hóa kích thước bundle
- [ ] Bật tối ưu hóa production build

### Kiểm Tra Tích Hợp

- [ ] Kiểm tra với API backend thực
- [ ] Xác minh khả năng tương thích định dạng grid
- [ ] Xác minh hoạt ảnh cascade khớp với dữ liệu backend
- [ ] Xác minh cập nhật số dư chính xác
- [ ] Xác minh đồng bộ hóa trạng thái free spins
- [ ] Kiểm tra các tình huống lỗi mạng
- [ ] Kiểm tra xử lý timeout phiên
- [ ] Kiểm tra tải (người dùng đồng thời)

---

## Các Bước Tiếp Theo

1. Triển khai API service (\`src/services/api.js\`)
2. Cập nhật composable logic trò chơi (\`useGameLogic.js\`)
3. Thêm các component xác thực
4. Kiểm tra với API backend
5. Xử lý các trường hợp biên và lỗi
6. Triển khai và giám sát
