import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Check,
  Sparkles,
  Layers,
  ZoomIn,
  Palette,
  Users,
  Loader2,
} from 'lucide-react';
import { Table, Guest, DanceFloor } from '../types';
import {
  renderMapToCanvas,
  downloadMapImage,
  MapExportOptions,
} from '../utils/exportMapImage';

interface ExportMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  guests: Guest[];
  danceFloor?: DanceFloor | null;
}

export const ExportMapModal: React.FC<ExportMapModalProps> = ({
  isOpen,
  onClose,
  tables,
  guests,
  danceFloor,
}) => {
  const [title, setTitle] = useState('מפת סידור שולחנות');
  const [cropToContent, setCropToContent] = useState(true);
  const [scale, setScale] = useState<number>(2); // 2 = HD, 3 = Ultra HD
  const [theme, setTheme] = useState<'clean' | 'blueprint'>('clean');
  const [includeGuestNames, setIncludeGuestNames] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate preview when options change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    const generatePreview = async () => {
      try {
        const canvas = await renderMapToCanvas(tables, guests, danceFloor, {
          title,
          cropToContent,
          scale: 1, // Fast preview scale
          theme,
          includeGuestNames,
        });

        if (isMounted) {
          const dataUrl = canvas.toDataURL('image/png');
          setPreviewUrl(dataUrl);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate preview', err);
        if (isMounted) setIsGenerating(false);
      }
    };

    const timeout = setTimeout(generatePreview, 150);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isOpen, tables, guests, danceFloor, title, cropToContent, theme, includeGuestNames]);

  if (!isOpen) return null;

  const placedCount = tables.filter((t) => t.position && t.position.isPlaced !== false).length;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const sanitizedTitle = title.trim().replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `${sanitizedTitle || 'seating-plan'}-${new Date().toISOString().slice(0, 10)}.png`;

      await downloadMapImage(
        tables,
        guests,
        danceFloor,
        {
          title,
          cropToContent,
          scale,
          theme,
          includeGuestNames,
        },
        filename
      );
      onClose();
    } catch (err) {
      console.error('Failed to download map image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">הורדת תמונת מפת השולחנות</h2>
              <p className="text-xs text-slate-500">
                ייצוא תמונת מפת האולם ברזולוציה גבוהה (PNG) להדפסה או שליחה
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Options Column */}
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                כותרת המפה בתמונה
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: מפת הושבה - חתונת דנה ויוסי"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Framing / Crop Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                היקף תצוגת האולם
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCropToContent(true)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                    cropToContent
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>התאמה לשולחנות</span>
                    {cropToContent && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 block">
                    חיתוך ממוקד סביב השולחנות שהוצבו
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCropToContent(false)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                    !cropToContent
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>כל שטח האולם</span>
                    {!cropToContent && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 block">
                    מהבמה העליונה ועד כניסת האורחים
                  </span>
                </button>
              </div>
            </div>

            {/* Visual Style Theme */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סגנון גרפי
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('clean')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                    theme === 'clean'
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>קלאסי בהיר</span>
                    {theme === 'clean' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 block">
                    רקע לבן נקי, מושלם להדפסה
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('blueprint')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                    theme === 'blueprint'
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>שרטוט אדריכלי</span>
                    {theme === 'blueprint' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 block">
                    מראה יוקרתי כהה עם רשת קווים
                  </span>
                </button>
              </div>
            </div>

            {/* Quality (Scale) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                איכות ורזולוציה
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScale(2)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scale === 2
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-black'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>חדות גבוהה (HD 2x)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScale(3)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scale === 3
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-black'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>איכות דפוס (Ultra HD 3x)</span>
                </button>
              </div>
            </div>

            {/* Include Guest Names Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeGuestNames}
                  onChange={(e) => setIncludeGuestNames(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  הצג שמות מוזמנים מתחת לכל שולחן בתמונה
                </span>
              </label>
            </div>
          </div>

          {/* Preview Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">תצוגה מקדימה של המפה:</span>
              <span className="text-[11px] text-slate-400">
                {placedCount} שולחנות הוצבו באולם
              </span>
            </div>

            <div className="flex-1 min-h-[260px] bg-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden relative shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">מכין תצוגה מקדימה...</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה של מפת השולחנות"
                  className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-xs text-slate-400">אין תצוגה מקדימה זמינה</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            הקובץ יישמר בפורמט <strong>PNG</strong> איכותי
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>מייצא תמונה...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>הורד תמונת מפה (PNG)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
