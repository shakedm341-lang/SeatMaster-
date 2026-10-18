import React, { useState, useMemo } from 'react';
import {
  Plus,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Users,
  Grid,
  Sparkles,
  ArrowUpDown,
  Clock,
  SortAsc,
  Sparkle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Scan,
  Map as MapIcon,
  MousePointer2,
  Download,
} from 'lucide-react';
import { Table, Guest } from '../types';
import { TableCard } from './TableCard';
import { MapFloorPlan } from './MapFloorPlan';
import { ExportMapModal } from './ExportMapModal';

const LOCAL_STORAGE_SORT_KEY = 'event_seating_table_sort_v1';

export type TableSortOption = 'newest' | 'name' | 'available' | 'full' | 'oldest';

interface SeatingAreaCanvasProps {
  tables: Table[];
  guests: Guest[];
  onOpenAddTable: () => void;
  onAssignGuestToTable: (guestId: string, tableId: string | null) => void;
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: string) => void;
  onClearTable: (tableId: string) => void;
  onUpdateTablePosition?: (tableId: string, position: { x: number; y: number; rotation?: number; isPlaced?: boolean } | null) => void;
  danceFloor?: import('../types').DanceFloor | null;
  onUpdateDanceFloor?: (danceFloor: import('../types').DanceFloor | null) => void;
  onEditGuest?: (guest: Guest) => void;
  onQuickRenameTable?: (tableId: string, newName: string) => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

export const SeatingAreaCanvas: React.FC<SeatingAreaCanvasProps> = ({
  tables,
  guests,
  danceFloor,
  onOpenAddTable,
  onAssignGuestToTable,
  onEditTable,
  onDeleteTable,
  onClearTable,
  onUpdateTablePosition,
  onUpdateDanceFloor,
  onEditGuest,
  onQuickRenameTable,
  isPresentationMode = false,
  onTogglePresentationMode,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overloaded' | 'available' | 'full'>('all');
  
  // View Mode: 'edit' (cards) or 'map' (visual floor plan)
  const [viewMode, setViewMode] = useState<'edit' | 'map'>('edit');

  // Zoom State
  const [zoomScale, setZoomScale] = useState(1);

  // Export Map Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Table Sort State (default to newest first so new tables appear immediately at the top)
  const [sortBy, setSortBy] = useState<TableSortOption>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SORT_KEY);
      if (saved && ['newest', 'name', 'available', 'full', 'oldest'].includes(saved)) {
        return saved as TableSortOption;
      }
    } catch (e) {
      console.error(e);
    }
    return 'newest';
  });

  const handleSortChange = (newSort: TableSortOption) => {
    setSortBy(newSort);
    try {
      localStorage.setItem(LOCAL_STORAGE_SORT_KEY, newSort);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute stats per table
  const tableStatsMap = useMemo(() => {
    const map = new Map<string, { totalOccupied: number; remaining: number; isOverloaded: boolean; isFull: boolean; isAvailable: boolean }>();
    tables.forEach((t) => {
      const seated = guests.filter((g) => g.tableId === t.id);
      const totalOccupied = seated.reduce((acc, g) => acc + g.partySize, 0);
      map.set(t.id, {
        totalOccupied,
        remaining: t.capacity - totalOccupied,
        isOverloaded: totalOccupied > t.capacity,
        isFull: totalOccupied === t.capacity,
        isAvailable: totalOccupied < t.capacity,
      });
    });
    return map;
  }, [tables, guests]);

  // Filter and Sort tables
  const filteredAndSortedTables = useMemo(() => {
    // 1. Filter
    const result = tables.filter((t) => {
      const stats = tableStatsMap.get(t.id);
      const matchSearch =
        tableSearch.trim() === '' ||
        t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(tableSearch.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'overloaded') matchStatus = !!stats?.isOverloaded;
      else if (statusFilter === 'available') matchStatus = !!stats?.isAvailable;
      else if (statusFilter === 'full') matchStatus = !!stats?.isFull;

      return matchSearch && matchStatus;
    });

    // 2. Sort
    return result.sort((a, b) => {
      const statsA = tableStatsMap.get(a.id) || { totalOccupied: 0, remaining: a.capacity, isOverloaded: false, isFull: false, isAvailable: true };
      const statsB = tableStatsMap.get(b.id) || { totalOccupied: 0, remaining: b.capacity, isOverloaded: false, isFull: false, isAvailable: true };

      if (sortBy === 'newest') {
        // Tables created most recently appear first
        const timeA = a.createdAt ?? 0;
        const timeB = b.createdAt ?? 0;
        if (timeA !== timeB) return timeB - timeA;
        // Fallback to reversed index if timestamps are identical
        return tables.indexOf(b) - tables.indexOf(a);
      }

      if (sortBy === 'oldest') {
        const timeA = a.createdAt ?? 0;
        const timeB = b.createdAt ?? 0;
        if (timeA !== timeB) return timeA - timeB;
        return tables.indexOf(a) - tables.indexOf(b);
      }

      if (sortBy === 'name') {
        // Natural Hebrew/Number sorting (e.g. שולחן 1, שולחן 2, שולחן 10)
        return a.name.localeCompare(b.name, 'he', { numeric: true, sensitivity: 'base' });
      }

      if (sortBy === 'available') {
        // Most available seats first
        return statsB.remaining - statsA.remaining;
      }

      if (sortBy === 'full') {
        // Most occupied seats first
        return statsB.totalOccupied - statsA.totalOccupied;
      }

      return 0;
    });
  }, [tables, tableSearch, statusFilter, sortBy, tableStatsMap]);

  // Total overloaded count for warning badge
  const totalOverloaded = useMemo(() => {
    let count = 0;
    tableStatsMap.forEach((s) => {
      if (s.isOverloaded) count++;
    });
    return count;
  }, [tableStatsMap]);

  return (
    <main className={`flex-1 w-full bg-slate-50/70 rounded-2xl transition-all ${isPresentationMode ? 'overflow-auto h-full p-6' : ''}`}>
      {/* Canvas Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              מפת הושבה ואולם האירוע
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
              {tables.length} שולחנות
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'map'
              ? 'גרור שולחנות ממאגר השולחנות בצד שמאל ישירות לרחבת האולם, סובב ושנה מיקומים לפי הצורך'
              : 'גרור מוזמנים מהרשימה בצד ימין או השתמש בכפתור השיבוץ המהיר על כל כרטיס מוזמן'}
          </p>
        </div>

        {/* View & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="מצב עריכה: סידור ושיבוץ אורחים"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">עריכה</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="מצב מפה: סידור שולחנות באולם"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">מפה</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs h-10" dir="ltr">
            <button
              onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.1))}
              className="px-2.5 h-full text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-r border-slate-200 cursor-pointer"
              title="הקטן תצוגה"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="px-3 h-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer w-14"
              title="איפוס זום"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={() => setZoomScale(Math.min(1.5, zoomScale + 0.1))}
              className="px-2.5 h-full text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-l border-slate-200 cursor-pointer"
              title="הגדל תצוגה"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onTogglePresentationMode}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer ${
              isPresentationMode 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
            title={isPresentationMode ? "צא ממסך מלא" : "מסך מלא (הסתר הכל מלבד השולחנות)"}
          >
            {isPresentationMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenAddTable}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ פתח שולחן חדש</span>
          </button>
          {viewMode === 'map' && !danceFloor && onUpdateDanceFloor && (
            <button
              onClick={() => onUpdateDanceFloor({ x: 300, y: 300, width: 250, height: 250 })}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white text-sm font-bold shadow-md shadow-pink-200 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>+ רחבת ריקודים</span>
            </button>
          )}
          {viewMode === 'map' && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="הורד תמונה של מפת השולחנות (PNG)"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>הורד תמונת מפה</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar for Tables */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              כל השולחנות ({tables.length})
            </button>

            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                statusFilter === 'available'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <span>פנויים להושבה</span>
            </button>

            <button
              onClick={() => setStatusFilter('full')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                statusFilter === 'full'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>שולחנות מלאים</span>
            </button>

            <button
              onClick={() => setStatusFilter('overloaded')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                statusFilter === 'overloaded'
                  ? 'bg-rose-600 text-white'
                  : totalOverloaded > 0
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>תפוסת יתר {totalOverloaded > 0 && `(${totalOverloaded})`}</span>
            </button>
          </div>

          {/* Table Search & Sorting */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Table Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="חפש שולחן..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Table Sort Dropdown */}
            <div className="relative w-full sm:w-auto shrink-0 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 hidden sm:inline">מיון:</span>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as TableSortOption)}
                  className="w-full sm:w-44 px-2.5 py-1.5 pr-7 pl-6 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="newest">🆕 חדשים ראשונים</option>
                  <option value="name">🔢 לפי מספר / שם (1-9)</option>
                  <option value="available">🟢 פנויים ביותר ראשונים</option>
                  <option value="full">👥 תפוסים ביותר ראשונים</option>
                  <option value="oldest">⏳ סדר יצירה (ישנים ראשונים)</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="transition-transform duration-300 origin-top-right" 
        style={{ transform: `scale(${zoomScale})`, width: `${100 / zoomScale}%` }}
      >
        {filteredAndSortedTables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 mx-auto" style={{ maxWidth: '400px' }}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {tables.length === 0 ? 'אין עדיין שולחנות באולם' : 'לא נמצאו שולחנות תואמים לסינון'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {tables.length === 0
                ? 'פתח את השולחן הראשון שלך כדי להתחיל לסדר ולהושיב את המוזמנים לאירוע.'
                : 'נסה לאפס את הסינון או מונח החיפוש.'}
            </p>
            {tables.length === 0 && (
              <button
                onClick={onOpenAddTable}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ פתח שולחן ראשון עכשיו</span>
              </button>
            )}
          </div>
        ) : viewMode === 'map' ? (
          <MapFloorPlan
            tables={tables}
            guests={guests}
            danceFloor={danceFloor}
            onUpdateTablePosition={onUpdateTablePosition}
            onUpdateDanceFloor={onUpdateDanceFloor}
            onEditGuest={onEditGuest}
            onEditTable={onEditTable}
            onQuickRenameTable={onQuickRenameTable}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAndSortedTables.map((table) => {
              const seatedGuests = guests.filter((g) => g.tableId === table.id);
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  seatedGuests={seatedGuests}
                  onAssignGuestToTable={onAssignGuestToTable}
                  onEditTable={onEditTable}
                  onDeleteTable={onDeleteTable}
                  onClearTable={onClearTable}
                  onEditGuest={onEditGuest}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Export Map Image Modal */}
      <ExportMapModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tables={tables}
        guests={guests}
        danceFloor={danceFloor}
      />
    </main>
  );
};
