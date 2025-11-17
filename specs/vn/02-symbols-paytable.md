# Biểu Tượng & Bảng Trả Thưởng

## Tổng Quan

Tài liệu này định nghĩa tất cả biểu tượng được sử dụng trong game slot Mahjong Ways, dựa trên **triển khai thực tế** trong codebase.

**Đặt Tên Biểu Tượng:** Biểu tượng sử dụng tên pinyin Trung Quốc (fa, zhong, bai, v.v.)
**Biến Thể Vàng:** Biểu tượng có thể có hậu tố `_gold` (chỉ hình ảnh, không ảnh hưởng gameplay trong MW1)

---

## Danh Mục Biểu Tượng

1. **Biểu Tượng Đặc Biệt** (wild, bonus, gold)
2. **Biểu Tượng Giá Trị Cao** (fa, zhong, bai, bawan)
3. **Biểu Tượng Giá Trị Thấp** (wusuo, wutong, liangsuo, liangtong)

---

## Biểu Tượng Đặc Biệt

### Biểu Tượng Wild (wild)

**ID Biểu Tượng:** `wild`

**Hình Ảnh:** Bát vàng/nồi với kho báu

**File Asset:**

- Thường: (tải riêng, không trong TILE_SLICES)
- Vàng: `wild_gold` (xuất hiện trên cuộn 2, 3, 4)

**Chức Năng:**

- Thay thế cho TẤT CẢ biểu tượng trả thưởng
- KHÔNG thay thế cho bonus (scatter)
- KHÔNG thay thế cho gold (mystery)

**Thanh Toán:** KHÔNG CÓ thanh toán độc lập (chỉ tồn tại để thay thế)

**Xuất Hiện:** KHÔNG thể xuất hiện trực tiếp. Wild CHỈ CÓ THỂ xuất hiện trên cuộn 2, 3, 4 nhưng CHỈ thông qua phép biến đổi từ biểu tượng Golden khi chúng là một phần của tổ hợp thắng.

*Lưu ý: Wild KHÔNG có mục bảng trả thưởng riêng. Nó chỉ hoạt động như thay thế, không có giá trị payout độc lập.*

**Mục Bảng Trả Thưởng:**

- KHÔNG CÓ (Wild không có thanh toán độc lập)

**Biến Thể Vàng:** Không có (Wild chỉ xuất hiện thông qua phép biến đổi Golden)

---

### Biểu Tượng Bonus (Scatter) (bonus)

**ID Biểu Tượng:** `bonus`

**Hình Ảnh:** Gạch Mahjong "发" (Fā) màu đỏ / Icon scatter đặc biệt

**File Asset:**

- `bonus.png`

**Chức Năng:** Kích hoạt tính năng Vòng Quay Miễn Phí (KHÔNG có thanh toán hàng)

**Quy Tắc Kích Hoạt:**

- 3+ biểu tượng Bonus ở bất kỳ đâu = Kích hoạt Vòng Quay Miễn Phí
- Biểu tượng Bonus KHÔNG cần phải liền kề
- Có thể xuất hiện ở bất kỳ vị trí cuộn nào

**Thưởng Vòng Quay Miễn Phí:**

| Số Lượng Bonus | Vòng Quay Miễn Phí Được Thưởng |
|----------------|--------------------------------|
| 3 Bonus | 12 Vòng Quay Miễn Phí |
| 4 Bonus | 14 Vòng Quay Miễn Phí (12 + 2) |
| 5 Bonus | 16 Vòng Quay Miễn Phí (12 + 4) |

**Công Thức:** `12 + (2 × (số_bonus - 3))`

**Mục Bảng Trả Thưởng:**

- KHÔNG CÓ (Bonus chỉ kích hoạt Free Spins, không có thanh toán hàng độc lập)

*Lưu ý: Bonus kích hoạt vòng quay miễn phí; nó KHÔNG tham gia vào thanh toán theo dòng.*

**Kích Hoạt Lại:**

- Trúng 3+ Bonus TRONG vòng quay miễn phí thưởng thêm vòng quay
- Có thể kích hoạt lại nhiều lần
- KHÔNG GIỚI HẠN tổng số vòng quay miễn phí

---

### Biểu Tượng Gold (Mystery) (gold)

**ID Biểu Tượng:** `gold`

**Hình Ảnh:** Quả cầu vàng / Biểu tượng bí ẩn

**File Asset:**

- `gold.png`

**Chức Năng:**

- Biểu tượng bí ẩn giá trị cao
- Không thể bị thay thế bởi Wild
- Thanh toán cao cấp

**Thanh Toán:** *Chưa được định nghĩa trong bảng trả thưởng hiện tại - cần đặc tả*

**Thanh Toán Ước Tính (dựa trên spec gốc):**

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | 500x |
| 4 biểu tượng | 100x |
| 3 biểu tượng | 10x |

**Xuất Hiện:** Tất cả cuộn (hiếm)

**Lưu ý:** `CONFIG.paytable` hiện tại không bao gồm `gold`. Backend nên triển khai các giá trị này.

---

## Biểu Tượng Giá Trị Cao

### Biểu Tượng H1: fa (发)

**ID Biểu Tượng:** `fa`

**Hình Ảnh:** Gạch Mahjong màu xanh lá với ký tự "发"

**File Asset:**

- Thường: `fa.png`
- Vàng: `fa_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Biểu tượng thường cao nhất

**Thanh Toán:**

```javascript
fa: { 3: 10, 4: 25, 5: 50 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **50x** |
| 4 biểu tượng | **25x** |
| 3 biểu tượng | **10x** |

---

### Biểu Tượng H2: zhong (中)

**ID Biểu Tượng:** `zhong`

**Hình Ảnh:** Gạch Mahjong màu đỏ với ký tự "中"

**File Asset:**

- Thường: `zhong.png`
- Vàng: `zhong_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Cao cấp cao

**Thanh Toán:**

```javascript
zhong: { 3: 8, 4: 20, 5: 40 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **40x** |
| 4 biểu tượng | **20x** |
| 3 biểu tượng | **8x** |

---

### Biểu Tượng H3: bai (白/百)

**ID Biểu Tượng:** `bai`

**Hình Ảnh:** Gạch vuông tím/trắng

**File Asset:**

- Thường: `bai.png`
- Vàng: `bai_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Cao cấp trung

**Thanh Toán:**

```javascript
bai: { 3: 6, 4: 15, 5: 30 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **30x** |
| 4 biểu tượng | **15x** |
| 3 biểu tượng | **6x** |

---

### Biểu Tượng H4: bawan (八萬)

**ID Biểu Tượng:** `bawan`

**Hình Ảnh:** Gạch Mahjong hiển thị "八萬" (8 trong bộ Chữ)

**File Asset:**

- Thường: `bawan.png`
- Vàng: `bawan_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Trung bình cao

**Thanh Toán:**

```javascript
bawan: { 3: 5, 4: 10, 5: 15 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **15x** |
| 4 biểu tượng | **10x** |
| 3 biểu tượng | **5x** |

---

## Biểu Tượng Giá Trị Thấp

### Biểu Tượng L1: wusuo (五索)

**ID Biểu Tượng:** `wusuo`

**Hình Ảnh:** Gạch với 5 que tre (bộ Tre)

**File Asset:**

- Thường: `wusuo.png`
- Vàng: `wusuo_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Trung bình

**Thanh Toán:**

```javascript
wusuo: { 3: 3, 4: 5, 5: 12 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **12x** |
| 4 biểu tượng | **5x** |
| 3 biểu tượng | **3x** |

---

### Biểu Tượng L2: wutong (五筒)

**ID Biểu Tượng:** `wutong`

**Hình Ảnh:** Gạch với 5 chấm tròn (bộ Chấm)

**File Asset:**

- Thường: `wutong.png`
- Vàng: `wutong_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Trung bình

**Thanh Toán:**

```javascript
wutong: { 3: 3, 4: 5, 5: 12 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **12x** |
| 4 biểu tượng | **5x** |
| 3 biểu tượng | **3x** |

---

### Biểu Tượng L3: liangsuo (两索)

**ID Biểu Tượng:** `liangsuo`

**Hình Ảnh:** Gạch với 2 que tre

**File Asset:**

- Thường: `liangsuo.png`
- Vàng: `liangsuo_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Thấp

**Thanh Toán:**

```javascript
liangsuo: { 3: 2, 4: 4, 5: 10 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **10x** |
| 4 biểu tượng | **4x** |
| 3 biểu tượng | **2x** |

---

### Biểu Tượng L4: liangtong (两筒)

**ID Biểu Tượng:** `liangtong`

**Hình Ảnh:** Gạch với 2 chấm tròn

**File Asset:**

- Thường: `liangtong.png`
- Vàng: `liangtong_gold.png` (chỉ cuộn 2, 3, 4)

**Hạng Giá Trị:** Thấp

**Thanh Toán:**

```javascript
liangtong: { 3: 1, 4: 3, 5: 6 }
```

| Số Lượng Biểu Tượng | Hệ Số Nhân Thanh Toán |
|---------------------|-----------------------|
| 5 biểu tượng | **6x** |
| 4 biểu tượng | **3x** |
| 3 biểu tượng | **1x** |

---

## Tóm Tắt Bảng Trả Thưởng Đầy Đủ

### Triển Khai Hiện Tại (từ `constants.js`)

```javascript
paytable: {
  fa:        { 3: 10, 4: 25, 5: 50 },
  zhong:     { 3: 8,  4: 20, 5: 40 },
  bai:       { 3: 6,  4: 15, 5: 30 },
  bawan:     { 3: 5,  4: 10, 5: 15 },
  wusuo:     { 3: 3,  4: 5,  5: 12 },
  wutong:    { 3: 3,  4: 5,  5: 12 },
  liangsuo:  { 3: 2,  4: 4,  5: 10 },
  liangtong: { 3: 1,  4: 3,  5: 6  },
  // bonus không có thanh toán (chỉ kích hoạt Free Spins)
  // wild không có thanh toán (chỉ thay thế, xuất hiện thông qua phép biến đổi Golden)
}
```

### Định Dạng Bảng

| Biểu Tượng | Loại | 5-cùng-loại | 4-cùng-loại | 3-cùng-loại | Ghi Chú |
|------------|------|-------------|-------------|-------------|---------|
| **Đặc Biệt** |
| wild | Đặc biệt | KHÔNG | KHÔNG | KHÔNG | Chỉ thay thế, xuất hiện qua biến đổi Golden |
| bonus | Đặc biệt | KHÔNG | KHÔNG | KHÔNG | Kích hoạt Vòng Quay Miễn Phí (3+), không thanh toán hàng |
| gold | Đặc biệt | 500x* | 100x* | 10x* | Biểu tượng bí ẩn (*đề xuất) |
| **Giá Trị Cao** |
| fa | Cao | 50x | 25x | 10x | "发" màu xanh |
| zhong | Cao | 40x | 20x | 8x | "中" màu đỏ |
| bai | Cao | 30x | 15x | 6x | Vuông trắng/tím |
| bawan | Cao | 15x | 10x | 5x | "八萬" |
| **Giá Trị Thấp** |
| wusuo | Thấp | 12x | 5x | 3x | 5 que tre |
| wutong | Thấp | 12x | 5x | 3x | 5 chấm |
| liangsuo | Thấp | 10x | 4x | 2x | 2 que tre |
| liangtong | Thấp | 6x | 3x | 1x | 2 chấm |

**Lưu ý:** Thanh toán biểu tượng Gold được đề xuất và cần được thêm vào cấu hình backend. Wild và Bonus không có mục bảng trả thưởng.

---

## Biến Thể Biểu Tượng Vàng

### Hành Vi

**QUAN TRỌNG:** Biểu tượng Golden là CƠ CHẾ BIẾN ĐỔI để tạo ra Wild symbols.

#### Quy Tắc Biến Đổi

- ✅ Khi biểu tượng Golden là một phần của tổ hợp thắng, nó được biến đổi thành Wild AFTER cascade
- ✅ Chỉ xuất hiện trên cuộn 2, 3, 4
- ✅ Biểu tượng gốc thanh toán bình thường trong cascade hiện tại
- ✅ Sau khi cascade hoàn thành, biểu tượng Golden được chuyển đổi thành Wild
- ✅ Wilds được chuyển đổi này vẫn tồn tại trong các cascades tiếp theo
- ✅ CÓ THỂ có nhiều cascades liên tiếp với các Wilds được chuyển đổi

#### Wild Chỉ Xuất Hiện Thông Qua Phép Biến Đổi

- ❌ Wild KHÔNG bao giờ xuất hiện trực tiếp từ RNG
- ❌ Wild KHÔNG bao giờ rơi từ trên xuống
- ✅ Wild CHỈ xuất hiện khi biểu tượng Golden là một phần của tổ hợp thắng và được biến đổi

### Định Dạng Biểu Tượng

**Backend/API:** Biểu tượng sử dụng hậu tố `_gold`

```
"fa_gold", "zhong_gold", "bai_gold", v.v.
```

**Frontend:** Đối tượng tile với flag `isGolden`

```javascript
{
  symbol: "fa",
  isGolden: true
}
```

### Hàm Chuyển Đổi

**Backend → Frontend:**

```javascript
function parseSymbol(symbolString) {
  return {
    symbol: symbolString.replace('_gold', ''),
    isGolden: symbolString.endsWith('_gold')
  }
}
```

**Frontend → Backend:**

```javascript
function serializeSymbol(tileObject) {
  return tileObject.isGolden
    ? `${tileObject.symbol}_gold`
    : tileObject.symbol
}
```

---

## Ví Dụ Tính Toán Chiến Thắng

### Ví Dụ 1: 3-cùng-loại đơn giản (fa)

**Cấu Hình Cuộn:**

```
Cuộn 1: fa (1 vị trí - hàng 1)
Cuộn 2: fa (2 vị trí - hàng 1, 3)
Cuộn 3: fa (1 vị trí - hàng 1)
```

**Tính Toán:**

```
Biểu tượng: fa
Số lượng: 3-cùng-loại
Cách = 1 × 2 × 1 = 2 cách
Thanh toán = 10x (từ bảng trả thưởng)
Hệ Số Nhân Cascade = 1 (cascade đầu tiên)
Cược Mỗi Cách = 100 / 20 = 5

Thắng = 10 × 2 × 1 × 5 = 100 credits
```

---

### Ví Dụ 2: Với Thay Thế Wild (zhong)

**Cấu Hình Cuộn:**

```
Cuộn 1: zhong (1 vị trí)
Cuộn 2: wild (1 vị trí)
Cuộn 3: zhong (2 vị trí)
Cuộn 4: zhong (1 vị trí)
```

**Tính Toán:**

```
Biểu tượng: zhong (wild thay thế)
Số lượng: 4-cùng-loại
Cách = 1 × 1 × 2 × 1 = 2 cách
Thanh toán = 20x
Hệ Số Nhân Cascade = 2 (cascade thứ hai)
Cược Mỗi Cách = 5

Thắng = 20 × 2 × 2 × 5 = 400 credits
```

---

### Ví Dụ 3: Số Cách Tối Đa (1,024)

**Cấu Hình Cuộn:**

```
Tất cả 5 cuộn có wutong ở tất cả 4 vị trí hiển thị
```

**Tính Toán:**

```
Biểu tượng: wutong
Số lượng: 5-cùng-loại
Cách = 4 × 4 × 4 × 4 × 4 = 1,024 cách (TỐI ĐA)
Thanh toán = 12x
Hệ Số Nhân Cascade = 10 (cascade 4+ trong Vòng Quay Miễn Phí)
Cược Mỗi Cách = 5

Thắng = 12 × 1,024 × 10 × 5 = 614,400 credits

Lưu ý: Sẽ bị giới hạn ở thắng tối đa (25,000x cược = 2,500,000 credits cho cược 100)
```

---

## Triển Khai Backend

### Cấu Hình Biểu Tượng

```go
package game

var Paytable = map[string]map[int]int{
    "fa":        {3: 10, 4: 25, 5: 50},
    "zhong":     {3: 8,  4: 20, 5: 40},
    "bai":       {3: 6,  4: 15, 5: 30},
    "bawan":     {3: 5,  4: 10, 5: 15},
    "wusuo":     {3: 3,  4: 5,  5: 12},
    "wutong":    {3: 3,  4: 5,  5: 12},
    "liangsuo":  {3: 2,  4: 4,  5: 10},
    "liangtong": {3: 1,  4: 3,  5: 6},
    // bonus: không có thanh toán (chỉ kích hoạt Free Spins)
    // wild: không có thanh toán (chỉ xuất hiện thông qua phép biến đổi Golden)
    "gold":      {3: 10, 4: 100, 5: 500}, // Biểu tượng bí ẩn
}

var SpecialSymbols = map[string]bool{
    "wild":  true,
    "bonus": true,
    "gold":  true,
}

func IsWildSubstitute(symbol string) bool {
    return symbol != "bonus" && symbol != "gold"
}

func GetBaseSymbol(symbol string) string {
    // Xóa hậu tố _gold
    if strings.HasSuffix(symbol, "_gold") {
        return symbol[:len(symbol)-5]
    }
    return symbol
}

func IsGoldenVariant(symbol string) bool {
    return strings.HasSuffix(symbol, "_gold")
}

func TransformGoldenToWild(symbol string) string {
    // Biến đổi biểu tượng Golden thành Wild sau khi cascade
    if IsGoldenVariant(symbol) {
        return "wild"
    }
    return symbol
}
```

### Schema Database

```sql
CREATE TABLE symbols (
    id SERIAL PRIMARY KEY,
    symbol_id VARCHAR(50) UNIQUE NOT NULL,
    symbol_name VARCHAR(100) NOT NULL,
    symbol_type VARCHAR(20) NOT NULL, -- 'HIGH_VALUE', 'LOW_VALUE', 'SPECIAL'
    payout_3 INTEGER,
    payout_4 INTEGER,
    payout_5 INTEGER,
    can_be_wild_substitute BOOLEAN DEFAULT TRUE,
    is_scatter BOOLEAN DEFAULT FALSE,
    is_wild BOOLEAN DEFAULT FALSE,
    can_have_golden_variant BOOLEAN DEFAULT TRUE,
    asset_path VARCHAR(255)
);

-- Chèn biểu tượng
INSERT INTO symbols (symbol_id, symbol_name, symbol_type, payout_3, payout_4, payout_5, is_wild, is_scatter) VALUES
('wild', 'Wild', 'SPECIAL', 1, 3, 6, TRUE, FALSE),
('bonus', 'Bonus Scatter', 'SPECIAL', 1, 3, 6, FALSE, TRUE),
('gold', 'Gold Mystery', 'SPECIAL', 10, 100, 500, FALSE, FALSE),
('fa', 'Green Fa', 'HIGH_VALUE', 10, 25, 50, FALSE, FALSE),
('zhong', 'Red Zhong', 'HIGH_VALUE', 8, 20, 40, FALSE, FALSE),
('bai', 'White Bai', 'HIGH_VALUE', 6, 15, 30, FALSE, FALSE),
('bawan', 'Eight Wan', 'HIGH_VALUE', 5, 10, 15, FALSE, FALSE),
('wusuo', 'Five Bamboo', 'LOW_VALUE', 3, 5, 12, FALSE, FALSE),
('wutong', 'Five Dots', 'LOW_VALUE', 3, 5, 12, FALSE, FALSE),
('liangsuo', 'Two Bamboo', 'LOW_VALUE', 2, 4, 10, FALSE, FALSE),
('liangtong', 'Two Dots', 'LOW_VALUE', 1, 3, 6, FALSE, FALSE);
```

---

## Tham Chiếu Asset

Tất cả asset biểu tượng được đặt tại:

```
src/assets/slotMachine/tiles/
```

### File Asset

```
fa.png              // "发" màu xanh
fa_gold.png
zhong.png           // "中" màu đỏ
zhong_gold.png
bai.png             // Vuông trắng/tím
bai_gold.png
bawan.png           // "八萬"
bawan_gold.png
wusuo.png           // 5 que tre
wusuo_gold.png
wutong.png          // 5 chấm
wutong_gold.png
liangsuo.png        // 2 que tre
liangsuo_gold.png
liangtong.png       // 2 chấm
liangtong_gold.png
gold.png            // Biểu tượng bí ẩn
bonus.png           // Scatter
star.png            // (Asset bổ sung)
```

**Lưu ý:** Asset biểu tượng Wild có thể được tải riêng hoặc ghép từ sprite sheets.

---

## Danh Sách Kiểm Tra Testing

- [ ] Tất cả biểu tượng tải đúng
- [ ] Giá trị bảng trả thưởng khớp với đặc tả
- [ ] Thay thế Wild hoạt động cho tất cả biểu tượng trừ bonus/gold
- [ ] Bonus kích hoạt vòng quay miễn phí ở số lượng 3+
- [ ] Biểu tượng Gold có thanh toán đúng
- [ ] Biến thể vàng chỉ xuất hiện trên cuộn 2, 3, 4
- [ ] Biến thể vàng chuyển thành thường sau cascade
- [ ] Tính toán thắng khớp với giá trị mong đợi
- [ ] Giới hạn thắng tối đa được thực thi (25,000x)
