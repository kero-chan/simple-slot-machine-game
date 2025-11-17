# RNG & Công Bằng

## Tổng Quan

**Random Number Generation (RNG)** là nền tảng của gameplay máy đánh bạc công bằng. Mọi kết quả quay phải thực sự ngẫu nhiên, không thể dự đoán và công bằng có thể chứng minh để đáp ứng các quy định về cờ bạc và yêu cầu tin cậy của người chơi.

**Nguyên Tắc Cốt Lõi:** RNG có thẩm quyền server sử dụng các thuật toán an toàn mật mã.

---

## Tại Sao RNG Quan Trọng

### Niềm Tin Người Chơi

**Đảm Bảo Chơi Công Bằng:**

```
Người chơi phải tin rằng:
✓ Kết quả thực sự ngẫu nhiên
✓ Kết quả không thể dự đoán
✓ Trò chơi không bị gian lận
✓ Các lượt quay trước không ảnh hưởng lượt quay sau
✓ Casino không thể thao túng kết quả
```

**Mất Niềm Tin = Mất Người Chơi**

---

### Tuân Thủ Quy Định

**Các Cơ Quan Cờ Bạc Yêu Cầu:**

- RNG an toàn mật mã
- Kết quả không thể dự đoán
- Kết quả có thể tái tạo (để kiểm toán)
- Xác minh tính ngẫu nhiên thống kê
- Chứng nhận bên thứ ba
- Nhật ký kiểm toán hoàn chỉnh

**Không Tuân Thủ = Thu Hồi Giấy Phép**

---

### Tính Toàn Vẹn Toán Học

**Tính Hợp Lệ RTP:**

```
Không có RNG thực:
→ Tần suất biểu tượng lệch khỏi weights đã cấu hình
→ RTP trở nên không thể dự đoán
→ Cân bằng trò chơi bị phá vỡ
→ Thanh toán trở nên không công bằng

Với RNG thực:
→ Tần suất biểu tượng khớp weights theo thời gian
→ RTP hội tụ đến mục tiêu (96.92%)
→ Trò chơi vẫn cân bằng
→ Lợi nhuận dài hạn công bằng
```

---

## RNG An Toàn Mật Mã

### Điều Gì Làm Cho RNG "An Toàn Mật Mã"?

**Yêu Cầu:**

1. **Không Thể Dự Đoán:** Không thể dự đoán giá trị tiếp theo từ các giá trị trước
2. **Seed Không Xác Định:** Seed ban đầu từ nguồn thực sự ngẫu nhiên (entropy phần cứng)
3. **Tính Ngẫu Nhiên Thống Kê:** Vượt qua các bài kiểm tra thống kê về tính ngẫu nhiên
4. **Độ Mạnh Mật Mã:** Chống lại các cuộc tấn công phân tích mật mã

---

### Nguồn RNG Được Chấp Nhận

**✅ ĐÚNG - Sử Dụng Những Cái Này:**

**1. RNG Crypto Hệ Điều Hành**

```
Go Language:
import "crypto/rand"

func generateRandomInt(max int) int {
    nBig, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
    if err != nil {
        // Xử lý lỗi - KHÔNG BAO GIỜ quay lại math/rand
        panic("RNG failure")
    }
    return int(nBig.Int64())
}

Nguồn: crypto/rand sử dụng OS entropy pool
Chất lượng: An toàn mật mã ✓
```

**2. Hardware Random Number Generators (HRNG)**

```
Nguồn vật lý:
- CPU RDRAND instruction (Intel/AMD)
- TPM (Trusted Platform Module)
- Hardware entropy dongles

Sử dụng: Bổ sung OS RNG cho entropy bổ sung
```

**3. Dịch Vụ RNG Bên Thứ Ba Được Chứng Nhận**

```
Ví dụ:
- Gaming Laboratories International (GLI) certified RNG
- iTech Labs certified RNG
- RANDOM.ORG API (với lưu ý)

Sử dụng: API calls đến nhà cung cấp RNG được chứng nhận
Lợi ích: Kiểm toán và chứng nhận bên thứ ba
```

---

### Nguồn RNG Không Được Chấp Nhận

**❌ SAI - KHÔNG BAO GIỜ Sử Dụng Cho Cờ Bạc:**

**1. Thư Viện Pseudorandom (PRNG)**

```
Go Language - CẤM:
import "math/rand"  // ❌ KHÔNG AN TOÀN MẬT MÃ

Tại sao bị cấm:
- Seed có thể dự đoán (thường dựa trên thời gian)
- Chuỗi xác định
- Thiên vị thống kê
- Dễ bị tấn công dự đoán
- KHÔNG được chấp nhận cho cờ bạc
```

**2. RNG Frontend/Client-Side**

```javascript
// JavaScript - KHÔNG BAO GIỜ cho logic trò chơi
Math.random()  // ❌ Hoàn toàn không thể chấp nhận

Tại sao bị cấm:
- Client có thể thao túng
- Có thể dự đoán trong trình duyệt
- Không có xác minh server
- Có thể hack dễ dàng
- Vi phạm quy định
```

---

## RNG Trong Bối Cảnh Máy Đánh Bạc

### RNG Quyết Định Gì

**Mỗi Lượt Quay Yêu Cầu Quyết Định Ngẫu Nhiên:**

**1. Vị Trí Bắt Đầu Reel (Quan Trọng)**

```
Cho mỗi trong 5 reels:
Tạo vị trí ngẫu nhiên từ 0 đến 99

Ví dụ:
Reel 1: Random(0-99) → 47
Reel 2: Random(0-99) → 23
Reel 3: Random(0-99) → 89
Reel 4: Random(0-99) → 12
Reel 5: Random(0-99) → 56

5 số này xác định toàn bộ kết quả quay!
```

**2. Không Gì Khác!**

```
RNG KHÔNG trực tiếp chọn:
✗ Biểu tượng riêng lẻ
✗ Người chơi có thắng hay không
✗ Số tiền thắng
✗ Kết quả cascade

Tất cả kết quả khác là XÁC ĐỊNH:
→ Đọc từ reel strips ở vị trí đã chọn
→ Áp dụng cơ chế cascade
→ Tính thắng từ paytable
→ Áp dụng multipliers
```

**Điều này rất quan trọng cho chơi công bằng có thể chứng minh!**

---

## Chơi Công Bằng Có Thể Chứng Minh

### "Chơi Công Bằng Có Thể Chứng Minh" Là Gì?

**Định Nghĩa:** Một hệ thống trong đó người chơi (hoặc kiểm toán viên) có thể xác minh độc lập rằng kết quả trò chơi được xác định công bằng và không bị thao túng.

**Các Thành Phần Chính:**

1. **Thuật Toán Minh Bạch:** Ghi chép công khai cách RNG ảnh hưởng kết quả
2. **Kết Quả Có Thể Xác Minh:** Người chơi có thể tái tạo kết quả từ dữ liệu seed
3. **Ghi Chép Chống Giả Mạo:** Nhật ký kiểm toán bất biến
4. **Kiểm Toán Bên Thứ Ba:** Xác minh bên ngoài về tính công bằng

---

### Triển Khai Chơi Công Bằng Có Thể Chứng Minh

**Bước 1: Tạo và Ghi Seed**

```
Trước khi thực thi quay:

1. Tạo seed mật mã
   Seed = crypto/rand (256-bit)
   Ví dụ: "a3f5c9d8e2b4f6a1c8e3d7f9b2a5c8e1"

2. Ghi seed vào database (bất biến)
   INSERT INTO rng_audit (
     spin_id,
     seed,
     timestamp,
     algorithm_version
   )

3. Sử dụng seed để khởi tạo trạng thái RNG cho lượt quay này
```

**Bước 2: Tạo Vị Trí Xác Định**

```
Từ seed, tạo 5 vị trí reel:

Position[i] = DeterministicRandom(seed, i) % 100

Trong đó:
- DeterministicRandom = CSPRNG có seed
- i = Chỉ số reel (0-4)
- % 100 = Ánh xạ đến phạm vi reel strip

Kết quả: Cùng seed luôn tạo cùng vị trí
```

---

## Xác Minh Thống Kê

### Yêu Cầu Kiểm Thử RNG

**Kiểm Thử Trước Triển Khai:**

**1. Kiểm Thử Tính Ngẫu Nhiên Thống Kê**

```
Bộ Kiểm Thử Tiêu Chuẩn Ngành:

- NIST SP 800-22 Statistical Test Suite
- Diehard Tests
- TestU01 (BigCrush)

Điều chúng xác minh:
✓ Phân phối tần suất
✓ Runs của các giá trị liên tiếp
✓ Phân tích quang phổ
✓ Autocorrelation
✓ Phân phối Chi-square
✓ Đo entropy

Tiêu Chí Đạt:
Tất cả kiểm thử phải đạt với p-value > 0.01
```

**2. Tính Đồng Nhất Phân Phối**

```
Kiểm thử: Tạo 1,000,000 vị trí ngẫu nhiên (0-99)

Mong đợi: Mỗi vị trí xuất hiện ~10,000 lần (±5%)

Kết Quả Ví Dụ:
Position 0: 10,023 lần xuất hiện ✓
Position 1: 9,987 lần xuất hiện ✓
Position 2: 10,145 lần xuất hiện ✓
...
Position 99: 9,998 lần xuất hiện ✓

Kiểm thử Chi-square: p-value = 0.42 (ĐẠT)
```

---

## Tóm Tắt

**Cơ Bản RNG:**

- RNG an toàn mật mã là bắt buộc (crypto/rand)
- Không bao giờ sử dụng thư viện pseudorandom (math/rand)
- Chỉ phía server - không ảnh hưởng client
- RNG xác định vị trí reel, không gì khác
- Tất cả kết quả khác là xác định

**Chơi Công Bằng Có Thể Chứng Minh:**

- Tạo dựa trên seed
- Nhật ký kiểm toán hoàn chỉnh
- Có thể xác minh độc lập
- Ghi chép bất biến
- Xác thực checksum

**Bảo Mật:**

- Cô lập khỏi ảnh hưởng bên ngoài
- Bảo vệ chống tấn công dự đoán
- Bảo vệ replay dựa trên nonce
- Kiểm soát có thẩm quyền server
- Bảo vệ giả mạo hoàn chỉnh

**Tuân Thủ:**

- Kiểm thử tính ngẫu nhiên thống kê
- Chứng nhận bên thứ ba
- Nhật ký kiểm toán quy định
- Xác minh RTP
- Báo cáo hàng tháng

**Kết quả:** Tạo số ngẫu nhiên công bằng, an toàn, minh bạch và tuân thủ mà người chơi có thể tin tưởng và cơ quan quản lý có thể xác minh!
