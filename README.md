# Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime (Collaborative AI Novel Co-Lab)

> [!IMPORTANT]
> **TÀI LIỆU NỘP BÀI CHÍNH:** Hướng dẫn chấm bài nhanh, giải trình lựa chọn công nghệ, kịch bản chạy thử nghiệm E2E và danh sách ảnh minh chứng nằm tại tệp tin **[SUBMISSION.md](SUBMISSION.md)**.
> * **Link chạy thử trực tiếp (Online Demo):** [http://trannhuy.online](http://trannhuy.online)
> * **Mã phòng mẫu:** **`DEMO99`**

Dự án này là đồ án môn học Công nghệ Phần mềm được xây dựng theo mô hình **ứng dụng thời gian thực đa người dùng kết hợp WebSocket, Redis và MongoDB**. Hệ thống mở rộng bài toán chat realtime thành quy trình sáng tác tiểu thuyết cộng đồng chuyên nghiệp, trong đó AI đóng vai trò kiểm duyệt và viết nối tiếp mạch truyện.

---

## 1. Quick Start (Chạy nhanh trong 3 bước)

Đảm bảo bạn đã mở **Docker Desktop** trên Windows trước khi thực hiện:

### Bước 1: Cài đặt thư viện
```bash
pnpm install
```

### Bước 2: Bật Cơ sở dữ liệu (Docker)
```bash
# Khởi động MongoDB và Redis
docker start local-mongodb local-redis
```
*(Nếu là lần đầu chạy và chưa tạo container, hãy dùng lệnh: `pnpm db:up` hoặc `docker compose up -d`)*

### Bước 3: Chạy Development Server
```bash
pnpm dev
```
Sau khi khởi chạy thành công:
* **Frontend Next.js**: `http://localhost:3000`
* **Backend NestJS**: `http://localhost:3001`

---

## 2. Kiểm tra Môi trường và Seed Dữ liệu

### A. Kiểm tra môi trường tự động
Để chắc chắn các cổng kết nối và Docker container đã sẵn sàng, hãy mở cửa sổ PowerShell (quyền thường) và chạy script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1
```
Tất cả các bước kiểm tra (Docker, ports, backend, frontend) cần hiển thị trạng thái `[PASS]`.

### B. Khởi tạo phòng mẫu DEMO99
Sau khi backend NestJS khởi động xong, chạy lệnh seed để tự động tạo phòng bối cảnh mẫu:
* **Trên Windows PowerShell:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed
  ```
* **Trên Git Bash / Linux / macOS:**
  ```bash
  curl -X POST http://localhost:3001/api/rooms/seed
  ```
Người dùng đầu tiên tham gia phòng `DEMO99` sẽ được tự động trao quyền **Host** để quản lý tiến trình.

---

## 3. Cấu hình AI Provider & Fallback an toàn (Phase 4)

Hệ thống cho phép cấu hình kết nối trực tiếp đến các API AI lớn hoặc chạy mô hình cục bộ qua các biến môi trường trong tệp `.env`:

* **AI_MODE**: 
  - `mock` (Khuyến nghị khi bảo vệ đồ án để tránh sự cố mạng/quá hạn quota).
  - `production` (Để gọi API thật).
* **Cấu hình nhà cung cấp cho từng Agent**:
  - `AI_LORE_PROVIDER=gemini` (Gemini API Key trong `GEMINI_API_KEY`, mặc định model: `gemini-2.5-flash-lite`)
  - `AI_WRITER_PROVIDER=xai` (Grok API Key trong `XAI_API_KEY`, mặc định model: `grok-beta`)
  - `AI_STRUCTURE_PROVIDER=gemini`
* **OpenRouter**:
  - `AI_WRITER_PROVIDER=openrouter` (OpenRouter API Key trong `OPENROUTER_API_KEY`)
* **Ollama (Local)**:
  - `AI_WRITER_PROVIDER=ollama` (Endpoint: `OLLAMA_BASE_URL=http://localhost:11434`)
* **Mock Fallback**:
  - Khi bật `AI_FALLBACK_TO_MOCK=true`, bất kỳ lỗi API key, hết hạn quota hoặc timeout nào từ AI thật sẽ tự động được chuyển đổi sang mock tương ứng kèm log `[AI Fallback]` trên Realtime Log Panel để giữ buổi demo hoạt động liên tục.

---

## 4. Xử lý sự cố thường gặp (Troubleshooting)

### A. Lỗi Docker npipe ("failed to connect to the docker API")
* **Triệu chứng**: Gặp lỗi không thể kết nối tới docker daemon khi chạy container.
* **Khắc phục**: Mở ứng dụng GUI **Docker Desktop** trên Windows trước khi chạy lệnh console. Nếu WSL bị đơ, chạy `wsl --shutdown` trong PowerShell rồi mở lại Docker Desktop.

### B. Lỗi ECONNREFUSED ::1:6379 hoặc 127.0.0.1:27017
* **Triệu chứng**: Backend NestJS báo lỗi mất kết nối đến database/cache.
* **Khắc phục**: Đảm bảo các container Docker đang hoạt động bằng lệnh `docker ps`. Nếu chúng đang tắt, khởi động lại bằng lệnh:
  ```bash
  docker start local-mongodb local-redis
  ```

### C. Lỗi chiếm dụng cổng (Port 3000/3001)
* **Triệu chứng**: Next.js hoặc NestJS báo lỗi `EADDRINUSE` cổng đã được sử dụng.
* **Khắc phục**: Chạy lệnh PowerShell sau để giải phóng ngay lập tức các cổng bị treo:
  ```powershell
  Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

### D. Lỗi API Key AI hoặc hết quota
* **Triệu chứng**: Quá trình AI viết truyện bị kẹt lâu hoặc vấp lỗi.
* **Khắc phục**: Kích hoạt `AI_FALLBACK_TO_MOCK=true` và đặt `AI_MODE=mock` trong `.env` để chạy mượt mà bằng dữ liệu giả lập chất lượng cao. Nếu Host bị kẹt trạng thái AI, bấm nút màu đỏ `"Gặp lỗi? Bấm để chạy lại AI"` ở panel Host để tái khởi động lượt viết.

---

## 5. Tài liệu liên quan

* [SUBMISSION.md](SUBMISSION.md): Tài liệu nộp bài chính, giải trình công nghệ và ảnh minh chứng.
* [luyen_bao_ve_do_an.md](luyen_bao_ve_do_an.md): Bản ôn luyện bảo vệ cầm tay, gồm lời mở đầu, kịch bản demo, kiến trúc và câu hỏi phản biện.
* [docs/demo-script.md](docs/demo-script.md): Kịch bản thuyết minh chi tiết từng bước cho buổi bảo vệ đồ án.
* [docs/slide-presentation.md](docs/slide-presentation.md): Bộ 12 slides báo cáo tóm tắt cấu trúc đề tài.
* [docs/defense-rehearsal.md](docs/defense-rehearsal.md): Bộ luyện bảo vệ gồm lời mở đầu, demo 5 phút, kiến trúc 3 phút và 20 câu hỏi phản biện.
* [walkthrough.md](walkthrough.md): Đặc tả chi tiết các models, cấu trúc Redis, sự kiện WebSocket và kiến trúc AI Provider.
* [bao-cao-demo.md](bao-cao-demo.md): Báo cáo nghiệm thu kết quả QA và E2E test.
