'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Clock3,
  Loader2,
  LogOut,
  Plus,
  Radio,
  Search,
  Sparkles,
  Timer,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { apiFetch, getUser, logout } from '../../lib/api';

const statusTone: Record<string, string> = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  completed: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  lobby: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
};

const statusTranslation: Record<string, string> = {
  active: 'Đang viết',
  completed: 'Hoàn thành',
  lobby: 'Chờ người',
};

export default function RoomsPage() {
  const router = useRouter();
  const [user, setUserState] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [turnDuration, setTurnDuration] = useState(60);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    router.push('/');
  }, [router]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/rooms');
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng viết');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const newRoom = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: roomName,
          description: roomDesc,
          turnDuration: Number(turnDuration),
          userId: user.id,
        }),
      });

      setIsModalOpen(false);
      setRoomName('');
      setRoomDesc('');
      setTurnDuration(60);

      await apiFetch(`/rooms/${newRoom._id}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      router.push(`/rooms/${newRoom._id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Không thể khởi tạo phòng viết');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await apiFetch(`/rooms/${roomId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      alert(err.message || 'Không thể vào phòng viết này');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredRooms = rooms.filter((room) => {
    const searchText = `${room.name || ''} ${room.description || ''} ${room.code || ''}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020205] text-stone-100">
      <div className="absolute inset-0 aurora-grid opacity-60" />
      <div className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-violet-600/15 blur-[115px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-rose-500/10 blur-[125px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <header className="relative z-10 border-b border-white/10 bg-[#020205]/70 px-5 py-4 backdrop-blur-2xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-left cursor-pointer"
            aria-label="Quay lại trang chủ"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
              <BookOpen className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black tracking-tight text-[#fff6df]">
                AI Novel Co-Lab
              </h2>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-stone-500 sm:block">
                Không gian viết truyện
              </p>
            </div>
          </button>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-stone-100">{user.username}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                  {user.role === 'host' ? 'Trưởng phòng' : 'Đồng tác giả'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-sm font-black text-rose-300">
                {user.username?.charAt(0).toUpperCase() || 'G'}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-stone-300 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-100 cursor-pointer"
                title="Đăng xuất phiên khách"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-[5rem] bg-violet-500/10 pointer-events-none" />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-rose-300">
                <Radio className="h-3.5 w-3.5" />
                Bảng điều khiển trực tiếp
              </div>
              <div>
                <h1 className="font-display text-balance text-4xl font-black leading-tight text-[#fff6df] sm:text-5xl">
                  Chọn phòng sáng tác để bắt đầu đồng viết chương truyện tiếp theo.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400 sm:text-base">
                  Hệ thống hỗ trợ thuyết trình đồ án: phòng demo tạo sẵn, các phòng đang viết, cấu hình lượt thời gian và các chương truyện đồng sáng tác được hiển thị trực quan tại một nơi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-violet-300">{rooms.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-500">Số phòng</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-rose-300">DEMO99</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-500">Mã trải nghiệm</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-cyan-300">60 giây</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-500">Thời gian lượt</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên phòng, mô tả cốt truyện hoặc mã phòng..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-stone-100 outline-none backdrop-blur transition placeholder:text-stone-600 focus:border-violet-500/30 focus:bg-white/10"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-rose-400 px-5 py-3.5 text-sm font-black text-stone-950 shadow-2xl shadow-violet-500/10 hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Khởi Tạo Phòng Viết Mới
          </button>
        </section>

        <section className="mt-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="mb-4 h-9 w-9 animate-spin text-violet-300" />
              <p className="text-sm font-bold text-stone-400">Đang tải danh sách phòng viết...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-3 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6">
              <AlertCircle className="h-5 w-5 text-rose-100" />
              <p className="text-sm font-bold text-rose-100">{error}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-5 py-20 text-center"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-black text-stone-100">Chưa tìm thấy phòng phù hợp</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                Hãy khởi tạo phòng viết mới hoặc nạp dữ liệu phòng thử nghiệm DEMO99 để bắt đầu trình diễn.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-xs font-black text-stone-100 transition hover:bg-white/20 cursor-pointer"
              >
                Khởi tạo phòng ngay
              </button>
            </m.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room, index) => (
                <m.article
                  key={room._id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/10"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/18" />
                  <div className="relative flex min-h-[260px] flex-col justify-between">
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusTone[room.status] || statusTone.lobby}`}>
                          {statusTranslation[room.status] || 'Chờ người'}
                        </span>
                        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-stone-400">
                          <Timer className="h-3.5 w-3.5 text-rose-300" />
                          {room.settings?.turnDuration || 60} giây
                        </div>
                      </div>

                      <div className="mb-4 flex items-start gap-3">
                        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                          <WandSparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="line-clamp-2 text-lg font-black leading-snug text-stone-50">
                            {room.name}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-400">
                            {room.description || 'Không gian đồng sáng tác cốt truyện đang đợi lượt chấp bút.'}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-violet-300">
                        Mã: {room.code}
                      </div>
                    </div>

                    <div className="mt-7 border-t border-white/10 pt-4">
                      <div className="mb-4 flex items-center justify-between text-xs font-bold text-stone-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          Đồng tác giả
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          Vòng lặp AI
                        </span>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room._id)}
                        className="group/button flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-black text-violet-300 transition hover:bg-violet-500/20 cursor-pointer"
                      >
                        Vào phòng viết
                        <ArrowRight className="h-4 w-4 transition group-hover/button:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </m.article>
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl">
            <m.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              className="glass-panel relative w-full max-w-lg rounded-[2rem] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-[4rem] bg-violet-500/10 pointer-events-none" />
              <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5 shrink-0">
                <div>
                  <h3 className="font-display text-2xl font-black text-[#fff6df]">Khởi Tạo Phòng Viết Mới</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                    Không gian đồng sáng tác AI
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-stone-400 transition hover:bg-white/10 hover:text-stone-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="relative flex-1 overflow-y-auto p-6 space-y-4">
                {createError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs font-bold text-rose-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>{createError}</span>
                  </div>
                )}

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Tên phòng viết</span>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỷ Nguyên Số Cyberpunk"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-violet-500/30"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Mô tả cốt truyện</span>
                  <textarea
                    rows={4}
                    placeholder="Mô tả tóm tắt bối cảnh cốt truyện của tác phẩm đồng sáng tác này..."
                    value={roomDesc}
                    onChange={(event) => setRoomDesc(event.target.value)}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm leading-6 text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-violet-500/30"
                  />
                </label>

                <label className="block space-y-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Thời gian mỗi lượt</span>
                    <span className="text-xs font-black text-rose-300">{turnDuration} giây</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={10}
                    value={turnDuration}
                    onChange={(event) => setTurnDuration(Number(event.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-rose-400 outline-none"
                  />
                  <div className="flex justify-between px-1 text-[10px] font-bold text-stone-600">
                    <span>30 giây</span>
                    <span>60 giây</span>
                    <span>120 giây</span>
                    <span>180 giây</span>
                  </div>
                </label>

                <div className="flex items-center gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-black text-stone-300 transition hover:bg-white/10 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex flex-1 items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-rose-400 py-3 text-xs font-black text-stone-950 transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 cursor-pointer rounded-2xl"
                  >
                    {createLoading ? (
                      <>
                         <Loader2 className="h-3.5 w-3.5 animate-spin" />
                         Đang khởi tạo...
                      </>
                    ) : (
                      'Khởi tạo phòng'
                    )}
                  </button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
