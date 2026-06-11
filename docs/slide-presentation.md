# SLIDE BÁO CÁO ĐỒ ÁN CÔNG NGHỆ PHẦN MỀM

## Đề tài: Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime (Collaborative AI Novel Co-Lab)
### Công nghệ cốt lõi: NestJS, Next.js, WebSocket, Redis, MongoDB

---

<!-- slide -->

# SLIDE 1: GIỚI THIỆU ĐỀ TÀI & THÀNH VIÊN
## Đề tài: Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime

* **Lĩnh vực ứng dụng**: Giải trí cộng đồng, Sáng tác nội dung số, Game Studio.
* **Ý tưởng cốt lõi**:
  * Chuyển đổi chat truyền thống thành **không gian đồng sáng tác văn học**.
  * Nhiều tác giả (Writers) cùng đề xuất ý tưởng, thảo luận và bỏ phiếu realtime.
  * Tích hợp **Đa tác nhân AI (Multi-Agent)** kiểm duyệt và sinh văn bản tự động.
* **Công nghệ trọng tâm**: 
  * WebSocket (Socket.IO) | Redis & BullMQ | MongoDB (Mongoose).

---

<!-- slide -->

# SLIDE 2: MỤC TIÊU & THÁCH THỨC KỸ THUẬT
## Giải quyết bài toán Realtime hiệu năng cao

* **Mục tiêu dự án**:
  * Xây dựng nền tảng tương tác thời gian thực không độ trễ.
  * Nhất quán trạng thái phòng viết giữa tất cả client khi reload/reconnect.
  * Chạy các tác vụ AI nặng (3-7 giây) ngầm, không gây nghẽn luồng chính.
* **Thách thức kỹ thuật**:
  * **Độ trễ của LLM**: Gọi API AI trực tiếp dễ làm nghẽn HTTP request-response.
  * **Tránh kẹt trạng thái**: Khi người dùng mất mạng đột ngột hoặc reload.
  * **Chặn biểu quyết trùng lặp (Double-voting)**: Đảm bảo tính công bằng.

---

<!-- slide -->

# SLIDE 3: KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)
## Mô hình Monorepo hiệu năng cao

```text
               +--------------------------------------+
               |          Next.js Frontend            |
               | (Rooms UI, Reader, Realtime-Log, UX) |
               +------------------+-------------------+
                                  | WebSocket & HTTP
                                  v
               +--------------------------------------+
               |            NestJS Backend            |
               | (Room Controller, Socket.IO Gateway) |
               +--------+---------+---------+---------+
                         |         |         |
           +-------------+         |         +-------------+
           |                       |                       |
           v                       v                       v
 +-------------------+   +-------------------+   +-------------------+
 |   Redis Cache     |   |   MongoDB Atlas   |   |   BullMQ Queue    |
 | (Presence, Timer, |   | (Persistent Data: |   |  (Async Workers:  |
 |  Vote Lock, Lock) |   |  Users, Chapters) |   |   Lore, Writer)   |
 +-------------------+   +-------------------+   +-------------------+
```

---

<!-- slide -->

# SLIDE 4: VAI TRÒ CỦA WEBSOCKET (SOCKET.IO)
## Cương lĩnh truyền thông thời gian thực không độ trễ

* **Đồng bộ hóa tức thời**:
  * **Room State Broadcast**: Chuyển giao diện cả phòng đồng loạt (Lobby -> Submission -> Voting -> Writing -> Published).
  * **Presence Indicator**: Hiển thị chính xác số người dùng trực tuyến (`2 Active`).
  * **Moderation Feedback**: Hiển thị trạng thái duyệt ý tưởng của AI ngay lập tức.
  * **Vote & Chapter Sync**: Tự động tăng lượt vote và đẩy chương truyện mới lên Novel Reader mà không cần reload trang.

---

<!-- slide -->

# SLIDE 5: VAI TRÒ CỦA REDIS
## Bộ đệm tốc độ cao & Điều phối tác vụ nguyên tử

* **Presence Tracker (`room:{id}:presence`)**:
  * Lưu trữ danh sách Client Socket ID dưới dạng Hash. Khử trùng lặp khi F5.
* **TTL Timer (`room:{id}:timer`)**:
  * Dùng cơ chế TTL tự hủy của Redis làm đồng hồ đếm ngược nhất quán cho cả phòng.
* **Atomic Vote Lock (`room:{id}:turn:{id}:voted:{userId}`)**:
  * Khóa lượt vote bằng lệnh nguyên tử `SET EX NX`.
  * Chặn đứng hành vi double-vote ngay tại Gateway, giảm tải cho Database.
* **BullMQ Gateway**: Điều phối hàng đợi job xử lý AI bất đồng bộ qua Redis.

---

<!-- slide -->

# SLIDE 6: VAI TRÒ CỦA MONGODB
## Cơ sở dữ liệu tài liệu bền vững

* **Room & User Schemas**: Quản lý thông tin phòng, mã phòng ngắn `DEMO99` và phân quyền Host/Writer.
* **Lorebook Schema**: Lưu trữ bối cảnh thế giới cốt truyện (Địa danh, Nhân vật, Quy luật phép thuật) làm tài liệu tham chiếu kiểm duyệt cho AI.
* **Turn & Idea Schemas**: Lưu vết lịch sử của từng lượt viết, lưu trữ các ý tưởng đề xuất và kết quả duyệt logic của AI.
* **Chapter Schema**: Bản thảo tác phẩm chính thức. Hỗ trợ việc ghi tiếp nối văn bản (Append) hoặc tạo chương mới tự động.

---

<!-- slide -->

# SLIDE 7: HỆ THỐNG ĐA TÁC NHÂN AI (MULTI-AGENT PIPELINE)
## Quy trình xử lý bất đồng bộ qua hàng đợi BullMQ

1. **AI Lore Checker (Lore Guard)**:
   * Tiếp nhận ý tưởng đề xuất -> Đối chiếu với bộ quy luật Lorebook từ MongoDB -> Trả về kết quả `Approved` hoặc `Rejected`.
2. **AI Writer (Chấp bút)**:
   * Lấy ý tưởng thắng cuộc -> Đọc ngữ cảnh lịch sử -> Chấp bút viết tiếp văn bản mới.
3. **AI Structure Manager (Cấu trúc chương)**:
   * Phân tích nội dung -> Quyết định ghép nối vào chương hiện tại hay tạo chương mới -> Cập nhật MongoDB và kích hoạt Socket broadcast.

---

<!-- slide -->

# SLIDE 8: CẤU HÌNH AI & CƠ CHẾ FALLBACK AN TOÀN
## Tích hợp đa nhà cung cấp & Đảm bảo demo thông suốt

* **Đa nhà cung cấp AI (Multi-Provider)**:
  * Hỗ trợ đổi linh hoạt trong `.env`: **Google Gemini**, **xAI (Grok)**, **OpenRouter**, **Ollama (Local)**.
  * Từng Agent (Lore, Writer, Structure) có cấu hình provider và model riêng biệt.
* **Cơ chế Fallback an toàn (Safe Fallback to Mock)**:
  * Khi gọi API thật bị lỗi, quá tải hoặc hết hạn quota -> Tự động chuyển sang Mock Provider có sẵn dữ liệu giả lập chất lượng cao.
  * Đẩy cảnh báo `[AI Fallback]` về bảng điều khiển Realtime Log để ban giám khảo theo dõi.
  * Đảm bảo buổi demo **100% không bị đứng** do lỗi nhà mạng hay API key.

---

<!-- slide -->

# SLIDE 9: KỊCH BẢN DEMO THỰC TẾ (DEMO99 SCENARIO)
## Chứng minh hiệu năng Realtime qua 5 bước chính

* **Bước 1: Kết nối**: Mở 2 tab (Host & Writer ẩn danh) vào phòng `DEMO99`. Presence hiện `2 Active`.
* **Bước 2: Gửi ý tưởng**: Host bắt đầu lượt -> Writer nhập ý tưởng -> AI Lore Checker duyệtapproved trong 2 giây (tích xanh hiển thị realtime).
* **Bước 3: Bình chọn**: Chuyển sang Voting -> Writer vote -> Thử click lần 2 -> Toast báo lỗi khóa vote từ **Redis Lock**.
* **Bước 4: Sinh truyện**: Chuyển sang AI Writing -> AI Agent chạy ngầm -> Chapter mới tự động đẩy lên Novel Reader với hiệu ứng viền hồng phát sáng và cuộn mượt.
* **Bước 5: WebSocket Log**: Bật Realtime Log Drawer xem payload JSON của các sự kiện truyền nhận thực tế.

---

<!-- slide -->

# SLIDE 10: CÁC CẢI TIẾN NÂNG CAO UX & TÍNH ỔN ĐỊNH
## Đạt chuẩn chất lượng phần mềm cao cấp

* **WebSocket Status Badge**: badge trạng thái kết nối trên Header, tự động gửi lại sự kiện `join_room` khi reconnect mà không cần F5.
* **Realtime Log Drawer**: Panel gập mở hiển thị trực quan 10 sự kiện truyền/nhận qua Socket.IO gần nhất dưới dạng JSON payload.
* **Giao diện Game Studio**: Phong cách tối (dark mode), CSS glassmorphism mượt mà, micro-interactions sinh động qua Framer Motion.
* **Nút bấm Hồi sinh Lượt**: Nút đỏ `"Gặp lỗi? Bấm để chạy lại AI"` ở panel Host giúp giải quyết tức thì các lỗi treo/timeout từ phía LLM API.

---

<!-- slide -->

# SLIDE 11: TỔNG KẾT & HƯỚNG PHÁT TRIỂN
## Đánh giá kết quả đề tài môn học

* **Kết quả đạt được**:
  * Ứng dụng tích hợp thành công **WebSocket + Redis + MongoDB**.
  * Cấu trúc Monorepo tối ưu, mã nguồn sạch, build pass 100%.
  * Trải nghiệm người dùng tốt, tài liệu hướng dẫn và kịch bản demo hoàn chỉnh.
* **Hướng phát triển tương lai**:
  * Tích hợp SDK Gemini/OpenAI chính thức thay thế cho REST calls.
  * Sử dụng cụm Redis Sentinel/Cluster để mở rộng quy mô phòng viết.
  * Hỗ trợ xuất bản truyện ra định dạng EPUB, PDF chuyên nghiệp.
