# Mahjong Ways - Tài Liệu Kỹ Thuật

## Tổng Quan

Thư mục này chứa tài liệu kỹ thuật đầy đủ cho dự án xây dựng lại game slot Mahjong Ways.

**Công Nghệ Sử Dụng:**

- **Backend:** Golang + PostgreSQL
- **Frontend:** HTML5 Canvas (hiện có)
- **Kiến trúc:** RESTful API

## Các Tài Liệu Kỹ Thuật

1. **[01-overview.md](./01-overview.md)** | **[English](../01-overview.md)**
   - Tổng quan về game và tóm tắt điều hành
   - Thông số cốt lõi (RTP, độ biến động, khoảng cược)
   - Tóm tắt tính năng chính

2. **[02-symbols-paytable.md](./02-symbols-paytable.md)** | **[English](../02-symbols-paytable.md)**
   - Định nghĩa đầy đủ các biểu tượng
   - Bảng trả thưởng cho tất cả biểu tượng
   - Hành vi của các biểu tượng đặc biệt

3. **[03-game-mechanics.md](./03-game-mechanics.md)** | **[English](../03-game-mechanics.md)**
   - Hệ thống 1,024 Cách Thắng
   - Cơ chế Cascade/Tumble
   - Tiến trình hệ số nhân
   - Tính năng Vòng Quay Miễn Phí
   - Quy tắc thay thế Wild
   - Chuyển đổi biểu tượng vàng

4. **[04-rtp-mathematics.md](./04-rtp-mathematics.md)** | **[English](../04-rtp-mathematics.md)**
   - Mục tiêu và xác thực RTP
   - Phân bố trọng số biểu tượng
   - Mô hình toán học
   - Yêu cầu mô phỏng

5. **[05-backend-api.md](./05-backend-api.md)** | **[English](../05-backend-api.md)**
   - Đặc tả các API endpoint
   - Định dạng request/response
   - Quản lý trạng thái game
   - Xử lý phiên

6. **[06-database-schema.md](./06-database-schema.md)** | **[English](../06-database-schema.md)**
   - Thiết kế schema PostgreSQL
   - Cấu trúc bảng
   - Indexes và mối quan hệ
   - Chính sách lưu trữ dữ liệu

7. **[07-frontend-integration.md](./07-frontend-integration.md)** | **[English](../07-frontend-integration.md)**
   - Giao tiếp frontend-backend
   - Cân nhắc WebSocket vs REST
   - Yêu cầu UI/UX
   - Triggers cho animation

8. **[08-game-configuration.md](./08-game-configuration.md)** | **[English](../08-game-configuration.md)**
   - Hệ thống cấu hình backend
   - Quản lý bảng trả thưởng và tỷ lệ xuất hiện
   - Phiên bản và xác thực cấu hình
   - Điều chỉnh RTP không cần thay đổi code
   - API endpoints cho quản trị

9. **[09-security-architecture.md](./09-security-architecture.md)** | **[English](../09-security-architecture.md)**
   - RNG bảo mật mã hóa
   - Gameplay quyền kiểm soát server
   - Ký và xác thực request
   - Chống gian lận và chống giả mạo
   - Audit logging và tuân thủ quy định

## Lịch Sử Phiên Bản

- **v1.1** (2025-11-17) - Thêm tài liệu về cấu hình và bảo mật
- **v1.0** (2025-11-17) - Tài liệu kỹ thuật được tổ chức ban đầu
- Nguồn: technical_specification.md gốc

## Bắt Đầu Nhanh

1. Đọc [01-overview.md](./01-overview.md) để hiểu về game
2. Xem [05-backend-api.md](./05-backend-api.md) để thiết kế API
3. Nghiên cứu [06-database-schema.md](./06-database-schema.md) để thiết lập database
4. Triển khai backend theo các đặc tả
5. Tích hợp với frontend hiện có theo [07-frontend-integration.md](./07-frontend-integration.md)

## Chỉ Số Chính

- **RTP:** 96.92% ± 0.5%
- **Độ Biến Động:** Cao
- **Thắng Tối Đa:** 25,000x cược
- **Lưới:** 5 cuộn × 4 hàng
- **Cách Thắng:** 1,024
