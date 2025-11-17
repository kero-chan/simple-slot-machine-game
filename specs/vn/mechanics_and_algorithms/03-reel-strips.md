# Kiến Trúc Reel Strip

## Khái Niệm Băng Ảo

**Reel strip** giống như một băng tròn các biểu tượng đại diện cho một reel. Hãy nghĩ về nó như một reel máy đánh bạc vật lý đã được "mở ra" thành một chuỗi biểu tượng.

**Hiểu Biết Chính:** Strip được **xác định trước** và **không thay đổi** - nó không được tạo ngẫu nhiên mỗi lượt quay. Thay vào đó, chúng ta chọn ngẫu nhiên NƠI bắt đầu đọc từ strip.

---

## Khái Niệm Hình Ảnh

### Tương Tự Máy Đánh Bạc Vật Lý

```
Reel Vật Lý Truyền Thống:
    ┌─────────┐
    │    A    │
    │    B    │ ← Biểu tượng được vẽ trên xi lanh
    │    C    │
    │    A    │
    └─────────┘
     (quay vật lý)
```

### Reel Strip Ảo

```
Băng Tròn Đã Mở (100 vị trí):

Position: 0    1    2    3    4    5    ... 98   99   0 (quay vòng)
Symbol:  [A]  [B]  [C]  [A]  [B]  [D]  ... [A]  [B]  [A]
          ↑                                           ↑
          └───────────────────────────────────────────┘
          Kết nối lại (tròn)
```

**Yếu Tố Ngẫu Nhiên:** Chúng ta chọn một vị trí bắt đầu ngẫu nhiên (ví dụ: 47), sau đó đọc tiếp.

---

## Tại Sao Reel Strips Cần Thiết

### 1. Kiểm Soát RTP

**Vấn Đề không có strips:**
Nếu biểu tượng hoàn toàn ngẫu nhiên mỗi lượt quay, RTP sẽ biến động mạnh và không thể dự đoán được.

**Giải pháp với strips:**
Bằng cách kiểm soát tần suất của mỗi biểu tượng trên strip, chúng ta xác định toán học:
- Tần suất xuất hiện của mỗi biểu tượng
- Xác suất thắng
- Tỷ lệ thanh toán dài hạn

**Ví dụ:**
```
Strip 100 vị trí:
- FA: 8 vị trí → 8% cơ hội mỗi vị trí
- WILD: 2 vị trí → 2% cơ hội mỗi vị trí
- LIANGTONG: 20 vị trí → 20% cơ hội mỗi vị trí

Qua hàng triệu lượt quay, những tỷ lệ chính xác này giữ nguyên.
→ RTP có thể dự đoán
```

---

### 2. Tính Liên Tục Cascade

**Vấn Đề không có strips:**
Trong cascades, biểu tượng mới đến từ đâu?

**Giải pháp với strips:**
Biểu tượng mới được đọc từ strip ở các vị trí "trên" điểm bắt đầu ban đầu.

**Ví dụ:**
```
Lượt quay ban đầu bắt đầu ở vị trí 50
Đọc vị trí: 50, 51, 52, 53, 54...

Sau khi cascade xóa biểu tượng, cần biểu tượng mới
Đọc từ "trên": 49, 48, 47...

Điều này đảm bảo:
✓ Cascades sử dụng cùng phân phối biểu tượng
✓ RTP vẫn nhất quán
✓ Biểu tượng có thể tái tạo/kiểm toán được
```

---

### 3. Chơi Công Bằng Có Thể Chứng Minh

**Yêu Cầu:**
Các quy định về cờ bạc yêu cầu các lượt quay phải có thể tái tạo để kiểm toán.

**Cách strips cho phép điều này:**
```
Spin ID: ABC-123
Reel Positions: [47, 23, 89, 12, 56]
Reel Strips: Version 1.0

Với thông tin này:
→ Có thể tạo lại kết quả quay chính xác
→ Có thể xác minh thanh toán đúng
→ Kiểm toán viên có thể xác thực tính công bằng
```

---

## Cấu Trúc Reel Strip

### Thành Phần

Mỗi reel strip chứa:
- **Độ dài cố định** (thường là 100-120 vị trí)
- **Phân phối biểu tượng** dựa trên weights
- **Cấu trúc tròn** (vị trí 99 quay về vị trí 0)

**Ví Dụ Strip (Reel 1, 100 vị trí):**
```
Position: Symbol
0:  liangtong
1:  fa
2:  wutong
3:  zhong
4:  liangsuo
5:  bawan
6:  wusuo
7:  liangtong
8:  fa
9:  bai
10: wutong
11: zhong
12: bonus        ← Scatter
13: liangsuo
14: bawan
15: wusuo
16: liangtong
17: wild         ← Wild
18: fa
... tiếp tục đến vị trí 99
```

---

## Đọc Từ Reel Strips

### Quy Trình Quay Ban Đầu

**Bước 1: Chọn Vị Trí Bắt Đầu Ngẫu Nhiên**
```
Độ dài Strip: 100
Vị trí Ngẫu Nhiên: 47 (được tạo bằng crypto/rand)
```

**Bước 2: Đọc Biểu Tượng Tiến**
```
Cần: 10 biểu tượng (4 rows hiển thị + 6 rows đệm)

Đọc từ strip:
Position 47: "liangtong"
Position 48: "fa"
Position 49: "wutong"
Position 50: "zhong"
Position 51: "liangsuo"  ← Rows hiển thị bắt đầu
Position 52: "bawan"
Position 53: "wusuo"
Position 54: "liangtong"  ← Rows hiển thị kết thúc
Position 55: "wild"
Position 56: "fa"
```

**Bước 3: Điền Cột Lưới**
```
Cột cho Reel 1:
Row 0: "liangtong" (đệm)
Row 1: "fa"        (đệm)
Row 2: "wutong"    (đệm)
Row 3: "zhong"     (đệm)
Row 4: "liangsuo"  ← Hiển thị
Row 5: "bawan"     ← Hiển thị
Row 6: "wusuo"     ← Hiển thị
Row 7: "liangtong" ← Hiển thị
Row 8: "wild"      (đệm)
Row 9: "fa"        (đệm)
```

---

### Quay Vòng (Tròn)

**Điều gì nếu việc đọc vượt quá cuối?**

```
Độ dài Strip: 100
Vị trí Bắt Đầu: 95

Đọc 10 biểu tượng:
Position 95: "zhong"
Position 96: "fa"
Position 97: "bai"
Position 98: "wutong"
Position 99: "liangsuo"
Position 0:  "liangtong"  ← Quay về đầu
Position 1:  "fa"
Position 2:  "wutong"
Position 3:  "zhong"
Position 4:  "liangsuo"

Strip là tròn - không có đầu hay cuối!
```

---

## Hành Vi Đọc Cascade

### Đọc "Trên" Vị Trí Bắt Đầu

Khi cascades xảy ra và cần biểu tượng mới, chúng ta đọc **ngược lại** từ vị trí bắt đầu ban đầu (mô phỏng biểu tượng "trên" rơi xuống).

**Khái niệm:**
```
Lượt quay ban đầu bắt đầu ở vị trí 50
Sau cascade, cần 2 biểu tượng mới

Đọc ngược:
Position 49: "wutong"
Position 48: "fa"

Những biểu tượng này trở thành biểu tượng mới "rơi từ trên"
```

---

## Các Strips Khác Nhau Mỗi Reel

### Tại Sao 5 Strips Khác Nhau?

**Mỗi reel có đặc điểm riêng:**

**Reel 1 & 5 (Reels Ngoài):**
- Không có biến thể biểu tượng vàng
- Phân phối biểu tượng cân bằng
- Biểu tượng giá trị thấp cao hơn một chút

**Reels 2, 3, 4 (Reels Giữa):**
- Có thể bao gồm biến thể vàng (fa_gold, wild_gold, v.v.)
- Phân phối được điều chỉnh để tính đến phiên bản vàng
- Tương tự nhưng không giống hệt với reels ngoài

---

## Quá Trình Tạo Strip

### Cách Strips Được Tạo (Khái niệm)

**Bước 1: Xác Định Weights**
```
Cấu hình chỉ định bao nhiêu của mỗi biểu tượng:
fa: 8
zhong: 10
bai: 12
...
```

**Bước 2: Tạo Pool Biểu Tượng**
```
Thêm biểu tượng vào pool dựa trên weights:
[fa, fa, fa, fa, fa, fa, fa, fa,    ← 8 fa
 zhong, zhong, zhong, zhong, ...,   ← 10 zhong
 bai, bai, bai, ...,                ← 12 bai
 ...]
```

**Bước 3: Xáo Trộn**
```
Xáo trộn ngẫu nhiên pool bằng xáo trộn mật mã
[zhong, fa, bai, wutong, fa, zhong, ...]
```

**Bước 4: Điền Đến Độ Dài**
```
Nếu pool < 100: Thêm biểu tượng giá trị thấp hơn
Nếu pool > 100: Xóa một số biểu tượng (theo tỷ lệ)
Độ dài cuối cùng: Chính xác 100 vị trí
```

**Bước 5: Lưu Trữ**
```
Lưu vào database với số phiên bản
Strip này bây giờ được sử dụng cho tất cả các lượt quay
```

---

## Tóm Tắt

**Reel Strips Là:**
- Chuỗi biểu tượng được xác định trước (thường là 100 vị trí)
- Tròn/vô tận (vị trí 99 quay về vị trí 0)
- Khác nhau cho mỗi trong 5 reels
- Được sử dụng cho cả lượt quay ban đầu và lấp đầy cascade
- Cần thiết cho kiểm soát RTP và tính công bằng

**Cách Chúng Hoạt Động:**
- Vị trí bắt đầu ngẫu nhiên được chọn mỗi lượt quay
- Biểu tượng được đọc tiến từ vị trí đó
- Cascades đọc ngược (mô phỏng "trên")
- Phân phối giống nhau đảm bảo RTP nhất quán
- Có thể kiểm toán và tái tạo

**Tại Sao Chúng Quan Trọng:**
- Kiểm soát RTP toán học
- Chơi công bằng có thể chứng minh
- Tính liên tục cascade
- Tuân thủ quy định
- Kết quả có thể tái tạo

**Kết quả:** Gameplay công bằng, có thể kiểm toán và chính xác toán học!
