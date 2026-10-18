import { Guest, Table } from '../types';

export function exportSeatingPlanToCSV(guests: Guest[], tables: Table[]) {
  const tableMap = new Map<string, Table>();
  tables.forEach((t) => tableMap.set(t.id, t));

  // CSV Headers in Hebrew
  const headers = [
    'שם האורח / משפחה',
    'כמות מוזמנים (נפשות)',
    'קבוצה / שיוך',
    'שולחן משובץ',
    'קיבולת שולחן',
    'סטטוס הושבה',
    'הערות',
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map(escapeCSV).join(','));

  // Sort guests: first assigned by table name, then unassigned
  const sortedGuests = [...guests].sort((a, b) => {
    if (a.tableId && !b.tableId) return -1;
    if (!a.tableId && b.tableId) return 1;
    if (a.tableId && b.tableId) {
      const tA = tableMap.get(a.tableId)?.name || '';
      const tB = tableMap.get(b.tableId)?.name || '';
      return tA.localeCompare(tB, 'he');
    }
    return a.name.localeCompare(b.name, 'he');
  });

  for (const g of sortedGuests) {
    const table = g.tableId ? tableMap.get(g.tableId) : null;
    const tableName = table ? table.name : 'טרם שובץ (במאגר)';
    const tableCapacity = table ? table.capacity : '-';
    const status = table ? 'משובץ' : 'ממתין להושבה';

    rows.push(
      [
        g.name,
        g.partySize,
        g.group,
        tableName,
        tableCapacity,
        status,
        g.notes || '',
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  // Summary section at bottom of CSV
  rows.push('');
  rows.push(['--- סיכום שולחנות ---'].map(escapeCSV).join(','));
  rows.push(
    ['שם שולחן', 'סה״כ יושבים', 'קיבולת מקסימלית', 'סטטוס תפוסה', 'אורחים בשולחן']
      .map(escapeCSV)
      .join(',')
  );

  for (const t of tables) {
    const tableGuests = guests.filter((g) => g.tableId === t.id);
    const totalOccupied = tableGuests.reduce((acc, g) => acc + g.partySize, 0);
    let status = 'תקין';
    if (totalOccupied > t.capacity) {
      status = `חריגה (${totalOccupied - t.capacity}+)`;
    } else if (totalOccupied === t.capacity) {
      status = 'מלא בדיוק';
    } else {
      status = `נותרו ${t.capacity - totalOccupied} מקומות`;
    }

    const guestListStr = tableGuests
      .map((g) => `${g.name} (${g.partySize})`)
      .join('; ');

    rows.push(
      [t.name, totalOccupied, t.capacity, status, guestListStr]
        .map(escapeCSV)
        .join(',')
    );
  }

  // Add UTF-8 BOM (\uFEFF) so Excel opens Hebrew properly without mojibake/garbled text
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `סידור_הושבה_אירוע_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
