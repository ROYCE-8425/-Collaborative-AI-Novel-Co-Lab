# KỊCH BẢN DEMO THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN

## Đề tài: Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime
### Phục vụ buổi báo cáo trước Hội đồng (Thời gian đề xuất: 5 - 7 phút)

---

## 1. Công tác Chuẩn bị (Trước giờ bảo vệ)

1. Mở sẵn **Docker Desktop** trên máy tính.
2. Mở terminal tại thư mục gốc, khởi động cơ sở dữ liệu:
   ```bash
   docker start local-mongodb local-redis
   ```
3. Khởi động ứng dụng phát triển:
   ```bash
   pnpm dev
   ```
4. Kiểm tra độ sẵn sàng của hệ thống bằng script tự động:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1
   ```
   *(Xác nhận tất cả đều báo `[PASS]`)*
5. Thực hiện Seed dữ liệu mẫu phòng `DEMO99`:
   ```powershell
   Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed
   ```
6. Mở **2 cửa sổ trình duyệt** cạnh nhau:
   * **Cửa sổ bên trái (Trình duyệt chính)**: Mở `http://localhost:3000`. Nhập tên hiển thị: `Host Demo`, nhập mã phòng `DEMO99`, bấm **Tham Gia Phòng**.
   * **Cửa sổ bên phải (Tab ẩn danh)**: Mở `http://localhost:3000`. Nhập tên hiển thị: `Writer Demo`, nhập mã phòng `DEMO99`, bấm **Tham Gia Phòng**.

---

## 2. Kịch bản Thuyết minh từng bước (Demo Script)

### Bước 1: Giới thiệu giao diện & Cơ chế Presence
* **Hành động**: Chỉ chuột vào header có hiển thị số lượng thành viên trực tuyến (`2 Online` hoặc `2 Active`) ở cả hai màn hình. Di chuột vào icon để hiện tên của `Host Demo` và `Writer Demo`.
* **Lời thuyết minh**: 
  > *"Kính thưa thầy cô và các bạn, đây là giao diện Workspace của phòng sáng tác mã số `DEMO99`. Màn hình bên trái của em là tài khoản của Host điều phối lượt viết, màn hình bên phải là tài khoản ẩn danh giả lập của một nhà văn (Writer). 
  > Hệ thống sử dụng **WebSocket (Socket.IO)** để đồng bộ hóa trạng thái hiện diện thời gian thực. Mỗi khi thành viên join hoặc rời phòng, sự hiện diện sẽ được cập nhật ngay lập tức mà không cần tải lại trang. Các thông tin session online này được lưu trữ tối ưu dưới dạng Hash trong **Redis** (`room:{id}:presence`)."*

### Bước 2: Bắt đầu lượt viết đầu tiên & Đóng góp ý tưởng (Submission Phase)
* **Hành động**: 
  * Trên tab **Host (trái)**, bấm nút **Bắt đầu lượt viết đầu tiên**.
  * Trên tab **Writer (phải)**, nhập ý tưởng: *"Nhom tham hiem tim thay mot thiet bi phat song la duoi long dat co dai."* và bấm **Gửi**.
* **Lời thuyết minh**:
  > *"Bây giờ, Host sẽ bắt đầu lượt viết mới. Cả hai giao diện lập tức chuyển sang phase **Submission (Gửi ý tưởng)** kèm theo đồng hồ đếm ngược được đồng bộ từ Redis TTL. 
  > Writer bên phải tiến hành nhập ý tưởng tiếp nối cho chương truyện. Khi bấm gửi, ý tưởng được đưa vào hàng đợi xử lý bất đồng bộ qua **BullMQ (Redis-backend)**. 
  > AI Lore Checker (Gemini API) lập tức được gọi để đối chiếu ý tưởng này với bộ quy luật bối cảnh thế giới trong **Lorebook** lưu trữ tại **MongoDB**. Ý tưởng hợp lệ sẽ được chuyển sang trạng thái tích xanh Approved và phát trực tiếp lên màn hình của Host thông qua WebSocket."*

### Bước 3: Bình chọn ý tưởng & Kiểm chứng Redis Lock (Voting Phase)
* **Hành động**:
  * Trên tab **Host (trái)**, bấm nút **Đóng đóng góp & Bắt đầu bình chọn**. Giao diện 2 tab lập tức chuyển sang phase **Voting**.
  * Trên tab **Writer (phải)**, bấm chọn **Vote** cho ý tưởng vừa duyệt. Hệ thống báo vote thành công.
  * Trên tab **Writer (phải)**, cố tình click nút **Vote** lần thứ hai.
* **Lời thuyết minh**:
  > *"Host tiến hành kết thúc nhận ý tưởng để chuyển sang phase **Voting (Bỏ phiếu)**. Ở giai đoạn này, tên của tác giả đề xuất được ẩn danh hoàn toàn để đảm bảo công bằng.
  > Để ngăn chặn gian lận bỏ phiếu trùng lặp, hệ thống sử dụng lệnh nguyên tử của **Redis** `SET EX NX` làm phân phối khóa (Vote Lock) theo cặp `userId` và `turnId`. 
  > Khi em cố tình biểu quyết lần thứ hai, hệ thống lập tức chặn yêu cầu ở ngay tầng gateway/cache của Redis và trả về thông báo lỗi màu đỏ: `[Redis Lock] Phát hiện double-vote!` mà không cần truy vấn ghi vào MongoDB, giúp tối ưu hóa hiệu năng cao."*

### Bước 4: AI chấp bút & Xuất bản chapter mới (AI Writing & Novel View)
* **Hành động**:
  * Trên tab **Host (trái)**, bấm nút **Đóng bình chọn & Bắt đầu AI Chấp Bút**.
  * Quan sát timeline tiến trình đa tác nhân AI đang chạy tuần tự trên giao diện. Sau khoảng 4-5 giây, Novel View bên phải tự động cuộn mượt xuống và chương truyện mới xuất bản xuất hiện với hiệu ứng viền hồng phát sáng trong 5 giây.
* **Lời thuyết minh**:
  > *"Sau khi chốt kết quả bỏ phiếu, Host đóng bình chọn để chuyển sang phase **AI Chấp Bút**. Lúc này, một AI Writer Agent (Grok/Gemini API) sẽ lấy ý tưởng thắng cuộc, đọc ngữ cảnh lịch sử các chương trước để viết tiếp phân đoạn văn mới. 
  > Tiếp theo, AI Structure Manager phân tích cấu trúc đoạn văn mới để quyết định ghép nối vào chương hiện tại hay tạo chương mới trong **MongoDB**. 
  > Khi hoàn tất, sự kiện `chapter_published` được phát qua WebSocket giúp đồng bộ trực tiếp nội dung tác phẩm lên màn hình đọc tiểu thuyết (Novel View) kèm hiệu ứng cuộn mượt và highlight phát sáng viền hồng trong 5 giây để gây ấn tượng thị giác cho độc giả."*

### Bước 5: Kiểm chứng bằng Realtime Log Drawer
* **Hành động**: Bấm nút **Realtime Log** ở góc phải Header trên màn hình Host. Mở rộng xem một vài event logs dạng JSON payload.
* **Lời thuyết minh**:
  > *"Để chứng minh rõ nét nhất cơ chế hoạt động của toàn bộ luồng truyền tải dữ liệu thời gian thực, tụi em đã tích hợp bảng điều khiển **Realtime WebSocket Log** ở thanh trượt bên trái. 
  > Tại đây, thầy cô có thể quan sát trực tiếp cấu trúc JSON payload của các sự kiện WebSocket vừa truyền và nhận trong phòng viết như `turn_started`, `idea_submitted`, `vote_update` và `chapter_published`. 
  > Bảng này giúp cho việc debug và kiểm định trực quan ngay trên trình duyệt trở nên cực kỳ rõ ràng."*

### Bước 6: Tổng kết
* **Lời thuyết minh**:
  > *"Tóm lại, thông qua đề tài này, nhóm em đã giải quyết thành công bài toán realtime hiệu năng cao bằng cách kết hợp: **WebSocket (Socket.IO)** truyền tin không độ trễ, **Redis** lưu trữ presence và timer TTL siêu tốc cùng khóa nguyên tử chặn biểu quyết trùng lặp, và **MongoDB** lưu trữ cấu trúc dữ liệu tài liệu cốt truyện bền vững. 
  > Em xin cảm ơn thầy cô đã lắng nghe và rất mong nhận được câu hỏi từ phía Hội đồng!"*
