# Release Checklist & Hướng dẫn Demo môn học

Tài liệu này cung cấp checklist chuẩn bị môi trường, kiểm tra mã nguồn, các bước chạy demo thực tế và danh sách tài liệu phục vụ cho việc nộp bài và bảo vệ đề tài **"Nền tảng đồng sáng tác tiểu thuyết AI realtime"** (Stack: **WebSocket + Redis + MongoDB**).

---

## 1. Danh sách tài liệu và file quan trọng

Trước khi nộp bài, hãy đảm bảo các tài liệu và thư mục sau đây nằm đầy đủ trong thư mục dự án:

| Tên file / Thư mục | Vai trò | Trạng thái |
| :--- | :--- | :---: |
| [README.md](README.md) | Tài liệu hướng dẫn cài đặt và khởi chạy nhanh dự án. | Đã hoàn thiện |
| [walkthrough.md](walkthrough.md) | Mô tả chi tiết kiến trúc monorepo, data models, WebSocket events và cách dùng Redis. | Đã hoàn thiện |
| [bao-cao-demo.md](bao-cao-demo.md) | Báo cáo chi tiết kịch bản demo thuyết trình và kết quả kiểm thử thực tế. | Đã hoàn thiện |
| [release-checklist.md](release-checklist.md) | File checklist hiện tại phục vụ quá trình release và chạy demo. | **Mới tạo** |
| `scripts/check-demo-env.ps1` | Script PowerShell tự động kiểm tra môi trường và các cổng kết nối. | Đã hoàn thiện |
| `docker-compose.yml` | Cấu hình khởi động nhanh MongoDB và Redis qua Docker. | Đã hoàn thiện |
| `docs/screenshots/` | Thư mục chứa 5 ảnh chụp màn hình minh chứng cho luồng demo E2E. | Đã có sẵn |

---

## 2. Checklist chuẩn bị môi trường

Thực hiện lần lượt các bước sau để thiết lập môi trường chạy ứng dụng trên máy local:

### Bước 2.1. Cài đặt các gói phụ thuộc (Dependencies)
Dự án được cấu trúc theo dạng Monorepo sử dụng `pnpm workspace`. Cài đặt toàn bộ dependencies cho cả frontend và backend bằng lệnh duy nhất tại thư mục gốc:
```bash
pnpm install
```

### Bước 2.2. Khởi chạy cơ sở dữ liệu (MongoDB & Redis)
Đảm bảo đã mở **Docker Desktop** trên máy Windows. Tại thư mục gốc, khởi chạy các container database ngầm:
```bash
pnpm db:up
```
*(Nếu muốn dừng dịch vụ, chạy `pnpm db:down`. Để kiểm tra logs chạy `pnpm db:logs`)*

### Bước 2.3. Kiểm tra môi trường tự động
Để chắc chắn các cổng kết nối và Docker container đã sẵn sàng, hãy chạy script kiểm tra:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1
```
**Yêu cầu kết quả:** Tất cả 6 bước kiểm tra từ `Docker CLI`, `Docker Daemon`, `Containers`, `Ports` cho đến `Backend/Frontend` đều hiển thị trạng thái `[PASS]`.

---

## 3. Quy trình chạy ứng dụng & Seed dữ liệu

### Bước 3.1. Khởi động các Server phát triển (Development)
Chạy lệnh sau tại thư mục gốc để khởi động đồng thời cả Frontend Next.js (cổng `3000`) và Backend NestJS (cổng `3001`):
```bash
pnpm dev
```

### Bước 3.2. Khởi tạo dữ liệu mẫu (Seeding)
Sau khi backend đã khởi động, gọi API seed để tự động tạo phòng mẫu mã `DEMO99` cùng cấu hình Lorebook ban đầu:
* **Trên Windows PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed
  ```
* **Trên Git Bash / Linux / macOS:**
  ```bash
  curl -X POST http://localhost:3001/api/rooms/seed
  ```
* **Kết quả mong muốn:** API phản hồi thành công và trả về thông tin phòng mẫu `DEMO99`.

---

## 4. Kịch bản các bước chạy Demo thực tế (Host & Writer Flow)

Để minh họa khả năng đồng bộ thời gian thực của hệ thống, hãy mở **2 cửa sổ trình duyệt** (trong đó có 1 cửa sổ ẩn danh):

1. **Bước 1: Đăng nhập Host (Cửa sổ 1)**
   * Truy cập `http://localhost:3000`.
   * Nhập tên hiển thị: `Host Demo`.
   * Nhập mã phòng: `DEMO99` -> Bấm **Join Room**.
   * Hệ thống sẽ nhận diện `Host Demo` là người đầu tiên tham gia và cấp quyền **Host** (Hiển thị bảng điều khiển *Host Control Panel* màu tím ở phía bên trái).

2. **Bước 2: Đăng nhập Writer (Cửa sổ 2 - Ẩn danh)**
   * Truy cập `http://localhost:3000`.
   * Nhập tên hiển thị: `Writer Demo`.
   * Nhập mã phòng: `DEMO99` -> Bấm **Join Room**.
   * Hệ thống kết nối và gán quyền **Writer**. Trình duyệt của Writer sẽ **không** thấy các nút điều khiển của Host.

3. **Bước 3: Kiểm tra sự hiện diện (Real-time Presence)**
   * Trên góc phải header và tại Lobby của cả 2 màn hình, kiểm tra số lượng người online cập nhật lên `2 Active`.
   * Di chuột vào tooltip hoặc nhìn danh sách lobby để xác nhận hiển thị chính xác tên `Host Demo` (Host) và `Writer Demo` (Writer).
   * *Giải thích chuyên môn:* Kết nối Socket.IO đồng bộ danh sách online tức thì, dữ liệu online được lưu trữ dưới dạng Hash trong Redis (`room:{roomId}:presence`).

4. **Bước 4: Giai đoạn gửi ý tưởng (Submission Phase)**
   * Trên màn hình **Host**, bấm **Start Co-creation Round**.
   * Giao diện cả 2 tab lập tức chuyển sang phase **Submission** với thanh tiến trình và bộ đếm ngược.
   * Trên màn hình **Writer**, nhập ý tưởng: *"Nhóm thám hiểm tìm thấy một thiết bị phát sóng lạ dưới lòng đất cổ đại."* -> Bấm **Gửi**.
   * Trạng thái ý tưởng hiển thị `Validating lore...` nhấp nháy. Sau 2 giây, trạng thái chuyển sang tích xanh lá `Approved & Verified`. Ý tưởng lập tức đồng bộ hiển thị lên màn hình của Host.
   * *Giải thích chuyên môn:* Ý tưởng được đưa vào hàng đợi BullMQ ngầm sử dụng Redis. AI Lore Checker kiểm tra ý tưởng đối chiếu với các mục trong Lorebook được lưu tại MongoDB. Nếu hợp lệ, Socket.IO gateway sẽ broadcast ý tưởng cho phòng viết.

5. **Bước 5: Giai đoạn bỏ phiếu & Khóa lượt bình chọn (Voting & Redis Lock)**
   * Trên màn hình **Host**, bấm **Close Submission & Start Voting**.
   * Cả 2 màn hình lập tức chuyển sang phase **Voting**. Tên của người viết sẽ được ẩn danh để đảm bảo tính công bằng.
   * Trên màn hình **Writer**, bấm **Vote** vào ý tưởng vừa được duyệt. Hệ thống báo vote thành công.
   * Writer cố tình bấm **Vote** lần thứ hai. Hệ thống lập tức hiển thị thông báo lỗi màu đỏ ở góc trái: `[Redis Lock] Phát hiện double-vote! Lượt bầu chọn đã được khóa trong Redis.`
   * *Giải thích chuyên môn:* Redis sử dụng lệnh nguyên tử `SET room:{roomId}:turn:{turnId}:voted:{userId} "voted" EX 3600 NX`. Lượt click thứ hai của cùng một người dùng sẽ bị từ chối ngay lập tức ở tầng cache/gateway mà không cần truy vấn nặng nề vào MongoDB, chống double-vote triệt để.

6. **Bước 6: Giai đoạn AI viết truyện & Xuất bản (AI Writing & Published)**
   * Trên màn hình **Host**, bấm **Close Voting & Start AI Writing**. Giao diện chuyển sang trạng thái chờ AI xử lý.
   * AI Writer (mock job) lấy ý tưởng thắng cuộc, tiến hành sinh văn bản trong 4 giây. AI Structure Manager phân tích cấu trúc trong 2 giây để quyết định nối tiếp vào chương hiện tại hay tạo chương mới trong MongoDB.
   * Kết quả hoàn tất, một đoạn truyện mới tự động xuất hiện ở cột phải **Novel View** của cả 2 màn hình với hiệu ứng mượt mà.
   * Host bấm **Start Next Turn** để tăng số lượt lượt viết (Turn) lên tiếp theo và bắt đầu vòng lặp mới.

---

## 5. Checklist kiểm tra khi Build Production

Trước khi nộp bài, hãy chạy thử quy trình build production để đảm bảo mã nguồn sạch hoàn toàn:
1. Chạy lệnh build:
   ```bash
   pnpm build
   ```
2. Kiểm tra xem thư mục `apps/backend/dist` và `.next` của frontend có được sinh ra thành công mà không có lỗi TypeScript hay linter nào hay không.

---

## 6. Danh sách hình ảnh minh chứng kiểm thử E2E

Các hình ảnh dưới đây đã được lưu trữ trong thư mục dự án tại đường dẫn tương đối `docs/screenshots/`:

1. **Màn hình Host Lobby (`docs/screenshots/host_lobby.png`):** Giao diện Host Demo gia nhập phòng `DEMO99` thấy mã phòng rõ ràng và Host Control Panel xuất hiện.
2. **Màn hình Writer Tham gia (`docs/screenshots/writer_joined.png`):** Writer Demo gia nhập phòng, danh sách online realtime đồng bộ hiển thị 2 người (`2 Active`).
3. **Phê duyệt ý tưởng (`docs/screenshots/submission_approved.png`):** Ý tưởng của Writer gửi lên được AI Lore Checker kiểm duyệt thành công (tích xanh Approved).
4. **Giao diện bình chọn (`docs/screenshots/voting_phase.png`):** Hiển thị danh sách ý tưởng ẩn danh trong phase Voting, đồng thời kiểm thử nút vote bị vô hiệu hóa sau lượt vote đầu tiên (chống double-vote).
5. **AI Xuất bản phân đoạn mới (`docs/screenshots/novel_published.png`):** Đoạn tiểu thuyết hoàn chỉnh sinh ra bởi AI tự động xuất hiện trên Novel View (cột phải) của tất cả người dùng trong phòng viết.

---

## 7. Các điểm lưu ý quan trọng khi nộp bài / Demo

> [!IMPORTANT]
> * **Guest Mode mặc định**: Flow đăng nhập truyền thống (Email/Password) đã được ẩn đi. Người dùng chỉ cần điền tên hiển thị và mã phòng để tham gia nhanh.
> * **Docker Desktop GUI**: Đảm bảo Docker Desktop GUI đã chạy trên máy Windows trước khi chạy các lệnh database.
> * **Redis Lock**: Cơ chế khóa lượt vote sử dụng bộ đếm thời gian thực trên Redis. Trong quá trình demo, nhấn mạnh việc chặn double-vote ở cả frontend (nút bị vô hiệu hóa ngay khi bấm) và backend (Redis Lock từ chối request trùng lặp nhanh chóng) để ghi điểm tối đa về tối ưu hóa hệ thống.
> * **Không cần reload trang**: Toàn bộ luồng chuyển phase, danh sách người dùng, đếm ngược và cập nhật truyện đều chạy realtime qua WebSocket Socket.IO.
