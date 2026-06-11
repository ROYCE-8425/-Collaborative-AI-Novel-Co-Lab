import React from 'react';

interface PresenceUser {
  userId: string;
  displayName?: string;
  socketId?: string;
}

interface PresenceAvatarsProps {
  presenceList: PresenceUser[];
}

export function PresenceAvatars({ presenceList }: PresenceAvatarsProps) {
  // De-duplicate presence users by userId to avoid duplicate avatars
  const uniqueList = (presenceList || []).filter(
    (value, index, self) => self.findIndex((t) => t.userId === value.userId) === index
  );

  if (uniqueList.length === 0) {
    return (
      <span className="text-[10px] text-slate-400 italic font-semibold select-none py-1.5 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-full">
        Không có tác giả trực tuyến
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2 mr-2">
        {uniqueList.map((pUser, idx) => (
          <div
            key={idx}
            className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-400 to-pink-300 border-2 border-white flex items-center justify-center text-[10px] font-black text-white uppercase select-none shadow-sm transition-transform hover:scale-115 cursor-default"
            title={pUser.displayName || 'Guest Writer'}
          >
            {(pUser.displayName || 'G').charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      <span
        className="text-[10px] text-slate-600 font-semibold bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 flex items-center gap-1.5 cursor-help"
        title={uniqueList.map((p) => p.displayName || 'Tác giả khách').join(', ')}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
        {uniqueList.length} Online
      </span>
    </div>
  );
}
