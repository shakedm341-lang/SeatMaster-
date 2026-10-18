import React from 'react';
import { AlertTriangle, RotateCcw, Sparkles, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isInfo = variant === 'info';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-100 text-rose-600'
                : isInfo
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isInfo ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : isInfo
                ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
