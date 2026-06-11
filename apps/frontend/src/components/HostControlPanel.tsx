import React from 'react';
import { StarFill } from 'react-bootstrap-icons';
import { Loader2 } from 'lucide-react';

interface HostControlPanelProps {
  isHost: boolean;
  turnStatus?: string;
  onCloseSubmission: () => void;
  onCloseVoting: () => void;
  timer?: number;
  onRetryAi?: () => void;
}

export function HostControlPanel({
  isHost,
  turnStatus,
  onCloseSubmission,
  onCloseVoting,
  timer = 0,
  onRetryAi,
}: HostControlPanelProps) {
  if (!isHost || !turnStatus) return null;

  return (
    <div className="bg-emerald-50/60 border border-emerald-250 text-emerald-800 rounded-2xl p-5 mb-6 relative overflow-hidden animate-fade-in shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <StarFill className="w-4 h-4 text-emerald-500 animate-pulse" />
        <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-extrabold">
          Bảng Điều Khiển Trưởng Phòng
        </span>
      </div>
      <p className="text-xs text-slate-650 mb-3 leading-relaxed">
        {turnStatus === 'submission' &&
          'Bạn có quyền kết thúc sớm giai đoạn đóng góp để bắt đầu bình chọn.'}
        {turnStatus === 'voting' &&
          'Bạn có quyền đóng bình chọn sớm để chuyển giao cho AI chấp bút.'}
        {turnStatus === 'writing' &&
          'Hệ thống AI đang viết chương truyện, vui lòng đợi trong giây lát.'}
      </p>
      <div className="flex gap-2">
        {turnStatus === 'submission' && (
          <button
            onClick={onCloseSubmission}
            className="px-4 py-2 rounded-xl text-xs fs-btn-green cursor-pointer"
          >
            Đóng đóng góp & Bắt đầu bình chọn
          </button>
        )}
        {turnStatus === 'voting' && (
          <button
            onClick={onCloseVoting}
            className="px-4 py-2 rounded-xl text-xs fs-btn-green cursor-pointer"
          >
            Đóng bình chọn & Bắt đầu AI Chấp Bút
          </button>
        )}
        {turnStatus === 'writing' && (
          <div className="flex flex-col gap-2 items-start w-full">
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              AI đang chấp bút viết truyện...
            </span>
            {timer <= 0 && onRetryAi && (
              <button
                onClick={onRetryAi}
                className="px-3 py-1.5 rounded-xl text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer transition-all shadow-sm"
              >
                Gặp lỗi? Bấm để chạy lại AI Chấp Bút
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
