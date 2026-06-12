import React from 'react';
import { BookHalf, InfoCircleFill, TagFill, CompassFill, Book } from 'react-bootstrap-icons';

interface StoryBriefCardProps {
  roomName: string;
  description: string;
  genre?: string;
  objective?: string;
  lorebook?: { entries: Array<{ key: string; content: string }> } | null;
}

export function StoryBriefCard({
  roomName,
  description,
  genre = 'Fantasy / Kỳ ảo',
  objective,
  lorebook,
}: StoryBriefCardProps) {
  // Extract top 3 active lore keys for quick rules display
  const activeRules = lorebook?.entries?.slice(0, 3).map(e => e.key) || [];

  return (
    <div className="glass-panel rounded-[2rem] p-6 border border-sky-100/80 shadow-md relative overflow-hidden bg-white/70 backdrop-blur-md space-y-5">
      {/* Background soft glow decoration */}
      <div className="absolute -right-8 -top-8 h-24 w-24 bg-sky-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 h-24 w-24 bg-pink-100/25 rounded-full blur-2xl pointer-events-none" />

      {/* Header section */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-sky-100/60">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 to-pink-500 flex items-center justify-center text-white">
          <BookHalf className="w-4.5 h-4.5" />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-600 block">
            Thiết lập tác phẩm
          </span>
          <h3 className="font-display text-base font-black text-slate-800 tracking-tight line-clamp-1">
            {roomName || 'Tên truyện'}
          </h3>
        </div>
      </div>

      {/* Main Premise */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <InfoCircleFill className="w-3.5 h-3.5 text-sky-400" />
          Tiền đề cốt truyện
        </span>
        <p className="text-xs text-slate-650 leading-relaxed text-justify font-medium">
          {description || 'Không gian đồng sáng tác tiểu thuyết kỳ diệu cùng các tác giả và trí tuệ nhân tạo.'}
        </p>
      </div>

      {/* Genre tag */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <TagFill className="w-3.5 h-3.5 text-pink-400" />
          Thể loại
        </span>
        <div className="inline-flex px-2.5 py-1 rounded-lg text-xs font-extrabold bg-pink-50/80 border border-pink-150 text-pink-600">
          {genre}
        </div>
      </div>

      {/* Current Objective */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <CompassFill className="w-3.5 h-3.5 text-teal-400" />
          Mục tiêu lượt hiện tại
        </span>
        <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-100 text-xs text-teal-800 leading-relaxed font-semibold">
          {objective || 'Nhập các ý tưởng đột phá để phát triển tình tiết tiếp theo. Host có thể cập nhật mục tiêu tại bảng điều khiển.'}
        </div>
      </div>

      {/* Active lore rules */}
      <div className="space-y-2 pt-2 border-t border-sky-100/60">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Book className="w-3.5 h-3.5 text-amber-500" />
          Thiết lập bối cảnh kích hoạt ({activeRules.length})
        </span>
        {activeRules.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">Chưa thiết lập quy tắc bối cảnh trong Lorebook.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeRules.map((rule, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100"
              >
                📜 {rule}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
