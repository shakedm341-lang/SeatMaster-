import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  FileUp,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  parseExcelOrCSVFile,
  parseSeatingPastedText,
  ParsedSeatingExcelResult,
} from '../utils/excelImportParser';
import { getGroupStyle } from '../data/categories';
import { Table, Guest } from '../types';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTables: Table[];
  onImportSeatingPlan: (data: {
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
  }) => void;
}

const SAMPLE_EXPORT_FORMAT_PASTE = `שם האורח / משפחה	כמות מוזמנים (נפשות)	קבוצה / שיוך	שולחן משובץ	קיבולת שולחן	סטטוס הושבה	הערות
משפחת שלום	4	משפחת כלה	שולחן 1 - משפחה קרובה כלה	12	משובץ	שולחן ליד החלון
דוד משה ורבקה	2	משפחת כלה	שולחן 1 - משפחה קרובה כלה	12	משובץ	
אביתר כהן ובת זוג	2	חברים מהעבודה	שולחן 3 - חברים מהעבודה	10	משובץ	צמחוני
צוות פיתוח (רועי, גיא)	2	חברים מהעבודה	שולחן 3 - חברים מהעבודה	10	משובץ	
משפחת גולדברג	5	שכנים ומכרים	שולחן 6 - שכנים ומכרים	10	משובץ	
עמירם ורותי	2	משפחת חתן	טרם שובץ (במאגר)	-	ממתין להושבה	
אלון שפירא	1	חברים מהצבא	טרם שובץ (במאגר)	-	ממתין להושבה	`;

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  existingTables,
  onImportSeatingPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [parsedData, setParsedData] = useState<ParsedSeatingExcelResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFileName(file.name);

    try {
      const result = await parseExcelOrCSVFile(file);
      if (result.guests.length === 0) {
        setErrorMessage('לא זוהו שורות מוזמנים בקובץ שנבחר. אנא בדוק את מבנה הקובץ.');
        setParsedData(null);
      } else {
        setParsedData(result);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        `שגיאה בקריאת הקובץ: ${err?.message || 'ודא שהקובץ הוא בפורמט Excel (.xlsx, .xls) או CSV תקין'}`
      );
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteChange = (text: string) => {
    setRawText(text);
    setErrorMessage(null);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    try {
      const result = parseSeatingPastedText(text);
      if (result.guests.length > 0) {
        setParsedData(result);
      } else {
        setParsedData(null);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileUpload(file);
    }
  };

  const handleLoadSample = () => {
    setActiveTab('paste');
    handlePasteChange(SAMPLE_EXPORT_FORMAT_PASTE);
  };

  // Compare detected tables with existing tables
  const existingTableNamesSet = useMemo(() => {
    return new Set(existingTables.map((t) => t.name.trim().toLowerCase()));
  }, [existingTables]);

  const newTablesToCreate = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.tablesDetected.filter(
      (t) => !existingTableNamesSet.has(t.name.trim().toLowerCase())
    );
  }, [parsedData, existingTableNamesSet]);

  const totalGuestsHeadcount = useMemo(() => {
    if (!parsedData) return 0;
    return parsedData.guests.reduce((acc, g) => acc + g.partySize, 0);
  }, [parsedData]);

  if (!isOpen) return null;

  const handleConfirmImport = () => {
    if (!parsedData || parsedData.guests.length === 0) return;

    onImportSeatingPlan({
      guests: parsedData.guests,
      tablesToCreate: parsedData.tablesDetected.map((t) => ({
        name: t.name,
        capacity: t.capacity || 12,
      })),
      mode: importMode,
    });

    handleClose();
  };

  const handleClose = () => {
    setParsedData(null);
    setFileName(null);
    setRawText('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                ייבוא סידור הושבה מקובץ אקסל / CSV
              </h2>
              <p className="text-xs text-slate-500">
                תמיכה מלאה בפורמט הייצוא כולל שיוך שולחנות ידני, כמות מוזמנים וקבוצות
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: File Upload vs Copy-Paste */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>העלאת קובץ (XLSX, XLS, CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>הדבקה מהירה (Ctrl+V)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer mb-2"
            title="טען נתוני דוגמה בפורמט ייצוא אקסל"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>טען נתוני דוגמה בפורמט ייצוא</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Instructions Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-bold block">פורמט עמודות נתמך (בהתאמה מדויקת לייצוא):</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                1. <strong>שם האורח / משפחה</strong> &bull; 2. <strong>כמות נפשות</strong> &bull; 3. <strong>קבוצה / שיוך</strong> &bull; 4. <strong>שולחן משובץ</strong> (אם ריק/ממתין - ייכנס למאגר הממתינים) &bull; 5. <strong>קיבולת שולחן</strong> &bull; 6. <strong>הערות</strong>
              </p>
            </div>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleFileUpload(files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : fileName
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-800">
                    {fileName ? fileName : 'גרור קובץ אקסל לכאן, או לחץ לבחירת קובץ'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    תומך בקבצי Excel (.xlsx, .xls) ובקבצי .csv
                  </p>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>קורא נתונים מהקובץ...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  הדבק שורות מטבלת אקסל (Ctrl+V):
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => handlePasteChange('')}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    נקה תיבה
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                dir="rtl"
                value={rawText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="הדבק לכאן עמודות מאקסל (מופרדות ב-Tab או פסיקים)..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedData && parsedData.guests.length > 0 && (
            <div className="space-y-3">
              {/* Summary Badges */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">סה״כ אורחים זוהו</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {totalGuestsHeadcount}{' '}
                    <span className="text-[11px] font-normal text-slate-500">
                      ({parsedData.summary.totalRows} הזמנות)
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <div className="text-emerald-700 text-[11px]">משובצים לשולחנות</div>
                  <div className="font-bold text-emerald-900 text-sm">
                    {parsedData.summary.assignedCount} הזמנות
                  </div>
                </div>

                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <div className="text-amber-700 text-[11px]">במאגר ממתינים</div>
                  <div className="font-bold text-amber-900 text-sm">
                    {parsedData.summary.unassignedCount} הזמנות
                  </div>
                </div>

                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                  <div className="text-indigo-700 text-[11px]">שולחנות שזוהו</div>
                  <div className="font-bold text-indigo-900 text-sm">
                    {parsedData.summary.uniqueTablesCount} שולחנות
                  </div>
                </div>
              </div>

              {/* Import Mode: Replace vs Merge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  אופן ייבוא הנתונים:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">החלפת הלוח בנתוני הקובץ (מומלץ)</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        טוען את סידור ההושבה המלא, מייצר את השולחנות ומשבץ את האורחים בדיוק לפי הקובץ
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">מיזוג והוספה לשולחנות הקיימים</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        מוסיף את המוזמנים לשולחנות הקיימים מבלי למחוק מוזמנים קודמים
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Table Preview of Guests */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-2.5 px-3 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    תצוגה מקדימה של נתוני ההושבה ({parsedData.guests.length} שורות)
                  </span>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[11px]">
                    תקין ומוכן
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2 px-3">#</th>
                        <th className="p-2">שם האורח / משפחה</th>
                        <th className="p-2">נפשות</th>
                        <th className="p-2">קבוצה</th>
                        <th className="p-2">שולחן משובץ</th>
                        <th className="p-2">הערות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.guests.map((item, idx) => {
                        const style = getGroupStyle(item.group);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-2 px-3 text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Users className="w-3 h-3" />
                                {item.partySize}
                              </span>
                            </td>
                            <td className="p-2">
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                                style={{
                                  backgroundColor: style.bgLight,
                                  borderColor: style.border,
                                  color: style.text,
                                }}
                              >
                                {item.group}
                              </span>
                            </td>
                            <td className="p-2">
                              {item.tableName ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 text-[11px]">
                                  <Layers className="w-3 h-3 text-indigo-600" />
                                  {item.tableName}
                                </span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-amber-200">
                                  ממתין במאגר
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-slate-500 truncate max-w-36">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedData && parsedData.guests.length > 0 ? (
              <span>
                יובאו <strong>{totalGuestsHeadcount}</strong> נפשות ב-
                <strong>{parsedData.summary.uniqueTablesCount}</strong> שולחנות
              </span>
            ) : (
              <span>העלה קובץ אקסל או הדבק טבלה כדי להמשיך</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="button"
              disabled={!parsedData || parsedData.guests.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                בצע ייבוא סידור הושבה ({parsedData?.guests.length || 0} רשומות)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
