import React from 'react';
import { TrendingUp, ShieldCheck, Plane, Landmark, Users, BarChart3, Target, Calendar } from 'lucide-react';

interface HajjUmrahProgramStat {
  id: string;
  name: string;
  type: string;
  revenue: number;
  cost: number;
  bookings: number;
  revenueBreakdown: { bookings: number, flight: number, other: number };
  costBreakdown: { purchase: number, expenses: number, flights: number };
}

interface HajjUmrahPLProps {
  stats: HajjUmrahProgramStat[];
  fromDate: string;
  toDate: string;
  shouldMaskAggregate: boolean;
  isPrint?: boolean;
}

const HajjUmrahPL: React.FC<HajjUmrahPLProps> = ({
  stats,
  fromDate,
  toDate,
  shouldMaskAggregate,
  isPrint = false
}) => {
  const totalProfit = (stats || []).reduce((s, p) => s + (Number(p?.revenue || 0) - Number(p?.cost || 0)), 0);
  const totalRevenue = (stats || []).reduce((s, p) => s + Number(p?.revenue || 0), 0);
  const totalCost = (stats || []).reduce((s, p) => s + Number(p?.cost || 0), 0);
  const totalBookings = (stats || []).reduce((s, p) => s + Number(p?.bookings || 0), 0);

  if (isPrint) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-right border-b border-slate-700">اسم البرنامج / الرحلة</th>
                <th className="p-4 text-center border-b border-slate-700">النوع</th>
                <th className="p-4 text-center border-b border-slate-700">الحجوزات</th>
                <th className="p-4 text-center border-b border-slate-700">الإيرادات</th>
                <th className="p-4 text-center border-b border-slate-700">التكاليف</th>
                <th className="p-4 text-center border-b border-slate-700 bg-slate-800">صافي الربح</th>
                <th className="p-4 text-center border-b border-slate-700">الهامش</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold divide-y divide-slate-200">
              {(stats || []).map((p, idx) => {
                const profit = Number(p?.revenue || 0) - Number(p?.cost || 0);
                const margin = Number(p?.revenue || 0) > 0 ? (profit / Number(p.revenue)) * 100 : 0;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 border-x border-slate-200 text-slate-900 font-bold">{p?.name}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{p?.type}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{Number(p?.bookings || 0)}</td>
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
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td colSpan={3} className="p-4 text-right">الإجمالي النهائي للبرامج</td>
                <td className="p-4 text-center">{shouldMaskAggregate ? '****' : (totalRevenue || 0).toLocaleString()}</td>
                <td className="p-4 text-center">{shouldMaskAggregate ? '****' : (totalCost || 0).toLocaleString()}</td>
                <td className="p-4 text-center bg-slate-800 text-emerald-400">
                  {shouldMaskAggregate ? '****' : (totalProfit || 0).toLocaleString()}
                </td>
                <td className="p-4 text-center">
                  {shouldMaskAggregate ? '****%' : `${Number((totalProfit / (totalRevenue || 1)) * 100).toFixed(1)}%`}
                </td>
              </tr>
            </tfoot>
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">أرباح برامج الحج والعمرة</h3>
              <p className="text-emerald-600 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Religious Tourism Program Profitability Analysis
              </p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-slate-900 px-6 py-4 rounded-2xl text-white shadow-lg">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60">إجمالي صافي الربح</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-400">
                {shouldMaskAggregate ? '****' : totalProfit.toLocaleString()} <span className="text-xs font-bold opacity-40 text-white">ج.م</span>
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
            <Landmark size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
            <p className="text-xl font-bold text-slate-900">{shouldMaskAggregate ? '****' : totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي التكاليف</p>
            <p className="text-xl font-bold text-slate-900">{shouldMaskAggregate ? '****' : totalCost.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الحجوزات</p>
            <p className="text-xl font-bold text-slate-900">{totalBookings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">هامش الربح العام</p>
            <p className="text-xl font-bold text-slate-900">
              {shouldMaskAggregate ? '****' : `${Number((totalProfit / (totalRevenue || 1)) * 100).toFixed(1)}%`}
            </p>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm`}>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">البرنامج / الرحلة</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">النوع</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الحجوزات</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الإيرادات</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">التكاليف</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-800">صافي الربح</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الأداء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-xs">
            {(stats || []).map((p, idx) => {
              const profit = Number(p?.revenue || 0) - Number(p?.cost || 0);
              const margin = Number(p?.revenue || 0) > 0 ? (profit / Number(p.revenue)) * 100 : 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm group-hover:text-emerald-600 transition-colors">{p?.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest opacity-60">ID: {(p?.id || '').slice(-6).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {p?.type === 'HAJJ' ? 'حج' : p?.type === 'UMRAH' ? 'عمرة' : p?.type === 'INDIVIDUAL_UMRAH' ? 'عمرة فردي' : 'عام'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-600 tabular-nums">{Number(p?.bookings || 0)}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : Number(p?.revenue || 0).toLocaleString()}</span>
                      <div className="flex gap-1 mt-1">
                        {Number(p?.revenueBreakdown?.bookings || 0) > 0 && <span title="حجوزات" className="w-1 h-1 rounded-full bg-emerald-400"></span>}
                        {Number(p?.revenueBreakdown?.flight || 0) > 0 && <span title="طيران" className="w-1 h-1 rounded-full bg-blue-400"></span>}
                        {Number(p?.revenueBreakdown?.other || 0) > 0 && <span title="أخرى" className="w-1 h-1 rounded-full bg-slate-300"></span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-rose-600 font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : Number(p?.cost || 0).toLocaleString()}</span>
                      <div className="flex gap-1 mt-1">
                        {Number(p?.costBreakdown?.purchase || 0) > 0 && <span title="مشتريات" className="w-1 h-1 rounded-full bg-rose-400"></span>}
                        {Number(p?.costBreakdown?.expenses || 0) > 0 && <span title="مصروفات" className="w-1 h-1 rounded-full bg-amber-400"></span>}
                        {Number(p?.costBreakdown?.flights || 0) > 0 && <span title="طيران" className="w-1 h-1 rounded-full bg-slate-400"></span>}
                      </div>
                    </div>
                  </td>
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

export default HajjUmrahPL;
