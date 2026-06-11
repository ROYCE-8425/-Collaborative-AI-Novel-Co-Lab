# Walkthrough du an

## 1. Tong quan

Du an la nen tang dong sang tac tieu thuyet AI realtime da nguoi dung. He thong duoc xay dung dung theo huong de tai: **WebSocket + Redis + MongoDB**.

Nguoi dung co the nhap ten hien thi, tao hoac join phong bang ma phong, cung gui idea trong tung turn, vote cho idea hop le, va xem AI mock tu dong publish chapter moi vao Novel View.

## 2. Kien truc tong the

```text
Next.js frontend
  -> REST API cho guest entry, room bootstrap, lorebook, chapter
  -> Socket.IO cho realtime room events

NestJS backend
  -> MongoDB qua Mongoose
  -> Redis cho timer, presence va distributed lock
  -> BullMQ cho AI background jobs
  -> Socket.IO gateway de broadcast state realtime
```

## 3. Frontend

Frontend nam trong `apps/frontend`.

Thanh phan chinh:

- `src/app/page.tsx`: man hinh vao nhanh bang ten hien thi va ma phong.
- `src/app/rooms/page.tsx`: danh sach room, tao room va join room.
- `src/app/rooms/[id]/page.tsx`: workspace chinh de sang tac realtime.
- `src/components/PresenceAvatars.tsx`: bong bong avatar và chỉ báo số lượng tác giả trực tuyến realtime.
- `src/components/PhaseStepper.tsx`: thanh chỉ báo quy trình trạng thái lượt viết (Phòng Chờ, Ý tưởng, Bình chọn, AI Chấp Bút, Chuyển lượt).
- `src/components/HostControlPanel.tsx`: bảng điều khiển admin dành riêng cho Host để đóng phase sớm.
- `src/components/NovelReader.tsx`: khu vực đọc truyện giả lập trang sách kem với cuộn mượt và đếm số từ.
- `src/components/LorebookDrawer.tsx`: ngăn kéo trượt chứa các thiết lập bối cảnh cốt truyện và form thêm thiết lập mới.
- `src/lib/api.ts`: helper goi REST API va luu guest/local user.
- `src/lib/socket.ts`: helper tao Socket.IO client.

Workspace room gom:

- khu vuc workshop turn-based
- timer realtime
- form submit idea
- danh sach idea da approve
- voting view
- AI writing state
- novel reader view
- lorebook drawer
- presence indicator

## 4. Backend

Backend nam trong `apps/backend`.

Module chinh:

- `AuthModule`: tao guest user cho demo nhanh; register/login van co o backend nhung khong con la flow chinh.
- `RoomModule`: tao room, join room, start room, submit idea, vote, lay state room.
- `LorebookModule`: doc va them lorebook entry.
- `ChapterModule`: doc danh sach chapter.
- `GatewayModule`: Socket.IO gateway cho realtime room.
- `JobsModule`: BullMQ worker xu ly AI mock.
- `RedisModule`: wrapper thao tac Redis.

## 5. MongoDB data model

MongoDB duoc dung lam database chinh.

Schemas da co:

- `User`: tai khoan, email, password hash, role.
- `Room`: phong sang tac, ma phong, host, status, settings, active turn, lorebook.
- `RoomMember`: thanh vien va role trong room.
- `Lorebook`: danh sach entry lore.
- `Turn`: so thu tu turn, status, timer deadline, idea thang.
- `Idea`: idea cua creator, moderation result.
- `Vote`: vote cua user cho idea trong turn.
- `Chapter`: chapter da publish.
- `AiJob`: trang thai job AI.
- `AiOutput`: ket qua dau ra cua AI worker.

## 6. Redis usage

Redis dang duoc dung cho:

- `room:{roomId}:timer`: timer TTL cho phase hien tai.
- `room:{roomId}:presence`: hash luu user online trong room.
- `room:{roomId}:turn:{turnId}:voted:{userId}`: vote lock chong double-vote.
- `lock:room:{roomId}:turn`: distributed lock khi chuyen phase turn.

Redis cung la backend connection cho BullMQ.

## 7. WebSocket events

Gateway hien co cac event:

- `join_room`
- `leave_room`
- `room_presence`
- `start_turn`
- `submit_idea`
- `idea_submitted`
- `idea_moderated`
- `start_voting`
- `cast_vote`
- `vote_cast_success`
- `timer_update`
- `turn_started`
- `turn_ended`
- `vote_update`
- `close_voting`
- `chapter_published`
- `next_turn`

`turn_started` da gui kem `turnId` de frontend co the submit idea dung turn hien tai.

## 8. Luong nghiep vu MVP

1. User nhap ten hien thi.
2. Frontend tao guest user tam thoi.
3. User tao room moi de lay ma phong hoac nhap ma phong de join.
4. Host vao room va start room.
5. Backend tao turn dau tien va set Redis timer.
6. Gateway broadcast `turn_started`.
7. Creator submit idea qua Socket.IO event `submit_idea`.
8. Backend dua idea vao BullMQ job `lore-check`.
9. Worker mock kiem tra lorebook va broadcast `idea_moderated`.
10. Het submission timer, backend chuyen sang voting phase.
11. Creator vote idea approved qua Socket.IO event `cast_vote`.
12. Het voting timer, backend chon winning idea.
13. Worker mock chay `writer`, tao paragraph.
14. Worker mock chay `structure`, tao hoac append chapter.
15. Gateway broadcast `chapter_published`.
16. Frontend cap nhat Novel View; neu chapter cu duoc append thi update lai chapter theo `_id`.
17. Host bam `Start Next Turn`, gateway goi `next_turn` va broadcast `turn_started`.

## 9. Chi tiet kien truc realtime

Luồng realtime duoc chia thanh ba lop ro rang:

- WebSocket/Socket.IO: dong bo hanh dong trong phong nhu join, presence, submit idea, vote, chuyen phase va publish chapter.
- Redis: giu du lieu ngan han can toc do cao gom presence, timer TTL, vote lock va mutex lock khi chuyen phase.
- MongoDB: luu du lieu ben vung gom user guest, room, turn, idea, vote, chapter, lorebook va AI output.

Vai tro Redis khi bao cao:

- Presence Tracker: `room:{roomId}:presence` luu danh sach user online theo hash, moi join/leave se broadcast `room_presence`.
- TTL Timer: `room:{roomId}:timer` dung TTL de frontend nhan `timer_update` gan thoi gian thuc.
- Vote Lock: `room:{roomId}:turn:{turnId}:voted:{userId}` dung `SET EX NX` de chan double-vote ngay lap tuc.
- Mutex Lock: `lock:room:{roomId}:turn` chan viec hai tien trinh cung chuyen phase cung luc.
- Queue backend: Redis cung lam backend cho BullMQ xu ly lore-check, writer va structure.

## 10. Kich ban bao cao de tai

Chuan bi demo:

- Mo MongoDB va Redis local.
- Chay `pnpm dev`.
- Mo 2-3 cua so trinh duyet hoac tab an danh.
- Tab 1 dat ten Host, tao room va copy room code.
- Tab 2/3 dat ten Writer va join bang room code.

Kich ban thao tac:

1. O Lobby, chi ra room code va danh sach online realtime. Noi rang WebSocket broadcast presence, Redis luu hash online.
2. Host bam `Start Co-creation Round`. Tat ca tab chuyen sang Submission, timer chay bang Redis TTL.
3. Writer gui idea. Noi rang frontend gui qua Socket.IO, backend luu MongoDB va day job lore-check vao BullMQ.
4. Khi idea duoc approve, UI cap nhat realtime. Noi rang worker broadcast `idea_moderated`.
5. Host bam `Close Submission & Start Voting`. Tac gia bi an danh trong phase vote.
6. Writer vote mot idea. Bam vote lan hai de cho thay thong bao `[Redis Lock]`, giai thich Redis `SET EX NX` chan double-vote.
7. Host bam `Close Voting & Start AI Writing`. UI chuyen sang AI Writing, worker mock tao paragraph va structure.
8. Khi `chapter_published` xuat hien, Novel View cap nhat ngay. Neu append vao chapter cu, frontend replace chapter trung `_id`.
9. Host bam `Start Next Turn` de chung minh flow co the lap lai.

## 11. Cach chay

Can chay MongoDB va Redis local truoc.

```bash
pnpm install
pnpm dev
```

Mo trinh duyet tai:

```text
http://localhost:3000
```

Build kiem tra:

```bash
pnpm build
```

Trang thai gan nhat: Tich hop thanh cong AI Provider that (Gemini/xAI/OpenRouter/Ollama) voi co che Mock Fallback an toan, build thanh cong 100%.

## 12. Tich hop AI Provider that & Co che Fallback an toan (Phase 4)

He thong cung cap lop truu tuong `AiProvider` cho phep lua chon linh hoat cac nha cung cap AI thong qua `.env`:
* **Trien khai cac Provider**:
  - `MockProvider`: Gia lap nhanh chong.
  - `GeminiProvider`: Ket noi Gemini API.
  - `XaiProvider`: Ket noi xAI/Grok API.
  - `OpenRouterProvider`: Tuong thich OpenAI API.
  - `OllamaProvider`: Dung cac model local.
* **Co che an toan (Mock Fallback)**:
  - Khi bat `AI_FALLBACK_TO_MOCK=true`, bat ky loi API nao nhu sai key, het quota hoac timeout se duoc tu dong chuyen sang Mock an toan.
  - Gui su kien `ai_stage_update` de cap nhat log realtime `[AI Fallback]` tren client, giup giam thieu toi da rui ro gian doan khi demo thuyet trinh.

## 13. Hinh anh ket qua thuc te

Anh minh chung duoc luu trong repo tai `docs/screenshots` de de nop kem source va mo lai tren may khac.

1. **Host vao phong DEMO99 va thay Host Control Panel**

   <img src="docs/screenshots/host_lobby.png" alt="Host Lobby" width="100%" />

2. **Writer join phong va presence realtime cap nhat 2 nguoi online**

   <img src="docs/screenshots/writer_joined.png" alt="Writer Joined" width="100%" />

3. **Submission phase: idea duoc AI Lore Checker approve realtime**

   <img src="docs/screenshots/submission_approved.png" alt="Submission Approved" width="100%" />

4. **Voting phase va co che Redis Lock chong double-vote**

   <img src="docs/screenshots/voting_phase.png" alt="Voting Phase" width="100%" />

5. **Novel View cap nhat doan truyen moi sau AI Writing**

   <img src="docs/screenshots/novel_published.png" alt="Novel Published" width="100%" />

## 14. Ghi chu bao cao

Khi bao cao, nen nhan manh:

- WebSocket phu trach dong bo realtime giua nhieu nguoi trong room.
- Ma phong giup nguoi dung join nhanh ma khong can tai khoan.
- Redis phu trach timer, presence, lock va queue coordination.
- MongoDB phu hop voi lorebook, idea, chapter va AI artifact dang document.
- BullMQ giup tach tac vu AI khoi request realtime.
- San pham mo rong bai toan chat realtime thanh mot ung dung co quy trinh nghiep vu ro rang.
