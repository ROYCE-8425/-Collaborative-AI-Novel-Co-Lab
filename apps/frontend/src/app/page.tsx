'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  BookHalf,
  PeopleFill,
  HourglassSplit,
  ArrowRightShort,
  PlusLg,
  Search as SearchIcon,
  BoxArrowRight,
  LightningFill,
  X as XIcon,
  QuestionCircleFill,
  PatchCheckFill,
  ExclamationCircleFill,
  PersonHeart,
  Activity,
  PenFill,
  Database as DbIcon,
  CpuFill,
  StarFill,
  CloudSunFill,
} from 'react-bootstrap-icons';
import { Loader2 } from 'lucide-react'; // keep loader-spin for standard usage
import { apiFetch, ensureGuestUser, getUser, logout } from '../lib/api';

const statusTone: Record<string, string> = {
  active: 'border-sky-200 bg-sky-50/70 text-sky-600',
  completed: 'border-emerald-200 bg-emerald-50/70 text-emerald-600',
  lobby: 'border-pink-200 bg-pink-50/70 text-pink-600 animate-pulse',
};

const statusTranslation: Record<string, string> = {
  active: 'Đang viết',
  completed: 'Hoàn thành',
  lobby: 'Chờ người',
};

const roomNames = [
  'Tinh Vân Ký Sự',
  'Hành Trình Vô Tận',
  'Ảo Ảnh Thời Không',
  'Thiên Hà Ký Ức',
  'Biên Niên Sử Cổ Đại',
  'Bí Ẩn Đại Dương',
  'Lời Nguyền Cổ Tự',
  'Kỷ Nguyên Hơi Nước',
  'Khải Huyền Ký'
];

const roomDescs = [
  'Không gian đồng sáng tác bối cảnh viễn tưởng du hành giữa các tinh cầu xa xôi.',
  'Hành trình phiêu lưu khám phá những bí ẩn thần thoại nằm ngoài thời gian.',
  'Cuộc chiến ma thuật giữa các gia tộc cổ xưa tranh giành thánh vật vạn năm.',
  'Khám phá bí mật ẩn giấu dưới đáy biển sâu cùng vết tích văn minh Atlantis.',
  'Kỷ nguyên hơi nước ngập tràn máy móc bánh răng cùng những thí nghiệm điên rồ.'
];

export default function GuestEntryPage() {
  const router = useRouter();
  
  // App states
  const [user, setUserState] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nickname Modal states
  const [isNickModalOpen, setIsNickModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nickError, setNickError] = useState<string | null>(null);
  const [savingNick, setSavingNick] = useState(false);
  
  // Action queue state (to resume what user clicked after entering nickname)
  const [pendingAction, setPendingAction] = useState<{
    type: 'join' | 'create_quick' | 'create_manual';
    targetRoomId?: string;
  } | null>(null);

  // Manual Room Creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manualRoomName, setManualRoomName] = useState('');
  const [manualRoomDesc, setManualRoomDesc] = useState('');
  const [manualDuration, setManualDuration] = useState(60);
  const [creatingManual, setCreatingManual] = useState(false);
  const [createManualError, setCreateManualError] = useState<string | null>(null);

  // Seed & Quick action states
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    // 1. Check current logged-in guest user
    const currentUser = getUser();
    if (currentUser) {
      setUserState(currentUser);
    }
    
    // 2. Fetch active rooms
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const data = await apiFetch('/rooms');
      setRooms(data);
    } catch (err: any) {
      setRoomsError(err.message || 'Không thể tải danh sách phòng viết.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserState(null);
  };

  // Generate random nickname for lazy users
  const handleRandomNickname = () => {
    const prefixes = ['Vô Danh', 'Mộng Mơ', 'Ẩn Sĩ', 'Kẻ Hành Trình', 'Sách Cổ', 'Tác Giả', 'Thi Sĩ', 'Đồng Nghiệp', 'Bút Ngâm'];
    const suffixes = ['Vũ Trụ', 'Ngàn Năm', 'Số 99', 'Huyền Bí', 'Kỳ Lạ', 'Thầm Lặng', 'Không Gian', 'Ảo Mộng'];
    const randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]} ${Math.floor(10 + Math.random() * 90)}`;
    setNicknameInput(randomName);
    setNickError(null);
  };

  // Select a room to join
  const handleSelectRoom = (roomId: string) => {
    if (user) {
      // If user exists, join directly
      joinRoomProcess(roomId);
    } else {
      // Queue action and open nickname modal
      setPendingAction({ type: 'join', targetRoomId: roomId });
      setIsNickModalOpen(true);
    }
  };

  const joinRoomProcess = async (roomId: string) => {
    setGlobalLoading(true);
    try {
      // Join room via API
      await apiFetch(`/rooms/${roomId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id || getUser()?.id }),
      });
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      alert(err.message || 'Không thể vào phòng viết này.');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Click Quick Create Room
  const handleTriggerQuickCreate = () => {
    if (user) {
      quickCreateRoomProcess();
    } else {
      setPendingAction({ type: 'create_quick' });
      setIsNickModalOpen(true);
    }
  };

  const quickCreateRoomProcess = async () => {
    setGlobalLoading(true);
    try {
      const activeUser = user || getUser();
      const randName = `${roomNames[Math.floor(Math.random() * roomNames.length)]} #${Math.floor(100 + Math.random() * 899)}`;
      const randDesc = roomDescs[Math.floor(Math.random() * roomDescs.length)];
      
      const newRoom = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          userId: activeUser.id,
          name: randName,
          description: randDesc,
          turnDuration: 60,
        }),
      });

      // Join new room automatically
      await apiFetch(`/rooms/${newRoom._id}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: activeUser.id }),
      });

      router.push(`/rooms/${newRoom._id}`);
    } catch (err: any) {
      alert(err.message || 'Không thể tạo phòng viết nhanh.');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Save nickname from modal
  const handleSaveNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nicknameInput.trim();
    if (!cleanName) {
      setNickError('Vui lòng nhập tên bút danh của bạn.');
      return;
    }

    setSavingNick(true);
    setNickError(null);

    try {
      const newUser = await ensureGuestUser(cleanName);
      setUserState(newUser);
      setIsNickModalOpen(false);
      setNicknameInput('');

      // Execute queued action
      if (pendingAction) {
        if (pendingAction.type === 'join' && pendingAction.targetRoomId) {
          // Join room
          setGlobalLoading(true);
          try {
            await apiFetch(`/rooms/${pendingAction.targetRoomId}/join`, {
              method: 'POST',
              body: JSON.stringify({ userId: newUser.id }),
            });
            router.push(`/rooms/${pendingAction.targetRoomId}`);
          } catch (err: any) {
            alert(err.message || 'Không thể vào phòng viết này.');
            setGlobalLoading(false);
          }
        } else if (pendingAction.type === 'create_quick') {
          // Quick create room
          setGlobalLoading(true);
          try {
            const randName = `${roomNames[Math.floor(Math.random() * roomNames.length)]} #${Math.floor(100 + Math.random() * 899)}`;
            const randDesc = roomDescs[Math.floor(Math.random() * roomDescs.length)];
            
            const newRoom = await apiFetch('/rooms', {
              method: 'POST',
              body: JSON.stringify({
                userId: newUser.id,
                name: randName,
                description: randDesc,
                turnDuration: 60,
              }),
            });
      
            await apiFetch(`/rooms/${newRoom._id}/join`, {
              method: 'POST',
              body: JSON.stringify({ userId: newUser.id }),
            });
      
            router.push(`/rooms/${newRoom._id}`);
          } catch (err: any) {
            alert(err.message || 'Không thể tạo phòng nhanh.');
            setGlobalLoading(false);
          }
        } else if (pendingAction.type === 'create_manual') {
          setIsCreateModalOpen(true);
        }
        setPendingAction(null);
      }
    } catch (err: any) {
      setNickError(err.message || 'Không thể thiết lập bút danh.');
    } finally {
      setSavingNick(false);
    }
  };

  // Open nickname edit
  const handleOpenEditNickname = () => {
    if (user) {
      setNicknameInput(user.username);
    }
    setPendingAction(null);
    setIsNickModalOpen(true);
  };

  // Trigger Manual Room creation
  const handleTriggerManualCreate = () => {
    if (user) {
      setIsCreateModalOpen(true);
    } else {
      setPendingAction({ type: 'create_manual' });
      setIsNickModalOpen(true);
    }
  };

  const handleManualCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRoomName.trim()) {
      setCreateManualError('Vui lòng nhập tên phòng.');
      return;
    }

    setCreatingManual(true);
    setCreateManualError(null);

    try {
      const activeUser = user || getUser();
      const newRoom = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          userId: activeUser.id,
          name: manualRoomName.trim(),
          description: manualRoomDesc.trim(),
          turnDuration: Number(manualDuration),
        }),
      });

      await apiFetch(`/rooms/${newRoom._id}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: activeUser.id }),
      });

      setIsCreateModalOpen(false);
      setManualRoomName('');
      setManualRoomDesc('');
      setManualDuration(60);
      router.push(`/rooms/${newRoom._id}`);
    } catch (err: any) {
      setCreateManualError(err.message || 'Không thể khởi tạo phòng viết.');
    } finally {
      setCreatingManual(false);
    }
  };

  // Setup DEMO99 Room fast
  const handleJoinDemoRoom = async () => {
    // 1. Setup user if not exists
    let activeUser = user;
    if (!activeUser) {
      const randomNames = ['Minh Anh', 'Bảo Nam', 'Khánh Linh', 'Quốc Bảo', 'Thùy Chi', 'Hữu Đạt', 'Hoài An', 'Gia Bách'];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)] + ' ' + Math.floor(10 + Math.random() * 90);
      setGlobalLoading(true);
      try {
        activeUser = await ensureGuestUser(randomName);
        setUserState(activeUser);
      } catch (err) {
        alert('Lỗi khởi tạo bút danh demo.');
        setGlobalLoading(false);
        return;
      }
    }

    // 2. Call seed endpoint first to ensure DEMO99 exists
    setGlobalLoading(true);
    try {
      await apiFetch('/rooms/seed', {
        method: 'POST',
      });
      
      // Get room id from code
      const result = await apiFetch('/rooms/join-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'DEMO99', userId: activeUser.id }),
      });
      router.push(`/rooms/${result.room._id}`);
    } catch (err: any) {
      alert(err.message || 'Phòng DEMO99 chưa được khởi tạo trên server.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const searchText = `${room.name || ''} ${room.description || ''} ${room.code || ''}`.toLowerCase();
    return searchText.includes(searchQuery.trim().toLowerCase());
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fafd] text-slate-800 font-sans flex flex-col">
      {/* Background decorations */}
      <div className="absolute inset-0 aurora-grid opacity-20 pointer-events-none" />
      <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-pink-200/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-sky-200/30 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-100/20 blur-[120px]" />

      {/* Cute Floating Shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none opacity-40">
        {/* Shape Group 1 - Top Right */}
        <div className="absolute top-[5%] right-[8%] flex flex-col items-end gap-2 text-sky-300/40">
          <CloudSunFill className="w-16 h-16 animate-bounce" style={{ animationDuration: '6s' }} />
          <StarFill className="w-8 h-8 text-pink-300/30 rotate-12" />
        </div>
        {/* Shape Group 2 - Bottom Left */}
        <div className="absolute bottom-[10%] left-[6%] flex flex-col items-start gap-2 text-emerald-300/40">
          <StarFill className="w-12 h-12 text-emerald-200/40 animate-pulse" />
          <CloudSunFill className="w-14 h-14 text-sky-200/40" />
        </div>
        {/* Scattered glowing bits */}
        <div className="absolute top-[18%] left-[28%] w-4 h-4 bg-pink-400/30 rounded-full animate-ping" />
        <div className="absolute top-[60%] right-[18%] w-6 h-6 bg-sky-400/20 rounded-full animate-pulse" />
      </div>

      {/* Global Loading overlay */}
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-700">Vui lòng đợi trong giây lát...</p>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-20 w-full border-b border-sky-100 bg-white/80 backdrop-blur-2xl px-5 py-4 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50">
            <BookHalf className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-pink-500">
              AI Novel Co-Lab
            </h1>
            <p className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 sm:block">
              Không gian viết truyện đồng sáng tác
            </p>
          </div>
        </div>

        {/* User profile action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-slate-700">{user.username}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Tác giả khách
                </p>
              </div>
              <button 
                onClick={handleOpenEditNickname}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sm font-black text-sky-600 hover:bg-sky-100 transition-all cursor-pointer shadow-xs"
                title="Thay đổi bút danh"
              >
                {user.username?.charAt(0).toUpperCase() || 'G'}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600 transition hover:border-pink-500/30 hover:bg-pink-50 hover:text-pink-600 cursor-pointer shadow-xs"
                title="Đăng xuất"
              >
                <BoxArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenEditNickname}
              className="px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-black text-sky-600 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <PersonHeart className="w-3.5 h-3.5" />
              Đặt Bút Danh
            </button>
          )}
        </div>
      </header>

      {/* Main Container splits info and rooms feed */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-5 py-6 sm:px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8">
        
        {/* Left Column: Welcome & Room List */}
        <div className="flex flex-col space-y-6">
          <m.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-[2.5rem] border border-sky-100 bg-gradient-to-br from-white/95 via-sky-50/40 to-white/95 relative overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(56,189,248,0.08)]"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-100/30 blur-[60px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-sky-200/20 blur-[80px] pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-sky-600">
                <Activity className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
                Sảnh Phòng Trực Tiếp
              </span>
              <h2 className="font-display text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-sky-700 to-pink-600 leading-tight">
                Mở phòng viết hoặc chọn phòng đang hoạt động bên dưới
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                Hệ thống cho phép các tác giả cùng lúc kết nối để viết nên những chương truyện hấp dẫn, được kiểm định nhất quán cốt truyện và chấp bút thơ văn nhờ AI thế hệ mới.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
              <div className="rounded-2xl border border-sky-100 bg-white/95 hover:border-sky-300 transition-all p-3.5 shadow-xs">
                <p className="text-2xl font-black text-sky-500">{rooms.length}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">Phòng viết</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/95 hover:border-emerald-300 transition-all p-3.5 cursor-pointer shadow-xs" onClick={handleJoinDemoRoom}>
                <p className="text-2xl font-black text-emerald-500">DEMO99</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">Phòng nhanh ➜</p>
              </div>
              <div className="rounded-2xl border border-pink-100 bg-white/95 hover:border-pink-300 transition-all p-3.5 shadow-xs">
                <p className="text-2xl font-black text-pink-500">60s</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">Thời gian lượt</p>
              </div>
            </div>
          </m.div>

          {/* Quick Filter & Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm phòng viết, mô tả hoặc mã..."
                className="w-full rounded-2xl border border-sky-100 bg-white/90 py-3.5 pl-11 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white text-slate-800 shadow-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTriggerQuickCreate}
                className="flex-1 sm:flex-none gap-1.5 rounded-2xl px-5 py-3.5 text-xs fs-btn-green flex items-center justify-center cursor-pointer transition-all"
                title="Tự động tạo phòng và vào viết ngay"
              >
                <StarFill className="w-3.5 h-3.5 animate-pulse" />
                Tạo Phòng Nhanh
              </button>
              <button
                onClick={handleTriggerManualCreate}
                className="flex-1 sm:flex-none gap-1.5 rounded-2xl px-5 py-3.5 text-xs border border-sky-200 bg-white hover:bg-sky-50 text-sky-600 flex items-center justify-center cursor-pointer transition-all"
                title="Cấu hình phòng viết mới thủ công"
              >
                <PlusLg className="w-3.5 h-3.5" />
                Tạo Phòng Thủ Công
              </button>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[calc(100vh-420px)] lg:max-h-[calc(100vh-320px)] pb-6">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-sky-500" />
                <p className="text-xs font-bold text-slate-500">Đang cập nhật sảnh phòng...</p>
              </div>
            ) : roomsError ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-pink-300/35 bg-pink-50 p-5">
                <ExclamationCircleFill className="h-5 w-5 text-pink-550" />
                <p className="text-xs font-bold text-pink-600">{roomsError}</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-white/70 p-12 text-center shadow-xs">
                <StarFill className="h-6 w-6 text-sky-400 mx-auto mb-2 animate-bounce" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có phòng viết nào</h3>
                <p className="text-xs text-slate-500 mt-1">Hãy bấm nút "Tạo Phòng Nhanh" hoặc dùng phòng "DEMO99" để trải nghiệm ngay.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((room, idx) => (
                  <m.article
                    key={room._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    onClick={() => handleSelectRoom(room._id)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer bg-white ${
                      room.status === 'active' || room.status === 'voting' || room.status === 'writing'
                        ? 'border-l-4 border-l-sky-400 border-sky-100 hover:border-sky-300'
                        : 'border-l-4 border-l-pink-400 border-sky-100 hover:border-sky-300'
                    }`}
                  >
                    <div className="relative flex flex-col justify-between h-full min-h-[140px]">
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-2.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${statusTone[room.status] || statusTone.lobby}`}>
                            {statusTranslation[room.status] || 'Chờ người'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            Lượt: {room.settings?.turnDuration || 60}s
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {room.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {room.description || 'Không gian đồng sáng tác tiểu thuyết cùng các tác giả và AI.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-sky-50 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono text-pink-500 bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded">
                          Mã: {room.code}
                        </span>
                        <span className="flex items-center gap-1 hover:text-sky-600 transition-colors font-bold">
                          Tham gia ngay ➜
                        </span>
                      </div>
                    </div>
                  </m.article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Intro & Concept */}
        <div className="hidden lg:flex flex-col space-y-6">
          
          {/* AI Info & Engine Card */}
          <m.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-[2.5rem] border border-sky-100 bg-gradient-to-br from-white/95 via-sky-50/20 to-white/90 relative overflow-hidden shadow-[0_20px_50px_rgba(56,189,248,0.06)]"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/20 blur-[50px] pointer-events-none" />
            <h3 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-500 uppercase tracking-widest mb-4 flex items-center gap-2 select-none">
              <LightningFill className="w-4 h-4 text-sky-500 animate-pulse" />
              Kiến Trúc AI Hệ Thống
            </h3>
            
            <div className="relative space-y-4 pt-2">
              {/* Visual pipeline connector */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-sky-300 via-pink-200 to-emerald-300 border-dashed border-l border-sky-100 pointer-events-none" />

              <div className="relative pl-12 p-4 bg-white border border-sky-100/60 hover:border-sky-300 transition-all rounded-2xl space-y-2 shadow-xs">
                {/* Flow Step Badge */}
                <div className="absolute left-[11px] top-5 w-6.5 h-6.5 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-[10px] font-mono text-sky-600 font-bold z-10">01</div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">AI Lore Checker</span>
                  <span className="text-[10px] text-sky-600 font-mono font-bold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">Gemini 2.5 Flash Lite</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tự động phân tích tính nhất quan của ý tưởng gửi lên với thiết lập bối cảnh có sẵn trong Lorebook cốt truyện.
                </p>
              </div>

              <div className="relative pl-12 p-4 bg-white border border-sky-100/60 hover:border-sky-300 transition-all rounded-2xl space-y-2 shadow-xs">
                <div className="absolute left-[11px] top-5 w-6.5 h-6.5 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-[10px] font-mono text-pink-600 font-bold z-10">02</div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">AI Writer Engine</span>
                  <span className="text-[10px] text-pink-650 font-mono font-bold bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">Grok (xAI)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhận ý tưởng chiến thắng từ bình chọn ẩn danh của các tác giả để chấp bút mở rộng thành chương truyện văn học sinh động.
                </p>
              </div>

              <div className="relative pl-12 p-4 bg-white border border-sky-100/60 hover:border-sky-300 transition-all rounded-2xl space-y-2 shadow-xs">
                <div className="absolute left-[11px] top-5 w-6.5 h-6.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-mono text-emerald-600 font-bold z-10">03</div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">AI Structure Manager</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Gemini 2.5 Flash Lite</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tính toán ngữ nghĩa, định vị chương hồi để quyết định viết tiếp vào chương cũ hay mở ra chương mới tự động.
                </p>
              </div>
            </div>
          </m.div>

          {/* Quick instruction board */}
          <m.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-[2.5rem] border border-emerald-100 bg-gradient-to-br from-white/95 via-emerald-50/20 to-white/90 relative overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.05)]"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/20 blur-[50px] pointer-events-none" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 select-none relative z-10">
              Quy Trình Sáng Tác Đồng Thời
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 relative z-10">
              <div className="rounded-2xl border border-sky-100 bg-white hover:border-sky-300 transition-all p-3.5 leading-relaxed shadow-xs">
                <PenFill className="mb-2 h-4 w-4 text-sky-500" />
                <strong>1. Gửi ý tưởng:</strong> Mỗi tác giả sẽ có 60s đóng góp diễn biến truyện tiếp theo cho lượt viết hiện tại.
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white hover:border-sky-300 transition-all p-3.5 leading-relaxed shadow-xs">
                <CpuFill className="mb-2 h-4 w-4 text-sky-500" />
                <strong>2. Bình chọn & AI viết:</strong> Các tác giả bình chọn ẩn danh để chọn ra hướng truyện hay nhất làm tư liệu cho AI.
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* POPUP 1: NICKNAME SETTING MODAL */}
      <AnimatePresence>
        {isNickModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <m.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              className="glass-panel relative w-full max-w-md rounded-[2rem] p-6 sm:p-8 overflow-hidden shadow-2xl border border-sky-100"
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-sky-200/20 blur-[60px] pointer-events-none" />
              
              <div className="relative flex items-center justify-between border-b border-sky-100 pb-4 mb-5">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-800">Đặt Bút Danh Của Bạn</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sách ký danh tác giả
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNickModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <XIcon className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNicknameSubmit} className="relative space-y-4">
                {nickError && (
                  <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 p-3 text-xs font-bold text-pink-600">
                    <ExclamationCircleFill className="h-4 w-4 shrink-0 text-pink-500" />
                    <span>{nickError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tên bút danh</span>
                    <button
                      type="button"
                      onClick={handleRandomNickname}
                      className="text-[10px] font-black text-sky-650 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Tự sinh tên ngẫu nhiên
                    </button>
                  </div>
                  <div className="relative">
                    <PersonHeart className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={nicknameInput}
                      onChange={(e) => {
                        setNicknameInput(e.target.value);
                        setNickError(null);
                      }}
                      maxLength={24}
                      required
                      placeholder="Ví dụ: Lãng Khách Cô Độc, Thi Sĩ Vũ Trụ..."
                      className="w-full rounded-2xl border border-sky-250 bg-white py-3.5 pl-11 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-sky-50 pt-5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsNickModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={savingNick || !nicknameInput.trim()}
                    className="flex-1 py-2.5 text-xs rounded-xl disabled:opacity-50 fs-btn-green"
                  >
                    {savingNick ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Xác nhận Bút danh'
                    )}
                  </button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP 2: MANUAL CREATE ROOM MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <m.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              className="glass-panel relative w-full max-w-md rounded-[2rem] p-6 sm:p-8 overflow-hidden shadow-2xl border border-sky-100"
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-sky-200/20 blur-[60px] pointer-events-none" />
              
              <div className="relative flex items-center justify-between border-b border-sky-100 pb-4 mb-5">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-800">Khởi Tạo Phòng Viết Mới</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cấu hình không gian đồng sáng tác
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <XIcon className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleManualCreateSubmit} className="relative space-y-4">
                {createManualError && (
                  <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 p-3 text-xs font-bold text-pink-650">
                    <ExclamationCircleFill className="h-4 w-4 shrink-0 text-pink-500" />
                    <span>{createManualError}</span>
                  </div>
                )}

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tên phòng viết</span>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỷ Nguyên Số Cyberpunk..."
                    value={manualRoomName}
                    onChange={(e) => setManualRoomName(e.target.value)}
                    className="w-full rounded-2xl border border-sky-200 bg-white py-3 px-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Mô tả bối cảnh / cốt truyện chính</span>
                  <textarea
                    rows={4}
                    placeholder="Mô tả tóm tắt bối cảnh cốt truyện của tác phẩm đồng sáng tác này..."
                    value={manualRoomDesc}
                    onChange={(e) => setManualRoomDesc(e.target.value)}
                    className="w-full resize-none rounded-2xl border border-sky-200 bg-white py-3 px-4 text-xs leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                  />
                </label>

                <label className="block space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Thời gian mỗi lượt</span>
                    <span className="text-xs font-black text-sky-600">{manualDuration} giây</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={10}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-sky-100 accent-sky-500 outline-none"
                  />
                  <div className="flex justify-between px-1 text-[9px] font-bold text-slate-400">
                    <span>30s</span>
                    <span>60s</span>
                    <span>120s</span>
                    <span>180s</span>
                  </div>
                </label>

                <div className="flex items-center gap-3 border-t border-sky-50 pt-5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={creatingManual || !manualRoomName.trim()}
                    className="flex-1 py-2.5 text-xs rounded-xl disabled:opacity-50 fs-btn-green"
                  >
                    {creatingManual ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
    </main>
  );
}
