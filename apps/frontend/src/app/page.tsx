'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  Plus,
  Radio,
  Search,
  Sparkles,
  Ticket,
  UserRound,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { apiFetch, ensureGuestUser, getUser, logout } from '../lib/api';

const statusLabel: Record<string, string> = {
  lobby: 'Phòng chờ',
  active: 'Đang viết',
  paused: 'Tạm dừng',
  finished: 'Hoàn tất',
  completed: 'Hoàn tất',
};

const journeySteps = [
  {
    title: 'Đặt bút danh',
    body: 'Không cần đăng nhập. Chỉ cần tên hiển thị để mọi người thấy bạn trong phòng viết.',
  },
  {
    title: 'Vào phòng truyện',
    body: 'Dùng DEMO99 để demo nhanh, nhập mã phòng riêng hoặc tạo một phòng mới.',
  },
  {
    title: 'Cùng viết theo lượt',
    body: 'Host mở lượt, Writer gửi ý tưởng, cả nhóm vote, AI viết tiếp chương truyện.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUserState] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('DEMO99');
  const [rooms, setRooms] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [turnDuration, setTurnDuration] = useState(60);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUserState(currentUser);
      setDisplayName(currentUser.username || '');
    }
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await apiFetch('/rooms');
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng viết.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const requireGuest = async () => {
    const cleanName = displayName.trim();
    if (!cleanName) {
      setError('Hãy nhập bút danh trước khi vào phòng viết.');
      return null;
    }

    const nextUser = await ensureGuestUser(cleanName);
    setUserState(nextUser);
    return nextUser;
  };

  const joinByCode = async (code: string) => {
    const activeUser = await requireGuest();
    if (!activeUser) return;

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Hãy nhập mã phòng, ví dụ DEMO99.');
      return;
    }

    const result = await apiFetch('/rooms/join-code', {
      method: 'POST',
      body: JSON.stringify({ code: cleanCode, userId: activeUser.id }),
    });
    router.push(`/rooms/${result.room._id}`);
  };

  const handleJoinCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusyAction('join-code');
    try {
      await joinByCode(roomCode);
    } catch (err: any) {
      setError(err.message || 'Không thể vào phòng bằng mã này.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleJoinDemo = async () => {
    setError(null);
    setBusyAction('demo');
    try {
      const activeUser = await requireGuest();
      if (!activeUser) return;

      await apiFetch('/rooms/seed', { method: 'POST' });
      const result = await apiFetch('/rooms/join-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'DEMO99', userId: activeUser.id }),
      });
      router.push(`/rooms/${result.room._id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể khởi động phòng demo DEMO99.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setError(null);
    setBusyAction(`room:${roomId}`);
    try {
      const activeUser = await requireGuest();
      if (!activeUser) return;

      await apiFetch(`/rooms/${roomId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: activeUser.id }),
      });
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tham gia phòng viết này.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusyAction('create');

    try {
      const activeUser = await requireGuest();
      if (!activeUser) return;

      if (!roomName.trim()) {
        setError('Hãy đặt tên phòng viết.');
        return;
      }

      const room = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          userId: activeUser.id,
          name: roomName.trim(),
          description: roomDesc.trim() || 'Một phòng đồng sáng tác tiểu thuyết realtime.',
          turnDuration: Number(turnDuration),
        }),
      });

      await apiFetch(`/rooms/${room._id}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: activeUser.id }),
      });

      router.push(`/rooms/${room._id}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo phòng viết.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = () => {
    logout();
    setUserState(null);
    setDisplayName('');
  };

  const filteredRooms = rooms.filter((room) => {
    const text = `${room.name || ''} ${room.description || ''} ${room.code || ''}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fafd] text-slate-800">
      <div className="absolute inset-0 aurora-grid opacity-20" />
      <div className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-sky-200/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-12 h-96 w-96 rounded-full bg-pink-200/35 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/30 blur-[110px]" />

      {busyAction && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/82 backdrop-blur-md">
          <Loader2 className="mb-4 h-11 w-11 animate-spin text-sky-500" />
          <p className="text-sm font-black text-slate-700">Đang chuẩn bị phòng viết...</p>
        </div>
      )}

      <header className="relative z-10 border-b border-sky-100 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-2xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50">
              <BookOpen className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black tracking-tight text-slate-900">
                AI Novel Co-Lab
              </h1>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 sm:block">
                Phòng viết truyện realtime
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-slate-700">{user.username}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Tác giả khách
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              >
                <LogOut className="h-4 w-4" />
                Thoát
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-10">
        <div className="space-y-5">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.25rem] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(56,189,248,0.10)] backdrop-blur"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">
              <Sparkles className="h-3.5 w-3.5" />
              Bắt đầu trong 30 giây
            </div>
            <h2 className="font-display text-balance text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
              Vào phòng, viết ý tưởng, để AI biến nó thành chương truyện.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Trải nghiệm được thiết kế lại theo một hành trình rõ ràng: đặt bút danh,
              chọn phòng, vào lobby, gửi ý tưởng, vote và xem Novel View cập nhật realtime.
            </p>

            <div className="mt-6 grid gap-3">
              {journeySteps.map((step, index) => (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-sky-600 shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-slate-100 bg-white/86 p-5 shadow-sm"
          >
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Bút danh của bạn
            </p>
            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError(null);
                }}
                maxLength={32}
                placeholder="Ví dụ: Minh Anh"
                className="w-full rounded-2xl border border-sky-100 bg-white py-4 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Bút danh chỉ dùng trong phiên demo để hiển thị presence và phân biệt lượt vote.
            </p>
          </m.div>
        </div>

        <div className="space-y-5">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[2.25rem] border border-sky-100 bg-white/90 p-5 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Chọn cách vào phòng
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">Bạn muốn bắt đầu thế nào?</h3>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Demo safe
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={handleJoinDemo}
                className="group rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
                  <Radio className="h-5 w-5" />
                </div>
                <p className="text-base font-black text-slate-900">Dùng phòng DEMO99</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Tự seed dữ liệu mẫu, vào phòng ngay và phù hợp nhất để bảo vệ đồ án.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-sky-600">
                  Vào demo <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="group rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-base font-black text-slate-900">Tạo phòng truyện mới</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Tự đặt tên tác phẩm, mô tả bối cảnh và thời lượng mỗi lượt viết.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-pink-600">
                  Tạo phòng <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>

            <form onSubmit={handleJoinCode} className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Hoặc vào bằng mã phòng
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Ticket className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="DEMO99"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm font-black uppercase tracking-[0.22em] text-slate-800 outline-none transition focus:border-sky-300"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-700"
                >
                  Vào phòng
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-[2.25rem] border border-slate-100 bg-white/86 p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Phòng hiện có
                </p>
                <p className="mt-1 text-sm font-bold text-slate-700">
                  Chọn một phòng đang có hoặc dùng DEMO99 để demo nhanh.
                </p>
              </div>
              <div className="relative sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm phòng..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-sky-300"
                />
              </div>
            </div>

            {loadingRooms ? (
              <div className="flex items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 py-12 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                Đang tải phòng viết...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 py-12 text-center">
                <WandSparkles className="mx-auto mb-3 h-8 w-8 text-sky-400" />
                <p className="text-sm font-black text-slate-700">Chưa có phòng phù hợp.</p>
                <p className="mt-1 text-xs text-slate-500">Hãy tạo phòng mới hoặc dùng DEMO99.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredRooms.map((room) => (
                  <button
                    key={room._id}
                    onClick={() => handleJoinRoom(room._id)}
                    className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600">
                        {statusLabel[room.status] || 'Phòng chờ'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {room.settings?.turnDuration || 60}s
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-black text-slate-900">{room.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {room.description || 'Một phòng đồng sáng tác tiểu thuyết realtime.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="rounded-xl bg-pink-50 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-pink-600">
                        {room.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-sky-600">
                        Tham gia <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </m.div>
        </div>
      </section>

      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <m.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Tạo phòng truyện mới</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Thiết lập bối cảnh trước khi viết
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 p-6">
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tên tác phẩm/phòng</span>
                  <input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    placeholder="Ví dụ: Bí ẩn hành tinh thứ 9"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-sky-300"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tóm tắt bối cảnh</span>
                  <textarea
                    rows={4}
                    value={roomDesc}
                    onChange={(event) => setRoomDesc(event.target.value)}
                    placeholder="Câu chuyện xảy ra ở đâu? Nhân vật đang đối mặt với điều gì?"
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 text-sm leading-6 outline-none transition focus:border-sky-300"
                  />
                </label>

                <label className="block space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Thời gian mỗi lượt</span>
                    <span className="text-xs font-black text-sky-600">{turnDuration} giây</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={10}
                    value={turnDuration}
                    onChange={(event) => setTurnDuration(Number(event.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-sky-100 accent-sky-500 outline-none"
                  />
                </label>

                <div className="flex gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-black text-white transition hover:bg-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Tạo và vào phòng
                  </button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
