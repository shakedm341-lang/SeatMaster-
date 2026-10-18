import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Users } from 'lucide-react';
import { Guest, Table } from '../types';
import { DEFAULT_CATEGORIES } from '../data/categories';

interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  tables: Table[];
  onSave: (updated: Guest) => void;
  onDelete: (guestId: string) => void;
}

export const EditGuestModal: React.FC<EditGuestModalProps> = ({
  isOpen,
  onClose,
  guest,
  tables,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState<number>(1);
  const [group, setGroup] = useState('משפחת כלה');
  const [customGroup, setCustomGroup] = useState('');
  const [tableId, setTableId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (guest) {
      setName(guest.name);
      setPartySize(guest.partySize);
      const isPredefined = DEFAULT_CATEGORIES.some((c) => c.name === guest.group);
      if (isPredefined) {
        setGroup(guest.group);
        setCustomGroup('');
      } else {
        setGroup('custom');
        setCustomGroup(guest.group);
      }
      setTableId(guest.tableId);
      setNotes(guest.notes || '');
    }
  }, [guest, isOpen]);

  if (!isOpen || !guest) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalGroup = group === 'custom' ? (customGroup.trim() || 'כללי') : group;

    onSave({
      ...guest,
      name: name.trim(),
      partySize: Math.max(1, partySize),
      group: finalGroup,
      tableId,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            עריכת פרטי מוזמן
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              שם האורח / משפחה *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                כמות נפשות
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-8 h-8 bg-slate-100 rounded-r-md text-slate-700 hover:bg-slate-200 font-bold border border-slate-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={partySize}
                  onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-1.5 bg-slate-50 border-y border-slate-300 text-slate-900 font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => setPartySize(partySize + 1)}
                  className="w-8 h-8 bg-slate-100 rounded-l-md text-slate-700 hover:bg-slate-200 font-bold border border-slate-300"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                קבוצה / שיוך
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="custom">אחר (הקלד ידנית)...</option>
              </select>
            </div>
          </div>

          {group === 'custom' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                שם קבוצה מותאם
              </label>
              <input
                type="text"
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              שיוך לשולחן
            </label>
            <select
              value={tableId || 'unassigned'}
              onChange={(e) => setTableId(e.target.value === 'unassigned' ? null : e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="unassigned">ללא שולחן (מאגר הממתינים)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (קיבולת: {t.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              הערות / העדפות
            </label>
            <input
              type="text"
              placeholder="צמחוני, כיסא גלגלים, ליד הדלת..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onDelete(guest.id);
                onClose();
              }}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>מחק מוזמן</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>שמור שינויים</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
