# Tài liệu ôn luyện bảo vệ đồ án

## Đề tài

**Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime**  
**Collaborative AI Novel Co-Lab**

Hướng đề tài gốc: **Xây dựng nền tảng chat realtime đa người dùng, kết hợp WebSocket, Redis và MongoDB**.

Tài liệu này là bản cầm tay để luyện nói trước hội đồng. Khi trả lời, hãy luôn kéo nội dung về 4 trụ cột: **WebSocket**, **Redis**, **MongoDB**, **BullMQ/AI Jobs**.

---

## 1. Lời mở đầu thuyết trình 1 phút

Kính thưa thầy cô trong Hội đồng phản biện và các bạn sinh viên,

Nhóm chúng em xin phép trình bày đồ án với đề tài **Nền tảng Đồng sáng tác Tiểu thuyết AI Realtime**.

Đề tài được phát triển từ hướng bài toán gốc là xây dựng một hệ thống chat realtime đa người dùng kết hợp **WebSocket, Redis và MongoDB**. Tuy nhiên, thay vì chỉ dừng lại ở việc gửi tin nhắn thông thường, nhóm chúng em mở rộng nghiệp vụ thành một không gian đồng sáng tác văn học. Trong hệ thống này, nhiều tác giả có thể cùng tham gia một phòng viết, gửi ý tưởng, bình chọn hướng phát triển cốt truyện và sử dụng AI Agent để kiểm duyệt bối cảnh cũng như viết tiếp chương truyện.

Về mặt kỹ thuật, hệ thống tập trung giải quyết bài toán đồng bộ trạng thái thời gian thực giữa nhiều client, xử lý các tác vụ AI nặng mà không làm nghẽn luồng chính, đồng thời đảm bảo dữ liệu được lưu trữ bền vững. Để làm được điều đó, nhóm sử dụng **WebSocket/Socket.IO** cho truyền tin hai chiều tức thời, **Redis** cho presence, timer, lock chống vote trùng và hàng đợi BullMQ, cùng **MongoDB** để lưu trữ phòng, lorebook, ý tưởng, vote, chương truyện và kết quả AI.

Sau đây, nhóm chúng em xin phép đi vào phần demo thực tế với phòng mẫu `DEMO99`.

---

## 2. Kịch bản demo thực tế 5 phút

Nên chia màn hình làm đôi:

- Bên trái: trình duyệt chính, vai trò **Host Demo**.
- Bên phải: tab ẩn danh, vai trò **Writer Demo**.

### Phút 1: Kết nối phòng và presence realtime

**Hành động**

1. Mở `http://localhost:3000` ở hai cửa sổ.
2. Tab trái nhập `Host Demo`, mã phòng `DEMO99`.
3. Tab phải nhập `Writer Demo`, mã phòng `DEMO99`.
4. Quan sát chỉ số online/presence cập nhật ở cả hai tab.

**Lời thuyết minh**

> Như thầy cô đang thấy, em mở hai trình duyệt để giả lập hai người dùng cùng tham gia một phòng viết. Khi Writer join vào phòng, danh sách thành viên online được cập nhật ngay lập tức trên cả hai màn hình. Đây là phần sử dụng Socket.IO để đồng bộ realtime. Trạng thái presence được lưu trong Redis dưới dạng Hash theo key `room:{id}:presence`, giúp hệ thống cập nhật nhanh khi user join, leave hoặc reload tab.

**Điểm nhấn kỹ thuật**

- WebSocket/Socket.IO broadcast sự kiện `room_presence`.
- Redis lưu dữ liệu online ngắn hạn, thay đổi liên tục.
- Không cần reload trang.

### Phút 2: Host bắt đầu turn và Writer gửi ý tưởng

**Hành động**

1. Host bấm **Start Co-creation Round**.
2. Writer nhập ý tưởng, ví dụ: `Nhóm thám hiểm tìm thấy một phi thuyền cổ đại dưới lòng đất`.
3. Writer bấm gửi.
4. Quan sát trạng thái AI Lore Checker.

**Lời thuyết minh**

> Host bắt đầu lượt viết mới, cả hai client chuyển sang phase Submission cùng lúc. Writer gửi ý tưởng, ý tưởng này được lưu vào MongoDB và đưa vào hàng đợi BullMQ chạy trên Redis. AI Lore Checker sẽ đối chiếu ý tưởng với Lorebook để xem có vi phạm bối cảnh truyện hay không. Kết quả approved hoặc rejected được đẩy realtime về các client thông qua WebSocket.

**Điểm nhấn kỹ thuật**

- Room state chuyển realtime bằng Socket.IO.
- BullMQ xử lý AI bất đồng bộ.
- Lorebook và idea lưu trong MongoDB.
- Redis giúp queue không block luồng chính.

### Phút 3: Voting và Redis double-vote lock

**Hành động**

1. Host bấm **Close Submission & Start Voting**.
2. Writer vote một ý tưởng.
3. Writer cố tình bấm vote lần hai.
4. Quan sát toast/badge báo lỗi Redis Lock.

**Lời thuyết minh**

> Ở phase Voting, các ý tưởng được đưa ra để bình chọn ẩn danh. Khi Writer vote lần đầu, backend ghi nhận thành công. Nhưng khi cố tình vote lần hai, hệ thống chặn ngay bằng Redis atomic lock. Cụ thể, backend tạo key theo `roomId`, `turnId` và `userId`, dùng cơ chế `SET EX NX`. Nếu key đã tồn tại, hệ thống biết user đã vote và từ chối request trước khi ghi xuống MongoDB.

**Điểm nhấn kỹ thuật**

- Redis lock chống double-vote.
- Thao tác nguyên tử giúp tránh race condition.
- MongoDB vẫn là nơi lưu vote bền vững.

### Phút 4: AI Writing và publish chapter

**Hành động**

1. Host bấm **Close Voting & Start AI Writing**.
2. Quan sát AI stage timeline.
3. Chờ hệ thống publish chương mới lên Novel View.

**Lời thuyết minh**

> Khi voting kết thúc, AI Writer lấy ý tưởng thắng cuộc, đọc bối cảnh chương trước và viết tiếp đoạn truyện. Sau đó AI Structure Manager quyết định đoạn mới nên nối vào chương hiện tại hay tạo chương mới. Kết quả cuối cùng được lưu vào MongoDB và phát sự kiện `chapter_published` qua WebSocket để Novel View cập nhật tức thời ở tất cả client.

**Điểm nhấn kỹ thuật**

- AI job chạy trong BullMQ.
- Kết quả chapter lưu MongoDB.
- WebSocket phát `chapter_published`.
- Frontend highlight đoạn mới và auto-scroll.

### Phút 5: Realtime Log Drawer

**Hành động**

1. Host mở **Realtime Log**.
2. Chỉ các event như `room_presence`, `turn_started`, `idea_moderated`, `vote_update`, `ai_stage_update`, `chapter_published`.

**Lời thuyết minh**

> Để chứng minh hệ thống realtime thật, nhóm có Realtime Log Drawer hiển thị các event WebSocket gần nhất cùng payload. Nhờ đó, hội đồng có thể thấy rõ dữ liệu không phải được reload thủ công mà được server đẩy xuống client theo thời gian thực.

---

## 3. Giải thích kiến trúc hệ thống 3 phút

### 3.1. Lớp WebSocket: Socket.IO Gateway

Lớp này là kênh giao tiếp hai chiều giữa frontend và backend. Backend dùng Socket.IO Gateway để broadcast trạng thái đến toàn bộ client trong cùng room.

Các event tiêu biểu:

- `room_presence`: cập nhật user online.
- `timer_update`: cập nhật countdown.
- `turn_started`: bắt đầu lượt viết.
- `idea_submitted`: có ý tưởng mới.
- `idea_moderated`: AI duyệt ý tưởng.
- `vote_update`: cập nhật vote.
- `ai_stage_update`: cập nhật tiến trình AI.
- `chapter_published`: xuất bản chương mới.

WebSocket phù hợp vì server cần chủ động đẩy dữ liệu tới client, thay vì để client polling liên tục bằng HTTP.

### 3.2. Lớp Redis và BullMQ

Redis xử lý dữ liệu nóng, thay đổi nhanh và cần thao tác nguyên tử.

Các vai trò chính:

- **Presence Tracker**: `room:{id}:presence`.
- **TTL Timer**: `room:{id}:timer`.
- **Atomic Vote Lock**: `room:{id}:turn:{id}:voted:{userId}`.
- **BullMQ Queue**: xử lý AI jobs như lore-check, writer, structure.

BullMQ giúp tách tác vụ AI nặng ra khỏi luồng chính của NestJS. Nhờ đó, trong lúc AI xử lý 3-8 giây, server vẫn tiếp tục phục vụ WebSocket và HTTP request khác.

### 3.3. Lớp MongoDB và Mongoose

MongoDB là nguồn lưu trữ bền vững của hệ thống.

Các collection chính:

- `users`
- `rooms`
- `room_members`
- `lorebooks`
- `turns`
- `ideas`
- `votes`
- `chapters`
- `ai_outputs`

MongoDB phù hợp vì dữ liệu truyện, lorebook, chapter và AI output đều có cấu trúc document linh hoạt, độ dài biến động và dễ mở rộng.

### 3.4. Lớp AI Provider

Hệ thống hỗ trợ nhiều provider:

- Mock Provider.
- Google Gemini.
- xAI/Grok.
- OpenRouter.
- Ollama local.

Nếu API thật lỗi, thiếu key hoặc hết quota, `AiService` tự fallback sang Mock Provider khi `AI_FALLBACK_TO_MOCK=true`. Đây là cơ chế quan trọng giúp demo không bị gián đoạn.

---

## 4. Bốn trụ cột kỹ thuật cần nhớ

### 4.1. WebSocket

WebSocket giải quyết bài toán truyền tin hai chiều tức thời:

- Presence realtime.
- State transition.
- Vote sync.
- AI stage update.
- Publish chapter.

Không dùng HTTP polling vì polling tốn request, có độ trễ và không phù hợp khi nhiều người cùng tương tác.

### 4.2. Redis

Redis dùng cho tốc độ và tính nguyên tử:

- Presence Tracker: lưu session/socket online.
- TTL Timer: đồng bộ countdown.
- Atomic Vote Lock: chống double-vote.
- BullMQ backend: queue cho AI jobs.

Câu cần nhớ:

> Redis trong hệ thống không thay thế MongoDB, mà xử lý các trạng thái nóng, ngắn hạn và cần tốc độ cao.

### 4.3. MongoDB

MongoDB lưu dữ liệu bền vững:

- Room.
- User.
- Lorebook.
- Idea.
- Vote.
- Chapter.
- AI output.

Câu cần nhớ:

> MongoDB là single source of truth cho dữ liệu nghiệp vụ dài hạn, còn Redis là lớp realtime/cache/lock tốc độ cao.

### 4.4. BullMQ

BullMQ giúp xử lý AI bất đồng bộ:

- Lore Checker.
- Writer.
- Structure Manager.

Câu cần nhớ:

> Nếu gọi AI trực tiếp trong HTTP request hoặc socket handler, backend dễ bị nghẽn. BullMQ đưa AI sang background job để server vẫn realtime mượt.

---

## 5. Cơ chế xử lý lỗi AI

### Safe Fallback to Mock

Khi provider thật như Gemini, Grok, OpenRouter hoặc Ollama bị lỗi mạng, thiếu API key, timeout hoặc hết quota, `AiService` sẽ:

1. Bắt exception.
2. Ghi log `[AI Fallback]`.
3. Phát event `ai_stage_update` về frontend.
4. Chuyển sang MockProvider.
5. Tiếp tục publish kết quả để demo không bị đứng.

### Force Retry Button

Nếu Host thấy AI bị nghẽn hoặc turn không tiến triển, có thể dùng nút retry để đẩy lại job AI vào BullMQ. Tính năng này giúp hệ thống có khả năng tự phục hồi trong demo.

---

## 6. Hai mươi câu hỏi phản biện và câu trả lời mẫu

### Câu 1. Vì sao dùng WebSocket thay vì HTTP Polling?

HTTP Polling bắt client gửi request liên tục, gây lãng phí băng thông và có độ trễ. WebSocket giữ kết nối hai chiều liên tục, cho phép server chủ động đẩy event như vote update, presence và chapter published xuống client ngay lập tức.

### Câu 2. Vì sao dùng Socket.IO thay vì WebSocket thuần?

Socket.IO hỗ trợ room, event-based API, reconnect và fallback tốt hơn. Với bài toán nhiều phòng realtime, Socket.IO giúp quản lý room và broadcast rõ ràng hơn WebSocket thuần.

### Câu 3. Vì sao dùng MongoDB thay vì MySQL/PostgreSQL?

Dữ liệu chính của dự án là lorebook, chapter, prompt và AI output. Đây là dữ liệu document có cấu trúc linh hoạt, độ dài thay đổi và dễ mở rộng. MongoDB phù hợp hơn vì không cần ép dữ liệu sáng tác vào nhiều bảng quan hệ cứng.

### Câu 4. Vì sao presence lưu trong Redis mà không lưu MongoDB?

Presence thay đổi liên tục khi user join, leave, reload hoặc mất mạng. Nếu ghi liên tục vào MongoDB sẽ tốn I/O và không cần thiết. Redis chạy trên RAM, rất phù hợp để lưu trạng thái online ngắn hạn.

### Câu 5. Redis double-vote lock hoạt động thế nào?

Khi user vote, backend tạo key `room:{roomId}:turn:{turnId}:voted:{userId}` trong Redis bằng lệnh kiểu `SET EX NX`. Nếu key chưa tồn tại, vote được chấp nhận. Nếu key đã tồn tại, Redis trả về thất bại và backend chặn lượt vote trùng.

### Câu 6. Vì sao không chỉ dùng unique index MongoDB để chặn double-vote?

Unique index vẫn hữu ích ở tầng database, nhưng Redis lock chặn request sớm hơn ở RAM trước khi chạm vào MongoDB. Điều này giảm tải database và phản hồi nhanh hơn khi user spam click hoặc nhiều user vote cùng lúc.

### Câu 7. Timer hoạt động thế nào?

Khi bắt đầu phase, backend tạo timer trong Redis với TTL. Backend đọc thời gian còn lại và phát `timer_update` qua WebSocket. Vì timer dựa trên Redis TTL, client reload vẫn lấy được thời gian còn lại nhất quán.

### Câu 8. Nếu client mất mạng đột ngột thì presence dọn thế nào?

Socket.IO có cơ chế heartbeat. Khi socket disconnect, Gateway bắt event `disconnect`, tìm room/user tương ứng và xóa socket khỏi Redis presence. Sau đó server broadcast danh sách online mới.

### Câu 9. BullMQ dùng để làm gì?

BullMQ dùng để đưa các tác vụ AI nặng vào background jobs. Nhờ vậy, NestJS không bị block trong lúc gọi AI và các kết nối realtime vẫn hoạt động mượt.

### Câu 10. Nếu AI API lỗi thì sao?

Hệ thống có `AI_FALLBACK_TO_MOCK=true`. Khi provider thật lỗi hoặc timeout, `AiService` fallback sang MockProvider, log `[AI Fallback]` và vẫn tiếp tục luồng demo.

### Câu 11. Ba AI Agent có vai trò gì?

AI Lore Checker kiểm tra ý tưởng với Lorebook. AI Writer viết tiếp đoạn truyện từ ý tưởng thắng vote. AI Structure Manager quyết định nối vào chương hiện tại hay tạo chương mới.

### Câu 12. Vì sao dùng Guest Mode?

Guest Mode giảm ma sát khi demo và phù hợp với phòng sáng tác nhanh. Người dùng chỉ cần tên hiển thị và mã phòng. Backend vẫn định danh bằng `userId`, nên vote và phân quyền vẫn kiểm soát được.

### Câu 13. Host và Writer khác nhau thế nào?

Host có quyền bắt đầu turn, đóng phase, kích hoạt AI writing và retry khi lỗi. Writer chủ yếu gửi ý tưởng và vote. Backend kiểm tra quyền dựa trên `hostId` của room, không chỉ dựa vào việc frontend ẩn nút.

### Câu 14. Nếu hai người trùng tên hiển thị thì sao?

Tên chỉ dùng để hiển thị. Hệ thống định danh bằng `userId` từ MongoDB, nên dù trùng tên vẫn phân biệt được idea, vote và socket session.

### Câu 15. Hệ thống scale nhiều backend instance thế nào?

Khi scale ngang, có thể dùng `@socket.io/redis-adapter`. Adapter này dùng Redis Pub/Sub để đồng bộ event giữa nhiều backend instance, giúp client ở instance khác nhau vẫn nhận được broadcast.

### Câu 16. Redis và MongoDB nhất quán thế nào?

MongoDB là nguồn dữ liệu bền vững. Redis lưu trạng thái tạm như presence, timer, lock và queue. Khi có dữ liệu cần lưu lâu dài như idea, vote, chapter, hệ thống ghi vào MongoDB.

### Câu 17. Novel View tránh duplicate chapter thế nào?

Khi nhận `chapter_published`, frontend kiểm tra `_id` của chapter. Nếu chapter đã tồn tại, nó cập nhật nội dung cũ. Nếu chưa tồn tại, nó thêm mới. Nhờ vậy khi AI append vào chương cũ, UI không bị lặp chương.

### Câu 18. Làm sao UX không khiến user nghĩ AI bị treo?

Frontend có phase stepper, AI stage update, toast, loading state và realtime log. Người dùng thấy rõ hệ thống đang lore checking, writing, structuring hay publishing.

### Câu 19. Dự án khác gì chat realtime bình thường?

Chat realtime chỉ gửi tin nhắn. Dự án này có turn engine, vote ẩn danh, Redis lock, BullMQ AI pipeline, Lorebook, Novel View và publish chapter realtime. Nghiệp vụ phức tạp hơn và thể hiện rõ hơn vai trò WebSocket/Redis/MongoDB.

### Câu 20. Hướng phát triển tiếp theo là gì?

Có thể thêm xác thực người dùng thật, Redis adapter để scale nhiều instance, RAG cho lorebook lớn, xuất EPUB/PDF, dashboard admin, billing token AI và test e2e tự động.

---

## 7. Câu trả lời nhanh khi bị hỏi khó

### Nếu hỏi: "AI thật có chạy không?"

Có. Hệ thống đã có kiến trúc provider cho Gemini, xAI/Grok, OpenRouter và Ollama. Tuy nhiên khi bảo vệ nên dùng `AI_MODE=mock` để tránh phụ thuộc mạng/quota. Nếu có API key hợp lệ, chỉ cần cấu hình `.env` là gọi được provider thật.

### Nếu hỏi: "Redis mất thì hệ thống thế nào?"

Redis là thành phần quan trọng cho presence, timer, lock và BullMQ. Nếu Redis mất, realtime coordination sẽ suy giảm. Trong production cần health check, retry và Redis managed/cluster.

### Nếu hỏi: "MongoDB mất thì sao?"

MongoDB là nơi lưu dữ liệu bền vững. Nếu MongoDB mất kết nối, hệ thống không thể lưu room, idea, vote hoặc chapter. Vì vậy demo có script `check-demo-env.ps1` để kiểm tra trước khi chạy.

### Nếu hỏi: "Bảo mật đã đủ production chưa?"

Bản đồ án tập trung vào realtime architecture. Guest Mode phù hợp demo nhưng production cần thêm đăng nhập thật, rate limit, DTO validation, audit log và phân quyền chặt hơn.

### Nếu hỏi: "Tại sao không dùng PostgreSQL?"

Đề tài yêu cầu MongoDB, Redis và WebSocket. Ngoài ra dữ liệu truyện, lorebook và AI output là document linh hoạt, nên MongoDB phù hợp. Nếu mở rộng phần billing giao dịch phức tạp, có thể bổ sung PostgreSQL sau.

---

## 8. Checklist trước khi vào phòng bảo vệ

- [ ] Mở Docker Desktop.
- [ ] Chạy `pnpm db:up` hoặc đảm bảo `local-mongodb`, `local-redis` đang chạy.
- [ ] Đặt `.env` về `AI_MODE=mock` nếu muốn demo ổn định.
- [ ] Chạy `pnpm dev`.
- [ ] Chạy `powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1`.
- [ ] Seed phòng `DEMO99`.
- [ ] Mở sẵn hai tab Host/Writer.
- [ ] Mở sẵn `docs/slide-presentation.md`.
- [ ] Mở sẵn `docs/demo-script.md`.
- [ ] Mở sẵn file này để ôn câu hỏi phản biện.

---

## 9. Công thức trả lời mọi câu hỏi

Khi hội đồng hỏi, trả lời theo 3 bước:

1. **Nêu vai trò kỹ thuật**: công nghệ đó làm gì.
2. **Gắn với demo**: nó xuất hiện ở bước nào trong `DEMO99`.
3. **Nêu lợi ích**: realtime hơn, nhanh hơn, bền vững hơn hoặc an toàn hơn.

Ví dụ:

> Redis trong dự án dùng cho trạng thái nóng như presence, timer và vote lock. Khi em demo double-vote, Redis chặn lượt vote thứ hai bằng atomic lock trước khi ghi xuống MongoDB. Nhờ vậy hệ thống phản hồi nhanh và tránh gian lận khi nhiều người vote cùng lúc.
