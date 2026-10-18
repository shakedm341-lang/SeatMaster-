import React, { useState, useEffect, useMemo } from 'react';
import { Guest, Table, SeatingStats } from './types';
import { INITIAL_TABLES, INITIAL_GUESTS } from './data/sampleData';
import { exportSeatingPlanToCSV } from './utils/exportExcel';
import { Header } from './components/Header';
import { GuestPoolSidebar } from './components/GuestPoolSidebar';
import { SeatingAreaCanvas } from './components/SeatingAreaCanvas';
import { AddTableModal } from './components/AddTableModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { EditGuestModal } from './components/EditGuestModal';
import { ConfirmDialog } from './components/ConfirmDialog';

const LOCAL_STORAGE_TABLES_KEY = 'event_seating_tables_v1';
const LOCAL_STORAGE_GUESTS_KEY = 'event_seating_guests_v1';
const LOCAL_STORAGE_DANCE_FLOOR_KEY = 'event_seating_dance_floor_v1';

export default function App() {
  // Initialize state from LocalStorage or Sample Data
  const [danceFloor, setDanceFloor] = useState<import('./types').DanceFloor | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DANCE_FLOOR_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading dance floor:', e);
    }
    return null;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading tables from localStorage:', e);
    }
    return INITIAL_TABLES;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GUESTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading guests from localStorage:', e);
    }
    return INITIAL_GUESTS;
  });

  // Modal States
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(tables));
    } catch (e) {
      console.error('Failed to save tables:', e);
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GUESTS_KEY, JSON.stringify(guests));
    } catch (e) {
      console.error('Failed to save guests:', e);
    }
  }, [guests]);

  useEffect(() => {
    try {
      if (danceFloor) {
        localStorage.setItem(LOCAL_STORAGE_DANCE_FLOOR_KEY, JSON.stringify(danceFloor));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_DANCE_FLOOR_KEY);
      }
    } catch (e) {
      console.error('Failed to save dance floor:', e);
    }
  }, [danceFloor]);

  // Derived calculations & statistics
  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => !g.tableId);
  }, [guests]);

  const stats: SeatingStats = useMemo(() => {
    const totalGuestsCount = guests.reduce((sum, g) => sum + g.partySize, 0);
    const assignedGuestsCount = guests
      .filter((g) => !!g.tableId)
      .reduce((sum, g) => sum + g.partySize, 0);
    const unassignedGuestsCount = totalGuestsCount - assignedGuestsCount;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    // Count overloaded tables
    let overloadedTablesCount = 0;
    tables.forEach((t) => {
      const seated = guests
        .filter((g) => g.tableId === t.id)
        .reduce((sum, g) => sum + g.partySize, 0);
      if (seated > t.capacity) overloadedTablesCount++;
    });

    const occupancyPercentage =
      totalCapacity > 0 ? Math.round((assignedGuestsCount / totalCapacity) * 100) : 0;

    return {
      totalGuestsCount,
      totalPartiesCount: guests.length,
      assignedGuestsCount,
      unassignedGuestsCount,
      totalTables: tables.length,
      totalCapacity,
      occupancyPercentage,
      overloadedTablesCount,
    };
  }, [tables, guests]);

  // Guest Operations
  const handleAssignGuestToTable = (guestId: string, tableId: string | null) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId } : g))
    );
  };

  const handleAddGuest = (guestDraft: Omit<Guest, 'id'>) => {
    const newGuest: Guest = {
      ...guestDraft,
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    setGuests((prev) => [newGuest, ...prev]);
  };

  const handleImportSeatingPlan = (importedData: {
    guests: {
      name: string;
      partySize: number;
      group: string;
      tableName: string | null;
      notes?: string;
    }[];
    tablesToCreate: {
      name: string;
      capacity: number;
    }[];
    mode: 'merge' | 'replace';
  }) => {
    let activeTables: Table[] = [];

    if (importedData.mode === 'replace') {
      // Build new tables list
      activeTables = importedData.tablesToCreate.map((t, idx) => ({
        id: `table-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        name: t.name,
        capacity: t.capacity,
        shape: 'round',
        createdAt: Date.now() + idx * 10,
      }));
    } else {
      // Merge mode: keep existing tables and create any missing ones
      const existingNameMap = new Map<string, Table>();
      tables.forEach((t) => existingNameMap.set(t.name.trim().toLowerCase(), t));

      const newTables: Table[] = [];
      importedData.tablesToCreate.forEach((t, idx) => {
        const key = t.name.trim().toLowerCase();
        if (!existingNameMap.has(key)) {
          newTables.push({
            id: `table-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            name: t.name,
            capacity: t.capacity,
            shape: 'round',
            createdAt: Date.now() + idx * 10,
          });
        }
      });

      activeTables = [...tables, ...newTables];
    }

    // Build map from tableName to Table ID
    const tableIdByNameMap = new Map<string, string>();
    activeTables.forEach((t) => {
      tableIdByNameMap.set(t.name.trim().toLowerCase(), t.id);
    });

    // Generate new Guests
    const newGuestsList: Guest[] = importedData.guests.map((g, idx) => {
      let tableId: string | null = null;
      if (g.tableName) {
        tableId = tableIdByNameMap.get(g.tableName.trim().toLowerCase()) || null;
      }

      return {
        id: `guest-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: g.name,
        partySize: g.partySize,
        group: g.group || 'כללי',
        notes: g.notes,
        tableId,
        createdAt: Date.now() + idx * 5,
      };
    });

    if (importedData.mode === 'replace') {
      setTables(activeTables);
      setGuests(newGuestsList);
    } else {
      setTables(activeTables);
      setGuests((prev) => [...newGuestsList, ...prev]);
    }
  };

  const handleSaveEditedGuest = (updatedGuest: Guest) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === updatedGuest.id ? updatedGuest : g))
    );
  };

  const handleDeleteGuest = (guestId: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  // Table Operations
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setIsAddTableOpen(true);
  };

  const handleOpenEditTable = (table: Table) => {
    setEditingTable(table);
    setIsAddTableOpen(true);
  };

  const handleSaveTable = (tableData: {
    name: string;
    capacity: number;
    shape?: 'round' | 'rectangle';
    notes?: string;
  }) => {
    if (editingTable) {
      // Update existing table
      setTables((prev) =>
        prev.map((t) => (t.id === editingTable.id ? { ...t, ...tableData } : t))
      );
    } else {
      // Create new table
      const newTable: Table = {
        id: `table-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: tableData.name,
        capacity: tableData.capacity,
        shape: tableData.shape || 'round',
        notes: tableData.notes,
        createdAt: Date.now(),
      };
      setTables((prev) => [...prev, newTable]);
    }
  };

  const handleQuickRenameTable = (tableId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, name: trimmed } : t))
    );
  };

  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find((t) => t.id === tableId);
    const tableName = tableToDelete ? tableToDelete.name : 'השולחן';
    const seatedCount = guests.filter((g) => g.tableId === tableId).reduce((s, g) => s + g.partySize, 0);

    const performDelete = () => {
      // Return all guests on this table back to the unassigned pool
      setGuests((prev) =>
        prev.map((g) => (g.tableId === tableId ? { ...g, tableId: null } : g))
      );
      // Remove table
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    };

    if (seatedCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: `מחיקת ${tableName}`,
        message: `בשולחן זה משובצים ${seatedCount} מוזמנים. מחיקת השולחן תחזיר את המוזמנים למאגר המוזמנים ללא שולחן. האם להמשיך?`,
        confirmText: 'מחק שולחן',
        variant: 'danger',
        onConfirm: performDelete,
      });
    } else {
      performDelete();
    }
  };

  const handleUpdateTablePosition = (tableId: string, position: { x: number; y: number; rotation?: number; isPlaced?: boolean } | null) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, position: position || undefined } : t))
    );
  };

  const handleClearTable = (tableId: string) => {
    const tableToClear = tables.find((t) => t.id === tableId);
    const tableName = tableToClear ? tableToClear.name : 'השולחן';
    
    setConfirmDialog({
      isOpen: true,
      title: `פינוי ${tableName}`,
      message: `האם להחזיר את כל המוזמנים המשובצים ב-${tableName} חזרה למאגר המוזמנים?`,
      confirmText: 'פנה שולחן',
      variant: 'warning',
      onConfirm: () => {
        setGuests((prev) =>
          prev.map((g) => (g.tableId === tableId ? { ...g, tableId: null } : g))
        );
      },
    });
  };

  // Global Actions
  const handleExportExcel = () => {
    exportSeatingPlanToCSV(guests, tables);
  };

  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const handleResetToSample = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'טעינת נתוני דוגמה',
      message: 'האם אתה בטוח שברצונך לטעון את נתוני הדוגמה המלאים? פעולה זו תחליף את כל השולחנות והמוזמנים הקיימים בלוח.',
      confirmText: 'טען נתוני דוגמה',
      variant: 'info',
      onConfirm: () => {
        setTables(INITIAL_TABLES);
        setGuests(INITIAL_GUESTS);
        try {
          localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(INITIAL_TABLES));
          localStorage.setItem(LOCAL_STORAGE_GUESTS_KEY, JSON.stringify(INITIAL_GUESTS));
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'איפוס כל הנתונים',
      message: 'האם אתה בטוח שברצונך לאפס ולמחוק את כל השולחנות וכל רשימת המוזמנים? הלוח יתאפס לחלוטין.',
      confirmText: 'אפס הכל והתחל מחדש',
      variant: 'danger',
      onConfirm: () => {
        setTables([]);
        setGuests([]);
        try {
          localStorage.removeItem(LOCAL_STORAGE_TABLES_KEY);
          localStorage.removeItem(LOCAL_STORAGE_GUESTS_KEY);
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-sans" dir="rtl">
      {/* Top Navigation & Live Stats */}
      {!isPresentationMode && (
        <Header
          stats={stats}
          onOpenAddTable={handleOpenAddTable}
          onExportExcel={handleExportExcel}
          onOpenImportExcel={() => setIsImportModalOpen(true)}
          onResetToSample={handleResetToSample}
          onClearAll={handleClearAll}
        />
      )}

      {/* Main Workspace Layout (RTL: Right Sidebar = Guest Pool, Left/Center = Seating Canvas) */}
      <div className={`flex-1 flex flex-col-reverse lg:flex-row ${isPresentationMode ? 'w-full h-screen fixed inset-0 z-50 bg-slate-100 p-0' : 'max-w-7xl w-full mx-auto lg:items-start gap-4 p-4 lg:p-6 lg:pt-4'}`}>
        {/* Main Canvas Area */}
        <SeatingAreaCanvas
          tables={tables}
          guests={guests}
          danceFloor={danceFloor}
          onOpenAddTable={handleOpenAddTable}
          onAssignGuestToTable={handleAssignGuestToTable}
          onEditTable={handleOpenEditTable}
          onDeleteTable={handleDeleteTable}
          onClearTable={handleClearTable}
          onUpdateTablePosition={handleUpdateTablePosition}
          onUpdateDanceFloor={setDanceFloor}
          onEditGuest={setEditingGuest}
          onQuickRenameTable={handleQuickRenameTable}
          isPresentationMode={isPresentationMode}
          onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
        />

        {/* Right Sidebar: Guest Pool */}
        {!isPresentationMode && (
          <GuestPoolSidebar
            unassignedGuests={unassignedGuests}
            allGuests={guests}
            tables={tables}
            onAddGuest={handleAddGuest}
            onAssignToTable={handleAssignGuestToTable}
            onEditGuest={setEditingGuest}
            onDeleteGuest={handleDeleteGuest}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => {
          setIsAddTableOpen(false);
          setEditingTable(null);
        }}
        onSave={handleSaveTable}
        initialTable={editingTable}
        suggestedTableNumber={tables.length + 1}
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTables={tables}
        onImportSeatingPlan={handleImportSeatingPlan}
      />

      <EditGuestModal
        isOpen={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        guest={editingGuest}
        tables={tables}
        onSave={handleSaveEditedGuest}
        onDelete={handleDeleteGuest}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
