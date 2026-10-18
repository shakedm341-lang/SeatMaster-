import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GripVertical,
  Users,
  MoreVertical,
  Trash2,
  Edit2,
  CornerDownLeft,
  Info,
  Search,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Guest, Table } from '../types';
import { getGroupStyle } from '../data/categories';

interface GuestCardProps {
  guest: Guest;
  tables: Table[];
  allGuests?: Guest[];
  onAssignToTable: (guestId: string, tableId: string | null) => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (guestId: string) => void;
  isCompact?: boolean;
}

export const GuestCard: React.FC<GuestCardProps> = ({
  guest,
  tables,
  allGuests = [],
  onAssignToTable,
  onEditGuest,
  onDeleteGuest,
  isCompact = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [tableFilterText, setTableFilterText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const groupStyle = getGroupStyle(guest.group);

  // Close quick assign on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsQuickAssignOpen(false);
      }
    };
    if (isQuickAssignOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickAssignOpen]);

  // Compute live occupancy stats for tables
  const tableOccupancyMap = useMemo(() => {
    const map = new Map<string, { occupied: number; remaining: number }>();
    tables.forEach((t) => {
      const seated = allGuests.filter((g) => g.tableId === t.id);
      const occupied = seated.reduce((sum, g) => sum + g.partySize, 0);
      map.set(t.id, {
        occupied,
        remaining: t.capacity - occupied,
      });
    });
    return map;
  }, [tables, allGuests]);

  // Filter tables in quick assign popover
  const filteredTables = useMemo(() => {
    const query = tableFilterText.trim().toLowerCase();
    if (!query) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query))
    );
  }, [tables, tableFilterText]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', guest.id);
    e.dataTransfer.setData('application/json', JSON.stringify(guest));
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('guest-card-dragging');
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('guest-card-dragging');
    }
  };

  const currentTable = tables.find((t) => t.id === guest.tableId);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={() => onEditGuest(guest)}
      className={`group relative bg-white border border-slate-200/90 rounded-xl transition-all duration-150 hover:shadow-md hover:border-indigo-300 select-none cursor-grab active:cursor-grabbing ${
        isCompact ? 'p-2' : 'p-3'
      }`}
      title="גרור לשולחן, או לחץ פעמיים לעריכת פרטים"
    >
      <div className="flex items-start justify-between gap-2">
        {/* Drag handle & Main details */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div
            className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5"
            title="גרור לשולחן"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-slate-900 truncate">
                {guest.name}
              </span>

              {/* Headcount pill */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                <Users className="w-3 h-3 text-slate-500" />
                {guest.partySize} {guest.partySize === 1 ? 'נפש' : 'נפשות'}
              </span>
            </div>

            {/* Category tag badge */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0"
                style={{
                  backgroundColor: groupStyle.bgLight,
                  borderColor: groupStyle.border,
                  color: groupStyle.text,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full ml-1"
                  style={{ backgroundColor: groupStyle.color }}
                />
                {guest.group}
              </span>

              {guest.notes && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                  title={guest.notes}
                >
                  <Info className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[120px]">{guest.notes}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Quick Seat Button + More Menu */}
        <div className="flex items-center gap-1 shrink-0 relative" ref={popoverRef}>
          {/* Quick Seat Button (1-Click without drag) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickAssignOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isQuickAssignOpen
                ? 'bg-indigo-600 text-white shadow-xs'
                : currentTable
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300'
            }`}
            title="שיבוץ מהיר לשולחן בלחיצה ללא גרירה"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {currentTable ? currentTable.name : 'הושב...'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Direct Edit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditGuest(guest);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            title="ערוך פרטי מוזמן (שם, כמות, קבוצה, הערות ושולחן)"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* More Actions (Edit, Delete) */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
                setIsQuickAssignOpen(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="פעולות נוספות"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEditGuest(guest);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>ערוך פרטי מוזמן</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeleteGuest(guest.id);
                    }}
                    className="w-full text-right px-3 py-2 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>מחק מהרשימה</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Assign Popover Modal */}
          {isQuickAssignOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>בחר שולחן עבור {guest.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  ({guest.partySize} נפשות)
                </span>
              </div>

              {/* Search Table inside Popover */}
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="חפש שולחן..."
                  value={tableFilterText}
                  onChange={(e) => setTableFilterText(e.target.value)}
                  className="w-full pr-7 pl-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tables List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                {tables.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    אין שולחנות פתוחים עדיין
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    לא נמצא שולחן תואם
                  </div>
                ) : (
                  filteredTables.map((t) => {
                    const stats = tableOccupancyMap.get(t.id) || {
                      occupied: 0,
                      remaining: t.capacity,
                    };
                    const isCurrent = guest.tableId === t.id;
                    const wouldOverload =
                      !isCurrent && stats.occupied + guest.partySize > t.capacity;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onAssignToTable(guest.id, t.id);
                          setIsQuickAssignOpen(false);
                        }}
                        className={`w-full text-right px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer border ${
                          isCurrent
                            ? 'bg-indigo-50/80 border-indigo-300 font-bold text-indigo-900 shadow-2xs'
                            : wouldOverload
                            ? 'bg-rose-50/50 hover:bg-rose-50 border-rose-200 text-slate-800'
                            : 'bg-slate-50/70 hover:bg-indigo-50/60 border-slate-100 hover:border-indigo-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-semibold text-xs truncate">
                            {t.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-md font-bold shrink-0">
                              נוכחי
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              wouldOverload
                                ? 'bg-rose-100 text-rose-700'
                                : stats.remaining <= 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stats.occupied}/{t.capacity}{' '}
                            {stats.remaining > 0
                              ? `(${stats.remaining} פנויים)`
                              : '(מלא)'}
                          </span>
                          {isCurrent && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Option to unseat guest if already assigned */}
              {guest.tableId && (
                <div className="pt-2 mt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onAssignToTable(guest.id, null);
                      setIsQuickAssignOpen(false);
                    }}
                    className="w-full text-right px-2 py-1.5 rounded-lg text-amber-700 hover:bg-amber-50 flex items-center justify-center gap-1.5 transition-colors font-semibold cursor-pointer text-xs"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>החזר למאגר ללא שולחן</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
