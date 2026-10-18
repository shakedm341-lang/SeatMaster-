export interface Guest {
  id: string;
  name: string;
  partySize: number;
  group: string;
  notes?: string;
  phone?: string;
  tableId: string | null; // null = unassigned pool
  createdAt?: number;
}

export interface DanceFloor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  shape?: 'round' | 'rectangle';
  notes?: string;
  createdAt?: number;
  position?: { x: number; y: number; rotation?: number; isPlaced?: boolean };
}

export interface GroupCategory {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  border: string;
  text: string;
}

export interface SeatingStats {
  totalGuestsCount: number; // total people (sum of partySize)
  totalPartiesCount: number; // number of guest groups/families
  assignedGuestsCount: number;
  unassignedGuestsCount: number;
  totalTables: number;
  totalCapacity: number;
  occupancyPercentage: number;
  overloadedTablesCount: number;
}
