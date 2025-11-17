# Hệ Thống Ways to Win

## Tổng Quan Khái Niệm

Không giống như các máy đánh bạc truyền thống với các đường thắng cố định, Mahjong Ways sử dụng hệ thống **"Ways to Win"**. Điều này có nghĩa là không có các đường thắng được xác định trước - thay vào đó, các biểu tượng khớp trên các reel liền kề từ trái sang phải tạo ra chiến thắng.

**Ways Có Thể Tối Đa:** 4 × 4 × 4 × 4 × 4 = **1,024 ways**

---

## Nguyên Tắc Cốt Lõi: Khớp Reel Liền Kề

### Quy Tắc Cơ Bản

**Biểu tượng phải xuất hiện trên các reels liên tiếp bắt đầu từ reel trái nhất (Reel 1).**

```
Mẫu Thắng Hợp Lệ:
Reel 1: Symbol A ✓
Reel 2: Symbol A ✓
Reel 3: Symbol A ✓
= 3-of-a-kind THẮNG

Mẫu Không Hợp Lệ:
Reel 1: Symbol B
Reel 2: Symbol A ✗ (không khớp Reel 1)
Reel 3: Symbol A ✗
= KHÔNG THẮNG (phải bắt đầu từ trái)

Mẫu Không Hợp Lệ:
Reel 1: Symbol A ✓
Reel 2: Symbol B ✗ (phá vỡ chuỗi)
Reel 3: Symbol A ✗
= KHÔNG THẮNG (phải liên tiếp)
```

---

## Cách Đếm Ways

### Khớp Vị Trí Đơn

**Kịch bản:** Một biểu tượng trên mỗi reel khớp

```
Bố Cục Lưới:
        Reel 1   Reel 2   Reel 3
Row 1:    A        B        C
Row 2:    X        A        A    ← Chỉ những cái này khớp
Row 3:    B        X        B
Row 4:    C        C        X

Tính Toán:
Reel 1: 1 vị trí khớp (row 2)
Reel 2: 1 vị trí khớp (row 2)
Reel 3: 1 vị trí khớp (row 2)

Ways = 1 × 1 × 1 = 1 way
```

**Kết quả:** 1 way để thắng với biểu tượng A (3-of-a-kind)

---

### Nhiều Vị Trí Mỗi Reel

**Kịch bản:** Nhiều biểu tượng khớp trên mỗi reel

```
Bố Cục Lưới:
        Reel 1   Reel 2   Reel 3
Row 1:    A        A        B
Row 2:    X        A        A    ← Row 2 của Reel 3 khớp
Row 3:    B        X        A    ← Row 3 của Reel 3 khớp
Row 4:    C        C        X

Tính Toán:
Reel 1: 1 vị trí khớp (A ở row 1)
Reel 2: 2 vị trí khớp (A ở rows 1 và 2)
Reel 3: 2 vị trí khớp (A ở rows 2 và 3)

Ways = 1 × 2 × 2 = 4 ways
```

**Kết quả:** 4 ways khác nhau để thắng với biểu tượng A

---

### Hình Dung Các Ways

Cho ví dụ trên, 4 ways là:

```
Way 1: Reel1(Row1) → Reel2(Row1) → Reel3(Row2)
Way 2: Reel1(Row1) → Reel2(Row1) → Reel3(Row3)
Way 3: Reel1(Row1) → Reel2(Row2) → Reel3(Row2)
Way 4: Reel1(Row1) → Reel2(Row2) → Reel3(Row3)
```

Mỗi way đại diện cho một đường dẫn duy nhất qua các biểu tượng khớp.

---

## Yêu Cầu Thắng Tối Thiểu

### Ít Nhất 3-of-a-Kind

**Biểu tượng phải xuất hiện trên ít nhất 3 reels liên tiếp từ trái.**

```
2-of-a-kind (KHÔNG HỢP LỆ):
Reel 1: A
Reel 2: A
= KHÔNG THANH TOÁN (cần tối thiểu 3)

3-of-a-kind (HỢP LỆ):
Reel 1: A
Reel 2: A
Reel 3: A
= THANH TOÁN ✓

4-of-a-kind (TỐT HƠN):
Reel 1: A
Reel 2: A
Reel 3: A
Reel 4: A
= THANH TOÁN CAO HƠN ✓

5-of-a-kind (TỐT NHẤT):
Reel 1: A
Reel 2: A
Reel 3: A
Reel 4: A
Reel 5: A
= THANH TOÁN TỐI ĐA ✓
```

---

## Tương Tác Biểu Tượng Wild

### Wild Như Biểu Tượng Thay Thế

**Biểu tượng Wild thay thế cho bất kỳ biểu tượng thanh toán nào** (ngoại trừ Scatter và Mystery).

```
Ví Dụ Với Wild:
        Reel 1   Reel 2   Reel 3   Reel 4
Row 1:    A       WILD      A        A
Row 2:    B        B        B        X

Phân Tích:
- WILD của Reel 2 thay thế cho biểu tượng A
- Tạo 4-of-a-kind cho biểu tượng A
- Kết quả: Thanh toán như 4-of-a-kind A
```

---

### Wild Tăng Ways

```
Bố Cục Lưới:
        Reel 1   Reel 2   Reel 3
Row 1:    A       WILD      A
Row 2:    B       WILD      B
Row 3:    C        C        A

Reel 1: A ở row 1
Reel 2: WILD ở rows 1 và 2 (cả hai đếm như A)
Reel 3: A ở rows 1 và 3

Ways cho biểu tượng A:
Reel 1: 1 vị trí
Reel 2: 2 vị trí (cả hai WILD đếu)
Reel 3: 2 vị trí

Ways = 1 × 2 × 2 = 4 ways

Chiến thắng bổ sung cho biểu tượng B:
Reel 1: B ở row 2
Reel 2: WILD ở row 1 và row 2 (đếm như B)
Reel 3: B ở row 2

Ways = 1 × 2 × 1 = 1 way

Tổng: 4 ways cho A + 2 way cho B = 6 ways tổng cộng
```

---

## Kịch Bản Ways Tối Đa

### Căn Chỉnh Hoàn Hảo (1,024 Ways)

**Tất cả 4 rows trên cả 5 reels chứa cùng biểu tượng:**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        A        A        A
Row 2:    A        A        A        A        A
Row 3:    A        A        A        A        A
Row 4:    A        A        A        A        A

Ways = 4 × 4 × 4 × 4 × 4 = 1,024 ways (TỐI ĐA)

Thanh toán = Symbol_A_5oak × 1,024 × Multiplier × Bet_Per_Way
```

**Điều này cực kỳ hiếm nhưng đại diện cho giá trị tối đa lý thuyết.**

---

## Nhiều Chiến Thắng Đồng Thời

### Các Biểu Tượng Khác Nhau Thắng Cùng Lúc

**Hệ thống đánh giá TẤT CẢ biểu tượng độc lập.**

```
Bố Cục Lưới:
        Reel 1   Reel 2   Reel 3
Row 1:    A        A        A     ← Biểu tượng A thắng
Row 2:    B        B        B     ← Biểu tượng B thắng
Row 3:    C        C        C     ← Biểu tượng C thắng
Row 4:    X        Y        Z

Kết Quả:
- Biểu tượng A: 3-of-a-kind, 1 way
- Biểu tượng B: 3-of-a-kind, 1 way
- Biểu tượng C: 3-of-a-kind, 1 way

Tổng thanh toán = Win_A + Win_B + Win_C
```

---

## Các Trường Hợp Đặc Biệt

### Trường Hợp 1: Reel 1 Không Có Khớp

**Nếu Reel 1 (trái nhất) không có biểu tượng, sẽ KHÔNG có chiến thắng.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    X        A        A        A        A
Row 2:    B        B        B        B        B

Kết Quả:
- Biểu tượng A: KHÔNG THẮNG (phải bắt đầu từ Reel 1)
- Biểu tượng B: 4-of-a-kind ✓ (bắt đầu từ Reel 1)
```

---

### Trường Hợp 2: Khoảng Trống Ở Reel Giữa

**Chuỗi bị phá vỡ ở reel không khớp đầu tiên.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A        X        A        A

Kết Quả:
- Biểu tượng A: 2-of-a-kind (chỉ reels 1-2)
- KHÔNG THANH TOÁN (tối thiểu là 3-of-a-kind)
- Reels 4-5 không đếm (khoảng trống ở Reel 3)
```

---

### Trường Hợp 3: Wild Lấp Khoảng Trống

**Wild CÓ THỂ kết nối các biểu tượng bị tách rời.**

```
        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 1:    A        A       WILD      A        A

Kết Quả:
- Wild thay thế như A trên Reel 3
- Tạo 5-of-a-kind cho biểu tượng A ✓
- Ways = 1 × 1 × 1 × 1 × 1 = 1 way
```

---

## Tích Hợp Tính Toán Thanh Toán

### Công Thức Hoàn Chỉnh

```
Total Win = Σ (Symbol_Payout × Ways_Count × Multiplier × Bet_Per_Way)

Cho mỗi biểu tượng thắng:
1. Đếm ways (như mô tả ở trên)
2. Tra cứu thanh toán từ paytable (dựa trên biểu tượng và số lượng)
3. Nhân với cascade multiplier hiện tại
4. Nhân với bet per way
5. Thêm vào tổng thắng
```

### Ví Dụ Tính Toán

```
Kịch Bản:
Symbol: FA (Green 发)
Count: 4-of-a-kind
Ways: 12 ways
Paytable: FA 4-of-a-kind = 25x
Cascade: 2nd cascade (multiplier = x2)
Bet: 100 total (100/20 = 5 per way)

Tính Toán:
Win = 25 × 12 × 2 × 5
    = 25 × 12 × 10
    = 3,000 credits
```

---

## So Sánh Với Paylines

### Paylines Truyền Thống

```
Đường Cố Định: ví dụ, 20 paylines
Line 1: Position[1,2] → Position[2,2] → Position[3,2]
Line 2: Position[1,1] → Position[2,1] → Position[3,1]
...

Chỉ biểu tượng ở những vị trí chính xác này mới đếm.
```

### Ways to Win

```
Linh Hoạt: Bất kỳ kết hợp vị trí nào cũng đếm
Tất cả vị trí trên các reel liền kề đều đóng góp
Tạo ra tối đa 1,024 đường thắng có thể

Năng động và thú vị hơn nhiều!
```

---

## Tổng Kết

**Ways to Win cung cấp:**

- Kết hợp thắng động (không có paylines cố định)
- Lên đến 1,024 ways có thể mỗi lượt quay
- Khớp reel liền kề từ trái sang phải
- Yêu cầu tối thiểu 3-of-a-kind
- Thay thế Wild tăng tính linh hoạt
- Nhiều chiến thắng đồng thời có thể

**Kết quả:** Thú vị, đa dạng và hấp dẫn hơn các paylines truyền thống!
