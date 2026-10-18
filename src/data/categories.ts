import { GroupCategory } from '../types';

export const DEFAULT_CATEGORIES: GroupCategory[] = [
  {
    id: 'משפחת כלה',
    name: 'משפחת כלה',
    color: '#ec4899', // pink-500
    bgLight: '#fdf2f8', // pink-50
    border: '#fbcfe8', // pink-200
    text: '#9d174d', // pink-800
  },
  {
    id: 'משפחת חתן',
    name: 'משפחת חתן',
    color: '#3b82f6', // blue-500
    bgLight: '#eff6ff', // blue-50
    border: '#bfdbfe', // blue-200
    text: '#1e40af', // blue-800
  },
  {
    id: 'חברים מהעבודה',
    name: 'חברים מהעבודה',
    color: '#10b981', // emerald-500
    bgLight: '#ecfdf5', // emerald-50
    border: '#a7f3d0', // emerald-200
    text: '#065f46', // emerald-800
  },
  {
    id: 'חברים מהצבא',
    name: 'חברים מהצבא',
    color: '#8b5cf6', // violet-500
    bgLight: '#f5f3ff', // violet-50
    border: '#ddd6fe', // violet-200
    text: '#5b21b6', // violet-800
  },
  {
    id: 'חברים מהלימודים',
    name: 'חברים מהלימודים',
    color: '#f59e0b', // amber-500
    bgLight: '#fffbeb', // amber-50
    border: '#fde68a', // amber-200
    text: '#92400e', // amber-800
  },
  {
    id: 'שכנים ומכרים',
    name: 'שכנים ומכרים',
    color: '#06b6d4', // cyan-500
    bgLight: '#ecfeff', // cyan-50
    border: '#a5f3fc', // cyan-200
    text: '#155e75', // cyan-800
  },
  {
    id: 'VIP / משפחה קרובה',
    name: 'VIP / משפחה קרובה',
    color: '#e11d48', // rose-600
    bgLight: '#fff1f2', // rose-50
    border: '#fecdd3', // rose-200
    text: '#9f1239', // rose-800
  },
  {
    id: 'כללי',
    name: 'כללי',
    color: '#64748b', // slate-500
    bgLight: '#f8fafc', // slate-50
    border: '#e2e8f0', // slate-200
    text: '#334155', // slate-700
  },
];

export const PALETTE_FALLBACKS = [
  { color: '#6366f1', bgLight: '#eef2ff', border: '#c7d2fe', text: '#3730a3' },
  { color: '#14b8a6', bgLight: '#f0fdfa', border: '#99f6e4', text: '#115e59' },
  { color: '#f97316', bgLight: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  { color: '#84cc16', bgLight: '#f7fee7', border: '#d9f99d', text: '#3f6212' },
  { color: '#d946ef', bgLight: '#fdf4ff', border: '#f5d0fe', text: '#86198f' },
];

export function getGroupStyle(groupName: string): GroupCategory {
  const normalized = (groupName || '').trim();
  const found = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === normalized.toLowerCase()
  );
  if (found) return found;

  // Generate deterministic color based on string hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_FALLBACKS.length;
  const palette = PALETTE_FALLBACKS[index];

  return {
    id: normalized || 'כללי',
    name: normalized || 'כללי',
    ...palette,
  };
}
