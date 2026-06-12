'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookHalf, PeopleFill, HourglassSplit, Clock, 
  PlusLg, X, SendFill, CheckCircleFill, XCircleFill, ExclamationCircleFill, 
  HandThumbsUpFill, Check, ChevronRight, QuestionCircleFill, StarFill, Terminal
} from 'react-bootstrap-icons';
import { Loader2 } from 'lucide-react';
import { apiFetch, getUser } from '../../../lib/api';
import { getSocket, disconnectSocket } from '../../../lib/socket';
import { PresenceAvatars } from '../../../components/PresenceAvatars';
import { PhaseStepper } from '../../../components/PhaseStepper';
import { HostControlPanel } from '../../../components/HostControlPanel';
import { NovelReader } from '../../../components/NovelReader';
import { LorebookDrawer } from '../../../components/LorebookDrawer';
import { RealtimeLogDrawer } from '../../../components/RealtimeLogDrawer';
import { StoryBriefCard } from '../../../components/StoryBriefCard';
import { StructuredIdeaForm } from '../../../components/StructuredIdeaForm';

interface ParsedIdea {
  proposedAction: string;
  locationOrTarget: string;
  consequence: string;
  tone: string;
  optionalNote: string;
  isStructured: boolean;
}

function parseStructuredIdea(content: string): ParsedIdea {
  const defaultRes = {
    proposedAction: '',
    locationOrTarget: '',
    consequence: '',
    tone: '',
    optionalNote: '',
    isStructured: false,
  };

  if (!content) return defaultRes;

  const actionMatch = content.match(/Hành động:\s*([\s\S]*?)(?=\nBối cảnh\/đối tượng:|$)/i);
  const locationMatch = content.match(/Bối cảnh\/đối tượng:\s*([\s\S]*?)(?=\nHậu quả:|$)/i);
  const consequenceMatch = content.match(/Hậu quả:\s*([\s\S]*?)(?=\nTông cảm xúc:|$)/i);
  const toneMatch = content.match(/Tông cảm xúc:\s*([\s\S]*?)(?=\nGhi chú cho AI:|$)/i);
  const noteMatch = content.match(/Ghi chú cho AI:\s*([\s\S]*?)$/i);

  if (actionMatch && locationMatch && consequenceMatch) {
    return {
      proposedAction: actionMatch[1].trim(),
      locationOrTarget: locationMatch[1].trim(),
      consequence: consequenceMatch[1].trim(),
      tone: toneMatch ? toneMatch[1].trim() : 'không chỉ định',
      optionalNote: noteMatch ? noteMatch[1].trim() : 'không có',
      isStructured: true,
    };
  }

  return defaultRes;
}

function RenderIdeaContent({ content }: { content: string }) {
  const parsed = parseStructuredIdea(content);

  if (!parsed.isStructured) {
    return <p className="text-xs text-slate-800 leading-relaxed font-medium italic">"{content}"</p>;
  }

  return (
    <div className="space-y-1.5 text-[11px] text-slate-700 bg-white/40 p-3 border border-sky-100/50 rounded-xl leading-normal text-left font-sans not-italic">
      <div>
        <span className="font-extrabold text-sky-600 block text-[9px] uppercase tracking-wider">⚡ Hành động:</span>
        <span className="font-medium text-slate-800">{parsed.proposedAction}</span>
      </div>
      <div>
        <span className="font-extrabold text-pink-600 block text-[9px] uppercase tracking-wider">📍 Bối cảnh:</span>
        <span className="font-medium text-slate-750">{parsed.locationOrTarget}</span>
      </div>
      <div>
        <span className="font-extrabold text-emerald-600 block text-[9px] uppercase tracking-wider">🔥 Hậu quả:</span>
        <span className="font-medium text-slate-750">{parsed.consequence}</span>
      </div>
      {(parsed.tone && parsed.tone !== 'không chỉ định') && (
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-405 text-[9px] uppercase tracking-wider">🎭 Tông:</span>
          <span className="font-bold text-pink-500 bg-pink-50/50 border border-pink-100/30 px-1 py-0.5 rounded text-[9px]">{parsed.tone}</span>
        </div>
      )}
      {(parsed.optionalNote && parsed.optionalNote !== 'không có') && (
        <div>
          <span className="font-extrabold text-slate-405 block text-[9px] uppercase tracking-wider">📝 Ghi chú:</span>
          <span className="italic text-slate-500 font-medium">{parsed.optionalNote}</span>
        </div>
      )}
    </div>
  );
}

export default function RoomWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [activeTurn, setActiveTurn] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lorebook, setLorebook] = useState<any>(null);
  const [presenceList, setPresenceList] = useState<any[]>([]);

  // Local interaction states
  const [ideaContent, setIdeaContent] = useState('');
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [hasVoted, setHasVoted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Drawer toggles
  const [isLoreOpen, setIsLoreOpen] = useState(false);
  const [newLoreKey, setNewLoreKey] = useState('');
  const [newLoreContent, setNewLoreContent] = useState('');
  const [addingLore, setAddingLore] = useState(false);

  // Realtime connection and event logger states
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>('disconnected');
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [lastPublishedChapterId, setLastPublishedChapterId] = useState<string | null>(null);
  const [writingProgressStep, setWritingProgressStep] = useState(0);

  // Reader scroll ref
  const readerEndRef = useRef<HTMLDivElement>(null);

  const addLog = (event: string, data: any) => {
    setRealtimeLogs((prev) => {
      const entry = {
        timestamp: new Date().toLocaleTimeString(),
        event,
        data,
      };
      return [entry, ...prev].slice(0, 10);
    });
  };

  // Simulate AI Writing steps progress
  useEffect(() => {
    if (activeTurn?.status !== 'writing') {
      setWritingProgressStep(0);
      return;
    }
    const t1 = setTimeout(() => setWritingProgressStep(1), 1200);
    const t2 = setTimeout(() => setWritingProgressStep(2), 2400);
    const t3 = setTimeout(() => setWritingProgressStep(3), 3600);
    const t4 = setTimeout(() => setWritingProgressStep(4), 4800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [activeTurn?.status]);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
    initializeRoom();

    return () => {
      disconnectSocket();
    };
  }, [roomId, router]);

  const initializeRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Room State
      const currentUser = getUser();
      const state = await apiFetch(`/rooms/${roomId}/state${currentUser ? `?userId=${currentUser.id}` : ''}`);
      setRoom(state.room);
      setActiveTurn(state.activeTurn);
      setIdeas(state.ideas || []);
      setTimer(state.timer || 0);
      if (state.hasVoted) {
        setHasVoted(state.votedIdeaId);
      }

      // 2. Fetch Chapters
      const chaptersData = await apiFetch(`/rooms/${roomId}/chapters`);
      setChapters(chaptersData || []);

      // 3. Fetch Lorebook
      const loreData = await apiFetch(`/rooms/${roomId}/lorebook`);
      setLorebook(loreData);

      // 4. Setup WebSockets
      setupWebSockets();

    } catch (err: any) {
      setError(err.message || 'Failed to load room workspace');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSockets = () => {
    const socket = getSocket();
    const currentUser = getUser();
    if (!socket || !currentUser) return;

    const onEvent = (event: string, handler: (...args: any[]) => void) => {
      socket.on(event, (...args: any[]) => {
        addLog(event, args[0]);
        handler(...args);
      });
    };

    // Connection events
    socket.on('connect', () => {
      setConnectionStatus('connected');
      addLog('connect', { socketId: socket.id, message: 'WebSocket connected successfully' });
      // Join room
      socket.emit('join_room', { 
        roomId, 
        userId: currentUser.id, 
        displayName: currentUser.username 
      });
    });

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      addLog('disconnect', { reason });
    });

    socket.on('connect_error', (err) => {
      setConnectionStatus('disconnected');
      addLog('connect_error', { message: err.message });
    });

    socket.on('reconnect_attempt', (attempt) => {
      setConnectionStatus('reconnecting');
      addLog('reconnect_attempt', { attempt });
    });

    setConnectionStatus('connecting');
    addLog('connecting', { message: 'Initiating WebSocket connection...' });
    socket.connect();

    // Listen to presence updates
    onEvent('room_presence', (list: any[]) => {
      setPresenceList(list);
    });

    // Listen to timer updates
    onEvent('timer_update', (data: { roomId: string; secondsLeft: number }) => {
      if (data.roomId === roomId) {
        setTimer(data.secondsLeft);
      }
    });

    // Listen to turn start
    onEvent('turn_started', (data: { roomId: string; turnId: string; turnNumber: number; duration: number; status?: string }) => {
      if (data.roomId === roomId) {
        setRoom((prev: any) => {
          if (!prev) return prev;
          return { ...prev, status: 'active' };
        });
        setActiveTurn({
          _id: data.turnId,
          number: data.turnNumber,
          status: data.status || 'submission',
          duration: data.duration,
        });
        setTimer(data.duration);
        if (!data.status || data.status === 'submission') {
          setIdeas([]);
          setIdeaContent('');
          setSubmittingIdea(false);
          setHasVoted(null);
        }
      }
    });

    // Listen to turn end (submission end / voting start)
    onEvent('turn_ended', (data: { roomId: string; turnNumber: number }) => {
      if (data.roomId === roomId) {
        setActiveTurn((prev: any) => ({
          ...prev,
          status: 'voting',
        }));
      }
    });

    // Listen to idea submissions
    onEvent('idea_submitted', (data: { roomId: string; ideaId: string; userId: string; content: string; isModerated?: boolean; moderationResult?: string }) => {
      if (data.roomId === roomId) {
        const myUser = getUser();
        if (myUser && data.userId === myUser.id) {
          setSubmittingIdea(false);
          setNotice('Đã gửi ý tưởng! Đang kiểm định cốt truyện...');
          setTimeout(() => setNotice(null), 3000);
        }
        setIdeas((prev) => {
          if (prev.some((id) => id._id === data.ideaId)) return prev;
          return [...prev, {
            _id: data.ideaId,
            creatorId: data.userId,
            content: data.content,
            isModerated: data.isModerated || false,
            moderationResult: data.moderationResult || 'pending',
          }];
        });
      }
    });

    // Listen to moderation updates
    onEvent('idea_moderated', (data: { roomId: string; ideaId: string; result: string; reason?: string }) => {
      if (data.roomId === roomId) {
        setIdeas((prev) => {
          const matchedIdea = prev.find((idea) => idea._id === data.ideaId);
          if (matchedIdea) {
            const cid = typeof matchedIdea.creatorId === 'string' ? matchedIdea.creatorId : (matchedIdea.creatorId?._id || matchedIdea.creatorId?.id);
            const myUser = getUser();
            if (myUser && cid === myUser.id) {
              if (data.result === 'approved') {
                setNotice('AI Lore Checker: Ý tưởng hợp lệ!');
              } else {
                setNotice(`AI Lore Checker: Từ chối! ${data.reason || 'Mâu thuẫn bối cảnh'}`);
              }
              setTimeout(() => setNotice(null), 4000);
            }
          }
          return prev.map((idea) => {
            if (idea._id === data.ideaId) {
              return {
                ...idea,
                isModerated: true,
                moderationResult: data.result,
                moderationReason: data.reason,
              };
            }
            return idea;
          });
        });
      }
    });

    // Listen to votes tallying updates
    onEvent('vote_update', (data: { roomId: string; ideaId: string; votesCount: number }) => {
      if (data.roomId === roomId) {
        setIdeas((prev) =>
          prev.map((idea) => {
            if (idea._id === data.ideaId) {
              return { ...idea, votesCount: data.votesCount };
            }
            return idea;
          })
        );
      }
    });

    onEvent('vote_cast_success', (data: { ideaId: string }) => {
      setHasVoted(data.ideaId);
      setNotice('Ghi nhận lượt vote thành công.');
      setTimeout(() => setNotice(null), 2500);
    });

    onEvent('host_changed', (data: { newHostId: string }) => {
      addLog('event:host_changed', data);
      setRoom((prev: any) => {
        if (!prev) return prev;
        return { ...prev, hostId: data.newHostId };
      });
      setNotice('Trưởng phòng đã rời phòng. Quyền trưởng phòng được chuyển giao tự động.');
      setTimeout(() => setNotice(null), 3000);
    });

    onEvent('error', (message: any) => {
      const text = typeof message === 'string' ? message : message?.message || 'Lỗi thao tác thời gian thực.';
      setSubmittingIdea(false);
      setNotice(text);
      setTimeout(() => setNotice(null), 4000);
    });

    onEvent('ai_stage_update', (data: { roomId: string; stage: string; provider?: string; model?: string; isFallback?: boolean; message?: string }) => {
      if (data.roomId === roomId) {
        if (data.isFallback) {
          setNotice(`[AI Fallback] ${data.message || 'Chuyển sang Mock'}`);
          setTimeout(() => setNotice(null), 4000);
        } else if (data.stage === 'Lore checking') {
          setNotice('AI Lore Checker: Đang kiểm định ý tưởng...');
          setTimeout(() => setNotice(null), 2500);
        } else if (data.stage === 'Writing') {
          setNotice('AI Writer: Đang chấp bút viết truyện...');
          setTimeout(() => setNotice(null), 2500);
        } else if (data.stage === 'Structuring') {
          setNotice('AI Structure Manager: Đang sắp xếp bố cục...');
          setTimeout(() => setNotice(null), 2500);
        }
      }
    });


    // Listen to novel chapter publish
    onEvent('chapter_published', (data: { roomId: string; chapter: any }) => {
      if (data.roomId === roomId) {
        setChapters((prev) => {
          if (prev.some((c) => c._id === data.chapter._id)) {
            return prev.map((c) => (c._id === data.chapter._id ? data.chapter : c));
          }
          return [...prev, data.chapter];
        });
        setActiveTurn(null);
        setNotice('Phần chương mới đã được AI xuất bản!');
        setLastPublishedChapterId(data.chapter._id);
        setTimeout(() => setLastPublishedChapterId(null), 5000);
        setTimeout(() => {
          readerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    });
  };

  const handleStartRoom = () => {
    const socket = getSocket();
    if (socket && user) {
      addLog('emit:start_turn', { roomId, userId: user.id });
      socket.emit('start_turn', { roomId, userId: user.id });
    }
  };

  const handleCloseSubmission = () => {
    const socket = getSocket();
    if (socket && activeTurn && user) {
      addLog('emit:start_voting', { roomId, turnId: activeTurn._id, userId: user.id });
      socket.emit('start_voting', { roomId, turnId: activeTurn._id, userId: user.id });
    }
  };

  const handleCloseVoting = () => {
    const socket = getSocket();
    if (socket && activeTurn && user) {
      addLog('emit:close_voting', { roomId, turnId: activeTurn._id, userId: user.id });
      socket.emit('close_voting', { roomId, turnId: activeTurn._id, userId: user.id });
    }
  };

  const handleNextTurn = () => {
    const socket = getSocket();
    if (socket && user) {
      addLog('emit:next_turn', { roomId, userId: user.id });
      socket.emit('next_turn', { roomId, userId: user.id });
    }
  };

  const handleSubmitIdea = (content: string) => {
    if (!content.trim() || !activeTurn || !user) return;

    setSubmittingIdea(true);
    const socket = getSocket();
    if (socket) {
      addLog('emit:submit_idea', {
        roomId,
        turnId: activeTurn._id,
        userId: user.id,
        content: content.trim(),
      });
      socket.emit('submit_idea', {
        roomId,
        turnId: activeTurn._id,
        userId: user.id,
        content: content.trim(),
      });
    }
  };

  const handleCastVote = (ideaId: string) => {
    if (hasVoted || !activeTurn || !user) return;
    const socket = getSocket();
    if (socket) {
      addLog('emit:cast_vote', {
        roomId,
        turnId: activeTurn._id,
        userId: user.id,
        ideaId,
      });
      socket.emit('cast_vote', {
        roomId,
        turnId: activeTurn._id,
        userId: user.id,
        ideaId,
      });
    }
  };

  const handleAddLore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoreKey.trim() || !newLoreContent.trim()) return;

    setAddingLore(true);
    try {
      const updatedLorebook = await apiFetch(`/rooms/${roomId}/lorebook/entries`, {
        method: 'POST',
        body: JSON.stringify({
          key: newLoreKey.trim(),
          content: newLoreContent.trim(),
        }),
      });

      setLorebook(updatedLorebook);
      setNewLoreKey('');
      setNewLoreContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to add lore entry');
    } finally {
      setAddingLore(false);
    }
  };

  const handleCopyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room && user && (room.hostId === user.id || (room.hostId && room.hostId._id === user.id));
  
  const getAuthorName = (creator: any) => {
    if (!creator) return 'Đồng tác giả';
    const cid = typeof creator === 'string' ? creator : (creator._id || creator.id);
    if (cid === user?.id) return user.username;
    const presenceUser = presenceList.find(p => p.userId === cid);
    if (presenceUser) return presenceUser.displayName;
    return creator.username || 'Đồng tác giả';
  };

  const myIdea = ideas.find((idea) => {
    const creatorId = idea.creatorId?._id || idea.creatorId?.id || idea.creatorId;
    return creatorId === user?.id;
  });

  // Filter approved ideas for voting view
  const approvedIdeas = ideas.filter((idea) => idea.moderationResult === 'approved');

  const getPhaseGuide = () => {
    const loreCount = lorebook?.entries?.length || 0;
    const approvedCount = approvedIdeas.length;

    if (room?.status === 'lobby') {
      return {
        eyebrow: 'Bước 1',
        title: 'Chuẩn bị phòng truyện',
        body: 'Trước khi viết, hãy kiểm tra bút danh, mã phòng, người online và lorebook. Khi mọi người đã sẵn sàng, Host mở lượt đầu tiên.',
        action: isHost ? 'Bạn là Host: bấm “Bắt Đầu Lượt Sáng Tác”.' : 'Bạn là Writer: chờ Host mở lượt viết.',
        meta: [`${presenceList.length} tác giả online`, `${loreCount} mục lorebook`],
      };
    }

    if (activeTurn?.status === 'submission') {
      return {
        eyebrow: 'Bước 2',
        title: 'Gửi một ý tưởng ngắn, rõ và nối được vào truyện',
        body: 'Đừng viết cả chương. Hãy gửi một bước ngoặt hoặc hành động tiếp theo để AI Lore Checker kiểm tra có hợp với bối cảnh không.',
        action: myIdea ? 'Bạn đã gửi ý tưởng. Hãy chờ AI duyệt rồi chuẩn bị bình chọn.' : 'Viết 1 ý tưởng dưới 200 ký tự, ưu tiên có nhân vật, hành động và hệ quả.',
        meta: [`${ideas.length} ý tưởng đã gửi`, `${approvedCount} ý tưởng hợp lệ`],
      };
    }

    if (activeTurn?.status === 'voting') {
      return {
        eyebrow: 'Bước 3',
        title: 'Chọn hướng truyện đáng để AI viết tiếp',
        body: 'Giai đoạn này không phải chat nữa, mà là quyết định nhánh truyện. Mỗi người chỉ có một lượt vote để đảm bảo công bằng.',
        action: hasVoted ? 'Bạn đã vote. Redis Lock sẽ chặn nếu cố vote lần hai.' : 'Chọn ý tưởng có khả năng tạo cao trào tốt nhất.',
        meta: [`${approvedCount} ý tưởng để vote`, hasVoted ? 'Đã khóa vote của bạn' : 'Chưa vote'],
      };
    }

    if (activeTurn?.status === 'writing') {
      return {
        eyebrow: 'Bước 4',
        title: 'AI đang biến ý tưởng thắng cuộc thành bản thảo',
        body: 'AI Writer viết đoạn truyện, sau đó AI Structure Manager quyết định nối vào chương cũ hay tạo chương mới trong MongoDB.',
        action: 'Chờ Novel View bên phải sáng lên khi chương mới được publish realtime.',
        meta: ['BullMQ đang xử lý AI job', 'MongoDB sẽ lưu chương'],
      };
    }

    return {
      eyebrow: 'Bước 5',
      title: 'Chương mới đã publish, chuẩn bị lượt tiếp theo',
      body: 'Đọc lại đoạn vừa được AI viết ở Novel View. Nếu muốn tiếp tục câu chuyện, Host mở lượt mới để mọi người gửi ý tưởng tiếp.',
      action: isHost ? 'Bấm “Bắt Đầu Lượt Mới” khi cả nhóm đã đọc xong.' : 'Chờ Host mở lượt tiếp theo.',
      meta: [`${chapters.length} chương/phân đoạn`, 'Realtime synced'],
    };
  };

  const phaseGuide = getPhaseGuide();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8fafd] text-slate-800 font-sans flex flex-col">
      {/* Background glowing decorations */}
      <div className="absolute inset-0 aurora-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[440px] h-[440px] rounded-full bg-pink-300/20 blur-[130px] pointer-events-none animate-pulse duration-5000" />
      <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full bg-sky-300/20 blur-[130px] pointer-events-none animate-pulse duration-7000" />

      {/* Cozy Dreamy Pixel Trail */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none opacity-40">
        {/* Pixel Group 1 - Top Right */}
        <div className="absolute top-[-20px] right-[10%] flex flex-col items-end gap-1">
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-sky-300/60 shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
            <div className="w-6 h-6 bg-pink-300/40" />
            <div className="w-6 h-6 bg-transparent" />
            <div className="w-6 h-6 bg-sky-200/50" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-transparent" />
            <div className="w-6 h-6 bg-pink-200/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]" />
            <div className="w-6 h-6 bg-sky-200/30" />
            <div className="w-6 h-6 bg-transparent" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-teal-200/50 shadow-[0_0_12px_rgba(20,185,129,0.15)]" />
            <div className="w-6 h-6 bg-transparent" />
            <div className="w-6 h-6 bg-pink-300/40 shadow-[0_0_15px_rgba(236,72,153,0.2)]" />
          </div>
        </div>

        {/* Scattered glowing stars */}
        <div className="absolute top-[18%] left-[28%] w-4 h-4 bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)] rotate-45 animate-pulse" />
        <div className="absolute top-[22%] left-[30%] w-3 h-3 bg-pink-300 shadow-[0_0_8px_rgba(244,63,94,0.4)] -rotate-12 animate-pulse" />
        <div className="absolute bottom-[40%] left-[42%] w-5 h-5 bg-sky-200/40 border border-sky-300/20" />
        <div className="absolute bottom-[44%] left-[45%] w-3 h-3 bg-pink-200/60 shadow-[0_0_6px_rgba(244,63,94,0.2)]" />
        <div className="absolute top-[60%] right-[15%] w-6 h-6 bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)] rotate-12" />
        <div className="absolute top-[63%] right-[13%] w-4 h-4 bg-pink-200/60 -rotate-12" />
      </div>

      {/* Main Workspace Header */}
      <header className="relative z-20 w-full border-b border-sky-100 bg-white/80 backdrop-blur-2xl px-5 py-4 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/rooms')}
            className="p-2 hover:bg-slate-100 border border-sky-100 rounded-xl transition-all duration-200 cursor-pointer text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-md sm:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-pink-500 to-teal-500">
                {room ? room.name : 'Đang tải phòng viết...'}
              </h1>
              {room && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  room.status === 'active' 
                    ? 'bg-sky-50 text-sky-600 border border-sky-200' 
                    : 'bg-pink-50 text-pink-600 border border-pink-200 animate-pulse'
                }`}>
                  {room.status === 'active' ? 'Đang viết' : 'Phòng chờ'}
                </span>
              )}
              {/* WebSocket Connection Status Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                connectionStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-205 animate-pulse' :
                connectionStatus === 'reconnecting' ? 'bg-pink-50 text-pink-650 border-pink-205 animate-pulse' :
                'bg-rose-50 text-rose-600 border-rose-250 pulse-red'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting' :
                 'Disconnected'}
              </span>
            </div>
            {room && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-500 truncate max-w-[200px] hidden sm:block">
                  {room.description}
                </p>
                <span className="text-[10px] font-mono font-bold bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded text-pink-605">
                  Mã: {room.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:text-slate-800 transition-all cursor-pointer font-bold"
                >
                  {copied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Presence & Actions */}
        <div className="flex items-center gap-4">
          <PresenceAvatars presenceList={presenceList} />

          {/* Realtime Event Log toggle */}
          <button
            onClick={() => setIsLogOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-slate-705 hover:text-slate-900 shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            Realtime Log
          </button>

          {/* Lorebook Drawer toggle */}
          <button
            onClick={() => setIsLoreOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-500/10 to-pink-500/10 hover:from-sky-500/20 hover:to-pink-500/20 border border-sky-200 hover:border-sky-350 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-sky-700 hover:text-sky-900 shadow-xs"
          >
            <BookHalf className="w-3.5 h-3.5" />
            Lorebook
          </button>
        </div>
      </header>

      {/* Grid Split Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-medium">Đang chuẩn bị không gian sáng tác...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center max-w-md bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center shadow-md">
            <ExclamationCircleFill className="w-10 h-10 text-rose-500 mb-4" />
            <h3 className="text-lg font-bold text-rose-605">Không thể tải phòng viết</h3>
            <p className="text-sm text-rose-600 mt-2 mb-6">{error}</p>
            <button
              onClick={() => router.push('/rooms')}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold"
            >
              Quay lại sảnh phòng
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Left Column: Workshop State Machine */}
          <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-sky-100/60 bg-white/60 p-5 sm:p-6 overflow-y-auto backdrop-blur-xl">
            
            <PhaseStepper roomStatus={room.status} turnStatus={activeTurn?.status} />

            {room && (
              <div className="mt-4 mb-6">
                <StoryBriefCard
                  roomName={room.name}
                  description={room.description}
                  genre="Fantasy / Đồng sáng tác"
                  objective={activeTurn?.objective || (room.status === 'lobby' ? 'Đang chờ Trưởng phòng khởi động lượt sáng tác đầu tiên để AI sinh khởi đầu cốt truyện...' : 'Đang sáng tác...')}
                  lorebook={lorebook}
                />
              </div>
            )}

            <m.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-[1.75rem] border border-sky-100 bg-white/90 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                    {phaseGuide.eyebrow}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-black leading-tight text-slate-900">
                    {phaseGuide.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {phaseGuide.body}
                  </p>
                  <p className="mt-3 rounded-2xl border border-pink-100 bg-pink-50/70 px-4 py-3 text-xs font-bold leading-5 text-pink-700">
                    {phaseGuide.action}
                  </p>
                </div>

                <div className="grid min-w-[180px] gap-2 text-xs">
                  {phaseGuide.meta.map((item) => (
                    <span
                      key={item}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 font-bold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </m.section>

            {/* LOBBY STATE */}
            {room.status === 'lobby' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
                <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-200 flex items-center justify-center text-pink-500 mb-6 animate-pulse">
                  <PeopleFill className="w-8 h-8" />
                </div>
                <h2 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-500">Phòng Chờ Sáng Tác</h2>
                <p className="text-sm text-slate-650 mt-2 mb-6 leading-relaxed">
                  Chào mừng bạn! Các tác giả đang hội quân vào phòng viết. Trưởng phòng sẽ bấm bắt đầu lượt viết khi mọi người đã sẵn sàng.
                </p>

                {isHost ? (
                  <button
                    onClick={handleStartRoom}
                    className="w-full py-3 rounded-2xl fs-btn-green"
                  >
                    Bắt Đầu Lượt Sáng Tác
                  </button>
                ) : (
                  <div className="w-full py-3 border border-slate-205 bg-slate-50 text-slate-550 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 select-none shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                    Đang đợi Trưởng phòng khởi động...
                  </div>
                )}

                {/* AI Models Overview Info Box */}
                <div className="w-full mt-6 bg-sky-50/50 border border-sky-100 rounded-2xl p-4 text-left shadow-sm">
                  <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                    <StarFill className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                    Công Nghệ AI Vận Hành
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-sky-100/50 pb-1">
                      <span className="text-slate-650">AI Lore Checker:</span>
                      <span className="text-sky-600 font-mono font-bold bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">Gemini 2.5 Flash Lite</span>
                    </div>
                    <div className="flex justify-between border-b border-sky-100/50 pb-1">
                      <span className="text-slate-655">AI Writer:</span>
                      <span className="text-pink-600 font-mono font-bold bg-pink-50 border border-pink-100 px-1.5 py-0.5 rounded">Grok (xAI)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-655">AI Structure Manager:</span>
                      <span className="text-purple-600 font-mono font-bold bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">Gemini 2.5 Flash Lite</span>
                    </div>
                  </div>
                </div>

                {/* Users in Lobby list */}
                <div className="w-full mt-6 bg-white border border-sky-100 rounded-2xl p-5 text-left shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 select-none">
                    <PeopleFill className="w-3.5 h-3.5 text-sky-500" />
                    Tác giả trong phòng ({presenceList.length})
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {presenceList.map((pUser, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm text-slate-705 bg-slate-50/50 border border-slate-200/50 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-gradient-to-tr from-sky-400 to-pink-300 flex items-center justify-center text-[10px] font-black text-white uppercase select-none shadow-sm">
                            {(pUser.displayName || 'G').charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium text-slate-800">{pUser.displayName || 'Guest Writer'}</span>
                        </div>
                        {pUser.userId === (room?.hostId?._id || room?.hostId) ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-pink-605 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-md select-none">Trưởng phòng</span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md select-none">Người viết</span>
                        )}
                      </div>
                    ))}
                    {presenceList.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Chưa có ai tham gia phòng.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE GAME STATE */}
            {room.status === 'active' && activeTurn && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Turn Status Banner */}
                  <div className="bg-sky-50/80 border border-sky-200/60 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-sky-400 to-sky-500" style={{ width: `${Math.min(100, (timer / (activeTurn.duration || 60)) * 100)}%` }} />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-sky-600 uppercase tracking-widest font-extrabold">Lượt viết #{activeTurn.number}</span>
                        <h3 className="text-lg font-bold text-slate-800 mt-1 capitalize">
                          {activeTurn.status === 'submission' && 'Đóng góp ý tưởng'}
                          {activeTurn.status === 'voting' && 'Bình chọn ẩn danh'}
                          {activeTurn.status === 'writing' && 'AI đang viết chương truyện...'}
                        </h3>
                      </div>
                      <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-300 ${
                        timer > 0 && timer <= 10 
                          ? 'bg-rose-50 border-rose-300 pulse-red' 
                          : 'bg-white border-slate-200'
                      }`}>
                        <Clock className={`w-4 h-4 ${timer > 0 && timer <= 10 ? 'text-rose-550' : 'text-sky-500'}`} />
                        <span className="font-mono text-sm font-bold text-slate-800">
                          {timer > 0 ? `${timer} giây` : 'Đang xử lý'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <HostControlPanel
                    isHost={isHost}
                    turnStatus={activeTurn?.status}
                    onCloseSubmission={handleCloseSubmission}
                    onCloseVoting={handleCloseVoting}
                    timer={timer}
                    onRetryAi={() => {
                      const socket = getSocket();
                      if (socket && user && activeTurn) {
                        addLog('emit:generate_chapter_mock', { roomId, turnId: activeTurn._id, userId: user.id });
                        socket.emit('generate_chapter_mock', { roomId, turnId: activeTurn._id, userId: user.id });
                        setNotice('Đã yêu cầu AI thực hiện lại chấp bút.');
                        setTimeout(() => setNotice(null), 3000);
                      }
                    }}
                  />

                  {/* STAGE: SUBMISSION */}
                  {activeTurn.status === 'submission' && (
                    <div className="space-y-6">
                      {!myIdea ? (
                        <StructuredIdeaForm
                          submitting={submittingIdea}
                          onSubmit={handleSubmitIdea}
                        />
                      ) : (
                        <m.div
                          initial={{ scale: 0.98, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="border border-sky-100 bg-sky-50/30 rounded-2xl p-5 shadow-sm"
                        >
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase mb-2 block">Ý Tưởng Đã Gửi Của Bạn</span>
                          <RenderIdeaContent content={myIdea.content} />
                          
                          <div className="border-t border-sky-100 pt-4 mt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 font-bold">AI Lore Checker:</span>
                              <span className="text-[9px] text-sky-500 font-mono">Model: Gemini 2.5 Flash Lite</span>
                            </div>
                            
                            {!myIdea.isModerated ? (
                              <span className="text-xs text-sky-600 font-semibold flex items-center gap-1.5 animate-pulse">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Đang kiểm tra cốt truyện...
                              </span>
                            ) : myIdea.moderationResult === 'approved' ? (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                <CheckCircleFill className="w-4 h-4 text-emerald-500" />
                                Hợp lệ & Đã Duyệt
                              </span>
                            ) : (
                              <span className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                                <XCircleFill className="w-4 h-4 text-rose-500" />
                                Mâu thuẫn Cốt truyện
                              </span>
                            )}
                          </div>

                          {myIdea.isModerated && myIdea.moderationResult === 'rejected' && myIdea.moderationReason && (
                            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                              <strong>Phản hồi từ AI:</strong> {myIdea.moderationReason}
                            </div>
                          )}
                        </m.div>
                      )}

                      {/* Other ideas feed */}
                      <div className="space-y-3">
                        <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ý Tưởng Đã Qua Kiểm Duyệt ({approvedIdeas.length})</h4>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {approvedIdeas.map((idea) => (
                            <div 
                              key={idea._id}
                              className="p-3.5 bg-slate-50 border border-slate-200 hover:border-sky-200 transition-colors rounded-xl flex items-start justify-between gap-3 shadow-xs"
                            >
                              <div className="space-y-1.5 flex-1">
                                <RenderIdeaContent content={idea.content} />
                                <p className="text-[10px] text-slate-500 font-semibold px-1">Tác giả: {getAuthorName(idea.creatorId)}</p>
                              </div>
                              <span className="p-1 text-sky-500" title="Nhất quán với Lorebook">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          ))}
                          {approvedIdeas.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-4">Chưa có ý tưởng nào được duyệt ở lượt này. Hãy là người đầu tiên!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAGE: VOTING */}
                  {activeTurn.status === 'voting' && (
                    <div className="space-y-6">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Hãy chọn hướng phát triển cốt truyện tốt nhất</span>
                        <span className="text-pink-650 font-extrabold bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">Hệ thống bình chọn ẩn danh đang chạy</span>
                      </div>

                      <div className="space-y-3">
                        {approvedIdeas.map((idea) => {
                          const isVotedThis = hasVoted === idea._id;
                          return (
                            <m.button
                              key={idea._id}
                              disabled={!!hasVoted}
                              onClick={() => handleCastVote(idea._id)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                                isVotedThis 
                                  ? 'bg-pink-50/60 border-pink-300 shadow-sm shadow-pink-500/5' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-sky-305'
                              } disabled:cursor-default shadow-xs`}
                            >
                              <div className="space-y-1.5 text-xs flex-1">
                                <RenderIdeaContent content={idea.content} />
                                <p className="text-[10px] text-slate-500 font-semibold px-1">Tác giả: {getAuthorName(idea.creatorId)}</p>
                              </div>
                              <div className="shrink-0 pt-0.5">
                                {isVotedThis ? (
                                  <div className="h-5 w-5 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-md">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 border border-slate-300 hover:border-sky-400 rounded-full transition-colors flex items-center justify-center bg-white" />
                                )}
                              </div>
                            </m.button>
                          );
                        })}

                        {approvedIdeas.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-xs text-slate-400 italic">Không có ý tưởng hợp lệ nào được gửi lên để bình chọn.</p>
                            <p className="text-[10px] text-slate-500 mt-1">AI Writer sẽ tự động phát triển phân đoạn dựa trên bối cảnh chung.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STAGE: AI WRITING */}
                  {activeTurn.status === 'writing' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                      <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-500 mb-6 relative shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <StarFill className="w-4 h-4 text-pink-400 absolute top-1 right-1 animate-bounce" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-850">AI đang phân tích & chấp bút...</h3>
                      <p className="text-sm text-slate-655 max-w-sm mt-2 leading-relaxed">
                        AI Writer đang mở rộng ý tưởng thắng cuộc thành một phân đoạn truyện văn học chất lượng cao, đồng thời tối ưu hóa cấu trúc chương truyện.
                      </p>

                      {/* Simulated AI Progress steps */}
                      <div className="w-full max-w-sm mt-6 bg-white border border-sky-100 rounded-2xl p-5 text-left shadow-sm space-y-3">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tiến trình đa tác nhân AI:</span>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              writingProgressStep > 0 ? 'bg-emerald-500 text-white' : 'bg-sky-100 text-sky-600 animate-pulse'
                            }`}>
                              {writingProgressStep > 0 ? '✓' : '1'}
                            </span>
                            <span className={writingProgressStep > 0 ? 'text-slate-400 line-through' : 'text-slate-850 font-bold'}>
                              Chốt ý tưởng chiến thắng
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              writingProgressStep > 1 ? 'bg-emerald-500 text-white' :
                              writingProgressStep === 1 ? 'bg-sky-100 text-sky-600 animate-pulse' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {writingProgressStep > 1 ? '✓' : '2'}
                            </span>
                            <span className={
                              writingProgressStep > 1 ? 'text-slate-400 line-through' :
                              writingProgressStep === 1 ? 'text-slate-850 font-bold' : 'text-slate-400'
                            }>
                              Nạp ngữ cảnh câu chuyện từ MongoDB
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              writingProgressStep > 2 ? 'bg-emerald-500 text-white' :
                              writingProgressStep === 2 ? 'bg-sky-100 text-sky-600 animate-pulse' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {writingProgressStep > 2 ? '✓' : '3'}
                            </span>
                            <span className={
                              writingProgressStep > 2 ? 'text-slate-400 line-through' :
                              writingProgressStep === 2 ? 'text-slate-850 font-bold' : 'text-slate-400'
                            }>
                              AI Writer (Grok) đang viết phân đoạn
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              writingProgressStep > 3 ? 'bg-emerald-500 text-white' :
                              writingProgressStep === 3 ? 'bg-sky-100 text-sky-600 animate-pulse' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {writingProgressStep > 3 ? '✓' : '4'}
                            </span>
                            <span className={
                              writingProgressStep > 3 ? 'text-slate-400 line-through' :
                              writingProgressStep === 3 ? 'text-slate-850 font-bold' : 'text-slate-400'
                            }>
                              AI Structure Manager phân chương & xuất bản
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 w-full max-w-xs text-left shadow-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-550">Chấp bút (Writer):</span>
                          <span className="text-pink-650 font-mono font-bold">Grok (xAI)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-550">Cấu trúc (Structure):</span>
                          <span className="text-sky-600 font-mono font-bold">Gemini 2.5 Flash Lite</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer status bar */}
                <div className="border-t border-slate-100 pt-4 mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Phòng Viết Tiểu Thuyết Đồng Sáng Tác</span>
                  <span>Phiên Làm Việc Realtime</span>
                </div>
              </div>
            )}

            {/* WAITING FOR NEXT TURN STATE */}
            {room.status === 'active' && !activeTurn && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-sky-100 flex items-center justify-center text-sky-500 mb-6 shadow-xs animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Đang chờ lượt viết tiếp theo...</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {isHost 
                    ? 'Lượt viết vừa rồi đã hoàn thành! Với tư cách là Trưởng phòng, bạn có thể bấm nút dưới đây để khởi động lượt viết tiếp theo.'
                    : 'Giai đoạn chuyển giao lượt đã hoàn tất. Vui lòng đợi Trưởng phòng khởi động lượt đóng góp mới.'}
                </p>
                {isHost && (
                  <button
                    onClick={handleNextTurn}
                    className="w-full mt-6 py-3 rounded-2xl fs-btn-green"
                  >
                    Bắt Đầu Lượt Mới
                  </button>
                )}
              </div>
            )}
          </div>

          <NovelReader
            roomName={room ? room.name : ''}
            chapters={chapters}
            readerEndRef={readerEndRef}
            lastPublishedChapterId={lastPublishedChapterId}
          />

          <LorebookDrawer
            isOpen={isLoreOpen}
            onClose={() => setIsLoreOpen(false)}
            lorebook={lorebook}
            newLoreKey={newLoreKey}
            setNewLoreKey={setNewLoreKey}
            newLoreContent={newLoreContent}
            setNewLoreContent={setNewLoreContent}
            addingLore={addingLore}
            onAddLore={handleAddLore}
          />

          <RealtimeLogDrawer
            isOpen={isLogOpen}
            onClose={() => setIsLogOpen(false)}
            logs={realtimeLogs}
            onClear={() => setRealtimeLogs([])}
          />

        </div>
      )}

      {/* Floating Notice Toast */}
      <AnimatePresence>
        {notice && (
          <m.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 max-w-sm rounded-2xl border border-sky-200 bg-white/95 p-4 shadow-2xl shadow-sky-500/5 flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-slate-700 leading-relaxed">{notice}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
