# HƯỚNG DẪN CHẤM BÀI & THÔNG TIN NỘP BÀI (SUBMISSION)

## Đề tài: Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime (Collaborative AI Novel Co-Lab)

> [!IMPORTANT]
> **TÀI LIỆU CHÍNH:** Đây là tài liệu hướng dẫn tổng quan và chấm bài chính dành cho Giảng viên và Ban giám khảo. Mọi thông tin thiết lập nhanh, kịch bản chạy thử, giải trình lý do lựa chọn công nghệ và liên kết tài liệu chi tiết đều được tổng hợp đầy đủ tại đây.

---

## 1. Giới thiệu Dự án & Nghiệp vụ cốt lõi

Dự án **Collaborative AI Novel Co-Lab** là một nền tảng Web cho phép nhiều người dùng đồng sáng tác tiểu thuyết theo thời gian thực (realtime) với sự hỗ trợ của các Agent trí tuệ nhân tạo (AI Agents) kiểm duyệt và sinh văn bản.

### Luồng nghiệp vụ chính:
1. **Lobby (Phòng chờ)**: Nhiều người tham gia phòng viết nhanh bằng Bút danh (Guest Mode) qua mã phòng ngắn (ví dụ: `DEMO99`). 
2. **Submission (Gửi ý tưởng)**: Người viết đóng góp ý tưởng tiếp nối câu chuyện. AI Lore Checker kiểm duyệt ý tưởng realtime dựa trên quy tắc thiết lập trong bối cảnh thế giới (Lorebook).
3. **Voting (Bình chọn)**: Mọi người biểu quyết ẩn danh chọn ý tưởng hay nhất. Hệ thống ngăn chặn việc bình chọn trùng lặp (Double-voting).
4. **AI Writing (Chấp bút)**: AI Writer tiếp nhận ý tưởng thắng cuộc để viết tiếp phân đoạn tiếp theo. AI Structure Manager phân tích ngữ cảnh để quyết định nối tiếp vào chương hiện tại hay tạo chương mới.
5. **Novel View (Xuất bản)**: Phân đoạn truyện mới sinh ra tự động đẩy realtime lên màn hình đọc tiểu thuyết của tất cả mọi người với hiệu ứng nổi bật.

---

## 2. Giải trình Lựa chọn Công nghệ (WebSocket + Redis + MongoDB)

Đề tài sử dụng mô hình kết hợp chặt chẽ 3 công nghệ bổ trợ nhau:

### A. Vì sao dùng WebSocket (Socket.IO)?
* **Đồng bộ hóa tức thời**: Mọi thay đổi về trạng thái phòng viết, danh sách thành viên trực tuyến, kết quả duyệt ý tưởng của AI, số lượt vote, và nội dung truyện xuất bản cần được cập nhật đồng loạt lên màn hình của mọi người mà không yêu cầu reload trang. WebSocket là kênh kết nối hai chiều liên tục đáp ứng hoàn hảo yêu cầu này.

### B. Vì sao dùng Redis?
* **Presence Tracker**: Lưu trữ danh sách Socket Client ID hoạt động dưới dạng Redis Hash (`room:{roomId}:presence`) giúp truy vấn tốc độ cao và khử trùng lặp chính xác khi reload hoặc mở nhiều tab.
* **TTL Timer**: Đồng hồ đếm ngược của phòng viết sử dụng cơ chế thời gian sống (TTL) của Redis (`room:{roomId}:timer`) để đảm bảo thời gian đếm ngược chính xác, nhất quán giữa tất cả client.
* **Atomic Vote Lock**: Ngăn chặn double-vote bằng lệnh nguyên tử `SET room:{roomId}:turn:{turnId}:voted:{userId} "voted" EX 3600 NX`. Lượt vote thứ hai sẽ bị từ chối ngay lập tức tại tầng gateway mà không làm nghẽn MongoDB.
* **BullMQ Queue Coordination**: Làm hạ tầng truyền thông và quản lý hàng đợi cho các background jobs của AI.

### C. Vì sao dùng MongoDB?
* **Lưu trữ dữ liệu bền vững**: MongoDB lưu trữ toàn bộ thông tin lâu dài của hệ thống bao gồm thông tin phòng (`Room`), thành viên (`RoomMember`), thiết lập cốt truyện (`Lorebook`), ý tưởng (`Idea`), phiếu bầu (`Vote`), và các chương truyện bản thảo chính thức (`Chapter`) dưới dạng cấu trúc JSON-like (BSON) linh hoạt và dễ mở rộng.

---

## 3. Hướng dẫn Khởi chạy nhanh (Quick Start)

### Yêu cầu hệ thống:
* **Node.js 18+**, **pnpm 9+** và ứng dụng **Docker Desktop** đã được khởi động.

### Các bước thực hiện:

1. **Cài đặt Dependencies**:
   ```bash
   pnpm install
   ```
2. **Khởi động Cơ sở dữ liệu (Docker)**:
   ```bash
   # Khởi động MongoDB (27017) và Redis (6379)
   docker start local-mongodb local-redis
   ```
   *(Nếu chưa tạo container, chạy `pnpm db:up` hoặc `docker compose up -d`)*
3. **Khởi chạy ứng dụng**:
   ```bash
   # Chạy cả Next.js (Port 3000) và NestJS (Port 3001) đồng thời
   pnpm dev
   ```
4. **Kiểm tra môi trường tự động**:
   ```powershell
   # Chạy script PowerShell kiểm tra cổng kết nối và Docker
   powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1
   ```
   *Yêu cầu:* Tất cả 6 bước kiểm tra phải báo `[PASS]`.
5. **Khởi tạo dữ liệu mẫu (Seed)**:
   ```powershell
   # Gọi API để khởi tạo phòng DEMO99 và nạp sẵn Lorebook, Chương 1
   Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed
   ```

---

## 4. Cấu hình AI Mode (Mock vs Live API)

Dự án hỗ trợ chuyển đổi linh hoạt giữa AI giả lập (Mock) và API thật trong tệp `.env`:
* **Khuyến nghị khi Bảo vệ**: Sử dụng `AI_MODE=mock`. Chế độ này không cần API key, chạy ổn định, nhanh chóng và loại bỏ 100% rủi ro mất mạng hoặc hết quota API giữa buổi demo.
* **Cấu hình AI thật**: Thay đổi `AI_MODE=production` và điền key tương ứng trong `.env`:
  * `AI_LORE_PROVIDER=gemini` (Gemini API Key trong `GEMINI_API_KEY`)
  * `AI_WRITER_PROVIDER=xai` (Grok API Key trong `XAI_API_KEY`)
  * `AI_STRUCTURE_PROVIDER=gemini`
* **Cơ chế Fallback an toàn**: Nếu gọi API thật bị lỗi, quá tải hoặc hết quota, hệ thống tự động chuyển sang dữ liệu giả lập (Mock) khi bật `AI_FALLBACK_TO_MOCK=true`, kèm theo cảnh báo `[AI Fallback]` trên Realtime Log Panel để buổi demo diễn ra thông suốt.

---

## 5. Tài liệu liên quan trong Mã nguồn

Hệ thống tài liệu bổ trợ được chia nhóm rõ ràng:
* **Tài liệu hướng dẫn phát triển và lỗi**:
  * [README.md](README.md): Hướng dẫn phát triển chi tiết, cấu trúc mã nguồn, và giải quyết lỗi thường gặp (Port conflict, Docker npipe).
  * [release-checklist.md](release-checklist.md): Danh mục kiểm tra hạ tầng và kịch bản demo chi tiết cho 2 vai trò Host và Writer.
* **Tài liệu học thuật & Kiến trúc**:
  * [walkthrough.md](walkthrough.md): Đặc tả chi tiết mô hình dữ liệu MongoDB, cấu trúc Redis key, WebSocket events và kiến trúc AI Provider.
  * [bao-cao-demo.md](bao-cao-demo.md): Báo cáo nghiệm thu kết quả kiểm thử thực tế và các lỗi QA đã khắc phục.
* **Phục vụ thuyết trình & Bảo vệ**:
  * [luyen_bao_ve_do_an.md](luyen_bao_ve_do_an.md): Bản ôn luyện bảo vệ cầm tay bằng tiếng Việt, tóm tắt lời mở đầu, demo, kiến trúc và phản biện.
  * [docs/slide-presentation.md](docs/slide-presentation.md): Giáo án 12 slide báo cáo tóm tắt bám sát nội dung đồ án.
  * [docs/demo-script.md](docs/demo-script.md): Kịch bản chi tiết từng bước kèm lời thuyết minh để diễn tập demo.
  * [docs/defense-rehearsal.md](docs/defense-rehearsal.md): Tài liệu luyện bảo vệ gồm lời mở đầu, giải thích kiến trúc và 20 câu hỏi phản biện mẫu.

---

## 6. Danh sách hình ảnh minh chứng kiểm thử

Các hình ảnh chứng thực luồng co-writing thời gian thực được lưu tại `docs/screenshots/`:
1. **Màn hình Host Lobby (`docs/screenshots/host_lobby.png`)**: Host tham gia phòng mẫu `DEMO99` và quản lý phòng.
2. **Đồng bộ hóa thành viên trực tuyến (`docs/screenshots/writer_joined.png`)**: Writers tham gia, danh sách presence cập nhật `2 Active` realtime.
3. **AI kiểm duyệt cốt truyện (`docs/screenshots/submission_approved.png`)**: Ý tưởng gửi lên được AI duyệt approved thành công.
4. **Bình chọn & Chặn bình chọn trùng (`docs/screenshots/voting_phase.png`)**: Phase vote ẩn danh và thử nghiệm Redis Double-vote Lock.
5. **AI sinh truyện & Cập nhật Novel View (`docs/screenshots/novel_published.png`)**: Phân đoạn văn bản mới xuất hiện realtime trên Novel View.
