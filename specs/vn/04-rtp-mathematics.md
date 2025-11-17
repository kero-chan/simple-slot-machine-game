# RTP & Toán Học

## Mục Tiêu RTP

- **RTP Mục Tiêu:** 96.92% ± 0.5%
- **Phạm Vi Chấp Nhận:** 96.42% - 97.42%
- **Độ Biến Động:** Cao
- **Mục Tiêu Tần Suất Trúng:** ~25-30% (khoảng 1 trong 3-4 vòng quay)
- **Thắng Tối Đa:** 25,000x cược

## Phân Bổ RTP

| Thành Phần | Đóng Góp RTP | Phần Trăm Tổng |
|-----------|------------------|---------------------|
| Trò Chơi Cơ Bản | ~90-92% | ~65% |
| Tính Năng Free Spins | ~4-6% | ~35% |
| **Tổng** | **96.92%** | **100%** |

## Phân Bổ Trọng Số Biểu Tượng

### Tổng Quan

Trọng số biểu tượng kiểm soát tần suất xuất hiện của mỗi biểu tượng trên các trục. Các trọng số này PHẢI được điều chỉnh thông qua mô phỏng để đạt được RTP mục tiêu là 96.92%.

### Baseline Ban Đầu (Phải Được Điều Chỉnh!)

⚠️ **QUAN TRỌNG:** Các giá trị dưới đây là ƯỚC TÍNH. Nhóm toán học của bạn PHẢI chạy mô phỏng 10M+ vòng quay và điều chỉnh các trọng số này để đạt được 96.92% ± 0.5% RTP.

### Trọng Số Ước Tính Mỗi Trục

Giả định ~100-120 vị trí mỗi dải trục:

#### Trục 1 (Trái Nhất)

```
wild:      2-3 vị trí  (~2-3%)
bonus:     2-3 vị trí  (~2-3%)
gold:      1-2 vị trí  (~1-2%)  // Biểu tượng Mystery
fa:        8-10 vị trí (~8-10%)
zhong:     10-12 vị trí (~10-12%)
bai:       12-14 vị trí (~12-14%)
bawan:     14-16 vị trí (~14-16%)
wusuo:     16-18 vị trí (~16-18%)
wutong:    16-18 vị trí (~16-18%)
liangsuo:  18-20 vị trí (~18-20%)
liangtong: 18-20 vị trí (~18-20%)
```

#### Trục 2, 3, 4 (Giữa - Có Thể Có Biểu Tượng Golden)

```
wild:        2-3 vị trí  (~2-3%)
wild_gold:   1-2 vị trí  (~1-2%)  // Chỉ hình ảnh
bonus:       2-3 vị trí  (~2-3%)
gold:        1-2 vị trí  (~1-2%)
fa:          8-10 vị trí (~8-10%)
fa_gold:     1-2 vị trí  (~1-2%)  // Biến thể hình ảnh
zhong:       8-10 vị trí (~8-10%)
zhong_gold:  1-2 vị trí  (~1-2%)
bai:         10-12 vị trí (~10-12%)
bai_gold:    1-2 vị trí  (~1-2%)
bawan:       12-14 vị trí (~12-14%)
bawan_gold:  1-2 vị trí  (~1-2%)
wusuo:       14-16 vị trí (~14-16%)
wusuo_gold:  1-2 vị trí  (~1-2%)
wutong:      14-16 vị trí (~14-16%)
wutong_gold: 1-2 vị trí  (~1-2%)
liangsuo:    16-18 vị trí (~16-18%)
liangsuo_gold: 1-2 vị trí (~1-2%)
liangtong:   16-18 vị trí (~16-18%)
liangtong_gold: 1-2 vị trí (~1-2%)
```

#### Trục 5 (Phải Nhất)

```
Phân bổ giống như Trục 1 (không có biểu tượng golden)
```

### Quy Tắc Biểu Tượng Golden

- **Xuất hiện:** Chỉ trên trục 2, 3, 4
- **Hành vi:** CHỈ HÌNH ẢNH (MW1 không chuyển đổi golden thành wild)
- **Thanh toán:** Giống như biểu tượng thông thường
- **Mục đích:** Nâng cao hình ảnh, thu hút người chơi

## Tỷ Lệ Kích Hoạt Free Spins

### Tỷ Lệ Kích Hoạt Mục Tiêu

**Mục tiêu:** 3-5% (1 trong 20-33 vòng quay)

### Tính Toán

Cho xác suất scatter mỗi trục:

```
P(scatter trên trục) = (scatter_positions / total_positions)

Ví dụ với 2.5 vị trí mỗi trục trên 100:
P(scatter) = 2.5 / 100 = 0.025 (2.5%)
```

### Xác Suất Nhị Thức Cho 3+ Scatters

```
P(3+ scatters) = P(chính xác 3) + P(chính xác 4) + P(chính xác 5)

P(chính xác k scatters) = C(5,k) × p^k × (1-p)^(5-k)

Trong đó:
- C(5,k) = tổ hợp của 5 trục chọn k
- p = xác suất scatter trên trục đơn
- k = số lượng scatters (3, 4, hoặc 5)
```

### Ví Dụ Tính Toán

```
Giả định p = 0.025:

P(chính xác 3) = C(5,3) × 0.025³ × 0.975²
             = 10 × 0.000015625 × 0.950625
             = 0.001485

P(chính xác 4) = C(5,4) × 0.025⁴ × 0.975¹
             = 5 × 0.00000039 × 0.975
             = 0.0000019

P(chính xác 5) = C(5,5) × 0.025⁵
             = 1 × 0.00000001
             = 0.00000001

Tổng tỷ lệ kích hoạt ≈ 0.0015 hoặc 0.15% (Quá thấp!)
```

### Chiến Lược Điều Chỉnh

Nếu tỷ lệ kích hoạt quá thấp: **Tăng vị trí scatter**
Nếu tỷ lệ kích hoạt quá cao: **Giảm vị trí scatter**

**Lưu ý:** Code hiện tại hiển thị `bonusChance: 0.25` (25%) là để kiểm tra. Production nên là ~3-5%.

## Đóng Góp Multiplier Cascade

### Tiến Trình Multiplier

**Trò Chơi Cơ Bản:**

```
Cascade 1: x1
Cascade 2: x2
Cascade 3: x3
Cascade 4+: x5
```

**Free Spins:**

```
Cascade 1: x2  (tăng 100%)
Cascade 2: x4  (tăng 100%)
Cascade 3: x6  (tăng 100%)
Cascade 4+: x10 (tăng 100%)
```

### Phân Bổ Cascade Dự Kiến

Xác suất ước tính (phải được xác thực qua mô phỏng):

```
1 cascade:   ~70% vòng quay thắng
2 cascades:  ~20% vòng quay thắng
3 cascades:  ~8% vòng quay thắng
4+ cascades: ~2% vòng quay thắng
```

### Tính Toán Multiplier Trung Bình

**Trò Chơi Cơ Bản:**

```
E(Multiplier) = (0.70 × 1) + (0.20 × 2) + (0.08 × 3) + (0.02 × 5)
              = 0.70 + 0.40 + 0.24 + 0.10
              = 1.44x trung bình
```

**Free Spins:**

```
E(Multiplier) = (0.70 × 2) + (0.20 × 4) + (0.08 × 6) + (0.02 × 10)
              = 1.40 + 0.80 + 0.48 + 0.20
              = 2.88x trung bình
```

### Tác Động RTP

- Multipliers tăng số tiền thắng ~44% trong trò chơi cơ bản
- Multipliers tăng số tiền thắng ~188% trong free spins
- Thành phần quan trọng để đạt được RTP mục tiêu 96.92%

## Công Thức Tính Toán Thắng

### Công Thức Thắng Cơ Bản

```
Win = Symbol_Payout × Ways_Count × Cascade_Multiplier × Bet_Per_Way

Trong đó:
- Symbol_Payout = giá trị paytable (ví dụ: 50x cho 5-of-a-kind fa)
- Ways_Count = số cách tổ hợp này xảy ra
- Cascade_Multiplier = multiplier cascade hiện tại (1, 2, 3, 5, hoặc 10)
- Bet_Per_Way = Total_Bet / 20 (20 đường cố định)
```

### Tính Toán Thắng Tối Đa

```
Tối Đa Lý Thuyết (trước giới hạn):
Biểu tượng: gold (Mystery) - giả định 500x cho 5-of-a-kind
Ways: 1,024 (tất cả vị trí khớp)
Multiplier: x10 (4+ cascades trong free spins)

Win = 500 × 1,024 × 10 × Bet_Per_Way
    = 5,120,000x lý thuyết

Tối Đa Thực Tế (với giới hạn):
Win giới hạn ở 25,000x tổng cược
```

### Tính Toán Cược Mỗi Cách

```
Total Bet = Base Bet × Bet Multiplier
Bet Per Way = Total Bet / 20

Ví dụ:
Total Bet = 100 credits
Bet Per Way = 100 / 20 = 5 credits mỗi cách
```

## Yêu Cầu Mô Phỏng RTP

### Giao Thức Kiểm Tra Bắt Buộc

✅ **Số Vòng Quay Tối Thiểu:** 10,000,000 vòng quay (10M)
✅ **Khuyến Nghị:** 50,000,000+ vòng quay để đảm bảo thống kê
✅ **Số Tiền Cược:** Sử dụng cược chuẩn hóa 1.00 để tính toán
✅ **Random Seed:** Sử dụng nhiều seeds để xác thực tính nhất quán
✅ **Tài Liệu:** Ghi lại tất cả kết quả với dấu thời gian

### Công Thức Tính RTP

```
RTP% = (Total_Returned / Total_Wagered) × 100

Trong đó:
- Total_Wagered = Number_of_Spins × Bet_Amount
- Total_Returned = Tổng tất cả tiền thắng (trò chơi cơ bản + free spins + cascades)
```

### Các Chỉ Số Bắt Buộc Mỗi Kiểm Tra

Cho mỗi mô phỏng 10M vòng quay, theo dõi:

1. **RTP Tổng Thể:** XX.XX%
2. **RTP Trò Chơi Cơ Bản:** XX.XX%
3. **RTP Free Spins:** XX.XX%
4. **Tần Suất Trúng:** XX.XX%
5. **Tỷ Lệ Kích Hoạt Free Spins:** X.XX%
6. **Free Spins Trung Bình Mỗi Lần Kích Hoạt:** XX.X vòng quay
7. **Thắng Tối Đa Quan Sát:** X,XXXx
8. **Độ Lệch Chuẩn:** ±X.XX%
9. **Tổng Thắng Trò Chơi Cơ Bản:** X,XXX,XXX
10. **Tổng Free Spins Được Kích Hoạt:** XXX,XXX

### Phân Bổ Cascade

Theo dõi phân bổ cascades:

```
- Cascade đơn: XX%
- Cascade kép: XX%
- Cascade ba: XX%
- 4+ cascades: XX%
```

### Tần Suất Trúng Biểu Tượng

Theo dõi tần suất trúng mỗi biểu tượng:

```
Biểu tượng: fa
- 3-of-a-kind: XX lần (XX%)
- 4-of-a-kind: XX lần (XX%)
- 5-of-a-kind: XX lần (XX%)

[Lặp lại cho tất cả biểu tượng]
```

### Phân Bổ Multiplier

Theo dõi việc sử dụng multiplier:

```
- x1: XX% lần thắng
- x2: XX% lần thắng
- x3: XX% lần thắng
- x5: XX% lần thắng
- x10: XX% lần thắng
```

## Tiêu Chí Xác Thực

### Tiêu Chí Đạt

🟢 **ĐẠT** nếu:

- RTP thực tế trong khoảng 96.42% - 97.42%
- Độ lệch chuẩn ổn định sau 10M+ vòng quay
- Đóng góp Free spins: 4-6% tổng RTP
- Đóng góp Trò chơi cơ bản: 90-92% tổng RTP
- Tần suất trúng trong 25-30%
- Không phát hiện lỗi toán học
- Logic cascade được xác thực

### Tiêu Chí Không Đạt

🔴 **KHÔNG ĐẠT** nếu:

- RTP ngoài phạm vi chấp nhận (96.42% - 97.42%)
- Phương sai lý thuyết vs mô phỏng >0.5%
- Lỗi logic trong tính toán thắng
- Phát hiện bất thường thống kê
- Tỷ lệ kích hoạt Free spins ngoài 3-5%
- Giới hạn thắng tối đa không được thực thi

### Dung Sai Độ Lệch

```
Tại 10M vòng quay:  ±0.3% chấp nhận được
Tại 50M vòng quay:  ±0.1% chấp nhận được
Tại 100M vòng quay: ±0.05% chấp nhận được
```

## Quy Trình Triển Khai

### Giai Đoạn 1: Phát Triển (Tuần 1-2)

1. Sử dụng trọng số biểu tượng ước tính làm điểm bắt đầu
2. Xây dựng engine mô phỏng trong Golang
3. Triển khai cơ chế cascade
4. Thêm logic free spins
5. Chạy kiểm tra 1M vòng quay ban đầu

### Giai Đoạn 2: Điều Chỉnh (Tuần 3-4)

1. Phân tích kết quả 1M vòng quay
2. Điều chỉnh trọng số biểu tượng nếu RTP lệch mục tiêu
3. Chạy kiểm tra 10M vòng quay
4. Tinh chỉnh tỷ lệ kích hoạt free spins
5. Xác thực phân bổ cascade
6. Tài liệu hóa tất cả điều chỉnh

### Giai Đoạn 3: Xác Thực (Tuần 5)

1. Chạy mô phỏng 50M+ vòng quay
2. Tạo báo cáo chỉ số đầy đủ
3. Xem xét mô hình toán học
4. Giải quyết mọi vấn đề được tìm thấy
5. Kiểm tra lại nếu cần điều chỉnh

### Giai Đoạn 4: Chứng Nhận Cuối Cùng (Tuần 6)

1. Xác thực RTP cuối cùng trong phạm vi mục tiêu
2. Tài liệu hóa các dải trục cuối cùng
3. Khóa cấu hình cho production
4. Cung cấp specs cho nhóm phát triển
5. Chuẩn bị cho kiểm tra tích hợp

## Ghi Chú Triển Khai Backend

### Yêu Cầu RNG

**Trình Tạo Số Ngẫu Nhiên An Toàn Mật Mã:**

```go
import "crypto/rand"

func GenerateSecureRandom(max int) int {
    // Sử dụng crypto/rand cho RNG an toàn
    // Phải có thể kiểm toán và công bằng có thể chứng minh
}
```

### Lưu Trữ Reel Strip

Lưu trữ các dải trục dưới dạng mảng biểu tượng:

```go
type ReelStrip []string

var BaseGameReels = [5]ReelStrip{
    // Trục 1
    {"fa", "zhong", "wutong", "liangtong", ...},
    // Trục 2
    {"fa", "fa_gold", "zhong", "wild", ...},
    // Trục 3
    {...},
    // Trục 4
    {...},
    // Trục 5
    {...},
}
```

### Triển Khai Tính Toán Thắng

```go
func CalculateWin(grid [][]string, bet float64, cascadeNum int, isFreeSpins bool) float64 {
    multiplier := GetMultiplier(cascadeNum, isFreeSpins)
    betPerWay := bet / 20

    totalWin := 0.0

    // Đánh giá tất cả loại biểu tượng
    for symbol, payouts := range Paytable {
        ways, reelCount := CountWays(grid, symbol)
        if reelCount >= 3 {
            payout := payouts[reelCount]
            win := float64(payout) * float64(ways) * multiplier * betPerWay
            totalWin += win
        }
    }

    // Áp dụng giới hạn thắng tối đa
    maxWin := bet * 25000
    if totalWin > maxWin {
        totalWin = maxWin
    }

    return totalWin
}
```

## Checklist Kiểm Tra

Trước khi triển khai vào production:

- [ ] RTP được xác thực ở 96.92% ± 0.5% trên 10M+ vòng quay
- [ ] Tần suất trúng trong 25-30%
- [ ] Tỷ lệ kích hoạt Free spins ở 3-5%
- [ ] Giới hạn thắng tối đa được thực thi (25,000x)
- [ ] Tất cả multiplier cascade hoạt động chính xác
- [ ] Logic thay thế Wild chính xác
- [ ] Đếm Scatter chính xác
- [ ] Kích hoạt lại Free spins hoạt động
- [ ] Biểu tượng Golden chỉ là hình ảnh (không ảnh hưởng gameplay)
- [ ] RNG an toàn về mặt mật mã
- [ ] Tất cả vòng quay được ghi log để kiểm toán
- [ ] Hiệu suất được kiểm tra dưới tải
