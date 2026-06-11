# Implementation Plan - Release QA

## Muc tieu

Chuan bi du an Collaborative AI Novel realtime o trang thai san sang nop bai va demo bao ve.

## Pham vi da hoan thanh

- Chuan hoa Guest Mode, khong dung login UI.
- Cau hinh stack dung de tai: WebSocket/Socket.IO, Redis, MongoDB.
- Them Docker Compose cho MongoDB va Redis.
- Them script `scripts/check-demo-env.ps1` de kiem tra moi truong demo.
- Them seed endpoint `POST /api/rooms/seed` tao phong mau `DEMO99`.
- Kiem thu runtime local voi Docker, backend, frontend va seed endpoint.
- Luu anh minh chung browser E2E vao `docs/screenshots`.
- Cap nhat `README.md`, `bao-cao-demo.md`, `walkthrough.md`, `task.md` va `release-checklist.md`.

## Lenh kiem tra release

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-demo-env.ps1
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/rooms/seed
pnpm build
```

## Ket qua mong doi

- Docker daemon PASS.
- MongoDB va Redis containers PASS.
- Port `27017`, `6379`, `3001`, `3000` PASS.
- Seed `DEMO99` thanh cong.
- Build frontend/backend thanh cong.

## Ghi chu nop bai

- Tai lieu chinh de mo dau: `README.md`.
- Checklist release: `release-checklist.md`.
- Bao cao demo: `bao-cao-demo.md`.
- Anh minh chung: `docs/screenshots`.
- Kien truc chi tiet: `walkthrough.md`.
