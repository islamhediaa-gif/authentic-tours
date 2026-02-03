import React from 'react';
import { TrendingUp, ShieldCheck, PieChart, Users, Target, BarChart3, Activity } from 'lucide-react';

interface CostCenterStats {
  revenue: number;
  cost: number;
  profit: number;
  bookings: number;
  supervisors: number;
  programs: Array<{
    id: string;
    name: string;
    revenue: number;
    cost: number;
    bookings: number;
    supervisors: number;
  }>;
}

interface CostCenterAnalysisProps {
  stats: CostCenterStats | null;
  costCenterName: string;
  fromDate: string;
  toDate: string;
  shouldMaskAggregate: boolean;
  isPrint?: boolean;
}

const CostCenterAnalysis: React.FC<CostCenterAnalysisProps> = ({
  stats,
  costCenterName,
  fromDate,
  toDate,
  shouldMaskAggregate,
  isPrint = false
}) => {
  if (!stats) {
    if (isPrint) return null;
    return (
      <div className="p-10 text-center text-slate-400 italic bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
        <Activity size={32} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-bold text-slate-900 mb-1">لا توجد بيانات متاحة</p>
        <p className="text-xs">برجاء اختيار مركز تكلفة من القائمة لعرض التحليل</p>
      </div>
    );
  }

  if (isPrint) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-slate-900 p-4 text-center">
            <p className="text-[8px] font-bold uppercase mb-1">إجمالي الإيرادات</p>
            <p className="text-xl font-bold">{shouldMaskAggregate ? '****' : Number(stats?.revenue || 0).toLocaleString()}</p>
          </div>
          <div className="border border-slate-900 p-4 text-center">
            <p className="text-[8px] font-bold uppercase mb-1">إجمالي التكاليف</p>
            <p className="text-xl font-bold">{shouldMaskAggregate ? '****' : Number(stats?.cost || 0).toLocaleString()}</p>
          </div>
          <div className="border border-slate-900 p-4 text-center">
            <p className="text-[8px] font-bold uppercase mb-1">Pax / مشرفين</p>
            <p className="text-xl font-bold">{Number(stats?.bookings || 0)} / {Number(stats?.supervisors || 0)}</p>
          </div>
          <div className="border border-slate-900 p-4 text-center bg-slate-900 text-white">
            <p className="text-[8px] font-bold uppercase mb-1">صافي الربح</p>
            <p className="text-xl font-bold text-emerald-400">{shouldMaskAggregate ? '****' : Number(stats?.profit || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-right border-b border-slate-700">البرنامج / العملية</th>
                <th className="p-4 text-center border-b border-slate-700">Pax</th>
                <th className="p-4 text-center border-b border-slate-700">Sup</th>
                <th className="p-4 text-center border-b border-slate-700">الإيرادات</th>
                <th className="p-4 text-center border-b border-slate-700">التكاليف</th>
                <th className="p-4 text-center border-b border-slate-700 bg-slate-800">الربح</th>
                <th className="p-4 text-center border-b border-slate-700">الهامش</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold divide-y divide-slate-200">
              {(stats?.programs || []).map((p, idx) => {
                const profit = Number(p?.revenue || 0) - Number(p?.cost || 0);
                const margin = Number(p?.revenue || 0) > 0 ? (profit / Number(p.revenue)) * 100 : 0;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 border-x border-slate-200 text-slate-900 font-bold">{p?.name}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{Number(p?.bookings || 0)}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{Number(p?.supervisors || 0)}</td>
                    <td className="p-3 border-x border-slate-200 text-center text-emerald-700">{shouldMaskAggregate ? '****' : Number(p?.revenue || 0).toLocaleString()}</td>
                    <td className="p-3 border-x border-slate-200 text-center text-rose-700">{shouldMaskAggregate ? '****' : Number(p?.cost || 0).toLocaleString()}</td>
                    <td className={`p-3 border-x border-slate-200 text-center font-bold ${profit >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {shouldMaskAggregate ? '****' : Number(profit || 0).toLocaleString()}
                    </td>
                    <td className="p-3 border-x border-slate-200 text-center font-bold">{shouldMaskAggregate ? '****%' : `${Number(margin).toFixed(1)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 transform group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">تحليل أرباح: {costCenterName}</h3>
              <p className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> {costCenterName} Performance Analysis
              </p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-slate-900 px-6 py-4 rounded-2xl text-white shadow-lg">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60">صافي ربح المركز</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-400">
                {shouldMaskAggregate ? '****' : Number(stats?.profit || 0).toLocaleString()} <span className="text-xs font-bold opacity-40 text-white">ج.م</span>
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
            <PieChart size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
            <p className="text-xl font-bold text-slate-900">{shouldMaskAggregate ? '****' : Number(stats?.revenue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي التكاليف</p>
            <p className="text-xl font-bold text-slate-900">{shouldMaskAggregate ? '****' : Number(stats?.cost || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">عدد الأفراد (Pax)</p>
            <p className="text-xl font-bold text-slate-900">{Number(stats?.bookings || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">عدد المشرفين</p>
            <p className="text-xl font-bold text-slate-900">{Number(stats?.supervisors || 0)}</p>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm`}>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">اسم البرنامج / العملية</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">Pax</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">مشرفين</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الإيرادات</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">التكاليف</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-800">صافي الربح</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الهامش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-xs">
            {(stats?.programs || []).map((p, idx) => {
              const profit = Number(p?.revenue || 0) - Number(p?.cost || 0);
              const margin = Number(p?.revenue || 0) > 0 ? (profit / Number(p.revenue)) * 100 : 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-4">
                    <p className="text-slate-900 font-bold text-sm group-hover:text-emerald-600 transition-colors">{p?.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest opacity-60">Operations ID: {(p?.id || '').slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="p-4 text-center text-slate-600 tabular-nums">{Number(p?.bookings || 0)}</td>
                  <td className="p-4 text-center text-slate-400 tabular-nums">{Number(p?.supervisors || 0)}</td>
                  <td className="p-4 text-center text-emerald-600 font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : Number(p?.revenue || 0).toLocaleString()}</td>
                  <td className="p-4 text-center text-rose-600 font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : Number(p?.cost || 0).toLocaleString()}</td>
                  <td className={`p-4 text-center font-bold text-lg tabular-nums ${profit >= 0 ? 'text-emerald-700 bg-emerald-50/30' : 'text-rose-700 bg-rose-50/30'}`}>
                    {shouldMaskAggregate ? '****' : Number(profit || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${profit >= 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}></div>
                      </div>
                      <span className={`text-[10px] font-bold tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(margin).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostCenterAnalysis;
