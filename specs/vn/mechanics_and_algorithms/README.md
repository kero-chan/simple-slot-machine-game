# Cơ Chế Trò Chơi & Thuật Toán

## Tổng Quan

Thư mục này chứa **tài liệu khái niệm** giải thích các cơ chế trò chơi cốt lõi và thuật toán của máy đánh bạc Mahjong Ways.

**Mục đích:** Giải thích thuần túy về cơ chế và toán học mà không có mã triển khai.

**Đối tượng mục tiêu:**
- Nhà thiết kế trò chơi hiểu các cơ chế
- Nhà toán học xác thực các mô hình RTP
- Người kiểm thử QA hiểu hành vi mong đợi
- Các bên liên quan xem xét thiết kế trò chơi
- Lập trình viên học các khái niệm trước khi viết mã

---

## Cấu Trúc Tài Liệu

### 1. [Hệ Thống Ways to Win](./01-ways-to-win.md)
**Tính Toán 1,024 Ways**

Phân tích sâu về cách hoạt động của hệ thống "Ways to Win":
- Quy tắc liền kề và khớp từ trái sang phải
- Tính toán toán học số ways
- Cách wild tương tác với hệ thống
- Các kịch bản ways tối đa và tối thiểu
- Các trường hợp đặc biệt và tình huống đặc biệt

### 2. [Cơ Chế Cascade](./02-cascade-system.md)
**Tumbling Reels & Phản Ứng Dây Chuyền**

Giải thích đầy đủ về hệ thống cascade/tumble:
- Loại bỏ biểu tượng và vật lý trọng lực
- Đánh giá chiến thắng liên tục
- Tiến triển multiplier trong cascades
- Khi nào cascades dừng lại
- Giới hạn cascade tối đa
- Luồng hình ảnh và thời gian

### 3. [Kiến Trúc Reel Strip](./03-reel-strips.md)
**Hệ Thống Băng Ảo**

Cách reel strips hoạt động về cơ bản:
- Khái niệm băng tròn
- Định vị và đọc biểu tượng
- Chọn vị trí quay ban đầu
- Đọc trong cascades
- Quy tắc đặt biểu tượng vàng
- Tại sao strips cần thiết cho RTP

### 4. [Tiến Triển Multiplier](./04-multiplier-progression.md)
**Logic Multiplier Cascade**

Cơ chế multiplier chi tiết:
- Tiến triển trò chơi cơ bản (x1→x2→x3→x5)
- Tiến triển nâng cao free spins (x2→x4→x6→x10)
- Khi multipliers áp dụng
- Điều kiện reset multiplier
- Tác động đến RTP
- Kịch bản thắng tối đa

### 5. [Tính Năng Free Spins](./05-free-spins.md)
**Cơ Chế Vòng Thưởng**

Kích hoạt và hành vi free spins:
- Logic kích hoạt biểu tượng scatter
- Tính toán giải thưởng free spins
- Cơ chế khóa cược
- Hệ thống kích hoạt lại
- Multipliers nâng cao
- Kết thúc free spins

### 6. [RNG & Công Bằng](./06-rng-and-fairness.md)
**Tạo Số Ngẫu Nhiên**

Cách hoạt động của tính ngẫu nhiên:
- Yêu cầu RNG mật mã
- Quy trình chọn vị trí
- Khái niệm công bằng có thể chứng minh
- Yêu cầu nhật ký kiểm toán
- Tiêu chuẩn tuân thủ cờ bạc
- Tại sao RNG frontend không bao giờ được chấp nhận

### 7. [Tính Toán Thắng](./07-win-calculation.md)
**Tính Toán Thanh Toán**

Tính toán thắng từng bước:
- Quy tắc khớp biểu tượng
- Thuật toán đếm ways
- Tra cứu paytable
- Áp dụng multiplier
- Nhiều chiến thắng đồng thời
- Giới hạn thắng tối đa

### 8. [Symbol Weights & RTP](./08-symbol-weights-rtp.md)
**Cân Bằng Toán Học**

Cách tần suất biểu tượng kiểm soát RTP:
- Khái niệm phân phối weight
- Tính toán xác suất
- Đóng góp RTP theo biểu tượng
- Cân bằng độ biến động
- Điều chỉnh cho RTP mục tiêu
- Yêu cầu mô phỏng

---

## Hướng Dẫn Đọc

### Dành Cho Nhà Thiết Kế Trò Chơi
**Bắt đầu với:**
1. Hệ Thống Ways to Win
2. Cơ Chế Cascade
3. Tiến Triển Multiplier
4. Tính Năng Free Spins

### Dành Cho Nhà Toán Học
**Bắt đầu với:**
1. Symbol Weights & RTP
2. RNG & Công Bằng
3. Tính Toán Thắng
4. Hệ Thống Ways to Win

### Dành Cho Lập Trình Viên
**Đọc tất cả theo thứ tự:**
1. Bắt đầu với Ways to Win
2. Tiến triển qua từng tài liệu
3. Sau đó tham khảo các thông số kỹ thuật chính để biết chi tiết triển khai

### Dành Cho Người Kiểm Thử QA
**Tập trung vào:**
1. Cơ Chế Cascade
2. Tính Toán Thắng
3. Tính Năng Free Spins
4. Tiến Triển Multiplier

---

## Tóm Tắt Khái Niệm Chính

### 1. Server Authority
**Nguyên Tắc Quan Trọng:** Tất cả cơ chế trò chơi thực thi trên server. Frontend chỉ hiển thị kết quả.

### 2. Kết Quả Xác Định
**Từ Reel Strips:** Cho cùng vị trí reel bắt đầu, kết quả luôn giống hệt và có thể tái tạo.

### 3. Công Bằng Có Thể Chứng Minh
**Kiểm Toán RNG:** Mọi quyết định ngẫu nhiên đều được ghi lại với seeds mật mã để xác minh.

### 4. Cân Bằng RTP
**Độ Chính Xác Toán Học:** Symbol weights và giá trị paytable kiểm soát chính xác lợi nhuận dài hạn cho người chơi.

### 5. Phản Ứng Dây Chuyền Cascade
**Đổi Mới Cốt Lõi:** Chiến thắng kích hoạt cascades, cascades có thể kích hoạt thêm chiến thắng, tạo ra sự phấn khích nhân lên.

---

## Thuật Ngữ

**Reel:** Một cột dọc biểu tượng (tổng 5 reels)
**Row:** Một dòng ngang biểu tượng (4 rows hiển thị)
**Symbol:** Ô/biểu tượng riêng lẻ trên lưới
**Strip:** Băng tròn biểu tượng cho mỗi reel
**Position:** Vị trí chỉ số trên reel strip
**Way:** Một đường dẫn kết hợp thắng hợp lệ
**Cascade:** Loại bỏ biểu tượng và làm đầy lại sau khi thắng
**Multiplier:** Hệ số nhân thanh toán
**Scatter:** Biểu tượng thưởng kích hoạt free spins
**Wild:** Biểu tượng thay thế cho các biểu tượng khác
**Golden:** Biến thể hình ảnh của biểu tượng (MW1: chỉ mang tính thẩm mỹ)

---

## Ký Hiệu Toán Học

**Tính Toán Ways:**
```
W = n₁ × n₂ × n₃ × ... × nₖ

Trong đó:
W = Tổng số ways cho tổ hợp thắng này
nᵢ = Số biểu tượng khớp trên reel i
k = Số reels liên tiếp có khớp (≥3)
```

**Công Thức Thắng:**
```
Win = P × W × M × B

Trong đó:
P = Thanh toán paytable cho biểu tượng và số lượng
W = Số ways
M = Cascade multiplier
B = Cược mỗi way (Total Bet / 20)
```

**Công Thức RTP:**
```
RTP = (Total Returned / Total Wagered) × 100

Mục tiêu: 96.92% ± 0.5%
```

---

## Nguyên Tắc Thiết Kế

### 1. Minh Bạch
Mọi cơ chế được định nghĩa và ghi chép rõ ràng. Không có quy tắc ẩn.

### 2. Công Bằng
Kết quả ngẫu nhiên không có thao túng. RNG công bằng có thể chứng minh.

### 3. Đơn Giản
Toán học phức tạp bên dưới, nhưng cơ chế dễ hiểu.

### 4. Phấn Khích
Cascades và multipliers tạo ra phản ứng dây chuyền hấp dẫn.

### 5. Cân Bằng
Độ biến động cao với lợi nhuận công bằng dài hạn.

---

## Phương Pháp Xác Thực

### Kiểm Thử Cơ Học
- Kiểm thử từng cơ chế riêng biệt
- Xác minh các trường hợp đặc biệt
- Xác nhận tương tác quy tắc
- Xác thực thời gian và trình tự

### Kiểm Thử Toán Học
- Mô phỏng hàng triệu lượt quay
- Xác minh hội tụ RTP
- Xác thực phân phối xác suất
- Xác nhận độ chính xác paytable

### Kiểm Thử Công Bằng
- Kiểm toán tính ngẫu nhiên RNG
- Xác minh tính không thể dự đoán
- Xác nhận khả năng tái tạo
- Kiểm tra thiên vị

---

## Nhật Ký Thay Đổi

- **v1.0** (2025-11-17) - Tài liệu cơ chế ban đầu
- Nguồn: Tổng hợp từ các tài liệu thông số kỹ thuật chính

---

## Tài Liệu Liên Quan

**Để Biết Chi Tiết Triển Khai:**
- Xem thư mục `/specs` chính để biết API, database, thông số kỹ thuật bảo mật

**Để Xác Thực RTP:**
- Xem `04-rtp-mathematics.md` trong specs chính

**Để Phát Triển Backend:**
- Xem `05-backend-api.md` và `09-security-architecture.md`

**Để Cấu Hình:**
- Xem `08-game-configuration.md` để biết weights và cài đặt
