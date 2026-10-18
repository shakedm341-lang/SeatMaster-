import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Layers,
  Upload,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SeatingStats } from '../types';

interface HeaderProps {
  stats: SeatingStats;
  onOpenAddTable: () => void;
  onExportExcel: () => void;
  onOpenImportExcel: () => void;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onOpenAddTable,
  onExportExcel,
  onOpenImportExcel,
  onResetToSample,
  onClearAll,
}) => {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Main Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-4 ring-indigo-50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  מתכנן הושבה לאירועים
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  גרסה חכמה
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ניהול וסידור מוזמנים, חלוקת שולחנות וייצוא לאקסל
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={onOpenAddTable}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="הוסף שולחן חדש לאולם"
            >
              <Plus className="w-4 h-4" />
              <span>+ פתח שולחן חדש</span>
            </button>

            <button
              onClick={onOpenImportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="ייבא קובץ אקסל או CSV עם סידור הושבה ידני"
            >
              <Upload className="w-4 h-4" />
              <span>ייבא מאקסל</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm font-semibold transition-colors cursor-pointer"
              title="הורד קובץ סידור שולחנות תואם אקסל (CSV בקידוד עברית)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ייצא לאקסל</span>
            </button>

            {/* More Menu / Utility Actions */}
            <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  showDashboard 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="הצג/הסתר נתוני הושבה (דשבורד)"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">דשבורד</span>
                {showDashboard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              
              <button
                onClick={onResetToSample}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
                title="טען נתוני דוגמה עשירים להתרשמות"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">דוגמה</span>
              </button>
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 text-xs font-medium transition-colors cursor-pointer"
                title="נקה את כל הנתונים והתחל מאפס"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">איפוס</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Event Stats Ribbon */}
        {showDashboard && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs animate-in slide-in-from-top-2 fade-in duration-200">
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-slate-500 font-medium leading-none mb-1">סה״כ מוזמנים</div>
                <div className="text-sm font-bold text-slate-900 leading-none">
                  {stats.totalGuestsCount} <span className="text-[11px] font-normal text-slate-500">({stats.totalPartiesCount} הזמנות)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
              <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-emerald-800 font-medium leading-none mb-1">שובצו בהצלחה</div>
                <div className="text-sm font-bold text-emerald-900 leading-none">
                  {stats.assignedGuestsCount} <span className="text-[11px] font-normal text-emerald-700">({stats.totalGuestsCount > 0 ? Math.round((stats.assignedGuestsCount / stats.totalGuestsCount) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200/80">
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <UserX className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-amber-800 font-medium leading-none mb-1">ממתינים להושבה</div>
                <div className="text-sm font-bold text-amber-900 leading-none">
                  {stats.unassignedGuestsCount} <span className="text-[11px] font-normal text-amber-700">נפשות</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/60 border border-indigo-200/80">
              <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-indigo-800 font-medium leading-none mb-1">שולחנות פעילים</div>
                <div className="text-sm font-bold text-indigo-900 leading-none">
                  {stats.totalTables} <span className="text-[11px] font-normal text-indigo-600">(תפוסה: {stats.totalCapacity} מק')</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <span className="font-bold text-xs">%</span>
              </div>
              <div>
                <div className="text-slate-500 font-medium leading-none mb-1">אחוז תפוסת שולחנות</div>
                <div className="text-sm font-bold text-slate-900 leading-none">
                  {stats.occupancyPercentage}%
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
              stats.overloadedTablesCount > 0 
                ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse' 
                : 'bg-slate-50 border-slate-200/80 text-slate-600'
            }`}>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                stats.overloadedTablesCount > 0 ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-600'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium leading-none mb-1">תפוסת יתר</div>
                <div className={`text-sm font-bold leading-none ${stats.overloadedTablesCount > 0 ? 'text-rose-900' : 'text-slate-900'}`}>
                  {stats.overloadedTablesCount > 0 ? `${stats.overloadedTablesCount} שולחנות!` : 'הכל תקין'}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </header>
  );
};
