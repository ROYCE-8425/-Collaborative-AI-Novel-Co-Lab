import React, { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { X, Trash, Terminal, ChevronDown, ChevronUp } from 'react-bootstrap-icons';

interface LogEntry {
  timestamp: string;
  event: string;
  data: any;
}

interface RealtimeLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClear: () => void;
}

export function RealtimeLogDrawer({ isOpen, onClose, logs, onClear }: RealtimeLogDrawerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getEventBadgeClass = (event: string) => {
    switch (event) {
      case 'connect':
      case 'reconnect':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'disconnect':
      case 'connect_error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'reconnect_attempt':
        return 'bg-amber-50 text-amber-755 border-amber-200 animate-pulse';
      case 'room_presence':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'timer_update':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'turn_started':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'idea_submitted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'idea_moderated':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'vote_update':
      case 'vote_cast_success':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'chapter_published':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ai_stage_update':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'error':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-40 flex justify-start">
          {/* Overlay backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Drawer panel (slides from left) */}
          <m.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md bg-white/95 border-r border-sky-100 h-full flex flex-col justify-between shadow-2xl backdrop-blur-2xl"
          >
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-650" />
                  <h3 className="text-base font-bold text-slate-800">
                    Realtime WebSocket Log
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {logs.length > 0 && (
                    <button
                      onClick={onClear}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Clear logs"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Logs List */}
              <div className="p-6 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">
                  10 sự kiện WebSocket gần nhất ({logs.length})
                </span>
                <div className="space-y-2">
                  {logs.map((log, idx) => {
                    const isExpanded = expandedIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-slate-100 rounded-xl overflow-hidden shadow-xs bg-slate-50/50"
                      >
                        <div
                          onClick={() => toggleExpand(idx)}
                          className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono text-slate-400">
                              {log.timestamp}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${getEventBadgeClass(
                                log.event
                              )}`}
                            >
                              {log.event}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        {isExpanded && (
                          <div className="p-3 bg-slate-900 text-slate-200 border-t border-slate-800 text-[10px] font-mono overflow-x-auto whitespace-pre leading-relaxed select-text">
                            {JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {logs.length === 0 && (
                    <div className="text-center py-20 text-slate-400 italic text-xs space-y-2 select-none">
                      <Terminal className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>Chưa có sự kiện nào truyền nhận.</p>
                      <p className="text-[10px]">
                        Bắt đầu tương tác viết truyện hoặc đếm ngược để xem tín hiệu.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-sky-100 text-[10px] text-slate-450 font-bold uppercase tracking-wider bg-slate-50/20 text-center select-none">
              Console debug hỗ trợ demo thuyết trình
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
