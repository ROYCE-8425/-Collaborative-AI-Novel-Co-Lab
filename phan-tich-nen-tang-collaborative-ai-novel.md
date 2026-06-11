# Phan tich nen tang Collaborative AI Novel

## 1. Tong quan nghiep vu

Du an la mot nen tang dong sang tac tieu thuyet co AI ho tro theo vong lap:

1. Creator de xuat y tuong ngan co gioi han thoi gian.
2. AI kiem duyet y tuong theo lorebook va quy tac the gioi.
3. Nhom bo phieu an danh.
4. AI Writer viet thanh doan van hoan chinh.
5. AI Structure Manager tu dong noi chuong hoac tao chuong moi.
6. Ban thao duoc cap nhat vao khu vuc doc truyen va mo turn moi.

## 1.1. Quyet dinh cong nghe cuoi cung cho de tai

Do rang buoc de tai mon hoc da chon huong:

- WebSocket
- Redis
- MongoDB

nen du an se duoc xay dung theo huong:

**Nen tang dong sang tac tieu thuyet AI realtime da nguoi dung**

Day la cach map giua de tai va san pham:

- `WebSocket`: cap nhat realtime workshop room, idea stream, voting, countdown, publish chapter.
- `Redis`: pub/sub, cache, timer, distributed lock, queue coordination, room presence.
- `MongoDB`: luu room, lorebook, ideas, chapters, AI outputs, lich su turn, event log.

## 1.2. Stack du kien de trien khai

Stack se uu tien tinh phu hop voi de tai va kha nang demo:

- Frontend: `Next.js`
- Backend: `NestJS`
- Realtime gateway: `Socket.IO`
- Database chinh: `MongoDB`
- Cache / PubSub / Timer / Lock: `Redis`
- Queue / Worker: `BullMQ`
- ODM: `Mongoose`
- AI integration: Gemini hoac OpenAI thong qua worker rieng

## 1.3. Luu y bao cao

Neu bao cao theo huong de tai, can nhan manh:

- Day la he thong realtime da nguoi dung.
- WebSocket la kenh giao tiep chinh giua client va server.
- Redis giup dong bo trang thai phong va timer khi co nhieu ket noi dong thoi.
- MongoDB phu hop voi du lieu document linh hoat cua lorebook, idea, chapter va lich su AI.
- Bai toan thuc te duoc mo rong tu "chat realtime" thanh "collaborative AI novel realtime".

## 2. Yeu cau chuc nang cot loi

### Nhom user

- Admin: quan tri he thong, giam sat, xu ly cau hinh.
- Host: tao room, cai dat lorebook, quan ly timer, chi phi token.
- Creator: gui y tuong, vote, theo doi ket qua.
- Reader: doc ban thao va lich su truyen.

### Nhom module

- Auth va RBAC.
- Workshop Room realtime.
- Lorebook management.
- Turn engine co timer.
- Idea submission va moderation.
- Voting an danh.
- AI orchestration.
- Chapter drafting va auto-structuring.
- Novel reader view.
- Credit/token billing.
- Logging, audit, analytics.

## 3. Danh gia cong nghe MongoDB, Redis, PocketBase

### Ket luan ngan

- Redis: nen dung.
- PocketBase: khong nen dung lam nen tang chinh.
- MongoDB: chi nen dung theo kieu hybrid, khong nen la database duy nhat cho toan he thong.

### Vi sao Redis nen dung

Redis rat hop cho:

- Session room realtime.
- Countdown timer cho turn.
- Pub/sub hoac stream cho event room.
- Queue tam thoi, rate limit, idempotency key.
- Cache lorebook, chapter context, ket qua AI.
- Bang xep hang va dem vote tam thoi.

### Vi sao PocketBase khong nen lam core

PocketBase tot cho MVP nho, demo nhanh, auth co san, realtime co san. Tuy nhien du an nay co:

- Nhieu vai tro va rule nghiep vu phuc tap.
- Workflow AI da buoc.
- Turn engine co timer nghiem ngat.
- Can logging, retry, queue, billing, moderation.
- Co kha nang scale room dong thoi.

Voi muc do nghiep vu nay, PocketBase de tro thanh diem nghen ve:

- domain logic
- migration va versioning
- scaling
- worker/job orchestration
- bao tri dai han

PocketBase co the dung cho prototype nhanh, nhung khong nen la xương song san pham.

### Vi sao MongoDB khong nen la DB duy nhat

MongoDB hop voi:

- Lorebook dang document.
- Ban ghi prompt/response AI.
- Event log, transcript, draft history.
- Metadata chapter linh hoat.

Nhung MongoDB khong toi uu neu dung mot minh cho:

- Vote can tinh nhat quan.
- Billing, credit, token ledger.
- Constraint nghiep vu chat.
- Bao cao quan tri co nhieu join logic.
- Workflow room, turn, state machine can transaction ro rang.

## 4. Kien truc de xuat

### Phuong an khuyen nghi

Dung kien truc hybrid:

- PostgreSQL: database chinh cho nghiep vu giao dich.
- Redis: realtime, timer, cache, queue coordination.
- Object Storage: luu asset, export, backup, prompt artifact.
- MongoDB: tu chon cho AI memory, prompt log, lore snapshot, event document.

### Neu bat buoc phai chon MongoDB + Redis

Van co the lam, nhung nen them mot lop service ro rang:

- MongoDB: room, lorebook, ideas, chapters, AI outputs, story snapshots.
- Redis: vote counter, timer, ephemeral room state, event broadcast.
- Mot worker engine rieng: xu ly scheduler, retry, AI pipeline.

Khi do can chap nhan:

- Logic transaction phai viet ky hon.
- Reporting va billing se kho hon.
- De phat sinh bug consistency neu vote/publish cung luc.

### Khong gian he thong

1. API Gateway / BFF
2. Auth Service
3. Room Service
4. Turn Engine Service
5. Voting Service
6. Lorebook Service
7. AI Orchestrator
8. Draft/Chapter Service
9. Billing Service
10. Notification/WebSocket Gateway
11. Admin/Analytics Service

## 5. Model du lieu muc cao

### Bang/collection nen co

- users
- profiles
- rooms
- room_members
- lorebooks
- lore_rules
- story_projects
- turns
- ideas
- moderation_results
- votes
- ai_jobs
- ai_outputs
- chapters
- story_versions
- token_ledgers
- audit_logs

### Phan tach du lieu

PostgreSQL:

- users
- room_members
- turns
- votes
- token_ledgers
- ai_jobs
- audit_logs

MongoDB:

- lorebooks
- lore snapshots
- idea raw content
- ai_outputs
- chapter draft history
- story context packages

Redis:

- room:{id}:timer
- room:{id}:active_turn
- turn:{id}:vote_count
- ws presence
- short-lived cache

## 6. Luong xu ly 1 turn

1. Host mo turn moi.
2. Turn Engine tao countdown trong Redis va luu turn record.
3. Creator gui idea.
4. AI Moderation worker lay idea, doi chieu lorebook, ghi moderation result.
5. He thong cong khai danh sach idea hop le len bang vote.
6. Het gio, Voting Service khoa vote va chon winner.
7. AI Orchestrator tao context package:
   - lorebook
   - chapter gan nhat
   - pacing state
   - winning idea
8. AI Writer sinh doan truyen.
9. AI Structure Manager quyet dinh noi chuong hay mo chuong moi.
10. Draft Service publish vao Novel View.
11. He thong mo turn tiep theo.

## 7. Lo trinh phat trien

### Phase 1 - MVP

- Dang nhap, tao room, moi thanh vien.
- Lorebook co ban.
- Tao turn co timer.
- Creator submit idea.
- Moderation AI co ban.
- Vote an danh.
- AI Writer sinh doan.
- Novel View hien chuong.

### Phase 2 - Ban on dinh

- Retry job, observability, audit.
- Credit/token billing.
- Story versioning.
- Chapter auto-structuring nang cao.
- Dashboard admin.
- Export EPUB/PDF.

### Phase 3 - Ban mo rong

- Nhiều room song song.
- Co-editing mode.
- Multi-model routing.
- RAG cho lorebook va chapter memory.
- Community publishing, ranking, comments.

## 8. Rui ro can xu ly som

- Xung dot state khi het gio va user gui idea sat deadline.
- Double vote hoac replay request.
- AI output vi pham lorebook du da moderation idea.
- Cost AI tang nhanh theo so turn va context dai.
- Kho doc context neu story rat dai.

## 9. Khuyen nghi cuoi cung

Neu muc tieu la lam san pham that va co the mo rong:

- Khong chon PocketBase lam nen tang chinh.
- Nen chon PostgreSQL + Redis lam xuong song.
- Chi them MongoDB cho phan du lieu document va AI artifact.

Neu muc tieu chi la prototype 2-4 tuan:

- Co the dung PocketBase de demo UX nhanh.
- Nhung nen xem do la ban thu nghiem, khong phai architecture cuoi.

## 10. Prompt de dua cho Gemini

### Prompt 1 - Phan tich kien truc tong the

```text
Ban dong vai tro la Senior Solution Architect, Business Analyst va AI Product Designer.

Toi dang xay dung mot nen tang "Collaborative AI Novel" voi cac vai tro:
- Admin
- Host
- Creator
- Reader
- AI Lore Checker
- AI Writer
- AI Structure Manager

Quy trinh nghiep vu:
1. Creator gui y tuong ngan duoi 500 chu trong mot turn co timer.
2. AI Lore Checker doi chieu y tuong voi lorebook va loai bo y tuong sai logic.
3. Cac y tuong hop le duoc dua len de vote an danh.
4. Y tuong thang duoc AI Writer viet thanh doan tieu thuyet hoan chinh.
5. AI Structure Manager quyet dinh noi vao chuong hien tai hay tao chuong moi.
6. Ban thao duoc publish len Novel View va mo turn tiep theo.

Yeu cau cua ban:
1. Phan tich nghiep vu va tach thanh module he thong.
2. De xuat kien truc MVP va kien truc production-ready.
3. Danh gia ro rang viec dung MongoDB, Redis va PocketBase cho bai toan nay.
4. Neu khong phu hop, de xuat stack thay the hop ly hon.
5. Thiet ke data model muc cao cho user, room, turn, idea, vote, chapter, lorebook, AI jobs.
6. Ve luong xu ly cho mot turn tu submit idea den publish chapter.
7. Liet ke API chinh cho frontend/backend.
8. Liet ke event realtime can co.
9. Dua ra roadmap 3 phase: MVP, Beta, Scale.
10. Liet ke 10 rui ro ky thuat lon nhat va cach giam thieu.

Rang buoc:
- Tra loi bang tieng Viet.
- Uu tien tinh thuc chien, co the giao cho team code ngay.
- Neu can, dua ra bang so sanh cong nghe.
- Trinh bay theo muc: Tong quan, Kien truc, Data model, API, Realtime, Roadmap, Risks, Recommendation.
```

### Prompt 2 - Thiet ke prompt cho 3 AI agent

```text
Ban la Prompt Engineer cho mot nen tang sang tac tieu thuyet AI cong tac.

Hay tao cho toi 3 system prompts chat luong cao, su dung duoc ngay trong production cho:
1. AI Lore Checker
2. AI Writer
3. AI Structure Manager

Thong tin he thong:
- AI Lore Checker phai kiem tra y tuong cua nguoi choi co vi pham lorebook, quy tac the gioi, logic nhan vat, timeline, he thong suc manh hay khong.
- AI Writer phai bien y tuong chien thang thanh doan van giau tinh tieu thuyet, nhat quan van phong, khong pha vo lorebook.
- AI Structure Manager phai quyet dinh doan vua sinh ra nen noi vao chuong hien tai hay tach chuong moi dua tren pacing, story arc va cao trao.

Yeu cau output:
- Moi agent co: System Prompt, Input JSON schema, Output JSON schema, Safety rules, Failure handling rules.
- Output phai uu tien JSON de backend de parse.
- Tranh output mo ho khong the xu ly tu dong.
- Tra loi bang tieng Viet.
```

## 11. Ket qua mong doi tu Gemini

Neu Gemini tra loi tot, ban nen nhan duoc:

- So do module ro rang.
- Quy tac chon database minh bach.
- Data model co the chuyen thanh schema ngay.
- Danh sach API va event de frontend/backend chia viec.
- Prompt agent co the dem di test ngay.

Neu Gemini tra loi chung chung, hay gui them lenh sau:

```text
Lam sau hon phan data model va API. Hay viet duoi dang bang, co field chinh, kieu du lieu, rang buoc, va ghi chu nghiep vu. Sau do de xuat luon thu tu implementation cho team 3 nguoi trong 4 tuan.
```
