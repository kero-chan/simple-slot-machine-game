# Tổng Quan Game

## Tóm Tắt Điều Hành

**Tên Game:** Mahjong Ways (麻将胡了)
**Nhà Phát Triển Gốc:** PG Soft (Pocket Games Soft)
**Loại Game:** Video Slot 5 Cuộn × 4 Hàng với Cơ Chế Cascade
**Phiên Bản:** Mahjong Ways 1 (KHÔNG phải Mahjong Ways 2)

## Thông Số Cốt Lõi

| Thông Số | Giá Trị |
|----------|---------|
| **RTP** (Return to Player) | 96.92% |
| **Thắng Tối Đa** | 25,000x cược |
| **Bố Cục Lưới** | 5 cuộn × 4 hàng |
| **Cách Thắng** | 1,024 cách |
| **Nền Tảng** | HTML5 (chạy trên trình duyệt) |
| **Loại Game** | Slot cascade với hệ số nhân tăng dần |
| **Độ Biến Động** | Cao |
| **Khoảng Cược** | 0.60 đến 1,000.00 mỗi lượt quay |

### Cấu Trúc Cược

- **Dòng Cố Định:** 20 paylines (đơn vị tính toán cơ bản)
- **Khoảng Hệ Số Nhân Cược:** 1x đến 10x
- **Khoảng Giá Trị Đồng Xu:** 0.03 đến 5.00

**Công Thức Tính Tổng Cược:**

```
Tổng Cược = 20 (dòng) × Hệ Số Nhân Cược × Giá Trị Đồng Xu
```

**Ví Dụ:**

- Tối thiểu: 20 × 1 × 0.03 = **0.60 mỗi lượt quay**
- Trung bình: 20 × 5 × 1.00 = **100.00 mỗi lượt quay**
- Tối đa: 20 × 10 × 5.00 = **1,000.00 mỗi lượt quay**

## Tính Năng Chính

### Tính Năng Gameplay Cốt Lõi

1. **Chiến Thắng Cascade với Hệ Số Nhân Tăng Dần**
   - Các biểu tượng thắng nổ tung và biểu tượng mới rơi xuống
   - Hệ số nhân tăng theo mỗi cascade: x1 → x2 → x3 → x5
   - Có thể liên tục vô hạn

2. **1,024 Cách Thắng**
   - Không có paylines truyền thống
   - Khớp cuộn liền kề từ trái sang phải
   - Nhiều tổ hợp thắng đồng thời

3. **Bonus Vòng Quay Miễn Phí**
   - Kích hoạt: 3+ biểu tượng Scatter
   - Thưởng: 12 Vòng Quay Miễn Phí (cơ bản)
   - Hệ số nhân nâng cao: x2 → x4 → x6 → x10
   - Có thể kích hoạt lại với scatter bổ sung

4. **Chuyển Đổi Biểu Tượng Vàng**
   - Xuất hiện chỉ trên cuộn 2, 3, 4
   - Cải thiện hình ảnh (không ảnh hưởng gameplay trong MW1)
   - Chuyển thành biểu tượng thường sau cascade

5. **Thay Thế Wild**
   - Thay thế cho tất cả biểu tượng trừ Scatter
   - Xuất hiện trên tất cả cuộn
   - Có thể xuất hiện dưới dạng Golden Wild

6. **Biểu Tượng Bí Ẩn**
   - Biểu tượng giá trị cao với thanh toán cao cấp
   - Quả cầu vàng với biểu tượng "?"
   - Xuất hiện hiếm

## Chủ Đề & Mỹ Thuật Game

Mahjong Ways kết hợp mỹ học gạch Mahjong truyền thống Trung Quốc:

- **Phong Cách Hình Ảnh:** Biểu tượng gạch Mahjong chính thống (发, 中, 萬, Tre, Tròn)
- **Bảng Màu:** Đỏ và vàng truyền thống với chủ đề thịnh vượng Trung Hoa
- **Animation:** Hiệu ứng chúc mừng cho chiến thắng lớn
- **Âm Thanh:** Nhạc nền và hiệu ứng âm thanh Trung Quốc truyền thống

## Công Nghệ Sử Dụng

### Backend (Triển Khai Mới)

- **Ngôn Ngữ:** Golang
- **Database:** PostgreSQL
- **Kiến Trúc:** RESTful API
- **Xác Thực:** Quản lý phiên dựa trên JWT

### Frontend (Hiện Có)

- **Công Nghệ:** HTML5 Canvas
- **Rendering:** Máy slot dựa trên JavaScript
- **Giao Tiếp:** REST API calls đến backend

### Yêu Cầu Hạ Tầng

- **Quản Lý Phiên:** Redis (khuyến nghị cho caching trạng thái game)
- **Random Number Generation:** RNG bảo mật mã hóa
- **Audit Logging:** Tất cả spins, wins và transactions
- **Tuân Thủ:** Sẵn sàng chứng nhận cơ quan gaming

## Phân Bố RTP

| Thành Phần | Đóng Góp RTP | Phần Trăm |
|------------|--------------|-----------|
| Chiến Thắng Game Cơ Bản | ~63.00% | ~65% |
| Tính Năng Vòng Quay Miễn Phí | ~33.92% | ~35% |
| **Tổng** | **96.92%** | **100%** |

## Hồ Sơ Độ Biến Động

- **Phân Loại:** Độ biến động cao
- **Tần Suất Trúng:** ~25-30% (khoảng 1 trong 3-4 lượt quay)
- **Tiềm Năng Thắng Lớn:** 25,000x tối đa
- **Phương Sai:** Phương sai cao do hệ số nhân cascade

## Công Thức Tính Chiến Thắng

```
Chiến Thắng = Thanh Toán Biểu Tượng × Số Cách × Hệ Số Nhân Cascade × Cược Mỗi Cách
```

**Giới Hạn Thắng Tối Đa:** 25,000x tổng cược mỗi lượt quay (bao gồm tất cả cascades)

## Tuân Thủ & Chứng Nhận

- **RTP Đã Kiểm Tra:** 96.92% ± 0.5%
- **Tiêu Chuẩn:** Tuân thủ tiêu chuẩn gaming quốc tế
- **MGA:** Được phê duyệt bởi Malta Gaming Authority
- **UKGC:** Tuân thủ UK Gambling Commission
- **Chơi Công Bằng:** Hệ thống RNG có thể chứng minh công bằng

## Ưu Tiên Phát Triển

### Giai Đoạn 1: Nền Tảng Backend

1. Thiết kế schema database
2. Game engine cốt lõi (RNG, tính toán thắng, logic cascade)
3. API endpoints
4. Quản lý phiên

### Giai Đoạn 2: Tích Hợp

1. Tích hợp API frontend
2. Cập nhật trạng thái game real-time
3. Xử lý giao dịch

### Giai Đoạn 3: Kiểm Tra & Xác Thực

1. Mô phỏng RTP (10M+ lượt quay)
2. Xác thực toán học
3. Load testing
4. Audit bảo mật

### Giai Đoạn 4: Triển Khai

1. Thiết lập môi trường production
2. Monitoring và logging
3. Tài liệu tuân thủ
4. Sẵn sàng ra mắt
