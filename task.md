# Task checklist

## Da hoan thanh

- [x] Khoi tao pnpm workspace cho monorepo.
- [x] Tao `apps/backend` bang NestJS.
- [x] Tao `apps/frontend` bang Next.js.
- [x] Cai dat phu thuoc frontend: Framer Motion, lucide-react, socket.io-client.
- [x] Cai dat phu thuoc backend: Mongoose, Socket.IO, ioredis, BullMQ, guest/auth module.
- [x] Cau hinh MongoDB connection qua `MongooseModule`.
- [x] Cau hinh Redis/BullMQ cho timer, lock, presence va AI jobs.
- [x] Tao Mongo schemas cho user, room, room member, lorebook, turn, idea, vote, chapter, AI job va AI output.
- [x] Tao guest API de vao nhanh bang ten hien thi.
- [x] Tao room API cho tao room, join room, start room, state, submit idea va vote.
- [x] Tao lorebook API cho doc va them entry.
- [x] Tao chapter API cho doc danh sach chapter.
- [x] Tao Socket.IO gateway cho join room, leave room, presence, idea, vote, timer, moderation va chapter publish.
- [x] Tao BullMQ processor cho `lore-check`, `writer` va `structure`.
- [x] Tao giao dien vao nhanh bang ten hien thi va ma phong.
- [x] Tao giao dien danh sach room va tao room.
- [x] Tao giao dien room workspace gom workshop, lorebook drawer va novel reader view.
- [x] Tao README huong dan chay local.
- [x] Tao walkthrough mo ta kien truc.
- [x] Them file `.env.example` cho MongoDB, Redis, API va Socket URL.
- [x] Kiem tra `pnpm build` thanh cong.
- [x] Sua event `turn_started` de frontend nhan duoc `turnId`.
- [x] Bo flow dang nhap khoi trai nghiem demo.
- [x] Them ma phong ngan de join room nhanh.
- [x] Them endpoint `POST /api/rooms/seed` tao phong demo `DEMO99`.
- [x] Cho guest dau tien join `DEMO99` claim quyen Host de demo Host Control Panel.

## QA & Bug Fixing cho demo

- [x] Sua Novel View de update chapter cu neu AI append vao chapter trung `_id`.
- [x] Khoi phuc `hasVoted` khi reload trang trong phase Voting bang query `userId`.
- [x] Them Redis vote lock message de demo double-vote ro rang.
- [x] Them toast realtime cho submit idea, lore-check, vote, loi va publish chapter.
- [x] Chuan hoa walkthrough voi kien truc WebSocket + Redis + MongoDB va kich ban bao cao.
- [x] Tao `bao-cao-demo.md` phuc vu copy noi dung vao bao cao/thuyet trinh.
- [x] Bo sung lenh Docker va lenh seed demo vao README.
- [x] Ra soat AuthModule/Guest Mode va lam chac `POST /api/auth/guest` tranh ten rong, retry duplicate key, dung localStorage.
- [x] Tao `docker-compose.yml` va tich hop script khoi dong nhanh (`db:up`, `db:down`, `db:logs`) trong `package.json`.
- [x] Viet script PowerShell tu dong kiem tra moi truong (`check-demo-env.ps1`) va tich hop vao tai lieu.
- [x] Tao release checklist (`release-checklist.md`) huong dan chi tiet setup, kiem tra moi truong va kich ban demo Host/Writer.
- [x] Tao `implementation_plan.md` luu vet ke hoach release QA cuoi cung.
- [x] Tao tai lieu nop bai chinh (`SUBMISSION.md`) o thu muc goc tom tat thong tin, setup va anh minh chung.

## Can lam tiep truoc khi bao ve

- [x] Thiet ke lai mau sac, kieu chu va layout cua toan bo he thong de dong bo voi phong cach Game Studio.
- [x] Chay demo local voi MongoDB va Redis that.
- [x] Bat Docker Desktop, start MongoDB/Redis containers va goi seed endpoint tren may that.
- [x] Tao ten guest thu nghiem va chup room mau `DEMO99` qua browser automation.
- [x] Quay video hoac chup anh cac man hinh chinh (luu cac file anh vao thu muc artifacts).
- [x] Chuyen phan thuyet minh WebSocket, Redis va MongoDB tu `walkthrough.md` sang slide.
- [x] Thay AI mock bang kien truc AI Provider (Gemini/xAI/OpenRouter/Ollama) an toan.
- [ ] Neu co thoi gian, them validation DTO thay cho `body: any`.
- [ ] Neu co thoi gian, them test e2e cho guest entry, room va turn flow.

## Phase 4: AI Provider Integration with Safe Mock Fallback
- [x] Them cac bien cau hinh vao `.env.example` va `.env`
- [x] Tao `ai.interface.ts` dinh nghia cac interface tru-tuong cua AI Provider
- [x] Tao `mock.provider.ts` gia lap du lieu AI
- [x] Tao `gemini.provider.ts` tich hop Google Gemini API
- [x] Tao `xai.provider.ts` tich hop xAI/Grok API
- [x] Tao `openrouter.provider.ts` tich hop OpenRouter API
- [x] Tao `ollama.provider.ts` tich hop Ollama API
- [x] Tao `ai.service.ts` quan ly provider routing, timeout, logging, fallback va events
- [x] Tao `ai.module.ts` dang ky AiService
- [x] Dang ky `AiModule` trong `jobs.module.ts`
- [x] Cap nhat `ai.processor.ts` su dung `AiService` va gui logs realtime khi AI chay/fallback
- [x] Cap nhat `README.md`, `bao-cao-demo.md`, `walkthrough.md` mo ta Phase 4
- [x] Kiem tra `pnpm build` thanh cong
- [x] Xac nhan cac luong demo chay on dinh (Mock va Fallback an toan)

## Phase 5: Dong goi du an & Nghiem thu
- [x] Chuan hoa tai lieu nop bai `SUBMISSION.md`
- [x] Chuan hoa tai lieu huong dan `README.md`
- [x] Tao kich ban demo chi tiet `docs/demo-script.md`
- [x] Chuan hoa slide thuyet trinh `docs/slide-presentation.md`
- [x] Ra soat encoding, secrets va lien ket tuyet doi trong tai lieu
- [x] Bien dich monorepo lan cuoi (`pnpm build`)

## Phase 6: Luyen bao ve & Phan bien
- [x] Tao `docs/defense-rehearsal.md` gom loi mo dau, demo 5 phut va giai thich kien truc 3 phut
- [x] Tao `luyen_bao_ve_do_an.md` ban cam tay on luyen bao ve bang tieng Viet
- [x] Soan 20 cau hoi hoi dong co the hoi kem cau tra loi ngan gon
- [x] Bo sung cac cau tra loi nhanh ve WebSocket, Redis, MongoDB, BullMQ va AI fallback
- [x] Lien ket tai lieu luyen bao ve vao `README.md` va `SUBMISSION.md`
