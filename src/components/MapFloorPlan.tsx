import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Table, Guest, DanceFloor } from '../types';
import {
  RotateCcw,
  Maximize2,
  Music,
  Undo2,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Sparkles,
  Users,
  Compass,
  ArrowDownToLine,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  Scan,
  Edit2,
  Check,
  X,
  Download,
} from 'lucide-react';
import { ExportMapModal } from './ExportMapModal';

interface MapFloorPlanProps {
  tables: Table[];
  guests: Guest[];
  danceFloor?: DanceFloor | null;
  onUpdateTablePosition?: (tableId: string, position: { x: number; y: number; rotation?: number; isPlaced?: boolean } | null) => void;
  onUpdateDanceFloor?: (danceFloor: DanceFloor | null) => void;
  onEditGuest?: (guest: Guest) => void;
  onEditTable?: (table: Table) => void;
  onQuickRenameTable?: (tableId: string, newName: string) => void;
}

export const MapFloorPlan: React.FC<MapFloorPlanProps> = ({
  tables,
  guests,
  danceFloor,
  onUpdateTablePosition,
  onUpdateDanceFloor,
  onEditGuest,
  onEditTable,
  onQuickRenameTable,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom state: ranges from 0.25 (25% - full bird's eye view) to 1.5 (150% - close-up view)
  const [zoom, setZoom] = useState<number>(0.65);

  // Export Map Image Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Inline Table Rename State
  const [inlineEditingTableId, setInlineEditingTableId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState<string>('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineEditingTableId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditingTableId]);

  const handleStartInlineRename = (table: Table) => {
    setInlineEditingTableId(table.id);
    setInlineNameValue(table.name);
  };

  const handleSaveInlineRename = (tableId: string) => {
    const trimmed = inlineNameValue.trim();
    if (trimmed) {
      if (onQuickRenameTable) {
        onQuickRenameTable(tableId, trimmed);
      } else if (onEditTable) {
        const table = tables.find((t) => t.id === tableId);
        if (table) {
          onEditTable({ ...table, name: trimmed });
        }
      }
    }
    setInlineEditingTableId(null);
  };

  const handleCancelInlineRename = () => {
    setInlineEditingTableId(null);
  };

  // Sidebar state
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'unplaced' | 'placed'>('unplaced');

  // Dragging states on canvas
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [draggingDanceFloor, setDraggingDanceFloor] = useState(false);
  const [resizingDanceFloor, setResizingDanceFloor] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Dragging state from sidebar onto canvas
  const [draggedSidebarTable, setDraggedSidebarTable] = useState<Table | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);

  const getTableDimensions = (capacity: number) => {
    // 10-12: square
    if (capacity >= 10 && capacity <= 12) {
      return { width: 120, height: 120, shapeClass: 'rounded-xl', isRect: false, label: 'ריבועי' };
    }
    // 18-24: rectangle
    if (capacity >= 18 && capacity <= 24) {
      return { width: 240, height: 100, shapeClass: 'rounded-xl', isRect: true, label: 'מלבני' };
    }
    // default: round
    return { width: 100, height: 100, shapeClass: 'rounded-full', isRect: false, label: 'עגול' };
  };

  // Separation of tables: placed vs unplaced
  const isTablePlaced = (table: Table) => {
    return Boolean(table.position && table.position.isPlaced === true);
  };

  const placedTables = tables.filter(isTablePlaced);
  const unplacedTables = tables.filter((t) => !isTablePlaced(t));

  const filteredUnplacedTables = unplacedTables.filter((t) =>
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const filteredPlacedTables = placedTables.filter((t) =>
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Zoom control helpers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.25, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleFitToWidth = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const availableWidth = scrollContainerRef.current.clientWidth - 48;
    const calculatedZoom = Math.min(1.0, Math.max(0.3, availableWidth / 1200));
    setZoom(Math.round(calculatedZoom * 100) / 100);
  }, []);

  // Fit to screen width on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToWidth();
    }, 60);
    return () => clearTimeout(timer);
  }, [handleFitToWidth]);

  // Zoom with Wheel + Ctrl or pinch gesture
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom((prev) => Math.min(1.5, Math.max(0.25, Math.round((prev + delta) * 100) / 100)));
    }
  };

  // Canvas Table Dragging (moving placed tables)
  const handleCanvasPointerDown = (e: React.PointerEvent, tableId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!containerRef.current) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setDraggingTableId(tableId);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });

    target.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!draggingTableId || !containerRef.current || !onUpdateTablePosition) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const table = tables.find((t) => t.id === draggingTableId);
    const { width, height } = getTableDimensions(table?.capacity || 10);

    let newX = (e.clientX - containerRect.left) / zoom - dragOffset.x;
    let newY = (e.clientY - containerRect.top) / zoom - dragOffset.y;

    newX = Math.max(10, Math.min(1200 - width - 10, newX));
    newY = Math.max(10, Math.min(3000 - height - 10, newY));

    onUpdateTablePosition(draggingTableId, {
      x: Math.round(newX),
      y: Math.round(newY),
      rotation: table?.position?.rotation || 0,
      isPlaced: true,
    });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (draggingTableId) {
      setDraggingTableId(null);
      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);
    }
    if (draggingDanceFloor || resizingDanceFloor) {
      setDraggingDanceFloor(false);
      setResizingDanceFloor(null);
      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);
    }
  };

  const handleRotate = (e: React.PointerEvent, table: Table) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onUpdateTablePosition) return;
    const pos = table.position || { x: 0, y: 0 };
    const currentRotation = pos.rotation || 0;
    const newRotation = currentRotation === 90 ? 0 : 90;
    onUpdateTablePosition(table.id, { ...pos, rotation: newRotation, isPlaced: true });
  };

  const handleUnplaceTable = (e: React.MouseEvent | React.PointerEvent, tableId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onUpdateTablePosition) return;
    const table = tables.find((t) => t.id === tableId);
    onUpdateTablePosition(tableId, {
      x: table?.position?.x || 0,
      y: table?.position?.y || 0,
      rotation: table?.position?.rotation || 0,
      isPlaced: false,
    });
  };

  // Place a table into the center of current viewport scroll
  const handleQuickPlaceTable = (table: Table) => {
    if (!onUpdateTablePosition) return;
    const scrollContainer = scrollContainerRef.current;
    const currentScrollY = scrollContainer ? scrollContainer.scrollTop / zoom : 0;
    const { width } = getTableDimensions(table.capacity);

    // Place near center of 1200px wide hall, down from current scroll
    const x = Math.round(600 - width / 2);
    const y = Math.round(currentScrollY + 160 + (placedTables.length % 5) * 40);

    onUpdateTablePosition(table.id, {
      x,
      y,
      rotation: 0,
      isPlaced: true,
    });
  };

  // Place all tables automatically in a grid
  const handlePlaceAllTables = () => {
    if (!onUpdateTablePosition) return;
    tables.forEach((t, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 140 + col * 340;
      const y = 200 + row * 240;
      onUpdateTablePosition(t.id, {
        x,
        y,
        rotation: 0,
        isPlaced: true,
      });
    });
  };

  // Return all tables back to unplaced sidebar
  const handleUnplaceAllTables = () => {
    if (!onUpdateTablePosition) return;
    tables.forEach((t) => {
      onUpdateTablePosition(t.id, {
        x: t.position?.x || 0,
        y: t.position?.y || 0,
        rotation: 0,
        isPlaced: false,
      });
    });
  };

  // Dance Floor Drag and Resize Handlers
  const handleDanceFloorPointerDown = (e: React.PointerEvent, type: 'drag' | 'resize') => {
    if (!containerRef.current) return;
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    if (type === 'drag') {
      setDraggingDanceFloor(true);
      setDragOffset({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      });
    } else if (type === 'resize') {
      setResizingDanceFloor('bottom-right');
      setDragOffset({
        x: e.clientX,
        y: e.clientY,
      });
    }
    target.setPointerCapture(e.pointerId);
  };

  const handleDanceFloorPointerMove = (e: React.PointerEvent) => {
    if (!danceFloor || !onUpdateDanceFloor || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (draggingDanceFloor) {
      let newX = (e.clientX - containerRect.left) / zoom - dragOffset.x;
      let newY = (e.clientY - containerRect.top) / zoom - dragOffset.y;
      newX = Math.max(0, Math.min(1200 - danceFloor.width, newX));
      newY = Math.max(0, Math.min(3000 - danceFloor.height, newY));
      onUpdateDanceFloor({ ...danceFloor, x: Math.round(newX), y: Math.round(newY) });
    } else if (resizingDanceFloor) {
      const dx = (e.clientX - dragOffset.x) / zoom;
      const dy = (e.clientY - dragOffset.y) / zoom;

      const newWidth = Math.max(120, Math.min(800, danceFloor.width + dx));
      const newHeight = Math.max(120, Math.min(800, danceFloor.height + dy));

      onUpdateDanceFloor({ ...danceFloor, width: Math.round(newWidth), height: Math.round(newHeight) });
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  // Dragging from Sidebar to Canvas Global Listeners
  const handleSidebarDragStart = (e: React.PointerEvent, table: Table) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setDraggedSidebarTable(table);
    setDragPointerPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!draggedSidebarTable) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      setDragPointerPos({ x: e.clientX, y: e.clientY });

      if (containerRef.current) {
        const canvasRect = containerRef.current.getBoundingClientRect();
        const over =
          e.clientX >= canvasRect.left &&
          e.clientX <= canvasRect.right &&
          e.clientY >= canvasRect.top &&
          e.clientY <= canvasRect.bottom;
        setIsOverCanvas(over);
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (containerRef.current && onUpdateTablePosition && draggedSidebarTable) {
        const canvasRect = containerRef.current.getBoundingClientRect();
        const over =
          e.clientX >= canvasRect.left &&
          e.clientX <= canvasRect.right &&
          e.clientY >= canvasRect.top &&
          e.clientY <= canvasRect.bottom;

        if (over) {
          const { width, height } = getTableDimensions(draggedSidebarTable.capacity);
          const dropX = (e.clientX - canvasRect.left) / zoom - width / 2;
          const dropY = (e.clientY - canvasRect.top) / zoom - height / 2;

          onUpdateTablePosition(draggedSidebarTable.id, {
            x: Math.round(Math.max(10, Math.min(1200 - width - 10, dropX))),
            y: Math.round(Math.max(10, Math.min(3000 - height - 10, dropY))),
            rotation: 0,
            isPlaced: true,
          });
        }
      }

      setDraggedSidebarTable(null);
      setDragPointerPos(null);
      setIsOverCanvas(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [draggedSidebarTable, onUpdateTablePosition, zoom]);

  return (
    <div
      className="w-full h-[78vh] min-h-[640px] rounded-2xl border-2 border-slate-300 bg-slate-200/60 flex flex-row overflow-hidden shadow-inner relative select-none"
      dir="ltr"
    >
      {/* Hall Canvas Viewport Area (Order 2 = sits on the right, takes flex-1) */}
      <div className="flex-1 h-full relative overflow-hidden flex flex-col order-2" dir="ltr">
        {/* Floating Zoom & View Toolbar */}
        <div
          dir="rtl"
          className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-lg border border-slate-200/90 text-slate-700"
        >
          {/* Bird's Eye View preset */}
          <button
            onClick={() => setZoom(0.35)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              zoom <= 0.38
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title="מבט על מרוחק - ראיית כל השולחנות והאולם יחד"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>מבט על (35%)</span>
          </button>

          {/* 50% Preset */}
          <button
            onClick={() => setZoom(0.5)}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              Math.abs(zoom - 0.5) < 0.05
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title="מבט רחב - 50%"
          >
            50%
          </button>

          {/* 75% Preset */}
          <button
            onClick={() => setZoom(0.75)}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              Math.abs(zoom - 0.75) < 0.05
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            title="תצוגה נוחה - 75%"
          >
            75%
          </button>

          {/* Fit to width button */}
          <button
            onClick={handleFitToWidth}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all cursor-pointer"
            title="התאם לרוחב המסך"
          >
            <Scan className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* Zoom Out (-) */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-all cursor-pointer"
            title="הקטן תצוגה (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Current Zoom Percentage display (clickable to reset 100%) */}
          <button
            onClick={() => setZoom(1.0)}
            className="px-2 py-1 min-w-[50px] text-center font-black text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
            title="לחץ לאיפוס ל-100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In (+) */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 1.5}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-all cursor-pointer"
            title="הגדל תצוגה (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* Download Map Image Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="הורד תמונה של מפת השולחנות (PNG)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>הורדת תמונת מפה</span>
          </button>
        </div>

        {/* Scrollable Canvas Viewport */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          dir="ltr"
          className="flex-1 h-full overflow-auto relative custom-scrollbar scroll-smooth p-4 sm:p-6"
        >
          {/* Centering container that spans at least 100% width so canvas is ALWAYS centered */}
          <div className="min-w-full w-fit min-h-full flex flex-col items-center justify-start py-2">
            {/* Sizing wrapper defining exact scroll bounds at current scale */}
            <div
              style={{
                width: `${1200 * zoom}px`,
                height: `${3000 * zoom}px`,
              }}
              className="relative transition-[width,height] duration-75 shrink-0"
            >
              <div
                ref={containerRef}
                dir="ltr"
                style={{
                  width: 1200,
                  height: 3000,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                className={`bg-white shadow-xl rounded-xl overflow-hidden border-2 border-slate-300/80 transition-shadow ${
                  isOverCanvas ? 'ring-4 ring-indigo-500/40 border-indigo-400' : ''
                }`}
              >
              {/* Architectural Grid Background */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Hall Entrance & Stage Markers */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-100 border border-slate-300 text-slate-500 px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none flex items-center gap-2 shadow-2xs">
                <Compass className="w-3.5 h-3.5" />
                <span>במה / קדמת האולם</span>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-100 border border-slate-300 text-slate-500 px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none flex items-center gap-2 shadow-2xs">
                <ArrowDownToLine className="w-4 h-4" />
                <span>כניסת אורחים ראשית</span>
              </div>

              {/* Empty Hall Watermark (when no tables are placed yet) */}
              {placedTables.length === 0 && !danceFloor && (
                <div className="absolute top-72 left-1/2 -translate-x-1/2 w-[520px] p-8 rounded-3xl border-2 border-dashed border-slate-300/80 bg-slate-50/80 backdrop-blur-xs text-center flex flex-col items-center justify-center pointer-events-auto">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">האולם נקי ומוכן לסידור!</h3>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    כל השולחנות ממתינים כעת ב<strong>מאגר השולחנות בצד שמאל</strong>.<br />
                    גרור שולחן מתוך הרשימה ישירות למיקום הרצוי ברחבת האולם, או לחץ על הכפתור למטה לסידור מהיר.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlaceAllTables}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>סדר את כל השולחנות באולם אוטומטית</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Placed Tables on Canvas */}
              {placedTables.map((table) => {
                const { width, height, shapeClass, isRect } = getTableDimensions(table.capacity);
                const seatedGuests = guests.filter((g) => g.tableId === table.id);
                const position = table.position || { x: 0, y: 0, rotation: 0 };
                const isDragging = draggingTableId === table.id;
                const isRotated = position.rotation === 90;

                return (
                  <div
                    key={table.id}
                    onPointerDown={(e) => handleCanvasPointerDown(e, table.id)}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerCancel={handleCanvasPointerUp}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartInlineRename(table);
                    }}
                    className={`absolute flex flex-col items-center justify-center bg-white shadow-md border-2 border-slate-300/90 cursor-grab active:cursor-grabbing group transition-shadow ${shapeClass} ${
                      isDragging
                        ? 'shadow-2xl z-50 ring-4 ring-indigo-500/40 border-indigo-500'
                        : 'z-10 hover:z-40 hover:border-slate-400'
                    }`}
                    style={{
                      left: position.x,
                      top: position.y,
                      width,
                      height,
                      transform: `rotate(${position.rotation || 0}deg)`,
                      transformOrigin: 'center center',
                      touchAction: 'none',
                    }}
                    title="גרור לשינוי מיקום, או לחץ פעמיים לעריכת שם השולחן"
                  >
                    {/* Floating Action Buttons on Table Hover */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-auto bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-md border border-slate-200"
                      style={{ transform: `translateX(-50%) rotate(-${position.rotation || 0}deg)` }}
                    >
                      {/* Edit Table Button */}
                      {onEditTable && (
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            onEditTable(table);
                          }}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                          title="ערוך שם ומאפייני שולחן"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isRect && (
                        <button
                          onPointerDown={(e) => handleRotate(e, table)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                          title="סובב שולחן 90 מעלות"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onPointerDown={(e) => handleUnplaceTable(e, table.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="החזר שולחן למאגר בצד שמאל"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content Container (Keeps text upright even when table is rotated) */}
                    <div
                      dir="rtl"
                      className="flex flex-col items-center justify-center w-full h-full px-2"
                      style={{ transform: `rotate(-${position.rotation || 0}deg)` }}
                    >
                      {inlineEditingTableId === table.id ? (
                        <div
                          className="flex items-center gap-1 z-50 pointer-events-auto bg-white/95 px-1.5 py-1 rounded-lg shadow-lg border border-indigo-400"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineNameValue}
                            onChange={(e) => setInlineNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInlineRename(table.id);
                              } else if (e.key === 'Escape') {
                                handleCancelInlineRename();
                              }
                            }}
                            className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24 text-center"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineRename(table.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                            title="שמור שם שולחן (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelInlineRename}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            title="ביטול (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center gap-1 group/name pointer-events-auto cursor-pointer max-w-[95%]"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartInlineRename(table);
                          }}
                          title="לחץ פעמיים לעריכת שם השולחן"
                        >
                          <span className="font-extrabold text-slate-800 text-sm text-center whitespace-normal break-words leading-tight group-hover/name:text-indigo-600 transition-colors">
                            {table.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartInlineRename(table);
                            }}
                            className="opacity-0 group-hover/name:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity cursor-pointer shrink-0"
                            title="שנה שם שולחן"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-1 pointer-events-none">
                        <span className="text-xs font-semibold text-slate-500">
                          {table.capacity} מק'
                        </span>
                        {seatedGuests.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-200/60">
                            {seatedGuests.length} מוזמנים
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Tooltip with Guests */}
                    {seatedGuests.length > 0 && !isDragging && (
                      <div
                        className="absolute mt-3 bg-slate-900 text-white p-3 rounded-xl text-xs w-56 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-auto border border-slate-700"
                        style={{
                          top: isRotated ? '50%' : '100%',
                          left: isRotated ? '-20px' : '50%',
                          transform: isRotated ? `translate(-100%, -50%) rotate(-90deg)` : 'translate(-50%, 0)',
                        }}
                      >
                        {!isRotated && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900" />
                        )}
                        <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 flex justify-between items-center text-slate-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate text-white font-bold">{table.name}</span>
                            {onEditTable && (
                              <button
                                type="button"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  onEditTable(table);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTable(table);
                                }}
                                className="p-1 hover:bg-slate-700 hover:text-indigo-400 text-slate-400 rounded transition-colors cursor-pointer shrink-0"
                                title="ערוך שם ומאפייני שולחן"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{table.capacity} מקומות</span>
                        </div>
                        <ul className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 pr-1">
                          {seatedGuests.map((g) => (
                            <li key={g.id} className="flex justify-between items-center text-slate-300 hover:text-white py-0.5">
                              <span className="truncate ml-2 text-[11px]">{g.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-300">
                                  {g.partySize} איש
                                </span>
                                {onEditGuest && (
                                  <button
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      onEditGuest(g);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditGuest(g);
                                    }}
                                    className="p-1 hover:bg-slate-700 hover:text-indigo-400 text-slate-400 rounded transition-colors cursor-pointer"
                                    title="ערוך פרטי מוזמן"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dance Floor */}
              {danceFloor && (
                <div
                  onPointerDown={(e) => handleDanceFloorPointerDown(e, 'drag')}
                  onPointerMove={handleDanceFloorPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                  className={`absolute flex flex-col items-center justify-center border-4 border-pink-400 bg-pink-500/10 rounded-2xl cursor-grab active:cursor-grabbing group ${
                    draggingDanceFloor ? 'shadow-2xl z-50 ring-4 ring-pink-500/30' : 'z-0'
                  }`}
                  style={{
                    left: danceFloor.x,
                    top: danceFloor.y,
                    width: danceFloor.width,
                    height: danceFloor.height,
                    touchAction: 'none',
                  }}
                >
                  <div className="flex flex-col items-center opacity-60 text-pink-700 pointer-events-none">
                    <Music className="w-12 h-12 mb-2" />
                    <span className="font-black text-2xl tracking-widest uppercase">רחבת ריקודים</span>
                  </div>

                  {/* Remove Dance Floor Button */}
                  {onUpdateDanceFloor && (
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onUpdateDanceFloor(null);
                      }}
                      className="absolute top-3 left-3 p-1.5 bg-white text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="הסר רחבת ריקודים"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Resize Handle */}
                  <div
                    onPointerDown={(e) => handleDanceFloorPointerDown(e, 'resize')}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-tl-xl rounded-br-xl cursor-nwse-resize flex items-center justify-center text-white shadow-sm"
                    title="גרור כדי להגדיל או להקטין"
                  >
                    <Maximize2 className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Left Sidebar: Table Dock (order-1 = sits on the left) */}
      <div
        className={`bg-white border-r border-slate-200 flex flex-col shrink-0 z-30 shadow-lg transition-all duration-300 order-1 ${
          isSidebarCollapsed ? 'w-14' : 'w-80 sm:w-84'
        }`}
        dir="rtl"
      >
        {/* Collapse / Expand Toggle Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm leading-none">מאגר שולחנות</h3>
                <span className="text-[11px] text-slate-500 font-medium">גרור לאולם או לחץ להצבה</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer mx-auto sm:mx-0"
            title={isSidebarCollapsed ? 'פתח את מאגר השולחנות' : 'כווץ מאגר'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Collapsed State Quick Indicator */}
        {isSidebarCollapsed ? (
          <div className="flex-1 flex flex-col items-center py-6 gap-6 text-slate-500">
            <div className="flex flex-col items-center gap-1">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                {unplacedTables.length}
              </span>
              <span className="text-[10px] font-bold text-slate-400 rotate-90 mt-4 whitespace-nowrap">
                ממתינים
              </span>
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer"
              title="פתח מאגר"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            {/* Tabs: Unplaced vs Placed */}
            <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5">
              <button
                onClick={() => setSidebarTab('unplaced')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'unplaced'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>להצבה</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    sidebarTab === 'unplaced'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {unplacedTables.length}
                </span>
              </button>

              <button
                onClick={() => setSidebarTab('placed')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'placed'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>באולם</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    sidebarTab === 'placed'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {placedTables.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="חיפוש שולחן..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-100/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Action Bar (Place All / Return All) */}
            <div className="px-3 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs">
              {sidebarTab === 'unplaced' ? (
                unplacedTables.length > 0 ? (
                  <button
                    onClick={handlePlaceAllTables}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>סדר את כולם באולם</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>כל השולחנות הוצבו!</span>
                  </span>
                )
              ) : (
                placedTables.length > 0 && (
                  <button
                    onClick={handleUnplaceAllTables}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>החזר את כולם למאגר</span>
                  </button>
                )
              )}
              <span className="text-[10px] text-slate-400">
                סה״כ {tables.length} שולחנות
              </span>
            </div>

            {/* List of Tables */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {sidebarTab === 'unplaced' ? (
                filteredUnplacedTables.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-700 text-sm">כל השולחנות הוצבו באולם</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ניתן לגרור שולחנות על גבי המפה לשינוי מיקום או להחזירם לכאן בלשונית 'באולם'.
                    </p>
                  </div>
                ) : (
                  filteredUnplacedTables.map((table) => {
                    const { label, isRect } = getTableDimensions(table.capacity);
                    const seatedCount = guests.filter((g) => g.tableId === table.id).length;

                    return (
                      <div
                        key={table.id}
                        onPointerDown={(e) => handleSidebarDragStart(e, table)}
                        onDoubleClick={() => onEditTable?.(table)}
                        className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative flex items-center justify-between gap-2"
                        title="גרור למפה, או לחץ פעמיים לעריכת שם השולחן"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="text-slate-300 group-hover:text-slate-500 shrink-0">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">
                              {table.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                {table.capacity} מק' • {label}
                              </span>
                              {seatedCount > 0 && (
                                <span className="text-indigo-600 font-medium text-[10px]">
                                  {seatedCount} משובצים
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onEditTable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTable(table);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="ערוך שם שולחן ומאפיינים"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickPlaceTable(table);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all cursor-pointer shadow-2xs border border-indigo-100 hover:border-transparent"
                            title="הצב באולם מיידית"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* Placed Tables List */
                filteredPlacedTables.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-400 text-xs">
                    אין עדיין שולחנות באולם
                  </div>
                ) : (
                  filteredPlacedTables.map((table) => {
                    const seatedCount = guests.filter((g) => g.tableId === table.id).length;
                    return (
                      <div
                        key={table.id}
                        onDoubleClick={() => onEditTable?.(table)}
                        className="bg-white border border-slate-200 hover:border-indigo-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between gap-2 transition-all"
                        title="לחץ פעמיים לעריכת שם השולחן"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate">
                            {table.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {table.capacity} מק' • {seatedCount} משובצים
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onEditTable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTable(table);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="ערוך שם שולחן ומאפיינים"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleUnplaceTable(e, table.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                            title="החזר שולחן זה למאגר השולחנות"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Dragging Floating Preview (when user drags table from sidebar towards canvas) */}
      {draggedSidebarTable && dragPointerPos && (
        <div
          className="fixed pointer-events-none z-[9999] bg-white border-2 border-indigo-600 shadow-2xl rounded-xl p-3 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 opacity-95 scale-105"
          style={{
            left: dragPointerPos.x,
            top: dragPointerPos.y,
            width: getTableDimensions(draggedSidebarTable.capacity).width,
            height: getTableDimensions(draggedSidebarTable.capacity).height,
          }}
        >
          <span className="font-bold text-slate-900 text-xs text-center line-clamp-2">
            {draggedSidebarTable.name}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
            {draggedSidebarTable.capacity} מק'
          </span>
          <span className="text-[10px] text-indigo-700 font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            שחרר באולם להצבה
          </span>
        </div>
      )}

      {/* Export Map Image Modal */}
      <ExportMapModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tables={tables}
        guests={guests}
        danceFloor={danceFloor}
      />
    </div>
  );
};
