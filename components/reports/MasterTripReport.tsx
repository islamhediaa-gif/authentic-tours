import React from 'react';
import { Layers, TrendingUp, Users, Package, Wallet } from 'lucide-react';
import { SummaryCard } from './ReportComponents';

interface MasterTripReportProps {
  stats: any[];
  shouldMaskAggregate: boolean;
  fromDate: string;
  toDate: string;
  isPrint?: boolean;
}

const MasterTripReport: React.FC<MasterTripReportProps> = ({ 
  stats, 
  shouldMaskAggregate, 
  fromDate, 
  toDate,
  isPrint = false
}) => {
  const masterTripStats = stats || [];
  const totalProfit = masterTripStats.reduce((s, p) => s + (Number(p?.revenue || 0) - Number(p?.cost || 0)), 0) || 0;
  const totalRevenue = masterTripStats.reduce((s, p) => s + Number(p?.revenue || 0), 0);
  const totalCost = masterTripStats.reduce((s, p) => s + Number(p?.cost || 0), 0);
  const totalBookings = masterTripStats.reduce((s, p) => s + Number(p?.bookings || 0), 0);

  if (isPrint) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-right border-b border-slate-700">اسم الرحلة المجمعة (Master Trip)</th>
                <th className="p-4 text-center border-b border-slate-700">التصنيف</th>
                <th className="p-4 text-center border-b border-slate-700">المعتمرين</th>
                <th className="p-4 text-center border-b border-slate-700">البرامج</th>
                <th className="p-4 text-center border-b border-slate-700">إجمالي الإيراد</th>
                <th className="p-4 text-center border-b border-slate-700">إجمالي التكلفة</th>
                <th className="p-4 text-center border-b border-slate-700 bg-slate-800">صافي الربح</th>
                <th className="p-4 text-center border-b border-slate-700">الهامش</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold divide-y divide-slate-200">
              {(masterTripStats || []).map((p, idx) => {
                const profit = Number(p?.revenue || 0) - Number(p?.cost || 0);
                const margin = Number(p?.revenue || 0) > 0 ? (profit / Number(p.revenue)) * 100 : 0;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 border-x border-slate-200 text-slate-900 font-bold">{p?.name}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{p?.type}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{Number(p?.bookings || 0)}</td>
                    <td className="p-3 border-x border-slate-200 text-center">{(p?.programs || []).length}</td>
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
                <td colSpan={4} className="p-4 text-right">إجمالي أرباح الرحلات المجمعة</td>
                <td className="p-4 text-center">{shouldMaskAggregate ? '****' : totalRevenue.toLocaleString()}</td>
                <td className="p-4 text-center">{shouldMaskAggregate ? '****' : totalCost.toLocaleString()}</td>
                <td className="p-4 text-center bg-slate-800 text-emerald-400">
                   {shouldMaskAggregate ? '****' : totalProfit.toLocaleString()}
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
    <div className="space-y-8 animate-in zoom-in-95 duration-700 print:animate-none print:opacity-100 print:transform-none">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:opacity-60 transition-opacity"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-50 pb-6 relative z-10">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 transform group-hover:scale-105 transition-transform duration-500">
                   <Layers size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 tracking-tight">التقرير المجمع للرحلات</h3>
                   <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Consolidated Trip Performance • {fromDate} - {toDate}</p>
                </div>
             </div>
             <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-lg transform hover:-translate-y-1 transition-transform duration-500">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 opacity-50">إجمالي صافي الأرباح</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-400">
                    {shouldMaskAggregate ? '****' : (totalProfit).toLocaleString()}
                  </p>
                  <span className="text-xs font-medium text-slate-400 uppercase">ج.م</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
            <SummaryCard 
              title="إجمالي الإيرادات" 
              value={shouldMaskAggregate ? 0 : totalRevenue} 
              icon={<TrendingUp size={18} />} 
              color="emerald" 
            />
            <SummaryCard 
              title="إجمالي التكاليف" 
              value={shouldMaskAggregate ? 0 : totalCost} 
              icon={<Wallet size={18} />} 
              color="rose" 
            />
            <SummaryCard 
              title="إجمالي المعتمرين" 
              value={totalBookings} 
              icon={<Users size={18} />} 
              color="emerald" 
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-inner bg-slate-50/30 relative z-10">
             <table className="w-full text-right border-collapse">
                <thead>
                   <tr className="bg-slate-900 text-white">
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">اسم الرحلة</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">التصنيف</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">الركاب</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">الإيرادات</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">التكاليف</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center bg-slate-800">صافي الربح</th>
                      <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 text-center">الهامش</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-xs">
                   {(masterTripStats || []).length === 0 ? (
                      <tr>
                         <td colSpan={7} className="p-10 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-20">
                               <Package size={48} className="text-slate-400" />
                               <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">لا توجد بيانات متاحة</span>
                            </div>
                         </td>
                      </tr>
                   ) : (
                     (masterTripStats || []).map((trip: any, idx: number) => {
                        const profit = Number(trip?.revenue || 0) - Number(trip?.cost || 0);
                        const margin = Number(trip?.revenue || 0) > 0 ? (profit / Number(trip.revenue)) * 100 : 0;
                        return (
                           <tr key={idx} className="hover:bg-emerald-50/30 transition-all duration-300 group">
                              <td className="px-4 py-3 text-slate-900 font-bold text-sm group-hover:text-emerald-600 transition-colors">{trip?.name}</td>
                              <td className="px-4 py-3 text-center">
                                 <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-emerald-100 shadow-sm">
                                    {trip?.type === 'HAJJ' ? 'حج' : trip?.type === 'UMRAH' ? 'عمرة' : 'عام'}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500 tabular-nums">{Number(trip?.bookings || 0)}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-bold tabular-nums tracking-tight">
                                {shouldMaskAggregate ? '****' : Number(trip?.revenue || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-rose-600 font-bold tabular-nums tracking-tight">
                                {shouldMaskAggregate ? '****' : Number(trip?.cost || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center bg-slate-50/50">
                                 <div className={`inline-flex flex-col items-center px-4 py-1.5 rounded-xl border ${profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
                                    <span className="text-base font-bold tabular-nums tracking-tight">
                                      {shouldMaskAggregate ? '****' : Number(profit || 0).toLocaleString()}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full rounded-full ${profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                          style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                                       ></div>
                                    </div>
                                    <span className={`text-[9px] font-bold tabular-nums ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                       {Number(margin).toFixed(1)}%
                                    </span>
                                 </div>
                              </td>
                           </tr>
                        );
                     })
                   )}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

export default React.memo(MasterTripReport);
