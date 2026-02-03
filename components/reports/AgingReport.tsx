import React from 'react';
import { History, ShieldCheck, Users, Truck, Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface AgingData {
  customers: any[];
  suppliers: any[];
}

interface AgingReportProps {
  agingData: AgingData;
  isHidden: boolean;
  isPrint?: boolean;
}

const AgingReport: React.FC<AgingReportProps> = ({ agingData, isHidden, isPrint = false }) => {
  const renderTable = (data: any[], title: string, icon: React.ReactNode, accentColor: string, type: 'customer' | 'supplier') => {
    const isCustomer = type === 'customer';
    const bgHeader = isCustomer ? 'bg-slate-900' : 'bg-rose-900';
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className={`w-10 h-10 ${isCustomer ? 'bg-indigo-600' : 'bg-rose-600'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <h4 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h4>
        </div>

        <div className={`overflow-hidden ${isPrint ? 'rounded-xl border border-slate-200' : 'rounded-3xl border border-white bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={`${bgHeader} text-white`}>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest border-b border-white/10">{isCustomer ? 'اسم العميل' : 'اسم المورد'}</th>
                <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-white/10 bg-emerald-600/20">حالي (0-30)</th>
                <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-white/10 bg-amber-500/20">31-60 يوم</th>
                <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-white/10 bg-orange-600/20">61-90 يوم</th>
                <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-white/10 bg-rose-700/20">أكثر من 90</th>
                <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-white/10 bg-white/10">الإجمالي</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-50 font-medium ${isPrint ? 'text-[9px]' : 'text-xs'}`}>
              {(data || []).length === 0 ? (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">لا توجد بيانات متاحة لهذا القسم حالياً</td>
                </tr>
              ) : (
                (data || []).map((item, idx) => (
                  <tr key={idx} className={`${!isPrint ? 'hover:bg-slate-50/50 transition-all group' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}`}>
                    <td className="p-4">
                      <p className="text-slate-900 font-bold group-hover:text-indigo-600 transition-colors text-sm">{isCustomer ? item?.name : (item?.company || item?.name)}</p>
                      {!isPrint && <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest opacity-60 italic">{isCustomer ? 'Verified Client' : 'Active Supplier'}</p>}
                    </td>
                    <td className="p-4 text-center text-emerald-600 font-bold text-base tabular-nums bg-emerald-50/5">
                      {isHidden ? '****' : (item?.current || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-amber-600 font-bold text-base tabular-nums bg-amber-50/5">
                      {isHidden ? '****' : (item?.[30] || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-orange-600 font-bold text-base tabular-nums bg-orange-50/5">
                      {isHidden ? '****' : (item?.[60] || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-rose-700 font-bold text-base tabular-nums bg-rose-50/5">
                      {isHidden ? '****' : (item?.over90 || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-bold text-lg tabular-nums bg-slate-50/30 text-slate-900">
                      {isHidden ? '****' : (item?.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isPrint) {
    return (
      <div className="space-y-12 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        {renderTable(agingData?.customers || [], "تحليل أعمار ديون العملاء", <Users size={28} />, "indigo", "customer")}
        {renderTable(agingData?.suppliers || [], "تحليل مستحقات الموردين", <Truck size={28} />, "rose", "supplier")}
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 print:animate-none print:opacity-100 print:transform-none">
      {/* Premium Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-md border border-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 transform group-hover:scale-110 transition-transform duration-500">
              <Clock size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">تقرير أعمار الديون</h3>
              <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Aging Analysis Report • Debt Recovery Insights
              </p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="bg-indigo-50/50 px-6 py-4 rounded-2xl border border-indigo-100/50 text-center">
             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1 opacity-60">إجمالي المستحقات</p>
             <p className="text-2xl font-bold text-indigo-600 tabular-nums tracking-tight">
               {isHidden ? '****' : (
                 (agingData?.customers || []).reduce((s, c) => s + (c?.total || 0), 0) + 
                 (agingData?.suppliers || []).reduce((s, s1) => s + (s1?.total || 0), 0)
               ).toLocaleString()} <span className="text-xs font-bold opacity-40">ج.م</span>
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {renderTable(agingData?.customers || [], "مديونيات العملاء المتأخرة", <Users size={20} />, "indigo", "customer")}
        {renderTable(agingData?.suppliers || [], "مستحقات الموردين المتأخرة", <Truck size={20} />, "rose", "supplier")}
      </div>

      {/* Quick Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">ديون مستقرة</p>
            <p className="text-lg font-bold text-slate-900">0-30 يوم</p>
          </div>
        </div>
        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">تحتاج متابعة</p>
            <p className="text-lg font-bold text-slate-900">31-90 يوم</p>
          </div>
        </div>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">ديون حرجة</p>
            <p className="text-lg font-bold text-slate-900">+90 يوم</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AgingReport);
