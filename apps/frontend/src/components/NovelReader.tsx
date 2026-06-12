import React, { useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { BookHalf, ChevronRight } from 'react-bootstrap-icons';

interface Chapter {
  _id: string;
  number: number;
  title: string;
  content: string;
}

interface NovelReaderProps {
  roomName: string;
  chapters: Chapter[];
  readerEndRef: React.RefObject<HTMLDivElement | null>;
  lastPublishedChapterId?: string | null;
}

export function NovelReader({
  roomName,
  chapters,
  readerEndRef,
  lastPublishedChapterId,
}: NovelReaderProps) {
  const wordCount = chapters.reduce(
    (acc, c) => acc + (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0),
    0
  );

  useEffect(() => {
    if (lastPublishedChapterId && readerEndRef.current) {
      setTimeout(() => {
        readerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [lastPublishedChapterId, readerEndRef]);

  return (
    <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-b from-sky-50/10 via-sky-50/30 to-white border-t lg:border-t-0 lg:border-l border-sky-100/60 p-5 sm:p-8 overflow-y-auto h-full">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
        
        <div className="space-y-8 pb-10">
          <div className="text-center border-b border-sky-100 pb-6 mb-6">
            <span className="text-[10px] text-pink-600 uppercase tracking-[0.28em] font-black">
              Bản thảo Đồng sáng tác
            </span>
            <h2 className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-pink-500 tracking-tight mt-2">
              {roomName || 'Tên tác phẩm'}
            </h2>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-24 text-slate-500 italic text-sm space-y-2 select-none rounded-[2rem] border border-dashed border-sky-200 bg-white/80">
              <BookHalf className="w-8 h-8 text-sky-500 mx-auto" />
              <p>Chưa có chương truyện nào được sáng tác.</p>
              <p className="text-xs text-gray-650">
                Hãy bắt đầu lượt đầu tiên để AI sinh phân đoạn truyện khởi đầu!
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {chapters.map((chapter) => {
                const isNew = chapter._id === lastPublishedChapterId;
                return (
                  <m.div
                    key={chapter._id}
                    initial={isNew ? { scale: 0.98, opacity: 0.5 } : false}
                    animate={isNew ? { scale: 1, opacity: 1 } : false}
                    className={`novel-page-effect rounded-[1.75rem] p-6 transition-all duration-1000 space-y-4 bg-white/60 ${
                      isNew 
                        ? 'ring-2 ring-pink-400 bg-pink-50/10 shadow-lg shadow-pink-500/5 scale-[1.01]' 
                        : 'shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-pink-600 text-xs font-black uppercase tracking-[0.2em]">
                      <span>Chương {chapter.number}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
                      <span className="text-slate-650">{chapter.title}</span>
                      {isNew && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-500 text-white animate-pulse">
                          Đoạn Mới
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-slate-900 leading-relaxed font-novel tracking-wide whitespace-pre-line text-justify pl-1">
                      {chapter.content}
                    </p>
                  </m.div>
                );
              })}
            </div>
          )}
          
          <div ref={readerEndRef} />
        </div>

        {/* Status Badge */}
        <div className="border-t border-sky-100 pt-4 mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>Số từ đã viết: {wordCount}</span>
          <span className="inline-flex items-center gap-1.5 text-sky-500">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            Đồng bộ trực tiếp
          </span>
        </div>
      </div>
    </div>
  );
}
