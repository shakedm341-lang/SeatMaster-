import { Guest, Table } from '../types';

const baseTime = 1700000000000;

export const INITIAL_TABLES: Table[] = [
  { id: 'table-1', name: 'שולחן 1 - משפחה קרובה כלה', capacity: 12, shape: 'round', createdAt: baseTime + 1000 },
  { id: 'table-2', name: 'שולחן 2 - משפחה קרובה חתן', capacity: 12, shape: 'round', createdAt: baseTime + 2000 },
  { id: 'table-3', name: 'שולחן 3 - חברים מהעבודה', capacity: 10, shape: 'round', createdAt: baseTime + 3000 },
  { id: 'table-4', name: 'שולחן 4 - חברים מהצבא', capacity: 12, shape: 'round', createdAt: baseTime + 4000 },
  { id: 'table-5', name: 'שולחן 5 - חברים מהלימודים', capacity: 12, shape: 'round', createdAt: baseTime + 5000 },
  { id: 'table-6', name: 'שולחן 6 - שכנים ומכרים', capacity: 10, shape: 'round', createdAt: baseTime + 6000 },
];

export const INITIAL_GUESTS: Guest[] = [
  // Assigned to Table 1
  { id: 'g-1', name: 'משפחת לוי (סבא וסבתא)', partySize: 4, group: 'משפחת כלה', tableId: 'table-1', notes: 'כיסא גלגלים' },
  { id: 'g-2', name: 'דוד יוסי ודודה רחל', partySize: 2, group: 'משפחת כלה', tableId: 'table-1' },
  { id: 'g-3', name: 'משפחת כהן המורחבת', partySize: 4, group: 'משפחת כלה', tableId: 'table-1' },

  // Assigned to Table 2
  { id: 'g-4', name: 'משפחת אברהם', partySize: 4, group: 'משפחת חתן', tableId: 'table-2' },
  { id: 'g-5', name: 'דני ומיכל ששון', partySize: 2, group: 'משפחת חתן', tableId: 'table-2' },
  { id: 'g-6', name: 'משפחת דיין', partySize: 3, group: 'משפחת חתן', tableId: 'table-2' },

  // Assigned to Table 3
  { id: 'g-7', name: 'עומר ורוני', partySize: 2, group: 'חברים מהעבודה', tableId: 'table-3' },
  { id: 'g-8', name: 'שרון, גיא ונועה', partySize: 3, group: 'חברים מהעבודה', tableId: 'table-3' },
  { id: 'g-9', name: 'יונתן וטליה', partySize: 2, group: 'חברים מהעבודה', tableId: 'table-3' },

  // Assigned to Table 4 (Overloaded table for realistic visual check: 14/12)
  { id: 'g-10', name: 'צוות גולני (אלעד, תומר, עידן)', partySize: 5, group: 'חברים מהצבא', tableId: 'table-4' },
  { id: 'g-11', name: 'מתן ובת זוג', partySize: 2, group: 'חברים מהצבא', tableId: 'table-4' },
  { id: 'g-12', name: 'אורן, יובל וגל', partySize: 4, group: 'חברים מהצבא', tableId: 'table-4' },
  { id: 'g-13', name: 'איתי ברק', partySize: 2, group: 'חברים מהצבא', tableId: 'table-4' }, // Total = 13 (overloaded)

  // Unassigned Guests Pool (in right sidebar)
  { id: 'g-14', name: 'יואב ודנה פרידמן', partySize: 2, group: 'חברים מהלימודים', tableId: null, notes: 'צמחוני' },
  { id: 'g-15', name: 'משפחת מזרחי (אורית ויניב)', partySize: 4, group: 'חברים מהלימודים', tableId: null },
  { id: 'g-16', name: 'ד״ר אילן רוזנברג', partySize: 1, group: 'חברים מהלימודים', tableId: null },
  { id: 'g-17', name: 'משפחת שפירא', partySize: 3, group: 'שכנים ומכרים', tableId: null },
  { id: 'g-18', name: 'ענת ומוטי זילברמן', partySize: 2, group: 'שכנים ומכרים', tableId: null },
  { id: 'g-19', name: 'עו״ד שלמה גולדשטיין', partySize: 2, group: 'VIP / משפחה קרובה', tableId: null, notes: 'אורח כבוד' },
  { id: 'g-20', name: 'ליאור קפלן', partySize: 1, group: 'חברים מהעבודה', tableId: null },
  { id: 'g-21', name: 'משפחת קורן', partySize: 5, group: 'משפחת כלה', tableId: null },
  { id: 'g-22', name: 'נועם ושיר', partySize: 2, group: 'משפחת חתן', tableId: null },
];
