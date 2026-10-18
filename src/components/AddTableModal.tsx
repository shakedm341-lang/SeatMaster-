import React, { useState, useEffect } from 'react';
import { X, Plus, Layers, Check } from 'lucide-react';
import { Table } from '../types';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableData: { name: string; capacity: number; shape?: 'round' | 'rectangle'; notes?: string }) => void;
  initialTable?: Table | null;
  suggestedTableNumber: number;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTable,
  suggestedTableNumber,
}) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(12);
  const [shape, setShape] = useState<'round' | 'rectangle'>('round');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTable) {
      setName(initialTable.name);
      setCapacity(initialTable.capacity);
      setShape(initialTable.shape || 'round');
      setNotes(initialTable.notes || '');
    } else {
      setName(`שולחן ${suggestedTableNumber}`);
      setCapacity(12);
      setShape('round');
      setNotes('');
    }
  }, [initialTable, suggestedTableNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      capacity: Math.max(1, capacity),
      shape,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {initialTable ? 'עריכת שולחן' : 'הוספת שולחן חדש לאולם'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              שם או מספר שולחן *
            </label>
            <input
              type="text"
              required
              placeholder="לדוגמה: שולחן 1, שולחן אבירים, משפחה קרובה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              קיבולת מקסימלית (מקומות ישיבה) *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCapacity(Math.max(2, capacity - 1))}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="2"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 12))}
                className="w-full text-center py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold text-slate-900"
              />
              <button
                type="button"
                onClick={() => setCapacity(capacity + 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">בחירה מהירה:</span>
              {[8, 10, 12, 14, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCapacity(num)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    capacity === num
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} מק'
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              הערות או מיקום באולם (אופציונלי)
            </label>
            <input
              type="text"
              placeholder="ליד הרחבה, קרוב למזנון, קומה שנייה..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialTable ? 'שמור שינויים' : 'פתח שולחן'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
