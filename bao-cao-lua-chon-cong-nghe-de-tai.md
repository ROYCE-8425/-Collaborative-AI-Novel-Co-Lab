# Bao cao lua chon cong nghe de tai

## 1. Ten huong de tai

De tai duoc trien khai theo huong:

**Xay dung nen tang realtime da nguoi dung cho dong sang tac tieu thuyet AI, ket hop WebSocket, Redis va MongoDB**

## 2. Ly do chon huong nay

Huong nay van bam sat de tai goc "nen tang chat realtime da nguoi dung", nhung tang them gia tri ung dung bang mot bai toan cu the:

- nhieu nguoi cung tham gia mot phong sang tac
- gui y tuong theo thoi gian thuc
- bo phieu realtime
- he thong AI xu ly noi dung va cap nhat ban thao ngay trong phien

Nhu vay, de tai khong chi dung o chat co ban ma the hien ro tinh ung dung cua cong nghe realtime trong mot he thong co quy trinh nghiep vu phuc tap.

## 3. Vai tro cua tung cong nghe

### WebSocket

WebSocket duoc su dung de:

- dong bo noi dung workshop room theo thoi gian thuc
- gui va nhan idea ngay lap tuc
- cap nhat bo dem nguoc cua turn
- cap nhat ket qua vote theo thoi gian thuc
- thong bao khi AI hoan thanh kiem duyet hoac sinh chapter moi

### Redis

Redis duoc su dung de:

- cache du lieu nong cua room
- pub/sub giua cac backend instance
- quan ly countdown timer
- luu trang thai tam thoi cua phong
- chong xu ly trung bang lock
- phoi hop queue job voi worker AI

### MongoDB

MongoDB duoc su dung de:

- luu thong tin room va thanh vien
- luu lorebook va quy tac the gioi
- luu ideas, votes, moderation result
- luu chapter, story snapshot va AI outputs
- luu event log va lich su phat trien cau chuyen

## 4. Tai sao phu hop voi de tai

He thong nay phu hop voi de tai vi:

- co tinh chat da nguoi dung va tuong tac dong thoi
- co nhu cau realtime ro rang
- co the hien vai tro ro net cua Redis trong cache va coordination
- co the hien vai tro ro net cua MongoDB trong luu tru document linh hoat
- co san kich ban demo de quan sat duoc ket qua ngay

## 5. Stack du kien

- Frontend: `Next.js`
- Backend: `NestJS`
- Realtime: `Socket.IO`
- Database: `MongoDB`
- Cache / PubSub / Timer / Lock: `Redis`
- Queue / Worker: `BullMQ`
- ODM: `Mongoose`
- AI service: Gemini hoac OpenAI

## 6. Ket luan

Nhom quyet dinh xay dung san pham theo huong:

**Nen tang dong sang tac tieu thuyet AI realtime da nguoi dung**

Huong nay vua dap ung dung cong nghe cua de tai `WebSocket + Redis + MongoDB`, vua tao ra mot bai toan co tinh moi, co kha nang demo tot, va de trinh bay gia tri ky thuat trong bao cao.
