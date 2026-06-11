import React from 'react';

interface PhaseStepperProps {
  roomStatus: string;
  turnStatus?: string;
}

export function PhaseStepper({ roomStatus, turnStatus }: PhaseStepperProps) {
  const isLobby = roomStatus === 'lobby';
  const isSubmission = roomStatus === 'active' && turnStatus === 'submission';
  const isVoting = roomStatus === 'active' && turnStatus === 'voting';
  const isWriting = roomStatus === 'active' && turnStatus === 'writing';
  const isNextTurnWaiting = roomStatus === 'active' && !turnStatus;

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1 text-[9px] font-black uppercase tracking-wider text-slate-400 mb-6 bg-slate-50/80 p-3 rounded-2xl border border-sky-100 select-none shadow-sm">
      <div className={`flex items-center gap-1 ${isLobby ? 'text-pink-600 font-extrabold' : 'text-slate-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isLobby ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
        <span>Phòng Chờ</span>
      </div>
      <span className="text-slate-300">/</span>
      <div className={`flex items-center gap-1 ${isSubmission ? 'text-sky-600 font-extrabold' : 'text-slate-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isSubmission ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
        <span>Ý tưởng</span>
      </div>
      <span className="text-slate-300">/</span>
      <div className={`flex items-center gap-1 ${isVoting ? 'text-pink-600 font-extrabold' : 'text-slate-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isVoting ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
        <span>Bình chọn</span>
      </div>
      <span className="text-slate-300">/</span>
      <div className={`flex items-center gap-1 ${isWriting ? 'text-purple-600 font-extrabold' : 'text-slate-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isWriting ? 'bg-purple-500 animate-pulse' : 'bg-slate-300'}`} />
        <span>AI Chấp Bút</span>
      </div>
      <span className="text-slate-300">/</span>
      <div className={`flex items-center gap-1 ${isNextTurnWaiting ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isNextTurnWaiting ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <span>Chuyển lượt</span>
      </div>
    </div>
  );
}
