import React from 'react';

interface NavBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export const NavBtn = React.memo(({ active, onClick, label }: NavBtnProps) => (
  <button 
    onClick={onClick} 
    className={`px-6 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all duration-500 transform active:scale-95 ${
      active 
        ? 'bg-slate-900 text-indigo-400 shadow-lg border-transparent' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-md border border-transparent'
    }`}
  >
    {label}
  </button>
));

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  color: 'slate' | 'emerald' | 'rose' | 'amber';
  highlight?: boolean;
  isHidden?: boolean;
}

export const KPICard = React.memo(({ title, value, icon, trend, color, highlight, isHidden }: KPICardProps) => {
  const colorMap = {
    slate: 'from-slate-900/10 to-transparent text-slate-900 border-slate-500/10',
    emerald: 'from-emerald-600/10 to-transparent text-emerald-600 border-emerald-500/10',
    rose: 'from-rose-600/10 to-transparent text-rose-600 border-rose-500/10',
    amber: 'from-amber-600/10 to-transparent text-amber-600 border-amber-500/10'
  };

  const iconColorMap = {
    slate: 'bg-slate-900 text-indigo-400 shadow-slate-500/40',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/40',
    rose: 'bg-rose-600 text-white shadow-rose-500/40',
    amber: 'bg-amber-600 text-white shadow-amber-500/40'
  };

  const highlightGradient = {
    slate: 'from-slate-800 to-slate-900 shadow-slate-900/30',
    emerald: 'from-emerald-600 to-emerald-900 shadow-emerald-600/30',
    rose: 'from-rose-600 to-rose-900 shadow-rose-600/30',
    amber: 'from-amber-500 to-amber-700 shadow-amber-500/30'
  };

  if (highlight) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br ${highlightGradient[color]} p-6 rounded-3xl shadow-xl text-white transform transition-all hover:-translate-y-1 duration-500 group`}>
        <div className="absolute -right-10 -top-10 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 120 }) : null}
        </div>
        <div className="relative z-10 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl backdrop-blur-xl border border-white/20 ${color === 'slate' ? 'bg-indigo-500/20' : 'bg-white/20'}`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: color === 'slate' ? 'text-indigo-400' : 'text-white' }) : null}
            </div>
            {trend && <span className="text-[9px] font-bold px-3 py-1 bg-white/10 rounded-full backdrop-blur-md uppercase tracking-widest">{trend}</span>}
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-3xl font-bold tabular-nums tracking-tighter">
              {isHidden ? '****' : (value || 0).toLocaleString()} <span className="text-sm font-medium opacity-60">ج.م</span>
            </h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white bg-gradient-to-br ${colorMap[color]} p-6 rounded-3xl shadow-md border border-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-500`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-[30px] -mr-12 -mt-12 group-hover:bg-white transition-all duration-700"></div>
      <div className="flex flex-col gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg ${iconColorMap[color]}`}>
           {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 22 }) : null}
        </div>
        <div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-70">{title}</p>
           <p className="text-2xl font-bold text-slate-900 tracking-tighter tabular-nums leading-none">
              {isHidden ? '****' : (value || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span>
           </p>
           {trend && <p className="text-[9px] font-bold text-slate-400 mt-3 bg-white/50 w-fit px-2.5 py-1 rounded-full">{trend}</p>}
        </div>
      </div>
    </div>
  );
});

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'rose' | 'amber';
}

export const SummaryCard = React.memo(({ title, value, icon, color }: SummaryCardProps) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-emerald-500/5',
    rose: 'bg-rose-50 text-rose-600 border-rose-100/50 shadow-rose-500/5',
    amber: 'bg-amber-50 text-amber-600 border-amber-100/50 shadow-amber-500/5',
    slate: 'bg-slate-50 text-slate-900 border-slate-200 shadow-slate-900/5'
  };

  const iconColors = {
    emerald: 'bg-emerald-600',
    rose: 'bg-rose-600',
    amber: 'bg-amber-600',
    slate: 'bg-slate-900'
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-lg flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-xl duration-500 ${colors[color]}`}>
       <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{title}</p>
          <p className="text-xl font-bold tracking-tighter">{(value || 0).toLocaleString()} <span className="text-xs opacity-50">ج.م</span></p>
       </div>
       <div className={`p-3 ${iconColors[color]} ${color === 'slate' ? 'text-indigo-400' : 'text-white'} rounded-2xl shadow-md`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : null}
       </div>
    </div>
  );
});
