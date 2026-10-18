import * as XLSX from 'xlsx';
import { Guest, Table } from '../types';

export interface ParsedSeatingExcelResult {
  guests: {
    name: string;
    partySize: number;
    group: string;
    tableName: string | null;
    notes?: string;
  }[];
  tablesDetected: {
    name: string;
    capacity?: number;
  }[];
  summary: {
    totalRows: number;
    assignedCount: number;
    unassignedCount: number;
    uniqueTablesCount: number;
  };
  errors: string[];
}

/**
 * Parses raw text (CSV, TSV, or pasted table) or Excel array rows into a structured seating plan.
 */
export function parseSeatingPlanFromRows(rawRows: string[][]): ParsedSeatingExcelResult {
  const result: ParsedSeatingExcelResult = {
    guests: [],
    tablesDetected: [],
    summary: {
      totalRows: 0,
      assignedCount: 0,
      unassignedCount: 0,
      uniqueTablesCount: 0,
    },
    errors: [],
  };

  if (!rawRows || rawRows.length === 0) {
    return result;
  }

  // Look for header row index or summary separator
  let headerIndex = -1;
  let nameColIdx = 0;
  let sizeColIdx = 1;
  let groupColIdx = 2;
  let tableColIdx = 3;
  let capacityColIdx = 4;
  let notesColIdx = 6;

  // Scan first 5 rows to locate header columns
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i].map((c) => String(c ?? '').trim().toLowerCase());
    const hasName = row.some((c) => c.includes('שם') || c.includes('אורח') || c.includes('משפחה') || c.includes('name'));
    const hasTable = row.some((c) => c.includes('שולחן') || c.includes('table'));
    const hasParty = row.some((c) => c.includes('כמות') || c.includes('נפשות') || c.includes('מוזמנים') || c.includes('size') || c.includes('count'));

    if (hasName || (hasTable && hasParty)) {
      headerIndex = i;
      // Map columns dynamically
      row.forEach((col, idx) => {
        if (col.includes('שם') || col.includes('name') || col.includes('מוזמן')) {
          nameColIdx = idx;
        } else if (col.includes('כמות') || col.includes('נפשות') || col.includes('size') || col.includes('count') || col.includes('אורחים')) {
          sizeColIdx = idx;
        } else if (col.includes('קבוצה') || col.includes('שיוך') || col.includes('קטגוריה') || col.includes('group')) {
          groupColIdx = idx;
        } else if (col.includes('שולחן משובץ') || (col.includes('שולחן') && !col.includes('קיבולת') && !col.includes('סיכום')) || col.includes('table')) {
          tableColIdx = idx;
        } else if (col.includes('קיבולת') || col.includes('capacity')) {
          capacityColIdx = idx;
        } else if (col.includes('הערות') || col.includes('הערה') || col.includes('notes') || col.includes('note')) {
          notesColIdx = idx;
        }
      });
      break;
    }
  }

  const tableCapacityMap = new Map<string, number>();
  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r].map((cell) => String(cell ?? '').trim());
    if (row.length === 0 || row.every((c) => !c)) continue;

    const firstCell = (row[0] || '').toLowerCase();
    // Stop if we hit the summary section of the exported CSV
    if (
      firstCell.includes('---') ||
      firstCell.includes('סיכום שולחנות') ||
      firstCell === 'שם שולחן'
    ) {
      // Read summary section table capacities if present
      for (let sr = r + 1; sr < rawRows.length; sr++) {
        const sumRow = rawRows[sr].map((cell) => String(cell ?? '').trim());
        if (sumRow.length >= 3 && sumRow[0] && sumRow[0] !== 'שם שולחן') {
          const cap = parseInt(sumRow[2].replace(/[^0-9]/g, ''), 10);
          if (!isNaN(cap) && cap > 0) {
            tableCapacityMap.set(sumRow[0], cap);
          }
        }
      }
      break;
    }

    const name = row[nameColIdx] || row[0];
    if (!name || name === 'שם' || name === 'שם האורח / משפחה') continue;

    // Parse party size
    let partySize = 1;
    const rawSize = row[sizeColIdx];
    if (rawSize) {
      const parsedSize = parseInt(String(rawSize).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedSize) && parsedSize > 0) {
        partySize = parsedSize;
      }
    }

    // Parse group
    let group = (row[groupColIdx] || '').trim();
    if (!group || group === '-' || group === 'null') {
      group = 'כללי';
    }

    // Parse assigned table
    let rawTable = (row[tableColIdx] || '').trim();
    let tableName: string | null = null;
    if (
      rawTable &&
      rawTable !== '-' &&
      rawTable !== 'null' &&
      !rawTable.includes('טרם שובץ') &&
      !rawTable.includes('במאגר') &&
      !rawTable.includes('ללא שולחן')
    ) {
      tableName = rawTable;
    }

    // Parse table capacity if found in column
    if (tableName && capacityColIdx >= 0 && row[capacityColIdx]) {
      const cap = parseInt(String(row[capacityColIdx]).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(cap) && cap > 0 && !tableCapacityMap.has(tableName)) {
        tableCapacityMap.set(tableName, cap);
      }
    }

    // Parse notes
    let notes = '';
    if (notesColIdx >= 0 && row[notesColIdx]) {
      notes = row[notesColIdx];
    }

    result.guests.push({
      name,
      partySize: Math.max(1, partySize),
      group,
      tableName,
      notes: notes || undefined,
    });
  }

  // Detect unique tables
  const uniqueTableNames = new Set<string>();
  result.guests.forEach((g) => {
    if (g.tableName) {
      uniqueTableNames.add(g.tableName);
    }
  });

  result.tablesDetected = Array.from(uniqueTableNames).map((name) => ({
    name,
    capacity: tableCapacityMap.get(name) || 12,
  }));

  result.summary.totalRows = result.guests.length;
  result.summary.assignedCount = result.guests.filter((g) => g.tableName).length;
  result.summary.unassignedCount = result.guests.filter((g) => !g.tableName).length;
  result.summary.uniqueTablesCount = uniqueTableNames.size;

  return result;
}

/**
 * Parse an Excel file (.xlsx, .xls, or .csv) uploaded via File object.
 */
export async function parseExcelOrCSVFile(file: File): Promise<ParsedSeatingExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('הקובץ אינו מכיל גליונות נתונים.');
  }

  const sheet = workbook.Sheets[sheetName];
  // Convert sheet to 2D string array
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  return parseSeatingPlanFromRows(rawRows);
}

/**
 * Parse pasted text (CSV or TSV copied from Excel/Sheets)
 */
export function parseSeatingPastedText(text: string): ParsedSeatingExcelResult {
  if (!text || !text.trim()) {
    return {
      guests: [],
      tablesDetected: [],
      summary: { totalRows: 0, assignedCount: 0, unassignedCount: 0, uniqueTablesCount: 0 },
      errors: [],
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rawRows: string[][] = lines.map((line) => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim());
    } else if (line.includes(',')) {
      // Basic CSV splitter preserving quoted values
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (matches) {
        return matches.map((m) => m.replace(/^"|"$/g, '').trim());
      }
      return line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    } else if (line.includes(';')) {
      return line.split(';').map((c) => c.trim().replace(/^"|"$/g, ''));
    }
    return [line];
  });

  return parseSeatingPlanFromRows(rawRows);
}
