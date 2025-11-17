# Tính Toán Thắng

## Tổng Quan

**Tính toán thắng** là quá trình xác định số tiền người chơi thắng từ một lượt quay. Nó kết hợp khớp biểu tượng, đếm ways, tra cứu paytable và áp dụng multiplier thành một số tiền thanh toán cuối cùng.

**Công Thức Chính:**
```
Total Win = Σ (Symbol_Payout × Ways × Multiplier × Bet_Per_Way)

Cho mỗi tổ hợp biểu tượng thắng trong cascade
```

---

## Tính Toán Thắng Từng Bước

### Luồng Thuật Toán Hoàn Chỉnh

```
┌─────────────────────────────────────────────┐
│ 1. ĐÁNH GIÁ LƯỚI CHO BIỂU TƯỢNG THẮNG       │
│    Quét tất cả biểu tượng cho khớp liền kề  │
│    Trái sang phải, tối thiểu 3-of-a-kind    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. ĐẾM WAYS CHO MỖI BIỂU TƯỢNG THẮNG        │
│    Nhân vị trí khớp mỗi reel                │
│    Ways = n₁ × n₂ × n₃ × ...               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. TRA CỨU THANH TOÁN TỪ PAYTABLE           │
│    Dựa trên: Biểu tượng + Độ dài khớp       │
│    Ví dụ: FA 4-of-a-kind = 25x             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 4. ÁP DỤNG CASCADE MULTIPLIER               │
│    Trò chơi cơ bản: x1/x2/x3/x5             │
│    Free spins: x2/x4/x6/x10                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. NHÂN VỚI BET PER WAY                     │
│    Bet_Per_Way = Total_Bet / 20            │
│    Win = Payout × Ways × Mult × BPW        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 6. TỔNG TẤT CẢ BIỂU TƯỢNG THẮNG            │
│    Total = Win_A + Win_B + Win_C + ...     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 7. ÁP DỤNG GIỚI HẠN THẮNG TỐI ĐA            │
│    Nếu total > 25,000x bet, giới hạn nó    │
│    Trả về số tiền thắng cuối cùng          │
└─────────────────────────────────────────────┘
```

---

## Bước 1: Đánh Giá Biểu Tượng

### Xác Định Biểu Tượng Thắng

**Quy Trình:** Quét lưới cho các biểu tượng tạo thành 3+ khớp liên tiếp từ trái sang phải.

**Ví Dụ Lưới:**
```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    FA       FA       FA       FA      ZHONG
Row 2:  ZHONG    ZHONG    ZHONG     WILD    ZHONG
Row 3:    BAI      BAI      BAI      BAI     WILD
Row 4:  WILD     BAWAN    WUSUO    LIANGSUO LIANGTONG
```

**Kết Quả Quét:**

**Biểu Tượng: FA**
```
Kiểm tra Reel 1: FA tìm thấy ở row 1 ✓
Kiểm tra Reel 2: FA tìm thấy ở row 1 ✓
Kiểm tra Reel 3: FA tìm thấy ở row 1 ✓
Kiểm tra Reel 4: FA tìm thấy ở row 1 ✓
Kiểm tra Reel 5: FA KHÔNG tìm thấy ✗

Kết quả: FA xuất hiện trên 4 reels liên tiếp
Khớp: 4-of-a-kind ✓
```

---

## Bước 2: Đếm Ways

### Thuật Toán Tính Ways

**Công Thức:**
```
Ways = Positions_Reel_1 × Positions_Reel_2 × ... × Positions_Reel_N

Trong đó:
N = Số reels liên tiếp có khớp (≥3)
Positions_Reel_i = Số biểu tượng khớp trên reel i
```

---

### Ví Dụ: Đếm Ways FA

**Từ Lưới Trên:**
```
FA xuất hiện trên reels 1-4 (4-of-a-kind)

Reel 1: FA ở row 1 → 1 vị trí
Reel 2: FA ở row 1 → 1 vị trí
Reel 3: FA ở row 1 → 1 vị trí
Reel 4: FA ở row 1 → 1 vị trí

Ways = 1 × 1 × 1 × 1 = 1 way
```

---

## Bước 3: Tra Cứu Paytable

### Cấu Trúc Paytable

**Từ Cấu Hình Trò Chơi:**

```javascript
paytable = {
  fa:        { 3: 10, 4: 25, 5: 50 },
  zhong:     { 3: 8,  4: 20, 5: 40 },
  bai:       { 3: 6,  4: 15, 5: 30 },
  bawan:     { 3: 5,  4: 10, 5: 15 },
  wusuo:     { 3: 3,  4: 5,  5: 12 },
  wutong:    { 3: 3,  4: 5,  5: 12 },
  liangsuo:  { 3: 2,  4: 4,  5: 10 },
  liangtong: { 3: 1,  4: 3,  5: 6  },
  bonus:     { 3: 1,  4: 3,  5: 6  },  // Scatter
  wild:      { 3: 1,  4: 3,  5: 6  }   // Wild
}
```

---

## Bước 4: Áp Dụng Cascade Multiplier

### Chọn Multiplier

**Multipliers Trò Chơi Cơ Bản:**
```
Cascade 1: x1
Cascade 2: x2
Cascade 3: x3
Cascade 4+: x5
```

**Multipliers Free Spins:**
```
Cascade 1: x2
Cascade 2: x4
Cascade 3: x6
Cascade 4+: x10
```

---

## Bước 5: Tính Bet Per Way

### Hiểu Cấu Trúc Cược

**Tổng Cược vs Bet Per Way:**

```
Người chơi đặt cược: 100 credits tổng cộng

Mẫu số ways cố định: 20

Bet Per Way = 100 / 20 = 5 credits

Tại sao 20?
- Tiêu chuẩn slot lịch sử
- Đơn giản hóa tính toán
- Dễ hiểu cho người chơi
- Nhất quán trên tất cả cược
```

**Ví Dụ:**
```
Tổng Cược: 100 → Bet Per Way: 5
Tổng Cược: 200 → Bet Per Way: 10
Tổng Cược: 50 → Bet Per Way: 2.5
Tổng Cược: 1000 → Bet Per Way: 50
```

---

### Tính Toán Thắng Cuối Cùng

**Cho mỗi biểu tượng, tính:**

```
Symbol_Win = Paytable_Value × Ways_Count × Multiplier × Bet_Per_Way
```

**Ví Dụ - Thắng FA:**
```
Symbol: FA
Paytable: 25x (4-of-a-kind)
Ways: 1
Multiplier: x6 (cascade 3, free spins)
Bet Per Way: 5 credits (100 tổng cược / 20)

Tính Toán:
FA_Win = 25 × 1 × 6 × 5
       = 25 × 30
       = 750 credits
```

---

## Bước 6: Tổng Tất Cả Thắng

### Tổng Cascade Thắng

**Thêm tất cả thắng biểu tượng riêng lẻ:**

```
Total Cascade Win = FA_Win + ZHONG_Win + BAI_Win
                  = 750 + 2,400 + 900
                  = 4,050 credits
```

**Đây là thắng cho MỘT cascade.**

---

## Bước 7: Giới Hạn Thắng Tối Đa

### Xác Minh Giới Hạn

**Quy Tắc Thắng Tối Đa:** 25,000x tổng cược

```
Tổng Cược: 100 credits
Thắng Tối Đa: 25,000 × 100 = 2,500,000 credits

Thắng Đã Tính: 6,510 credits

Kiểm tra: 6,510 < 2,500,000?
Có → Không áp dụng giới hạn
Thắng Cuối Cùng: 6,510 credits
```

**Nếu giới hạn bị vượt quá:**
```
Thắng Đã Tính: 3,200,000 credits
Tối Đa Cho Phép: 2,500,000 credits

Kiểm tra: 3,200,000 > 2,500,000?
Có → Áp dụng giới hạn
Thắng Cuối Cùng: 2,500,000 credits (giới hạn)

Lưu ý: Người chơi được thông báo đạt thắng tối đa
       Trong free spins: Phiên kết thúc ngay lập tức
```

---

## Ví Dụ Tính Toán Hoàn Chỉnh

### Thiết Lập Kịch Bản

**Trạng Thái Trò Chơi:**
- Chế độ: Free Spins
- Cascade Hiện Tại: 2 (multiplier x4)
- Tổng Cược: 200 credits
- Bet Per Way: 200 / 20 = 10 credits

**Kết Quả Lưới:**
```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    FA       FA       FA       FA      ZHONG
Row 2:  BAWAN    BAWAN    BAWAN    BAWAN    BAWAN
Row 3:  WILD      BAI      BAI      BAI      BAI
Row 4:  ZHONG    ZHONG    WUSUO    LIANGSUO LIANGTONG
```

---

### Tính Toán Từng Bước

**Bước 1: Xác Định Thắng**
```
FA: Reels 1-4 → 4-of-a-kind ✓
BAWAN: Reels 1-5 → 5-of-a-kind ✓
BAI: Reels 2-5 → Không thể bắt đầu từ Reel 1 ✗
     Kiểm tra Reel 1: WILD ở row 3 thay thế
     → Reels 1-5 → 5-of-a-kind ✓
```

**Biểu Tượng Thắng:**
- FA: 4-of-a-kind
- BAWAN: 5-of-a-kind
- BAI: 5-of-a-kind

---

**Bước 2: Đếm Ways**

**Ways FA:**
```
Reel 1: row 1 → 1 vị trí
Reel 2: row 1 → 1 vị trí
Reel 3: row 1 → 1 vị trí
Reel 4: row 1 → 1 vị trí

Ways = 1 × 1 × 1 × 1 = 1 way
```

**Ways BAWAN:**
```
Reel 1: row 2 → 1 vị trí
Reel 2: row 2 → 1 vị trí
Reel 3: row 2 → 1 vị trí
Reel 4: row 2 → 1 vị trí
Reel 5: row 2 → 1 vị trí

Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

**Ways BAI:**
```
Reel 1: WILD ở row 3 (thay thế) → 1 vị trí
Reel 2: BAI ở row 3 → 1 vị trí
Reel 3: BAI ở row 3 → 1 vị trí
Reel 4: BAI ở row 3 → 1 vị trí
Reel 5: BAI ở row 3 → 1 vị trí

Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

---

**Bước 3: Tra Cứu Paytable**

```
FA 4-of-a-kind: paytable["fa"][4] = 25x
BAWAN 5-of-a-kind: paytable["bawan"][5] = 15x
BAI 5-of-a-kind: paytable["bai"][5] = 30x
```

---

**Bước 4: Áp Dụng Multiplier**

```
Cascade 2 trong Free Spins
Multiplier: x4
```

---

**Bước 5: Tính Từng Thắng**

**Thắng FA:**
```
25 × 1 × 4 × 10 = 1,000 credits
```

**Thắng BAWAN:**
```
15 × 1 × 4 × 10 = 600 credits
```

**Thắng BAI:**
```
30 × 1 × 4 × 10 = 1,200 credits
```

---

**Bước 6: Tổng Cộng**

```
Total Cascade Win = 1,000 + 600 + 1,200
                  = 2,800 credits
```

---

**Bước 7: Kiểm Tra Thắng Tối Đa**

```
Tổng Cược: 200 credits
Thắng Tối Đa: 25,000 × 200 = 5,000,000 credits
Đã Tính: 2,800 credits

2,800 < 5,000,000 → Không giới hạn
Thắng Cuối Cùng: 2,800 credits
```

---

## Tóm Tắt

**Quy Trình Tính Toán Thắng:**
1. **Đánh Giá**: Quét lưới cho 3+ khớp biểu tượng liên tiếp
2. **Đếm Ways**: Nhân vị trí khớp qua các reels
3. **Tra Cứu**: Lấy giá trị paytable cho biểu tượng + độ dài khớp
4. **Nhân**: Áp dụng cascade multiplier
5. **Quy Mô**: Nhân với bet per way
6. **Tổng**: Thêm tất cả thắng biểu tượng riêng lẻ
7. **Giới Hạn**: Áp dụng tối đa 25,000x nếu vượt quá

**Công Thức:**
```
Total Win = Σ (Paytable[symbol][length] × Ways × Multiplier × Bet_Per_Way)
```

**Điểm Chính:**
- Wild thay thế cho bất kỳ biểu tượng thanh toán nào
- Chỉ khớp dài nhất mỗi biểu tượng đếm
- Tất cả thắng trong cascade sử dụng cùng multiplier
- Bet per way = Total bet / 20
- Thắng tối đa = 25,000x tổng cược
- Cho phép credits phân số
- Scatters thanh toán VÀ kích hoạt

**Kết quả:** Tính toán thanh toán công bằng, minh bạch và chính xác toán học!
