# Hệ Thống Cascade (Tumbling Reels)

## Tổng Quan Khái Niệm

**Hệ Thống Cascade** (còn gọi là Tumbling Reels hoặc Avalanche) là cơ chế đặc trưng của Mahjong Ways. Khi có chiến thắng, các biểu tượng thắng biến mất, các biểu tượng còn lại rơi xuống do "trọng lực," và các biểu tượng mới rơi từ trên xuống để lấp đầy khoảng trống.

**Đổi Mới Chính:** Điều này có thể tạo ra phản ứng dây chuyền trong đó các chiến thắng mới kích hoạt cascades bổ sung, có thể tiếp tục vô thời hạn.

---

## Chu Kỳ Cascade

### Sơ Đồ Luồng Hoàn Chỉnh

```
┌─────────────────────────────────────────┐
│  BƯỚC 1: QUAY BAN ĐẦU                   │
│  - Reels quay và hạ cánh                │
│  - Lưới ban đầu được điền               │
│  - Bộ đếm cascade = 0                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BƯỚC 2: ĐÁNH GIÁ CHIẾN THẮNG           │
│  - Kiểm tra tất cả tổ hợp biểu tượng    │
│  - Xác định vị trí thắng                │
│  - Tính số ways                         │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
     KHÔNG THẮNG   CÓ CHIẾN THẮNG
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  BƯỚC 3: LÀM NỔI BẬT & TÍNH │
        │  │  - Biểu tượng thắng phát sáng│
        │  │  - Tính số tiền thắng        │
        │  │  - Áp dụng multiplier        │
        │  │  - Thêm vào tổng thắng       │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  BƯỚC 4: XÓA BIỂU TƯỢNG     │
        │  │  - Biểu tượng thắng nổ      │
        │  │  - Vị trí trống được tạo     │
        │  │  - Tăng bộ đếm cascade      │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  BƯỚC 5: BIỂU TƯỢNG RƠI     │
        │  │  - Biểu tượng còn lại rơi   │
        │  │  - Vật lý trọng lực áp dụng │
        │  │  - Biểu tượng nằm ở đáy     │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  BƯỚC 6: LẤP ĐẦY KHOẢNG TRỐNG│
        │  │  - Biểu tượng mới rơi từ trên│
        │  │  - Đọc từ reel strip        │
        │  │  - Lưới hoàn chỉnh trở lại  │
        │  └──────────┬──────────────────┘
        │             │
        │             ▼
        │  ┌─────────────────────────────┐
        │  │  BƯỚC 7: TĂNG MULTIPLIER    │
        │  │  - Tăng số cascade          │
        │  │  - Cập nhật giá trị multiplier│
        │  └──────────┬──────────────────┘
        │             │
        │             └──────┐
        │                    │
        └────────────────────┼─────► QUAY LẠI BƯỚC 2
                             │
                             ▼
               ┌─────────────────────────┐
               │  HOÀN THÀNH QUAY        │
               │  - Reset multiplier     │
               │  - Trao tổng thắng      │
               │  - Sẵn sàng quay tiếp   │
               └─────────────────────────┘
```

---

## Giải Thích Chi Tiết Từng Bước

### Bước 1: Quay Ban Đầu

**Điều Gì Xảy Ra:**

- Người chơi bắt đầu một lượt quay
- Backend tạo vị trí bắt đầu ngẫu nhiên cho cả 5 reels
- Biểu tượng được đọc từ reel strips dựa trên các vị trí này
- Lưới được điền với 5 cột × 10 rows (4 hiển thị + 6 đệm)

**Trạng Thái Ban Đầu:**

- Số cascade: 0 (chưa bắt đầu)
- Multiplier: x1 (trò chơi cơ bản) hoặc x2 (free spins)
- Tổng thắng: 0

---

### Bước 2: Đánh Giá Chiến Thắng

**Điều Gì Xảy Ra:**

- Hệ thống quét các rows hiển thị để tìm tổ hợp thắng
- Kiểm tra mọi loại biểu tượng độc lập
- Sử dụng thuật toán Ways to Win để đếm đường thắng
- Xác định vị trí chính xác của tất cả biểu tượng thắng

**Điểm Quyết Định:**

- **Nếu tìm thấy chiến thắng:** Tiếp tục Bước 3
- **Nếu không có chiến thắng:** Nhảy đến Hoàn Thành Quay

---

### Bước 3: Làm Nổi Bật & Tính Toán

**Điều Gì Xảy Ra:**

- Tất cả biểu tượng thắng được đánh dấu/làm nổi bật
- Số tiền thắng được tính bằng công thức
- Cascade multiplier hiện tại được áp dụng
- Chiến thắng được thêm vào tổng

**Hiệu Ứng Hình Ảnh:**

```
Biểu tượng thắng phát sáng VÀNG:

        Reel 1   Reel 2   Reel 3   Reel 4   Reel 5
Row 4:  [FA✨]   [FA✨]    bai      wutong   liangsuo
Row 5:   zhong   [FA✨]   [FA✨]    bawan    wild
Row 6:   bai      wutong  [FA✨]   [FA✨]    liangtong
Row 7:   wusuo    liangsuo bawan    zhong    fa

✨ = Biểu tượng thắng (được làm nổi bật màu vàng)
```

---

### Bước 4: Xóa Biểu Tượng

**Điều Gì Xảy Ra:**

- Biểu tượng thắng được xóa khỏi lưới
- Vị trí trở nên trống
- Hình ảnh: Hoạt ảnh nổ/biến mất phát
- Bộ đếm cascade tăng lên

---

### Bước 5: Biểu Tượng Rơi (Trọng Lực)

**Điều Gì Xảy Ra:**

- Biểu tượng còn lại "rơi" xuống để lấp đầy khoảng trống
- Nghĩ về trọng lực kéo biểu tượng xuống dưới
- Biểu tượng nằm ở đáy cột của chúng
- Vị trí trống di chuyển lên trên

---

### Bước 6: Lấp Đầy Khoảng Trống

**Điều Gì Xảy Ra:**

- Biểu tượng mới rơi từ "trên" để lấp đầy vị trí trống
- Những biểu tượng này đến từ reel strip
- Việc đọc tiếp tục từ nơi lượt quay cuối cùng dừng lại
- Lưới trở nên hoàn chỉnh trở lại

**Khái Niệm Quan Trọng:**
Các biểu tượng mới KHÔNG được tạo ngẫu nhiên. Chúng được đọc từ reel strip được xác định trước, tiếp tục từ vị trí "trên" nơi lượt quay ban đầu bắt đầu.

---

### Bước 7: Tăng Multiplier

**Điều Gì Xảy Ra:**

- Số cascade tăng
- Giá trị multiplier cập nhật dựa trên số cascade
- Chuẩn bị cho đánh giá tiếp theo

**Tiến Triển Multiplier:**

**Trò Chơi Cơ Bản:**

```
Cascade 1: x1 multiplier
Cascade 2: x2 multiplier ← Chúng ta đang ở đây
Cascade 3: x3 multiplier
Cascade 4+: x5 multiplier (ở lại x5)
```

**Free Spins:**

```
Cascade 1: x2 multiplier
Cascade 2: x4 multiplier
Cascade 3: x6 multiplier
Cascade 4+: x10 multiplier (ở lại x10)
```

---

## Ví Dụ Phản Ứng Dây Chuyền

### Chuỗi 3-Cascade Hoàn Chỉnh

**Cascade 1:**

- Thắng: FA 4-of-a-kind, 4 ways
- Multiplier: x1
- Thanh toán: 500 credits
- **Tổng cộng: 500**

**Cascade 2:**

- Thắng: ZHONG 4-of-a-kind, 1 way
- Multiplier: x2
- Thanh toán: 200 credits
- **Tổng cộng: 700**

**Cascade 3:**

- Thắng: WUTONG 3-of-a-kind, 2 ways
- Multiplier: x3
- Thanh toán: 180 credits
- **Tổng cộng: 880**

**Cascade 4:**

- Không tìm thấy chiến thắng
- **Chuỗi kết thúc**
- **Thanh toán cuối cùng: 880 credits**

---

## Khi Cascades Dừng Lại

### Điều Kiện Kết Thúc

**1. Không Tìm Thấy Chiến Thắng**

```
Lưới được đánh giá, không tìm thấy biểu tượng khớp 3+
→ Chuỗi cascade kết thúc
→ Multiplier reset về cơ bản (x1 hoặc x2)
→ Tổng thắng được trao cho người chơi
```

**2. Đạt Giới Hạn An Toàn**

```
Số cascade đạt 100 (giới hạn an toàn)
→ Chuỗi cascade bắt buộc kết thúc
→ Ngăn vòng lặp vô hạn
→ Trao chiến thắng tích lũy
```

**3. Hoàn Thành Quay**

```
Sau khi chuỗi cascade kết thúc:
→ Số dư được cập nhật với tổng thắng
→ Bộ đếm free spins giảm (nếu trong FS)
→ Lưới sẵn sàng cho lượt quay tiếp theo
→ Tất cả trạng thái được reset
```

---

## Tóm Tắt

**Hệ Thống Cascade:**

- Xóa biểu tượng thắng sau mỗi chiến thắng
- Các biểu tượng còn lại rơi qua trọng lực
- Lấp đầy khoảng trống với biểu tượng mới từ reel strip
- Đánh giá lại cho chiến thắng mới
- Tiếp tục cho đến khi không tìm thấy chiến thắng
- Tăng multiplier với mỗi cascade
- Tạo gameplay phản ứng dây chuyền thú vị

**Kết quả:** Hấp dẫn hơn các lượt quay tĩnh, với tiềm năng chiến thắng cascade nhiều lần khổng lồ!
