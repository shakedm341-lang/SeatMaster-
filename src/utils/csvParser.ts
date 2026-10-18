import { Guest } from '../types';

export interface ParsedGuestDraft {
  name: string;
  partySize: number;
  group: string;
  notes?: string;
}

export function parseExcelPaste(rawText: string): ParsedGuestDraft[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedGuestDraft[] = [];

  for (const line of lines) {
    // Detect delimiter: tab (Excel paste default), comma, semicolon, or pipeline
    let tokens: string[] = [];
    if (line.includes('\t')) {
      tokens = line.split('\t').map((t) => t.trim());
    } else if (line.includes(',')) {
      tokens = line.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));
    } else if (line.includes(';')) {
      tokens = line.split(';').map((t) => t.trim());
    } else {
      // Space separated heuristic or single name
      tokens = [line];
    }

    if (tokens.length === 0 || !tokens[0]) continue;

    // Check if header line (e.g. 'שם', 'כמות', 'קבוצה' or 'Name', 'Count', 'Group')
    const firstCol = tokens[0].toLowerCase();
    if (
      firstCol === 'שם' ||
      firstCol === 'name' ||
      firstCol === 'שם האורח' ||
      firstCol === 'שם אורח'
    ) {
      continue; // Skip header
    }

    const name = tokens[0];
    let partySize = 1;
    let group = 'כללי';
    let notes = '';

    // If second column has number
    if (tokens.length > 1) {
      const parsedNum = parseInt(tokens[1].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        partySize = parsedNum;
        if (tokens.length > 2 && tokens[2]) {
          group = tokens[2];
        }
        if (tokens.length > 3 && tokens[3]) {
          notes = tokens[3];
        }
      } else {
        // Second token is group name
        group = tokens[1];
        if (tokens.length > 2) {
          const num3 = parseInt(tokens[2].replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num3) && num3 > 0) {
            partySize = num3;
          } else {
            notes = tokens[2];
          }
        }
      }
    }

    results.push({
      name,
      partySize: Math.max(1, partySize),
      group: group || 'כללי',
      notes: notes || undefined,
    });
  }

  return results;
}
