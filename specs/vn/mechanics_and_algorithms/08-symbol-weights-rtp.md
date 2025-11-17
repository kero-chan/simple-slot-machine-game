# Symbol Weights & RTP

## Tổng Quan

**Symbol weights** là nền tảng của toán học máy đánh bạc. Chúng xác định tần suất mỗi biểu tượng xuất hiện trên các reels, điều này trực tiếp kiểm soát tỷ lệ Return to Player (RTP) và hồ sơ độ biến động của trò chơi.

**Nguyên Tắc Chính:** Tần suất biểu tượng được cân bằng cẩn thận tạo ra gameplay có thể dự đoán, công bằng và hấp dẫn.

---

## Hiểu Symbol Weights

### Symbol Weights Là Gì?

**Định Nghĩa:** Số lần một biểu tượng xuất hiện trên một reel strip.

**Ví Dụ:**
```
Độ Dài Reel Strip: 100 vị trí

Symbol Weights cho Reel 1:
wild:      2 vị trí  →  2% cơ hội mỗi lượt quay
fa:        8 vị trí  →  8% cơ hội mỗi lượt quay
zhong:     10 vị trí → 10% cơ hội mỗi lượt quay
bawan:     14 vị trí → 14% cơ hội mỗi lượt quay
liangtong: 18 vị trí → 18% cơ hội mỗi lượt quay

Tổng: 100 vị trí (phải bằng độ dài strip)
```

---

### Khái Niệm Phân Phối Weight

**Biểu Diễn Hình Ảnh:**

```
Reel Strip (100 vị trí):

[liangtong][fa][liangtong][zhong][bawan][zhong][liangtong]...

Position:  0    1    2         3        4       5      6
Symbol:    ↑    ↑    ↑         ↑        ↑       ↑      ↑
Weight:    18x  8x   18x       10x      14x     10x    18x

Weight cao hơn = Thường xuyên hơn = Giá trị thấp hơn
Weight thấp hơn = Ít thường xuyên hơn = Giá trị cao hơn
```

---

### Tại Sao Weights Quan Trọng

**Kiểm Soát RTP:**
```
Biểu tượng giá trị cao (ví dụ: FA):
- Weight thấp (8 vị trí / 100)
- Xuất hiện 8% thời gian
- Thanh toán cao (50x cho 5-of-a-kind)
- Hiếm nhưng có giá trị

Biểu tượng giá trị thấp (ví dụ: LIANGTONG):
- Weight cao (18 vị trí / 100)
- Xuất hiện 18% thời gian
- Thanh toán thấp (6x cho 5-of-a-kind)
- Phổ biến nhưng ít giá trị hơn

Cân bằng:
- Thắng nhỏ thường xuyên (sự tham gia)
- Thắng lớn hiếm (sự phấn khích)
- Kết hợp = RTP mục tiêu (96.92%)
```

---

## Cấu Hình Symbol Weight

### Bảng Weight Hoàn Chỉnh

**Reel 1 & Reel 5 (Reels Ngoài):**
```
Symbol       Weight    Tỷ Lệ Phần Trăm
─────────────────────────────────
liangtong      18        18.0%
liangsuo       18        18.0%
wutong         16        16.0%
wusuo          16        16.0%
bawan          14        14.0%
bai            12        12.0%
zhong          10        10.0%
fa              8         8.0%
bonus           3         3.0%
wild            2         2.0%
gold            1         1.0%
─────────────────────────────────
TỔNG          118       118.0%

Lưu ý: Cần điều chỉnh đến 100 vị trí
```

**Quy Trình Điều Chỉnh:**
```
Tổng weights: 118
Độ dài Strip: 100

Cần xóa: 18 vị trí

Chiến lược:
1. Giảm tỷ lệ biểu tượng phổ biến nhất
2. Hoặc chọn ngẫu nhiên 18 vị trí để xóa
3. Duy trì tỷ lệ gần nhất có thể

Weights đã điều chỉnh:
liangtong: 18 → 15
liangsuo: 18 → 15
wutong: 16 → 14
wusuo: 16 → 14
bawan: 14 → 12
bai: 12 → 10
zhong: 10 → 8
fa: 8 → 6
bonus: 3 → 3
wild: 2 → 2
gold: 1 → 1

TỔNG: 100 ✓
```

---

**Reels 2, 3, 4 (Reels Giữa với Biểu Tượng Vàng):**
```
Symbol       Weight    Tỷ Lệ Phần Trăm
─────────────────────────────────
liangtong      15        15.0%
liangsuo       15        15.0%
wutong         14        14.0%
wusuo          14        14.0%
bawan          12        12.0%
bai            10        10.0%
zhong           7         7.0%
zhong_gold      1         1.0%
fa              5         5.0%
fa_gold         1         1.0%
bonus           3         3.0%
wild            1         1.0%
wild_gold       1         1.0%
gold            1         1.0%
─────────────────────────────────
TỔNG          100       100.0% ✓

Lưu ý: Biến thể vàng được tách từ biểu tượng cơ bản
```

---

## Tính Toán Xác Suất

### Xác Suất Biểu Tượng Đơn

**Công Thức:**
```
P(Symbol on Reel) = Weight / Strip_Length

Ví dụ - FA trên Reel 1:
P(FA) = 6 / 100 = 0.06 = 6%
```

---

### Xác Suất Nhiều Reel

**Mô Hình Reel Độc Lập:**
```
P(Symbol on all reels) = P(Reel1) × P(Reel2) × P(Reel3) × P(Reel4) × P(Reel5)

Ví dụ - FA 5-of-a-kind (1 way):
P(FA on R1) = 6/100 = 0.06
P(FA on R2) = 6/100 = 0.06
P(FA on R3) = 6/100 = 0.06
P(FA on R4) = 6/100 = 0.06
P(FA on R5) = 6/100 = 0.06

P(FA 5-oak, 1 way) = 0.06^5
                    = 0.00000777
                    = 1 trong 128,600 lượt quay

Rất hiếm!
```

---

## Đóng Góp RTP Theo Biểu Tượng

### Phân Tích Công Thức RTP

**Cho Mỗi Biểu Tượng:**
```
RTP_Symbol = Σ (P(match) × Payout × Expected_Ways × Multiplier)

Trong đó:
P(match) = Xác suất tạo độ dài khớp đó
Payout = Giá trị paytable cho khớp đó
Expected_Ways = Số ways trung bình cho khớp đó
Multiplier = Cascade multiplier mong đợi
```

---

### Ví Dụ: Đóng Góp RTP Biểu Tượng FA

**Paytable FA:**
```
3-of-a-kind: 10x
4-of-a-kind: 25x
5-of-a-kind: 50x
```

**Ước Tính Xác Suất (đơn giản hóa):**
```
P(FA 3-oak) ≈ 0.05 (5%)
P(FA 4-oak) ≈ 0.01 (1%)
P(FA 5-oak) ≈ 0.0005 (0.05%)
```

**Ways Mong Đợi (đơn giản hóa):**
```
FA 3-oak: ~2 ways trung bình
FA 4-oak: ~1.5 ways trung bình
FA 5-oak: ~1 way trung bình
```

**Multiplier Mong Đợi:**
```
Trung bình trò chơi cơ bản: 1.44x
(Từ phân tích tiến triển multiplier)
```

**Tính Toán:**
```
RTP(FA 3-oak) = 0.05 × 10 × 2 × 1.44 = 1.44%
RTP(FA 4-oak) = 0.01 × 25 × 1.5 × 1.44 = 0.54%
RTP(FA 5-oak) = 0.0005 × 50 × 1 × 1.44 = 0.036%

RTP(FA Total) ≈ 2.02%

FA đóng góp ~2% vào tổng RTP
```

---

## Cân Bằng Độ Biến Động

### Khái Niệm Độ Biến Động

**Định Nghĩa:** Mức độ phương sai tồn tại trong số tiền thắng.

**Độ Biến Động Thấp:**
```
Đặc điểm:
- Thắng nhỏ thường xuyên
- Thắng lớn hiếm
- Gameplay ổn định
- Biến động số dư thấp hơn
- Thu hút người chơi thông thường

Chiến Lược Symbol Weight:
- Weights cao hơn cho tất cả biểu tượng
- Paytable cân bằng hơn
- Thanh toán tối đa thấp hơn
```

**Độ Biến Động Cao (Trò Chơi Của Chúng Ta):**
```
Đặc điểm:
- Thắng không thường xuyên
- Tiềm năng thắng khổng lồ
- Gameplay kịch tính
- Biến động số dư lớn
- Thu hút những người tìm kiếm cảm giác mạnh

Chiến Lược Symbol Weight:
- Weights thấp hơn cho biểu tượng giá trị cao
- Khoảng cách paytable cực độ (1x đến 50x)
- Thanh toán tối đa cao (25,000x cược)
- Khuếch đại cascade multiplier
```

---

## Điều Chỉnh Cho RTP Mục Tiêu

### Điều Chỉnh Dựa Trên Mô Phỏng

**Quy Trình:**

```
┌─────────────────────────────────────────┐
│ 1. CẤU HÌNH BAN ĐẦU                      │
│    Đặt symbol weights (đoán có căn cứ)  │
│    Định nghĩa paytable                   │
│    Cấu hình multipliers                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. CHẠY MÔ PHỎNG                        │
│    Mô phỏng 10,000,000+ lượt quay       │
│    Theo dõi đã đặt & đã trả             │
│    Tính RTP                              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. PHÂN TÍCH KẾT QUẢ                    │
│    RTP = (Returned / Wagered) × 100    │
│    So sánh với mục tiêu (96.92%)        │
│    Xác định sự khác biệt                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. ĐIỀU CHỈNH WEIGHTS                   │
│    Nếu RTP quá cao: Giảm biểu tượng cao │
│    Nếu RTP quá thấp: Tăng biểu tượng cao│
│    Thực hiện thay đổi tăng dần nhỏ      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 5. LẶP LẠI                              │
│    Lặp lại bước 2-4 cho đến hội tụ      │
│    Mục tiêu: 96.92% ± 0.5%             │
│    Thường mất 5-15 lần lặp              │
└─────────────────────────────────────────┘
```

---

### Ví Dụ Điều Chỉnh

**Kịch Bản 1: RTP Quá Cao**
```
Kết Quả Mô Phỏng: 97.5% RTP
Mục Tiêu: 96.92%
Khác Biệt: +0.58% (quá cao)

Phân Tích:
- Biểu tượng cao xuất hiện quá thường xuyên
- HOẶC paytable quá hào phóng

Chiến Lược Điều Chỉnh:
Option A: Giảm weights biểu tượng cao
  fa: 6 → 5 vị trí
  zhong: 8 → 7 vị trí
  bai: 10 → 9 vị trí

Option B: Điều chỉnh paytable
  fa 5-oak: 50x → 48x
  zhong 5-oak: 40x → 38x

Kiểm thử lại:
Chạy mô phỏng với weights mới
Kết quả mong đợi: Gần hơn với 96.92%
```

**Kịch Bản 2: RTP Quá Thấp**
```
Kết Quả Mô Phỏng: 96.2% RTP
Mục Tiêu: 96.92%
Khác Biệt: -0.72% (quá thấp)

Phân Tích:
- Biểu tượng cao quá hiếm
- HOẶC paytable không đủ hào phóng
- HOẶC cascade multipliers hoạt động kém

Chiến Lược Điều Chỉnh:
Option A: Tăng weights biểu tượng cao
  fa: 6 → 7 vị trí
  zhong: 8 → 9 vị trí

Option B: Tăng giá trị paytable
  fa 4-oak: 25x → 27x
  zhong 4-oak: 20x → 22x

Option C: Điều chỉnh tiến triển multiplier
  Cascade 4: x5 → x6

Kiểm thử lại và lặp lại
```

---

## Yêu Cầu Xác Thực

### Tiêu Chuẩn Mô Phỏng

**Yêu Cầu Tối Thiểu:**

```
Số Lượt Quay: 10,000,000 tối thiểu
  - Nhiều hơn càng tốt (100M+ lý tưởng)
  - Hội tụ cải thiện với khối lượng

Khoảng Tin Cậy: 95%
  - RTP ± 0.5% với độ tin cậy 95%
  - Yêu cầu ý nghĩa thống kê

Biến Thể Seed:
  - Chạy với nhiều seed ngẫu nhiên
  - Xác minh tính nhất quán qua các seed
  - Không phụ thuộc seed đơn

Đóng Băng Cấu Hình:
  - Khóa cấu hình sau khi chấp nhận
  - Kiểm soát phiên bản tất cả cài đặt
  - Ghi chép weights cuối cùng
```

---

## Tác Động Cascade Đến RTP

### Tăng RTP Multiplier

**Đóng Góp Cascade:**

```
Không có cascades/multipliers:
RTP Cơ Bản: ~80-85%

Với cascades/multipliers:
RTP Nâng Cao: 96.92%

Cascade thêm: ~12-17% vào RTP

Như thế nào?
1. Thắng kích hoạt cascades
2. Cascades có thể kích hoạt thêm thắng
3. Multipliers khuếch đại thắng cascade sau
4. Phản ứng dây chuyền tăng tổng thanh toán

Cascade multiplier mong đợi: 1.44x (trò chơi cơ bản)
Cascade multiplier mong đợi: 2.88x (free spins)
```

---

## Tác Động Free Spins Đến RTP

### Đóng Góp RTP Tính Năng

**Giá Trị Free Spins:**

```
Free spins đóng góp: ~24% tổng RTP

Phân Tích:
- Tần suất kích hoạt: ~1 trong 100 lượt quay
- Free spins trung bình được trao: 13
- Thắng free spins trung bình: 60x cược
- Multipliers nâng cao: 2x trò chơi cơ bản
- Tiềm năng kích hoạt lại: +15% giá trị

Tính toán RTP:
(1/100) × 13 spins × Enhanced_Multiplier × Base_RTP
≈ 24% đóng góp

Quan trọng để đạt mục tiêu 96.92%!
```

---

## Tóm Tắt

**Cơ Bản Symbol Weights:**
- Kiểm soát tần suất biểu tượng xuất hiện (tần suất)
- Tác động trực tiếp RTP và độ biến động
- Cho phép weights khác nhau mỗi reel
- Phải tổng bằng độ dài strip (thường là 100)

**Tính Toán RTP:**
- Tổng tất cả đóng góp biểu tượng
- Bao gồm tăng cascade multiplier (~12-17%)
- Bao gồm giá trị tính năng free spins (~24%)
- Yêu cầu mô phỏng 10M+ lượt quay cho độ chính xác
- Mục tiêu: 96.92% ± 0.5%

**Kiểm Soát Độ Biến Động:**
- Độ biến động cao: Weights thấp cho biểu tượng cao
- Khoảng cách paytable cực độ (1x đến 50x)
- Khuếch đại cascade
- Tiềm năng thắng tối đa (25,000x)

**Quy Trình Điều Chỉnh:**
1. Cấu hình ban đầu (đoán có căn cứ)
2. Mô phỏng 10M+ lượt quay
3. Đo RTP
4. Điều chỉnh weights tăng dần
5. Lặp lại cho đến đạt mục tiêu
6. Xác thực với kiểm thử thống kê
7. Phiên bản và ghi chép
8. Chứng nhận với phòng thí nghiệm kiểm thử

**Xác Thực:**
- Kiểm thử tính ngẫu nhiên thống kê
- Xác minh hội tụ RTP
- Xác nhận tần suất biểu tượng
- Phân tích phân phối thắng
- Chứng nhận bên thứ ba

**Kết quả:** Gameplay cân bằng toán học, công bằng có thể chứng minh và hấp dẫn mang lại lợi nhuận nhất quán dài hạn trong khi duy trì độ biến động thú vị!
