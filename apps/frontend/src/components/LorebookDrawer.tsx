import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { BookHalf, X, PlusLg, ExclamationCircleFill } from 'react-bootstrap-icons';
import { Loader2 } from 'lucide-react';

interface LorebookEntry {
  key: string;
  content: string;
}

interface Lorebook {
  entries: LorebookEntry[];
}

interface LorebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lorebook: Lorebook | null;
  newLoreKey: string;
  setNewLoreKey: (val: string) => void;
  newLoreContent: string;
  setNewLoreContent: (val: string) => void;
  addingLore: boolean;
  onAddLore: (e: React.FormEvent) => Promise<void> | void;
}

export function LorebookDrawer({
  isOpen,
  onClose,
  lorebook,
  newLoreKey,
  setNewLoreKey,
  newLoreContent,
  setNewLoreContent,
  addingLore,
  onAddLore,
}: LorebookDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-40 flex justify-end">
          {/* Overlay backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Drawer panel */}
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md bg-white/95 border-l border-sky-100 h-full flex flex-col justify-between shadow-2xl backdrop-blur-2xl"
          >
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookHalf className="w-5 h-5 text-sky-550" />
                  <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-500">
                    Lorebook Thiết Lập
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Entry Form */}
              <form onSubmit={onAddLore} className="p-6 border-b border-sky-100 space-y-3 bg-sky-50/40">
                <span className="text-[10px] text-sky-600 font-extrabold uppercase tracking-wider">
                  Thêm Thiết Lập / Khái Niệm
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Thực thể..."
                    value={newLoreKey}
                    onChange={(e) => setNewLoreKey(e.target.value)}
                    className="col-span-1 bg-white border border-sky-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-400 transition-colors text-slate-800 placeholder-slate-400"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Quy tắc cốt truyện..."
                    value={newLoreContent}
                    onChange={(e) => setNewLoreContent(e.target.value)}
                    className="col-span-2 bg-white border border-sky-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-400 transition-colors text-slate-800 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingLore || !newLoreKey.trim() || !newLoreContent.trim()}
                  className="w-full py-2 text-xs rounded-xl disabled:opacity-50 fs-btn-green gap-1.5"
                >
                  {addingLore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <PlusLg className="w-3.5 h-3.5" />
                      Ghi nhận cốt truyện
                    </>
                  )}
                </button>
              </form>

              {/* Entries List */}
              <div className="p-6 space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto">
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">
                  Danh Sách Thiết Lập Cốt Truyện ({lorebook?.entries?.length || 0})
                </span>
                <div className="space-y-2">
                  {lorebook?.entries?.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-xl space-y-1 shadow-xs"
                    >
                      <span className="text-xs font-bold text-sky-600">{entry.key}</span>
                      <p className="text-xs text-slate-755 leading-relaxed">{entry.content}</p>
                    </div>
                  ))}

                  {(!lorebook || !lorebook.entries || lorebook.entries.length === 0) && (
                    <div className="text-center py-10 text-slate-500 italic text-xs space-y-1.5">
                      <ExclamationCircleFill className="w-6 h-6 text-sky-400 mx-auto" />
                      <p>Lorebook chưa có dữ liệu thiết lập.</p>
                      <p className="text-slate-400 text-[10px]">
                        Hãy thêm khái niệm để đảm bảo nội dung viết không bị mâu thuẫn.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-sky-100 text-[10px] text-slate-450 font-bold uppercase tracking-wider bg-sky-50/20 text-center select-none">
              Đồng bộ Lorebook trực tiếp
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
