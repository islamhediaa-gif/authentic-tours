import React from 'react';
import { X, Square, Minus, ShieldCheck } from 'lucide-react';
import { DataService } from '../DataService';

const TitleBar: React.FC<{ appName: string }> = ({ appName }) => {
  const isElectron = typeof window !== 'undefined' && !!(window as any).process && (window as any).process.type === 'renderer';
  const tenantId = !isElectron ? DataService.getTenantId() : null;

  // ملاحظة: هذه الأزرار ستعمل عند تشغيل البرنامج في بيئة Electron
  const handleAction = (action: string) => {
    if (isElectron) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-control', action);
    }
  };

  return (
    <div className="h-10 bg-slate-900 flex items-center justify-between px-4 no-print select-none drag-region border-b border-slate-800" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center shadow-sm shadow-indigo-500/20">
           <ShieldCheck size={12} className="text-slate-900" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {appName} — {isElectron ? 'Desktop Enterprise' : `Web Portal${tenantId && tenantId !== 'default_user' ? ` (${tenantId})` : ''}`}
        </span>
      </div>
      
      {isElectron && (
        <div className="flex items-center h-full no-drag-region" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => handleAction('minimize')} 
            className="h-full px-4 hover:bg-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center"
            title="تصغير"
          >
            <Minus size={16} />
          </button>
          
          <button 
            onClick={() => handleAction('maximize')} 
            className="h-full px-4 hover:bg-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center"
            title="تكبير"
          >
            <Square size={14} />
          </button>

          <button 
            onClick={() => handleAction('close')} 
            className="h-full px-6 hover:bg-rose-600 text-slate-500 hover:text-white transition-all group flex items-center gap-2"
            title="إغلاق"
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">إغلاق</span>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
