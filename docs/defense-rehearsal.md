# Luyện bảo vệ đồ án: Collaborative AI Novel Realtime

Tài liệu này dùng để luyện nói trước hội đồng. Mục tiêu là trả lời ngắn gọn, chắc kỹ thuật, tránh lan man và luôn kéo câu trả lời về ba công nghệ lõi của đề tài: **WebSocket, Redis, MongoDB**.

---

## 1. Lời mở đầu 1 phút

Kính thưa thầy cô, em xin trình bày đồ án **Nền tảng đồng sáng tác tiểu thuyết AI realtime**. Đề tài gốc của em là xây dựng nền tảng chat realtime đa người dùng kết hợp **WebSocket, Redis và MongoDB**. Từ yêu cầu đó, em mở rộng thành một phòng sáng tác truyện thời gian thực, nơi nhiều người dùng có thể tham gia bằng Guest Mode, gửi ý tưởng, bình chọn ẩn danh và để AI viết tiếp nội dung truyện.

Điểm chính của hệ thống là mọi thay đổi đều được đồng bộ realtime: người dùng join phòng, trạng thái online, chuyển phase, gửi ý tưởng, vote và xuất bản chương mới. **WebSocket** đảm nhiệm đồng bộ tức thời giữa các trình duyệt. **Redis** xử lý presence, timer, hàng đợi BullMQ và khóa chống vote trùng. **MongoDB** lưu dữ liệu bền vững như phòng, lorebook, ý tưởng, vote, chương truyện và kết quả AI.

Trong phần demo, em sẽ dùng phòng mẫu `DEMO99` để minh họa luồng Host và Writer cùng tương tác trong một phòng viết.

---

## 2. Kịch bản demo 5 phút

### Phút 0: Chuẩn bị

Em đã mở sẵn Docker, backend NestJS, frontend Next.js và seed phòng mẫu `DEMO99`. Cấu hình AI khuyến nghị khi bảo vệ là `AI_MODE=mock` để demo ổn định, còn hệ thống vẫn hỗ trợ Gemini, xAI/Grok, OpenRouter và Ollama nếu có API key.

### Phút 1: Join phòng và giải thích presence

Mở hai tab: một tab Host, một tab Writer. Cả hai nhập tên hiển thị và mã phòng `DEMO99`.

Lời nói:

> Khi hai người dùng vào phòng, giao diện cập nhật ngay số lượng online. Phần này dùng WebSocket để broadcast sự kiện join/leave, còn Redis lưu presence theo room để hệ thống biết ai đang online và tránh trùng khi người dùng reload tab.

### Phút 2: Host start turn và Writer gửi ý tưởng

Host bấm bắt đầu lượt viết. Writer nhập một ý tưởng nối tiếp câu chuyện và gửi lên.

Lời nói:

> Khi Host bắt đầu turn, trạng thái phòng chuyển từ Lobby sang Submission trên cả hai tab mà không cần reload. Ý tưởng của Writer được lưu vào MongoDB, sau đó đưa vào BullMQ để AI Lore Checker xử lý bất đồng bộ. Kết quả approved hoặc rejected được đẩy lại realtime qua WebSocket.

### Phút 3: Vote và chứng minh Redis lock

Host đóng submission và chuyển sang voting. Writer vote một ý tưởng, sau đó thử vote lại.

Lời nói:

> Ở phase voting, hệ thống dùng Redis atomic lock để chặn double-vote. Cụ thể backend tạo khóa theo `turnId` và `userId`; nếu user đã vote, Redis trả về trạng thái đã tồn tại và hệ thống chặn ngay trước khi ghi thêm vào MongoDB. Cách này nhanh hơn và an toàn hơn khi có nhiều user vote cùng lúc.

### Phút 4: AI writing và publish chapter

Host đóng voting, hệ thống chuyển sang AI writing. Novel View cập nhật chương mới.

Lời nói:

> Ý tưởng thắng cuộc được đưa vào AI Writer. Sau đó AI Structure Manager quyết định nối vào chương hiện tại hay tạo chương mới. Nội dung cuối cùng được lưu vào MongoDB và phát sự kiện `chapter_published` qua WebSocket để mọi client cập nhật Novel View realtime.

### Phút 5: Mở Realtime Log và kết luận

Mở Realtime Log Drawer để chỉ các event như `room_presence`, `turn_started`, `idea_moderated`, `vote_update`, `ai_stage_update`, `chapter_published`.

Lời nói:

> Realtime Log giúp quan sát trực tiếp các event WebSocket trong lúc demo. Qua đó có thể thấy hệ thống không chỉ là giao diện đẹp mà có luồng realtime thật, Redis thật và lưu trữ MongoDB thật.

---

## 3. Giải thích kiến trúc 3 phút

### 3.1. Tổng quan

Hệ thống được chia thành frontend Next.js và backend NestJS. Frontend gọi HTTP API để lấy dữ liệu ban đầu và dùng Socket.IO client để nhận cập nhật realtime. Backend NestJS có Controller cho REST API, Gateway cho WebSocket, Service cho nghiệp vụ phòng viết và BullMQ Processor cho các job AI.

### 3.2. WebSocket

WebSocket dùng cho những dữ liệu cần cập nhật ngay:

- Người dùng join/leave phòng.
- Cập nhật số người online.
- Bắt đầu turn mới.
- Đồng hồ countdown.
- AI duyệt ý tưởng.
- Cập nhật vote.
- Publish chương mới.
- AI stage update và realtime log.

Điểm cần nhấn mạnh: HTTP phù hợp cho request đơn lẻ, còn WebSocket phù hợp khi server cần chủ động đẩy dữ liệu đến nhiều client trong cùng phòng.

### 3.3. Redis

Redis có bốn vai trò chính:

- **Presence**: lưu danh sách user/socket đang online trong phòng.
- **Timer**: hỗ trợ countdown và trạng thái turn ngắn hạn.
- **Vote lock**: chống double-vote bằng khóa nguyên tử.
- **BullMQ queue**: làm nền cho job AI chạy bất đồng bộ.

Redis được dùng vì dữ liệu dạng này cần tốc độ cao, TTL và thao tác nguyên tử.

### 3.4. MongoDB

MongoDB lưu dữ liệu bền vững:

- Users guest.
- Rooms và room members.
- Lorebook.
- Turns.
- Ideas.
- Votes.
- Chapters.
- AI outputs.

MongoDB phù hợp vì dữ liệu truyện, lorebook, prompt và output AI có cấu trúc document linh hoạt.

### 3.5. AI Provider

AI được tách qua abstraction chung. Hệ thống hỗ trợ mock, Gemini, xAI/Grok, OpenRouter và Ollama. Nếu API thật lỗi, thiếu key hoặc timeout, hệ thống fallback sang mock để demo không bị đứng. Đây là điểm quan trọng khi bảo vệ vì môi trường mạng hoặc quota API không ổn định.

---

## 4. 20 câu hỏi phản biện và câu trả lời mẫu

### 1. Vì sao đề tài chat realtime lại mở rộng thành đồng sáng tác tiểu thuyết AI?

Vì bản chất kỹ thuật vẫn là chat realtime đa người dùng, nhưng em mở rộng use case để thể hiện rõ hơn các vấn đề realtime: presence, phase sync, voting, queue xử lý nền và publish nội dung realtime. Nhờ vậy đồ án không chỉ dừng ở gửi tin nhắn mà có nghiệp vụ phong phú hơn.

### 2. WebSocket dùng để làm gì trong dự án?

WebSocket dùng để server chủ động đẩy cập nhật đến tất cả client trong phòng, ví dụ user online, timer, chuyển phase, ý tưởng được duyệt, vote update và chapter published. Nếu chỉ dùng HTTP polling thì độ trễ cao hơn và tốn request hơn.

### 3. Vì sao chọn Socket.IO thay vì WebSocket thuần?

Socket.IO hỗ trợ room, reconnect, event-based API và fallback tốt hơn khi làm demo đa tab. Với đồ án realtime, Socket.IO giúp triển khai nhanh, rõ và dễ debug hơn WebSocket thuần.

### 4. Redis giữ vai trò gì?

Redis xử lý dữ liệu ngắn hạn và cần tốc độ cao: presence, timer, vote lock và BullMQ queue. Những dữ liệu này không nhất thiết phải lưu bền vững lâu dài trong MongoDB nhưng cần phản hồi nhanh và nhất quán.

### 5. Redis lock chống double-vote hoạt động thế nào?

Khi user vote, backend tạo key theo `turnId` và `userId`. Redis dùng thao tác nguyên tử kiểu `SET NX` để chỉ cho phép tạo key nếu chưa tồn tại. Nếu key đã tồn tại, backend biết user đã vote và chặn lượt vote thứ hai.

### 6. Vì sao vẫn cần MongoDB nếu đã có Redis?

Redis chủ yếu lưu trạng thái tạm thời, còn MongoDB lưu dữ liệu bền vững. Phòng, lorebook, ý tưởng, vote, chương truyện và AI output cần tồn tại sau khi server restart, nên phải lưu trong MongoDB.

### 7. Vì sao MongoDB phù hợp với dự án này?

Dữ liệu truyện, lorebook, prompt AI và chapter là dạng document linh hoạt, có thể thay đổi cấu trúc theo thời gian. MongoDB giúp lưu các cấu trúc này tự nhiên hơn so với bảng quan hệ cứng.

### 8. BullMQ dùng để làm gì?

BullMQ dùng để đưa các tác vụ AI vào hàng đợi xử lý nền. Gọi AI có thể mất vài giây, nên nếu xử lý trực tiếp trong request HTTP thì dễ làm treo trải nghiệm. Queue giúp hệ thống phản hồi nhanh và xử lý AI bất đồng bộ.

### 9. Nếu AI API lỗi thì hệ thống xử lý ra sao?

Hệ thống có `AI_FALLBACK_TO_MOCK=true`. Nếu provider thật thiếu API key, timeout, lỗi mạng hoặc hết quota, backend tự fallback sang Mock Provider, log sự kiện fallback và vẫn tiếp tục luồng demo.

### 10. Vì sao dùng Guest Mode thay vì đăng nhập truyền thống?

Vì mục tiêu demo là giảm ma sát tham gia phòng realtime. Người dùng chỉ cần nhập tên và mã phòng là vào được. Điều này phù hợp với use case workshop/demo lớp học, nơi cần nhiều người tham gia nhanh.

### 11. Guest Mode có rủi ro gì?

Guest Mode không phù hợp cho production có yêu cầu bảo mật cao. Nếu triển khai thật, có thể thêm login, rate limit và phân quyền sâu hơn. Trong phạm vi đồ án, Guest Mode giúp tập trung vào realtime và Redis/MongoDB.

### 12. Làm sao hệ thống biết ai là Host?

Room có thông tin host trong MongoDB. Với phòng seed `DEMO99`, guest đầu tiên join có thể claim quyền Host để thuận tiện demo. Sau đó Host có quyền start/close phase và điều phối turn.

### 13. Khi reload trang trong phase voting, user có vote lại được không?

Không. Frontend có thể mất state local khi reload, nhưng backend kiểm tra trạng thái vote theo user/turn và trả lại `hasVoted`. Ngoài ra Redis/MongoDB vẫn chặn vote trùng ở backend.

### 14. Realtime Log Drawer có ý nghĩa gì?

Realtime Log Drawer giúp chứng minh trực quan các event WebSocket đang chạy thật. Khi demo, hội đồng có thể thấy tên event và payload như `room_presence`, `turn_started`, `vote_update`, `chapter_published`.

### 15. AI Lore Checker kiểm tra cái gì?

AI Lore Checker kiểm tra ý tưởng người dùng gửi có mâu thuẫn với lorebook, timeline, logic thế giới hoặc quy tắc nhân vật không. Kết quả trả về approved/rejected cùng lý do ngắn.

### 16. AI Structure Manager làm gì?

AI Structure Manager quyết định đoạn văn mới nên nối vào chương hiện tại hay tạo chương mới. Nó giúp Novel View có cấu trúc truyện hợp lý hơn thay vì chỉ append toàn bộ vào một chỗ.

### 17. Hệ thống có mở rộng nhiều phòng cùng lúc được không?

Có. Socket.IO room tách event theo từng room, Redis key có namespace theo room/turn, MongoDB lưu room độc lập. Khi mở rộng production, có thể thêm Redis adapter cho Socket.IO để scale nhiều backend instance.

### 18. Nếu nhiều user vote cùng lúc thì có race condition không?

Redis lock giảm rủi ro race condition vì thao tác tạo lock là nguyên tử. MongoDB vẫn lưu vote bền vững, nhưng Redis giúp chặn trùng nhanh ở tầng trước.

### 19. Dự án khác gì một chat app thông thường?

Chat app chủ yếu gửi tin nhắn. Dự án này có state machine theo turn, AI moderation, voting ẩn danh, Redis lock, AI writing pipeline và Novel View publish realtime. Nó thể hiện nhiều bài toán realtime phức tạp hơn chat cơ bản.

### 20. Nếu có thêm thời gian, em sẽ phát triển gì tiếp?

Em sẽ thêm xác thực người dùng thật, Redis adapter để scale nhiều instance, test e2e tự động, export EPUB/PDF, dashboard admin, và dùng provider AI thật ổn định hơn với monitoring chi phí/token.

---

## 5. Câu trả lời ngắn khi bị hỏi khó

### Nếu thầy cô hỏi: "Tại sao không dùng PostgreSQL?"

Trong phạm vi đề tài, công nghệ bắt buộc là WebSocket, Redis và MongoDB. MongoDB cũng phù hợp với dữ liệu document của truyện, lorebook và AI output. Nếu triển khai sản phẩm thương mại có billing phức tạp, em có thể cân nhắc thêm PostgreSQL cho phần giao dịch.

### Nếu thầy cô hỏi: "AI thật đã chạy chưa?"

Hệ thống đã có kiến trúc provider thật cho Gemini, xAI/Grok, OpenRouter và Ollama. Tuy nhiên khi bảo vệ em khuyến nghị dùng mock mode để tránh phụ thuộc mạng/quota. Nếu có API key hợp lệ, chỉ cần cấu hình `.env` là có thể chuyển sang provider thật.

### Nếu thầy cô hỏi: "Redis mất thì hệ thống có chạy không?"

Các phần realtime quan trọng như presence, timer, queue và vote lock phụ thuộc Redis, nên nếu Redis mất thì hệ thống sẽ suy giảm nghiêm trọng. Trong production cần health check, retry, monitoring và có thể dùng Redis managed service hoặc Redis cluster.

### Nếu thầy cô hỏi: "MongoDB mất thì sao?"

MongoDB là nơi lưu dữ liệu bền vững nên nếu mất kết nối thì không thể lưu room, idea, vote và chapter. Backend cần báo lỗi rõ ràng cho user. Trong bản demo có script kiểm tra môi trường trước khi chạy để tránh lỗi này.

### Nếu thầy cô hỏi: "Có bảo mật không?"

Bản demo tập trung vào realtime architecture. Đã có Guest Mode và phân quyền Host/Writer cơ bản. Nếu triển khai thật cần bổ sung authentication, authorization chặt hơn, rate limit, input validation DTO và audit log.

---

## 6. Checklist ngay trước khi bước vào phòng bảo vệ

- [ ] Docker Desktop đang chạy.
- [ ] `pnpm db:up` hoặc container MongoDB/Redis đã start.
- [ ] `.env` đang để `AI_MODE=mock` nếu muốn demo ổn định.
- [ ] `pnpm dev` đang chạy.
- [ ] `scripts/check-demo-env.ps1` báo PASS.
- [ ] Đã seed `DEMO99`.
- [ ] Mở sẵn 2 tab Host và Writer.
- [ ] Mở sẵn `docs/slide-presentation.md`.
- [ ] Mở sẵn `docs/demo-script.md`.
- [ ] Chuẩn bị một câu trả lời ngắn về WebSocket, Redis, MongoDB.

---

## 7. Công thức trả lời nhanh

Khi bị hỏi bất kỳ câu nào, ưu tiên trả lời theo khung:

1. **Nêu vai trò kỹ thuật**: thành phần đó làm gì.
2. **Gắn với demo**: nó xuất hiện ở bước nào trong DEMO99.
3. **Nêu lợi ích**: nhanh hơn, realtime hơn, ổn định hơn hoặc lưu bền vững hơn.

Ví dụ:

> Redis trong dự án dùng để lưu trạng thái ngắn hạn cần tốc độ cao như presence, timer và vote lock. Khi em demo double-vote, Redis chặn lượt vote thứ hai bằng atomic lock trước khi ghi MongoDB. Nhờ vậy hệ thống vừa nhanh vừa tránh gian lận khi nhiều người vote cùng lúc.
