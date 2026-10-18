import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  RotateCcw,
  Info,
  GripVertical,
  Plus,
} from 'lucide-react';
import { Guest, Table } from '../types';
import { getGroupStyle } from '../data/categories';

interface TableCardProps {
  table: Table;
  seatedGuests: Guest[];
  onAssignGuestToTable: (guestId: string, tableId: string | null) => void;
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: string) => void;
  onClearTable: (tableId: string) => void;
  onEditGuest?: (guest: Guest) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  seatedGuests,
  onAssignGuestToTable,
  onEditTable,
  onDeleteTable,
  onClearTable,
  onEditGuest,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showQuickAddList, setShowQuickAddList] = useState(false);

  // Headcount calculation
  const totalOccupied = seatedGuests.reduce((acc, g) => acc + g.partySize, 0);
  const isOverloaded = totalOccupied > table.capacity;
  const isFull = totalOccupied === table.capacity;
  const remainingSeats = table.capacity - totalOccupied;
  const percentage = Math.min(100, Math.round((totalOccupied / table.capacity) * 100));

  // Progress ring calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  // Progress can exceed 100 visually or clamp to ring
  const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  // Ring colors
  let ringColor = '#6366f1'; // indigo-500
  let ringBg = '#eef2ff'; // indigo-50
  if (isOverloaded) {
    ringColor = '#ef4444'; // red-500
    ringBg = '#fef2f2'; // red-50
  } else if (isFull) {
    ringColor = '#10b981'; // emerald-500
    ringBg = '#ecfdf5'; // emerald-50
  } else if (percentage >= 80) {
    ringColor = '#f59e0b'; // amber-500
    ringBg = '#fffbeb'; // amber-50
  }

  // Drag & drop handlers on table
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const guestId = e.dataTransfer.getData('text/plain');
    if (guestId) {
      onAssignGuestToTable(guestId, table.id);
    }
  };

  // Drag guest out of table
  const handleGuestDragStart = (e: React.DragEvent, guest: Guest) => {
    e.dataTransfer.setData('text/plain', guest.id);
    e.dataTransfer.setData('application/json', JSON.stringify(guest));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Group breakdown calculation for tooltip
  const groupBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    seatedGuests.forEach((g) => {
      counts[g.group] = (counts[g.group] || 0) + g.partySize;
    });
    return Object.entries(counts).map(([group, count]) => ({
      group,
      count,
      pct: Math.round((count / (totalOccupied || 1)) * 100),
      style: getGroupStyle(group),
    }));
  }, [seatedGuests, totalOccupied]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white rounded-2xl transition-all duration-200 border flex flex-col justify-between shadow-xs hover:shadow-lg ${
        isOverloaded
          ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20'
          : isDragOver
          ? 'border-indigo-500 ring-4 ring-indigo-100 bg-indigo-50/30 scale-[1.01]'
          : isFull
          ? 'border-emerald-300 ring-1 ring-emerald-100'
          : 'border-slate-200/90 hover:border-indigo-200'
      }`}
    >
      {/* Table Header */}
      <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              isOverloaded
                ? 'bg-rose-500 animate-ping'
                : isFull
                ? 'bg-emerald-500'
                : percentage > 0
                ? 'bg-indigo-500'
                : 'bg-slate-300'
            }`}
          />
          <h3 className="font-bold text-slate-900 text-sm truncate" title={table.name}>
            {table.name}
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <button
            type="button"
            onClick={() => onEditTable(table)}
            className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="ערוך שם או קיבולת שולחן"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {seatedGuests.length > 0 && (
            <button
              type="button"
              onClick={() => onClearTable(table.id)}
              className="p-1 rounded-md hover:bg-amber-50 hover:text-amber-700 transition-colors"
              title="פנה את כל האורחים משולחן זה חזרה למאגר"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteTable(table.id)}
            className="p-1 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="מחק שולחן זה"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table Visual Gauge Area */}
      <div className="p-4 flex items-center justify-between gap-4">
        {/* Progress Ring Graphic */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 -rotate-90 transform">
            {/* Background Track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={ringColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
            <span
              className={`text-base font-extrabold ${
                isOverloaded ? 'text-rose-600' : isFull ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {totalOccupied}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
              / {table.capacity}
            </span>
          </div>
        </div>

        {/* Capacity Details & Status Badge */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
            {isOverloaded ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3 h-3" />
                חריגה ({totalOccupied - table.capacity}+)
              </span>
            ) : isFull ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                שולחן מלא
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                נותרו {remainingSeats} מקומות
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            {seatedGuests.length === 0 ? (
              <span className="text-slate-400 italic">השולחן ריק - גרור מוזמנים לכאן</span>
            ) : (
              <span>{seatedGuests.length} קבוצות / משפחות</span>
            )}
          </p>

          {/* Mini group color dots preview */}
          {groupBreakdown.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {groupBreakdown.map((g) => (
                <div
                  key={g.group}
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
                  style={{ backgroundColor: g.style.color }}
                  title={`${g.group}: ${g.count} מוזמנים`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seated Guests List in Table */}
      <div className="px-4 pb-3 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>יושבים בשולחן ({totalOccupied} נפשות)</span>
          {isDragOver && (
            <span className="text-indigo-600 font-bold animate-pulse text-[11px]">
              + שחרר להוספה
            </span>
          )}
        </div>

        {seatedGuests.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-50/60 text-indigo-700'
                : 'border-slate-200 bg-slate-50/50 text-slate-400'
            }`}
          >
            <p className="text-xs font-medium">גרור מוזמנים לכאן</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {seatedGuests.map((guest) => {
              const style = getGroupStyle(guest.group);
              return (
                <div
                  key={guest.id}
                  draggable
                  onDragStart={(e) => handleGuestDragStart(e, guest)}
                  onDoubleClick={() => onEditGuest?.(guest)}
                  className="group/item flex items-center justify-between gap-1.5 p-1.5 px-2 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-indigo-300 rounded-lg text-xs transition-all cursor-grab active:cursor-grabbing shadow-2xs"
                  title="גרור לשולחן אחר, לחץ על העיפרון לעריכה, או על X להחזרה למאגר"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <GripVertical className="w-3 h-3 text-slate-300 group-hover/item:text-slate-500 shrink-0" />
                    
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: style.color }}
                    />

                    <span className="font-semibold text-slate-800 truncate text-[12px]">
                      {guest.name}
                    </span>

                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-200 shrink-0">
                      👥 {guest.partySize}
                    </span>

                    {guest.notes && (
                      <span
                        className="text-amber-600 cursor-help shrink-0"
                        title={guest.notes}
                      >
                        <Info className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Edit button */}
                    {onEditGuest && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGuest(guest);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="ערוך פרטי מוזמן (שם, כמות, קבוצה, הערות ושולחן)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Remove button (returns to pool) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignGuestToTable(guest.id, null);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="החזר מוזמן למאגר הכללי (בטל שיבוץ)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
