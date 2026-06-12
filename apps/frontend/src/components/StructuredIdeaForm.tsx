import React, { useState, useEffect } from 'react';
import { LightningChargeFill, CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { Loader2 } from 'lucide-react';

export interface StructuredIdeaPayload {
  proposedAction: string;
  locationOrTarget: string;
  consequence: string;
  tone?: string;
  optionalNote?: string;
}

interface StructuredIdeaFormProps {
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (content: string, structured?: StructuredIdeaPayload) => void;
}

const TEMPLATE_SUGGESTIONS: StructuredIdeaPayload[] = [
  {
    proposedAction: 'Nhóm thám hiểm phát hiện một cánh cửa kim loại cổ',
    locationOrTarget: 'bên dưới lòng đất của Hành Tinh Số 9',
    consequence: 'cánh cửa phát tín hiệu đánh thức một AI cổ đại',
    tone: 'bí ẩn, căng thẳng nhẹ',
    optionalNote: 'tập trung vào âm thanh khởi động của máy móc cổ xưa',
  },
  {
    proposedAction: 'Minh quyết định rút thanh kiếm găm sâu trên bệ đá',
    locationOrTarget: 'ngay giữa chánh điện của đền thờ thần mặt trời',
    consequence: 'luồng hào quang bùng lên làm tan chảy lớp băng bao quanh đền',
    tone: 'hùng vĩ, tráng lệ',
    optionalNote: 'mô tả thanh kiếm có các vết nứt rực ánh lửa',
  },
  {
    proposedAction: 'Nhân vật chính vô tình làm đổ lọ thuốc màu tím',
    locationOrTarget: 'trên cuốn sách ma pháp đang mở ở thư viện cổ',
    consequence: 'các ký tự trên trang sách bay lên và tạo thành một vòng xoáy năng lượng',
    tone: 'kỳ ảo, huyền bí',
    optionalNote: 'mô tả các ký tự phát sáng màu tím dịu mắt',
  },
];

export function StructuredIdeaForm({
  submitting,
  disabled = false,
  onSubmit,
}: StructuredIdeaFormProps) {
  const [proposedAction, setProposedAction] = useState('');
  const [locationOrTarget, setLocationOrTarget] = useState('');
  const [consequence, setConsequence] = useState('');
  const [tone, setTone] = useState('');
  const [optionalNote, setOptionalNote] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Generate preview content string
  const formatContentString = (payload: StructuredIdeaPayload) => {
    return [
      `Hành động: ${payload.proposedAction.trim()}`,
      `Bối cảnh/đối tượng: ${payload.locationOrTarget.trim()}`,
      `Hậu quả: ${payload.consequence.trim()}`,
      `Tông cảm xúc: ${payload.tone?.trim() || 'không chỉ định'}`,
      `Ghi chú cho AI: ${payload.optionalNote?.trim() || 'không có'}`,
    ].join('\n');
  };

  const previewString = [
    `Hành động: ${proposedAction || '...'}`,
    `Bối cảnh/đối tượng: ${locationOrTarget || '...'}`,
    `Hậu quả: ${consequence || '...'}`,
    `Tông cảm xúc: ${tone || 'không chỉ định'}`,
    `Ghi chú cho AI: ${optionalNote || 'không có'}`,
  ].join('\n');

  const handleQuickSuggest = () => {
    const randomTemplate = TEMPLATE_SUGGESTIONS[Math.floor(Math.random() * TEMPLATE_SUGGESTIONS.length)];
    setProposedAction(randomTemplate.proposedAction);
    setLocationOrTarget(randomTemplate.locationOrTarget);
    setConsequence(randomTemplate.consequence);
    setTone(randomTemplate.tone || '');
    setOptionalNote(randomTemplate.optionalNote || '');
    setErrors({});
    setGlobalError(null);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (proposedAction.trim().length < 8) {
      newErrors.proposedAction = 'Hành động nhân vật phải tối thiểu 8 ký tự.';
    }
    if (locationOrTarget.trim().length < 4) {
      newErrors.locationOrTarget = 'Địa điểm/đối tượng phải tối thiểu 4 ký tự.';
    }
    if (consequence.trim().length < 8) {
      newErrors.consequence = 'Hậu quả phải tối thiểu 8 ký tự.';
    }

    const payload: StructuredIdeaPayload = {
      proposedAction,
      locationOrTarget,
      consequence,
      tone,
      optionalNote,
    };
    const content = formatContentString(payload);
    if (content.length > 600) {
      setGlobalError(`Tổng chiều dài ý tưởng (${content.length} ký tự) vượt quá giới hạn 600 ký tự.`);
      return false;
    } else {
      setGlobalError(null);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: StructuredIdeaPayload = {
      proposedAction,
      locationOrTarget,
      consequence,
      tone,
      optionalNote,
    };

    const content = formatContentString(payload);
    onSubmit(content, payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick suggest button */}
      <div className="flex justify-between items-center select-none">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Đóng góp diễn biến tiếp theo
        </span>
        <button
          type="button"
          onClick={handleQuickSuggest}
          disabled={disabled || submitting}
          className="px-3 py-1.5 rounded-xl text-[10px] font-black text-sky-650 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
        >
          <LightningChargeFill className="w-3 h-3 text-sky-500 animate-pulse" />
          Gợi ý nhanh mẫu viết
        </button>
      </div>

      {/* Field 1: Proposed Action */}
      <div className="space-y-1">
        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
          1. Hành động chính của nhân vật *
        </label>
        <input
          value={proposedAction}
          onChange={(e) => {
            setProposedAction(e.target.value);
            if (errors.proposedAction) setErrors((prev) => { const copy = { ...prev }; delete copy.proposedAction; return copy; });
          }}
          disabled={disabled || submitting}
          placeholder="Ví dụ: Minh dũng cảm tiến tới xoay tay cầm kim loại lớn..."
          maxLength={150}
          className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none transition focus:bg-white bg-slate-50/50 ${
            errors.proposedAction ? 'border-pink-300 focus:border-pink-500' : 'border-sky-100 focus:border-sky-300'
          }`}
        />
        {errors.proposedAction ? (
          <p className="text-[10px] font-bold text-pink-600 flex items-center gap-1">
            <ExclamationTriangleFill className="w-3 h-3 shrink-0" />
            {errors.proposedAction}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400">Nhân vật chính hay nhóm nhân vật sẽ làm hành động gì?</p>
        )}
      </div>

      {/* Field 2: Location or Target */}
      <div className="space-y-1">
        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
          2. Địa điểm / Đối tượng bị ảnh hưởng *
        </label>
        <input
          value={locationOrTarget}
          onChange={(e) => {
            setLocationOrTarget(e.target.value);
            if (errors.locationOrTarget) setErrors((prev) => { const copy = { ...prev }; delete copy.locationOrTarget; return copy; });
          }}
          disabled={disabled || submitting}
          placeholder="Ví dụ: ngay trên bề mặt tấm bia đá lớn giữa sảnh đền cổ..."
          maxLength={100}
          className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none transition focus:bg-white bg-slate-50/50 ${
            errors.locationOrTarget ? 'border-pink-300 focus:border-pink-500' : 'border-sky-100 focus:border-sky-300'
          }`}
        />
        {errors.locationOrTarget ? (
          <p className="text-[10px] font-bold text-pink-600 flex items-center gap-1">
            <ExclamationTriangleFill className="w-3 h-3 shrink-0" />
            {errors.locationOrTarget}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400">Sự việc này diễn ra ở đâu, tác động đến vật thể hay ai?</p>
        )}
      </div>

      {/* Field 3: Consequence */}
      <div className="space-y-1">
        <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
          3. Hậu quả / Sự kiện xảy ra ngay sau đó *
        </label>
        <textarea
          rows={2}
          value={consequence}
          onChange={(e) => {
            setConsequence(e.target.value);
            if (errors.consequence) setErrors((prev) => { const copy = { ...prev }; delete copy.consequence; return copy; });
          }}
          disabled={disabled || submitting}
          placeholder="Ví dụ: một tiếng rầm lớn vang lên, cánh cửa đá nứt ra làm lộ lối đi ngầm ngập ánh sáng xanh..."
          maxLength={200}
          className={`w-full rounded-2xl border px-4 py-3 text-xs leading-5 outline-none transition resize-none focus:bg-white bg-slate-50/50 ${
            errors.consequence ? 'border-pink-300 focus:border-pink-500' : 'border-sky-100 focus:border-sky-300'
          }`}
        />
        {errors.consequence ? (
          <p className="text-[10px] font-bold text-pink-600 flex items-center gap-1">
            <ExclamationTriangleFill className="w-3 h-3 shrink-0" />
            {errors.consequence}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400">Hành động đó dẫn đến biến cố gì để AI viết tiếp?</p>
        )}
      </div>

      {/* Optional Field 4: Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-black text-slate-600 tracking-wider">
            4. Tông cảm xúc (Tùy chọn)
          </label>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={disabled || submitting}
            placeholder="Ví dụ: căng thẳng, kỳ bí, bi tráng..."
            maxLength={50}
            className="w-full rounded-2xl border border-sky-100 px-4 py-3 text-xs outline-none transition focus:bg-white bg-slate-50/50 focus:border-sky-300"
          />
        </div>

        {/* Optional Field 5: AI Note */}
        <div className="space-y-1">
          <label className="block text-xs font-black text-slate-600 tracking-wider">
            5. Ghi chú cho AI (Tùy chọn)
          </label>
          <input
            value={optionalNote}
            onChange={(e) => setOptionalNote(e.target.value)}
            disabled={disabled || submitting}
            placeholder="Ví dụ: tả kỹ ánh sáng xanh..."
            maxLength={100}
            className="w-full rounded-2xl border border-sky-100 px-4 py-3 text-xs outline-none transition focus:bg-white bg-slate-50/50 focus:border-sky-300"
          />
        </div>
      </div>

      {/* Realtime Live Preview (Only if user has typed something) */}
      {(proposedAction || locationOrTarget || consequence) && (
        <div className="p-4 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-slate-650 space-y-2 select-none">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
            Bản thảo xem trước ý tưởng gửi lên AI:
          </span>
          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            {previewString}
          </pre>
        </div>
      )}

      {/* Global character count error */}
      {globalError && (
        <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 p-3 text-xs font-bold text-pink-650">
          <ExclamationTriangleFill className="w-4 h-4 shrink-0 text-pink-505" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Submit Action */}
      <button
        type="submit"
        disabled={disabled || submitting || !proposedAction.trim() || !locationOrTarget.trim() || !consequence.trim()}
        className="w-full py-3.5 text-xs rounded-2xl font-black transition-all flex items-center justify-center gap-1.5 fs-btn-green disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang gửi đề xuất diễn biến...
          </>
        ) : (
          <>
            <CheckCircleFill className="w-4 h-4 text-white" />
            Gửi đề xuất diễn biến
          </>
        )}
      </button>
    </form>
  );
}
