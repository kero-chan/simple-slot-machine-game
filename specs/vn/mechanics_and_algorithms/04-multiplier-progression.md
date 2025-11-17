# Tiến Triển Multiplier

## Tổng Quan

**Hệ thống multiplier** là điều làm cho cascades ngày càng có giá trị hơn. Mỗi cascade thành công tăng multiplier, khuếch đại chiến thắng theo cấp số nhân.

**Nguyên Tắc Chính:** Cascades trở nên có lợi hơn khi chúng tiếp tục lâu hơn.

---

## Multipliers Trò Chơi Cơ Bản

### Bảng Tiến Triển

| Số Cascade | Multiplier | Tăng Từ Trước |
|------------|------------|---------------|
| 1st cascade | **x1** | Cơ bản (không multiplier) |
| 2nd cascade | **x2** | +100% |
| 3rd cascade | **x3** | +50% |
| 4th cascade | **x5** | +67% |
| 5th+ cascades | **x5** | Ở lại x5 |

**Mẫu:** 1 → 2 → 3 → 5 → 5 → 5...

---

### Biểu Diễn Hình Ảnh

```
Chuỗi Cascade:

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Cascade 1│────>│Cascade 2│────>│Cascade 3│────>│Cascade 4│────>│Cascade 5│
│  x1     │     │  x2     │     │  x3     │     │  x5     │     │  x5     │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
   100%           200%            300%            500%            500%
```

**Cao Nguyên:** Multiplier đạt tối đa x5 và ở lại đó cho tất cả cascades tiếp theo.

---

## Multipliers Free Spins (Nâng Cao)

### Bảng Tiến Triển

| Số Cascade | Multiplier | Tăng Từ Trò Chơi Cơ Bản |
|------------|------------|-------------------------|
| 1st cascade | **x2** | +100% (so với x1 ở cơ bản) |
| 2nd cascade | **x4** | +100% (so với x2 ở cơ bản) |
| 3rd cascade | **x6** | +100% (so với x3 ở cơ bản) |
| 4th+ cascades | **x10** | +100% (so với x5 ở cơ bản) |

**Mẫu:** 2 → 4 → 6 → 10 → 10 → 10...

**Nâng Cao:** GẤP ĐÔI ở mỗi giai đoạn so với trò chơi cơ bản!

---

### Biểu Đồ So Sánh

```
Cascade #    Cơ Bản    Free Spins    Ưu Thế
────────────────────────────────────────────────
    1           x1           x2          2x tốt hơn
    2           x2           x4          2x tốt hơn
    3           x3           x6          2x tốt hơn
    4+          x5           x10         2x tốt hơn
────────────────────────────────────────────────

Multipliers free spins CHÍNH XÁC GẤP ĐÔI trò chơi cơ bản!
```

---

## Cách Multipliers Áp Dụng

### Áp Dụng Trong Tính Toán Thắng

**Công Thức:**
```
Win = Symbol_Payout × Ways_Count × Multiplier × Bet_Per_Way
```

**Ví Dụ:**
```
Symbol: FA (4-of-a-kind)
Paytable Payout: 25x
Ways Count: 4 ways
Cascade Number: 3 (cascade thứ ba)
Multiplier: x3 (trò chơi cơ bản)
Bet Per Way: 5 credits

Tính Toán:
Win = 25 × 4 × 3 × 5
    = 25 × 4 × 15
    = 1,500 credits

Cùng chiến thắng ở cascade 1 sẽ là:
Win = 25 × 4 × 1 × 5 = 500 credits

Có giá trị gấp 3 lần!
```

---

## Chu Kỳ Sống Multiplier

### Khi Multiplier Tăng

**Kích Hoạt:** Sau khi biểu tượng được xóa và biểu tượng mới điền vào

```
Luồng Cascade:
1. Đánh giá lưới → Tìm chiến thắng
2. Tính thanh toán với multiplier HIỆN TẠI
3. Xóa biểu tượng thắng
4. Biểu tượng rơi và điền
5. TĂNG multiplier ← Xảy ra ở đây
6. Đánh giá lưới lại với multiplier MỚI
```

**Quan Trọng:** Chiến thắng được tính TRƯỚC KHI multiplier tăng cho cascade tiếp theo.

---

### Khi Multiplier Reset

**Điều Kiện Reset:**

**1. Không Tìm Thấy Chiến Thắng**
```
Cascade đánh giá, không có tổ hợp thắng
→ Chuỗi cascade kết thúc
→ Multiplier reset về cơ bản (x1 hoặc x2)
```

**2. Hoàn Thành Quay**
```
Tất cả cascades hoàn thành
→ Tổng thắng được trao
→ Multiplier reset về x1 (trò chơi cơ bản) hoặc x2 (free spins)
```

**3. Giữa Các Lượt Quay**
```
Quay A kết thúc với 5 cascades (multiplier ở x5)
Quay B mới bắt đầu
→ Multiplier reset về x1
→ KHÔNG chuyển qua giữa các lượt quay!
```

---

## Tác Động Đến Thanh Toán

### Tăng Giá Trị Tiến Triển

**Kịch Bản:** Cùng chiến thắng trên các cascades khác nhau

```
Symbol: ZHONG 3-of-a-kind
Payout: 8x
Ways: 2 ways
Bet per way: 5 credits

Cascade 1 (x1): 8 × 2 × 1 × 5 = 80 credits
Cascade 2 (x2): 8 × 2 × 2 × 5 = 160 credits
Cascade 3 (x3): 8 × 2 × 3 × 5 = 240 credits
Cascade 4 (x5): 8 × 2 × 5 × 5 = 400 credits

Cùng chiến thắng có giá trị gấp 5 lần ở cascade 4!
```

---

### Ưu Thế Free Spins

**Cùng kịch bản trong free spins:**

```
Cascade 1 (x2): 8 × 2 × 2 × 5 = 160 credits
Cascade 2 (x4): 8 × 2 × 4 × 5 = 320 credits
Cascade 3 (x6): 8 × 2 × 6 × 5 = 480 credits
Cascade 4 (x10): 8 × 2 × 10 × 5 = 800 credits

Có giá trị gấp 10 lần so với cascade 1 trò chơi cơ bản!
```

---

## Kịch Bản Thắng Tối Đa

### Tối Đa Lý Thuyết

**Trường Hợp Tốt Nhất:**
- 5-of-a-kind biểu tượng cao nhất (FA: 50x)
- Ways tối đa (1,024)
- Multiplier tối đa (x10 trong free spins)
- Cược lớn (100 credits, 5 mỗi way)

```
Win = 50 × 1,024 × 10 × 5
    = 2,560,000 credits

Tuy nhiên:
Giới hạn thắng tối đa = 25,000x tổng cược
= 25,000 × 100 = 2,500,000 credits

Thắng được giới hạn ở 2,500,000 credits
```

---

## Tóm Tắt

**Hệ Thống Multiplier:**
- Tăng với mỗi cascade
- Trò chơi cơ bản: x1 → x2 → x3 → x5
- Free spins: x2 → x4 → x6 → x10 (gấp đôi!)
- Đạt tối đa (x5 hoặc x10)
- Reset giữa các lượt quay
- Áp dụng cho TẤT CẢ chiến thắng trong một cascade
- Quan trọng cho RTP và sự phấn khích

**Kết quả:** Làm cho cascades liên tiếp có giá trị theo cấp số nhân, tạo ra gameplay phản ứng dây chuyền ly kỳ!
