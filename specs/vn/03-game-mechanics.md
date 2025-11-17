# Cơ Chế Trò Chơi

## Mục Lục

1. [Hệ Thống 1,024 Cách Thắng](#hệ-thống-1024-cách-thắng)
2. [Cơ Chế Cascade/Tumble](#cơ-chế-cascadetumble)
3. [Tiến Trình Multiplier](#tiến-trình-multiplier)
4. [Tính Năng Free Spins](#tính-năng-free-spins)
5. [Thay Thế Wild](#thay-thế-wild)
6. [Biến Đổi Biểu Tượng Golden](#biến-đổi-biểu-tượng-golden)
7. [Luồng Trò Chơi](#luồng-trò-chơi)

---

## Hệ Thống 1,024 Cách Thắng

### Tổng Quan

Mahjong Ways sử dụng "Ways to Win" thay vì các đường thắng truyền thống. Các biểu tượng thắng phải xuất hiện trên **các trục liền kề bắt đầu từ trục bên trái nhất**.

### Phương Pháp Tính Toán

**Công thức:**

```
Ways = (Biểu tượng trên Trục 1) × (Biểu tượng trên Trục 2) × (Biểu tượng trên Trục 3) × ...
```

**Số Cách Tối Đa:**

```
5 trục × 4 hàng = 4^5 = 1,024 cách có thể tối đa
```

### Quy Tắc Liền Kề

✅ **Hợp lệ:**

- Biểu tượng PHẢI ở trên các trục liên tiếp từ trái sang phải
- Nhiều tổ hợp thắng có thể xảy ra đồng thời
- Biểu tượng Wild được tính là khớp

❌ **Không hợp lệ:**

- Khoảng trống trong chuỗi trục phá vỡ tổ hợp thắng
- Tổ hợp từ phải sang trái không được tính
- Các trục không liền kề không được tính

### Ví Dụ Tính Toán

#### Ví dụ 1: 3-of-a-kind cơ bản

```
Trục 1: 1 biểu tượng khớp (hàng 2)
Trục 2: 3 biểu tượng khớp (hàng 1, 2, 4)
Trục 3: 2 biểu tượng khớp (hàng 2, 3)

Ways = 1 × 3 × 2 = 6 cách
Win = Thanh toán Biểu tượng (3-of-a-kind) × 6 cách × Cược Mỗi Cách
```

#### Ví dụ 2: 5-of-a-kind đầy đủ

```
Trục 1: 2 biểu tượng khớp
Trục 2: 4 biểu tượng khớp
Trục 3: 1 biểu tượng khớp
Trục 4: 3 biểu tượng khớp
Trục 5: 2 biểu tượng khớp

Ways = 2 × 4 × 1 × 3 × 2 = 48 cách
Win = Thanh toán Biểu tượng (5-of-a-kind) × 48 cách × Cược Mỗi Cách
```

#### Ví dụ 3: Số Cách Tối Đa (1,024)

```
Tất cả 5 trục có cùng biểu tượng khớp trong tất cả 4 hàng

Ways = 4 × 4 × 4 × 4 × 4 = 1,024 cách (TỐI ĐA)
Win = Thanh toán Biểu tượng × 1,024 cách × Cược Mỗi Cách
```

### Logic Triển Khai

```
Thuật toán: Tính Số Cách Thắng

1. Cho mỗi loại biểu tượng:
   2. count[reel] = 0 cho tất cả trục
   3. Với reel = 1 đến 5:
      4. Đếm biểu tượng khớp (bao gồm Wilds) trong trục
      5. Nếu count > 0:
         6. count[reel] = biểu tượng khớp
      7. Ngược lại:
         8. Break (không khớp, dừng ở trục trước)

   9. Nếu dừng tại reel >= 3: (tối thiểu 3-of-a-kind)
      10. ways = count[1] × count[2] × count[3] × ... × count[last_reel]
      11. payout = paytable[symbol][reels_matched]
      12. win = payout × ways × bet_per_way × multiplier
```

---

## Cơ Chế Cascade/Tumble

### Luồng Trình Tự

Hệ thống cascade là cơ chế cốt lõi cho phép nhiều lần thắng từ một lần quay.

#### Bước 1: Quay Ban Đầu

1. Các trục quay và dừng với các biểu tượng ngẫu nhiên
2. Hệ thống đánh giá tất cả các tổ hợp thắng
3. Multiplier bắt đầu ở giá trị cơ bản (x1 cho trò chơi cơ bản, x2 cho free spins)

#### Bước 2: Đánh Giá Thắng

1. Tất cả các biểu tượng thắng được xác định
2. Các biểu tượng thắng được làm nổi bật với hiệu ứng **VÀNG**
3. Số tiền thắng được tính toán và hiển thị
4. Tổng số tiền thắng được tích lũy

#### Bước 3: Xóa Biểu Tượng (Cascade)

1. Các biểu tượng thắng nổ với hoạt ảnh
2. Tạo vị trí trống trên các trục
3. Các biểu tượng còn lại rơi xuống (hiệu ứng trọng lực)
4. Các biểu tượng mới rơi từ trên xuống để lấp đầy khoảng trống

#### Bước 4: Tiến Trình Multiplier

- Multiplier tăng sau mỗi cascade thành công
- Xem phần [Tiến Trình Multiplier](#tiến-trình-multiplier) bên dưới

#### Bước 5: Đánh Giá Lại

1. Bố trí biểu tượng mới được đánh giá về các lần thắng
2. **Nếu có thắng:** Quay lại Bước 2 (lặp lại cascade)
3. **Nếu không thắng:** Chuỗi cascade kết thúc, multiplier được đặt lại

### Hành Vi Chính

- ✅ Multiplier chỉ tăng trên các cascade thành công
- ✅ Multiplier áp dụng cho TẤT CẢ các lần thắng trong cascade đó
- ✅ Quá trình có thể tiếp tục vô thời hạn nếu các lần thắng tiếp tục hình thành
- ❌ Multiplier được đặt lại về cơ bản khi không có lần thắng mới nào hình thành
- ❌ Multiplier KHÔNG được chuyển giữa các lần quay

### Pseudocode Triển Khai

```
Function: ProcessCascade(grid, is_free_spins)

1. cascade_count = 0
2. total_win = 0
3. multiplier = GetInitialMultiplier(is_free_spins) // x1 hoặc x2

4. While true:
   5. wins = EvaluateWins(grid)
   6. If wins is empty:
      7. Break (không còn cascade)

   8. cascade_count++
   9. current_win = CalculateWinAmount(wins, multiplier)
   10. total_win += current_win

   11. RemoveWinningSymbols(grid, wins)
   12. DropSymbols(grid)
   13. FillEmptyPositions(grid)

   14. multiplier = GetMultiplier(cascade_count, is_free_spins)

15. Return total_win
```

---

## Tiến Trình Multiplier

### Multiplier Trò Chơi Cơ Bản

| Số Cascade | Multiplier | Ghi Chú |
|----------------|------------|-------|
| Cascade thứ 1 | **x1** | Không có multiplier ở lần thắng đầu tiên |
| Cascade thứ 2 | **x2** | |
| Cascade thứ 3 | **x3** | |
| Cascade thứ 4+ | **x5** | Giữ ở x5 cho tất cả các cascade tiếp theo |

### Multiplier Free Spins (Nâng cao)

| Số Cascade | Multiplier | Tăng so với Cơ Bản |
|----------------|------------|------------------|
| Cascade thứ 1 | **x2** | +100% (x2 so với x1) |
| Cascade thứ 2 | **x4** | +100% (x4 so với x2) |
| Cascade thứ 3 | **x6** | +100% (x6 so với x3) |
| Cascade thứ 4+ | **x10** | +100% (x10 so với x5) |

### Bảng So Sánh

```
┌───────────┬─────────────┬──────────────┬────────────┐
│ Cascade   │ Trò Cơ Bản  │ Free Spins   │ Khác Biệt  │
├───────────┼─────────────┼──────────────┼────────────┤
│ 1         │ x1          │ x2           │ +100%      │
│ 2         │ x2          │ x4           │ +100%      │
│ 3         │ x3          │ x6           │ +100%      │
│ 4+        │ x5          │ x10          │ +100%      │
└───────────┴─────────────┴──────────────┴────────────┘
```

### Triển Khai

```go
func GetMultiplier(cascadeCount int, isFreeSpins bool) int {
    if isFreeSpins {
        switch cascadeCount {
        case 1:
            return 2
        case 2:
            return 4
        case 3:
            return 6
        default: // 4+
            return 10
        }
    } else {
        switch cascadeCount {
        case 1:
            return 1
        case 2:
            return 2
        case 3:
            return 3
        default: // 4+
            return 5
        }
    }
}
```

---

## Tính Năng Free Spins

### Yêu Cầu Kích Hoạt

- Hạ **3 HOẶC NHIỀU HƠN** biểu tượng Scatter ở bất kỳ đâu trên các trục
- Scatter có thể xuất hiện ở BẤT KỲ vị trí trục nào
- Scatter KHÔNG cần phải liền kề

### Bảng Thưởng Free Spins

| Số Scatter | Free Spins Được Thưởng | Tính Toán |
|---------------|-------------------|-------------|
| 3 Scatters | 12 Free Spins | Giải thưởng cơ bản |
| 4 Scatters | 14 Free Spins | 12 + (2 × 1) |
| 5 Scatters | 16 Free Spins | 12 + (2 × 2) |

**Công thức:**

```
Free Spins = 12 + (2 × (scatter_count - 3))
```

### Cơ Chế Kích Hoạt Lại

- ✅ Hạ 3+ Scatters TRONG free spins sẽ thưởng thêm vòng quay
- ✅ Công thức tương tự được áp dụng
- ✅ Có thể được kích hoạt lại nhiều lần
- ✅ **KHÔNG GIỚI HẠN** tổng số free spins tích lũy

**Ví dụ:**

```
Kích hoạt: 3 Scatters = 12 Free Spins
Trong vòng quay 5: 4 Scatters = +14 Free Spins
Còn lại: 7 (gốc) + 14 (mới) = 21 Free Spins
```

### Hành Vi Free Spins

1. **Cài Đặt Cược Bị Khóa**
   - Số tiền cược bị khóa ở giá trị vòng quay kích hoạt
   - Không thể điều chỉnh cược trong free spins
   - Tất cả các lần thắng được tính bằng cược bị khóa

2. **Multiplier Nâng Cao**
   - Xem [Tiến Trình Multiplier](#tiến-trình-multiplier) ở trên
   - x2 → x4 → x6 → x10 (so với trò chơi cơ bản x1 → x2 → x3 → x5)

3. **Tất Cả Cơ Chế Khác Giống Nhau**
   - Tính toán 1,024 cách không thay đổi
   - Cơ chế cascade hoạt động giống nhau
   - Thay thế Wild hoạt động bình thường
   - Các biểu tượng Golden vẫn hoạt động trên trục 2-3-4

### Tiềm Năng Thắng Tối Đa

**Tối Đa Lý Thuyết (trước giới hạn):**

```
Biểu tượng: Mystery (500x)
Ways: 1,024 (tất cả vị trí khớp)
Multiplier: x10 (4+ cascade trong free spins)

Win = 500 × 1,024 × 10 = 5,120,000x lý thuyết
```

**Tối Đa Thực Tế (với giới hạn):**

```
Giới Hạn Thắng Tối Đa: 25,000x tổng cược mỗi vòng quay
```

### Triển Khai

```go
type FreeSpinsState struct {
    TotalSpins      int
    RemainingSpins  int
    LockedBetAmount float64
    Triggered       bool
}

func TriggerFreeSpins(scatterCount int, currentBet float64) FreeSpinsState {
    baseSpins := 12
    bonusSpins := (scatterCount - 3) * 2
    totalSpins := baseSpins + bonusSpins

    return FreeSpinsState{
        TotalSpins:      totalSpins,
        RemainingSpins:  totalSpins,
        LockedBetAmount: currentBet,
        Triggered:       true,
    }
}

func RetriggerFreeSpins(state *FreeSpinsState, scatterCount int) {
    baseSpins := 12
    bonusSpins := (scatterCount - 3) * 2
    additionalSpins := baseSpins + bonusSpins

    state.RemainingSpins += additionalSpins
    state.TotalSpins += additionalSpins
}
```

---

## Thay Thế Wild

### Thuộc Tính Biểu Tượng Wild

✅ **Có Thể Thay Thế:**

- TẤT CẢ các biểu tượng thanh toán thông thường (giá trị cao và giá trị thấp)

❌ **Không Thể Thay Thế:**

- Biểu tượng Scatter (kích hoạt free spins)
- Biểu tượng Mystery

### Quy Tắc Thay Thế

1. **Xuất Hiện Trên Trục:**
   - Wild có thể xuất hiện trên TẤT CẢ các trục (1, 2, 3, 4, 5)

2. **Wild Vàng:**
   - Có thể xuất hiện với khung Vàng trên trục 2, 3, 4
   - Chức năng giống hệt Wild thông thường
   - Chỉ nâng cao về mặt hình ảnh

3. **Ưu Tiên Thay Thế:**
   - Wild lấp đầy cho các biểu tượng còn thiếu trong các cách thắng tiềm năng
   - Hệ thống tính toán lần thắng cao nhất có thể bằng cách sử dụng Wild
   - Wild được tính là biểu tượng nào tạo ra thanh toán tối đa

4. **Không Có Thanh Toán Độc Lập:**
   - Wild KHÔNG có giá trị thanh toán riêng
   - Chỉ hoạt động như thay thế

### Wild Trong Tổ Hợp

**Đường Wild Thuần Túy:**

- Nếu tất cả các biểu tượng trong một đường thắng đều là Wild
- Được tính là biểu tượng thanh toán có giá trị cao nhất để thanh toán

**Nhiều Wild:**

- Nhiều Wild tăng đáng kể số lượng cách
- Mỗi vị trí Wild nhân lên phép tính cách

### Ví Dụ

#### Ví dụ 1: Thay Thế Wild Đơn Giản

```
Trục 1: HIGH_FA
Trục 2: WILD
Trục 3: HIGH_FA
Trục 4: HIGH_FA
Trục 5: HIGH_FA

Kết quả: 5-of-a-kind HIGH_FA (thanh toán 100x)
```

#### Ví dụ 2: Wild Tăng Cách

```
Trục 1: HIGH_FA (1 vị trí)
Trục 2: WILD (2 vị trí)
Trục 3: HIGH_FA (1 vị trí)

Ways = 1 × 2 × 1 = 2 cách
Payout = 15x (3-of-a-kind)
```

#### Ví dụ 3: Wild Chọn Biểu Tượng Tốt Nhất

```
Trục 1: HIGH_FA (hàng 1), HIGH_ZHONG (hàng 2)
Trục 2: WILD (hàng 1)
Trục 3: HIGH_FA (hàng 1), HIGH_ZHONG (hàng 2)

Hai lần thắng riêng biệt:
1. HIGH_FA: 1 × 1 × 1 = 1 cách (thanh toán 15x)
2. HIGH_ZHONG: 1 × 1 × 1 = 1 cách (thanh toán 10x)

Wild khớp với cả hai biểu tượng độc lập
```

### Triển Khai

```go
func IsWildSubstitute(symbolType string) bool {
    return symbolType != "SCATTER" && symbolType != "MYSTERY"
}

func CountMatchingSymbols(reel []Symbol, targetSymbol string) int {
    count := 0
    for _, symbol := range reel {
        if symbol.Type == targetSymbol ||
           (symbol.Type == "WILD" && IsWildSubstitute(targetSymbol)) {
            count++
        }
    }
    return count
}
```

---

## Biến Đổi Biểu Tượng Golden

### Tổng Quan

**LƯU Ý QUAN TRỌNG:** Trong Mahjong Ways 1, các biểu tượng Golden chỉ là **HÌNH ẢNH THÔI**. Chúng KHÔNG chuyển đổi thành Wild (đây là tính năng của Mahjong Ways 2).

### Hành Vi Biểu Tượng Golden

#### Quy Tắc Xuất Hiện

- ❌ **Không bao giờ trên Trục 1**
- ✅ **Chỉ trên Trục 2, 3, 4**
- ❌ **Không bao giờ trên Trục 5**

#### Biểu Tượng Đủ Điều Kiện

- Biểu tượng Wild có thể xuất hiện dưới dạng Golden Wild
- Biểu tượng thanh toán thông thường có thể xuất hiện dưới dạng Golden

#### Chỉ Báo Trực Quan

- Ánh sáng/khung vàng xung quanh biểu tượng
- Hoạt ảnh lấp lánh
- Khác biệt với diện mạo biểu tượng thông thường

### Hành Vi Giai Đoạn

#### Giai đoạn 1: Xuất Hiện Ban Đầu

1. Biểu tượng hạ cánh với khung/ánh sáng vàng
2. Chức năng bình thường cho đánh giá thắng
3. Tham gia vào cơ chế cascade
4. Được tính cho tính toán thanh toán

#### Giai đoạn 2: Sau Cascade

1. Sau khi cascade hoàn thành và các biểu tượng mới hạ cánh
2. Biểu tượng Golden chuyển đổi thành phiên bản thông thường
3. Ánh sáng/khung vàng được loại bỏ
4. Biểu tượng giữ nguyên loại (ví dụ: Golden Wild → Wild Thông thường)
5. **Không ảnh hưởng đến gameplay, chỉ là hình ảnh**

### Mục Đích

- Phấn khích và dự đoán về mặt hình ảnh
- Nâng cao thẩm mỹ trong các chuỗi thắng
- Sự tham gia của người chơi (không có lợi ích thanh toán thực tế)

### Triển Khai

```go
type Symbol struct {
    Type     string // "WILD", "HIGH_FA", v.v.
    IsGolden bool   // Chỉ trạng thái hình ảnh
    Reel     int
    Row      int
}

func CanBeGolden(reel int) bool {
    return reel >= 2 && reel <= 4
}

func TransformGoldenSymbols(grid [][]Symbol) {
    for i := range grid {
        for j := range grid[i] {
            if grid[i][j].IsGolden {
                grid[i][j].IsGolden = false
            }
        }
    }
}

// Gọi TransformGoldenSymbols sau khi cascade hoàn thành
```

---

## Luồng Trò Chơi

### Chu Kỳ Quay Hoàn Chỉnh

```
┌─────────────────────────────────────┐
│  1. Người chơi bắt đầu quay         │
│     - Khấu trừ cược từ số dư        │
│     - Kiểm tra xem có ở chế độ      │
│       free spins không              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Tạo vị trí trục ngẫu nhiên      │
│     - Sử dụng RNG cho mỗi trục      │
│     - Áp dụng trọng số biểu tượng   │
│     - Điền lưới 5×4                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Kiểm tra kích hoạt Scatter      │
│     - Đếm biểu tượng Scatter        │
│     - Nếu 3+: Kích hoạt Free Spins  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Vòng lặp Cascade (Cascade #1)   │
│     ┌────────────────────────────┐  │
│     │ a) Đánh giá thắng          │  │
│     │ b) Tính thanh toán         │  │
│     │ c) Áp dụng multiplier      │  │
│     │ d) Thêm vào tổng thắng     │  │
│     └────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Có Biểu Tượng Thắng?            │
│     ┌─────KHÔNG──┐   ┌─────CÓ─────┐
│     │Kết thúc    │   │Tiếp tục    │
│     │Cascade     │   │Đến bước 6  │
│     │Đến bước 8  │   │            │
│     └────────────┘   └────────────┘
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Xóa biểu tượng thắng            │
│     - Hoạt ảnh nổ                   │
│     - Xóa vị trí                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. Rơi và điền biểu tượng          │
│     - Rơi trọng lực hiện tại        │
│     - Điền từ trên                  │
│     - Biến đổi biểu tượng vàng      │
│     - Tăng multiplier               │
│     - Quay lại bước 4               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  8. Hoàn tất Quay                   │
│     - Thêm tiền thắng vào số dư     │
│     - Đặt lại multiplier            │
│     - Ghi log giao dịch             │
│     - Cập nhật trạng thái trò chơi  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  9. Kiểm tra trạng thái trò chơi    │
│     - Nếu Free Spins: Giảm          │
│     - Nếu FS kết thúc: Quay về cơ   │
│       bản                           │
│     - Sẵn sàng cho lần quay tiếp    │
│       theo                          │
└─────────────────────────────────────┘
```

### Quản Lý Trạng Thái

```go
type GameState struct {
    // Người chơi
    PlayerID    string
    Balance     float64

    // Quay Hiện Tại
    BetAmount   float64
    Grid        [][]Symbol
    TotalWin    float64

    // Cascade
    CascadeCount    int
    Multiplier      int

    // Free Spins
    FreeSpinsState  *FreeSpinsState

    // Metadata
    SpinID      string
    Timestamp   time.Time
}
```
